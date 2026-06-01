'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requirePermission, audit } from '@/lib/auth/permissions';
import { validarRut } from '@/lib/format';

const ClienteSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  razon_social: z.string().min(2, 'Razón social requerida'),
  rut: z.string().min(3, 'RUT requerido').refine(validarRut, 'RUT inválido'),
  contacto: z.string().optional().default(''),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional().default(''),
  direccion: z.string().optional().default(''),
  comuna: z.string().optional().default(''),
  ciudad: z.string().optional().default('Santiago'),
  segmento: z.enum(['constructora','ferreteria','pintor','retail','industria','inmobiliaria','mayorista']),
  notas: z.string().optional().default(''),
});

export async function upsertClienteAction(formData: FormData) {
  await requirePermission('clientes.crear');
  const raw = Object.fromEntries(formData.entries());
  const parsed = ClienteSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const isNew = !raw.id;
  const { id, ...payload } = parsed.data;

  if (isNew) {
    const { data, error } = await supabase.from('clients').insert(payload).select('id').single();
    if (error) return { error: error.message };
    await audit({ accion: 'crear_cliente', modulo: 'clientes', registroId: data.id, registroTipo: 'clients', valorNuevo: payload });
    revalidatePath('/clientes');
    redirect(`/clientes/${data.id}`);
  } else {
    const { data: prev } = await supabase.from('clients').select('*').eq('id', id!).single();
    const { error } = await supabase.from('clients').update(payload).eq('id', id!);
    if (error) return { error: error.message };
    await audit({ accion: 'editar_cliente', modulo: 'clientes', registroId: id, registroTipo: 'clients', valorAnterior: prev, valorNuevo: payload });
    revalidatePath('/clientes'); revalidatePath(`/clientes/${id}`);
    redirect(`/clientes/${id}`);
  }
}

export async function deleteClienteAction(id: string) {
  await requirePermission('clientes.eliminar');
  const supabase = createClient();
  const { data: prev } = await supabase.from('clients').select('*').eq('id', id).single();
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) return { error: error.message };
  await audit({ accion: 'eliminar_cliente', modulo: 'clientes', registroId: id, valorAnterior: prev });
  revalidatePath('/clientes');
  redirect('/clientes');
}

export async function addClienteNotaAction(formData: FormData) {
  await requirePermission('clientes.editar');
  const supabase = createClient();
  const clientId = String(formData.get('client_id') || '');
  const tipo = String(formData.get('tipo') || 'Llamada');
  const nota = String(formData.get('nota') || '').trim();
  if (!nota) return { error: 'Nota vacía' };
  await supabase.from('client_notes').insert({ client_id: clientId, tipo, nota });
  await audit({ accion: 'crear_nota_cliente', modulo: 'clientes', registroId: clientId });
  revalidatePath(`/clientes/${clientId}`);
}

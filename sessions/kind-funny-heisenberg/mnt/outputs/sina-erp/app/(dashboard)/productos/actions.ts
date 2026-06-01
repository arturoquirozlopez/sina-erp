'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requirePermission, audit } from '@/lib/auth/permissions';

const ProductSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  sku: z.string().min(2),
  nombre: z.string().min(2),
  categoria: z.string().min(1),
  acabado: z.string().optional().default(''),
  color: z.string().optional().default(''),
  formato: z.string().optional().default(''),
  descripcion: z.string().optional().default(''),
  proveedor_id: z.string().uuid().optional().or(z.literal('')),
  costo: z.coerce.number().min(0),
  precio: z.coerce.number().min(0),
  stock_min: z.coerce.number().int().min(0),
  stock_reco: z.coerce.number().int().min(0),
});

export async function upsertProductAction(formData: FormData) {
  await requirePermission('inventario.crear');
  const raw: any = Object.fromEntries(formData.entries());
  if (raw.proveedor_id === '') delete raw.proveedor_id;
  const parsed = ProductSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const isNew = !raw.id;
  const { id, ...payload } = parsed.data;

  if (payload.precio < payload.costo) return { error: 'El precio no puede ser menor al costo' };

  if (isNew) {
    const { data, error } = await supabase.from('products').insert(payload).select('id').single();
    if (error) return { error: error.message };
    await audit({ accion: 'crear_producto', modulo: 'inventario', registroId: data.id, valorNuevo: payload });
    revalidatePath('/productos');
    redirect(`/productos/${data.id}`);
  } else {
    const { data: prev } = await supabase.from('products').select('*').eq('id', id!).single();
    const { error } = await supabase.from('products').update(payload).eq('id', id!);
    if (error) return { error: error.message };
    await audit({ accion: 'editar_producto', modulo: 'inventario', registroId: id, valorAnterior: prev, valorNuevo: payload });
    revalidatePath('/productos'); revalidatePath(`/productos/${id}`);
    redirect(`/productos/${id}`);
  }
}

export async function deleteProductAction(id: string) {
  await requirePermission('inventario.eliminar');
  const supabase = createClient();
  const { data: prev } = await supabase.from('products').select('*').eq('id', id).single();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return { error: error.message };
  await audit({ accion: 'eliminar_producto', modulo: 'inventario', registroId: id, valorAnterior: prev });
  revalidatePath('/productos');
  redirect('/productos');
}

export async function inventoryMovementAction(formData: FormData) {
  await requirePermission('inventario.editar');
  const supabase = createClient();
  const productId = String(formData.get('product_id') || '');
  const locationId = String(formData.get('location_id') || 'BC');
  const tipo = String(formData.get('tipo') || 'entrada') as 'entrada'|'salida'|'ajuste';
  const cantidad = Number(formData.get('cantidad') || 0);
  const motivo = String(formData.get('motivo') || '');
  if (cantidad < 0) return { error: 'Cantidad inválida' };

  const { error } = await supabase.from('inventory_movements').insert({
    product_id: productId, location_id: locationId,
    tipo, cantidad, motivo: motivo || tipo,
  });
  if (error) return { error: error.message };
  await audit({ accion: `movimiento_${tipo}`, modulo: 'inventario', registroId: productId, detalle: `${tipo} ${cantidad} ud en ${locationId}` });
  revalidatePath(`/productos/${productId}`);
  revalidatePath('/productos');
  return { ok: true };
}

'use client';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Btn } from '@/components/ui/button';
import Link from 'next/link';

type Cliente = {
  id?: string; razon_social?: string; rut?: string; contacto?: string;
  email?: string; telefono?: string; direccion?: string;
  comuna?: string; ciudad?: string; segmento?: string; notas?: string;
};

const SEGMENTOS = [
  { v: 'constructora', l: 'Constructora' },
  { v: 'ferreteria', l: 'Ferretería' },
  { v: 'pintor', l: 'Pintor' },
  { v: 'retail', l: 'Retail' },
  { v: 'industria', l: 'Industria' },
  { v: 'inmobiliaria', l: 'Inmobiliaria' },
  { v: 'mayorista', l: 'Mayorista' },
];

export function ClienteForm({ action, initial }: { action: (fd: FormData) => Promise<any>; initial?: Cliente }) {
  return (
    <form action={action} className="space-y-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Razón social" name="razon_social" required defaultValue={initial?.razon_social} />
        <Input label="RUT" name="rut" required placeholder="76.111.222-3" defaultValue={initial?.rut} />
        <Input label="Nombre contacto" name="contacto" defaultValue={initial?.contacto || ''} />
        <Input label="Email" name="email" type="email" defaultValue={initial?.email || ''} />
        <Input label="Teléfono" name="telefono" defaultValue={initial?.telefono || ''} />
        <Input label="Dirección" name="direccion" defaultValue={initial?.direccion || ''} />
        <Input label="Comuna" name="comuna" defaultValue={initial?.comuna || ''} />
        <Input label="Ciudad" name="ciudad" defaultValue={initial?.ciudad || 'Santiago'} />
        <Select label="Segmento" name="segmento" required defaultValue={initial?.segmento || 'retail'}>
          {SEGMENTOS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
        </Select>
      </div>
      <Textarea label="Notas" name="notas" rows={3} defaultValue={initial?.notas || ''} />
      <div className="flex justify-end gap-2 pt-3 border-t border-sina-line">
        <Link href="/clientes"><Btn variant="ghost" type="button">Cancelar</Btn></Link>
        <Btn type="submit">Guardar cliente</Btn>
      </div>
    </form>
  );
}

'use client';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Btn } from '@/components/ui/button';
import Link from 'next/link';

const CATEGORIAS = ['Látex','Esmalte al agua','Esmalte sintético','Óleo','Barniz','Anticorrosivo','Selladores','Diluyentes','Accesorios'];

export function ProductForm({ action, initial, suppliers }: { action: (fd: FormData) => Promise<any>; initial?: any; suppliers: { id: string; nombre: string }[] }) {
  return (
    <form action={action} className="space-y-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid grid-cols-3 gap-3">
        <Input label="SKU" name="sku" required defaultValue={initial?.sku} />
        <Input label="Nombre" name="nombre" required defaultValue={initial?.nombre} className="col-span-2" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Select label="Categoría" name="categoria" required defaultValue={initial?.categoria || 'Látex'}>
          {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
        </Select>
        <Input label="Color" name="color" defaultValue={initial?.color || ''} />
        <Input label="Formato" name="formato" defaultValue={initial?.formato || '1 L'} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Acabado" name="acabado" defaultValue={initial?.acabado || ''} />
        <Select label="Proveedor" name="proveedor_id" defaultValue={initial?.proveedor_id || ''}>
          <option value="">— Sin proveedor —</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </Select>
      </div>
      <Textarea label="Descripción" name="descripcion" rows={2} defaultValue={initial?.descripcion || ''} />
      <div className="grid grid-cols-4 gap-3">
        <Input label="Costo unitario (CLP)" name="costo" type="number" min="0" required defaultValue={initial?.costo ?? 0} />
        <Input label="Precio de venta (CLP)" name="precio" type="number" min="0" required defaultValue={initial?.precio ?? 0} />
        <Input label="Stock mínimo" name="stock_min" type="number" min="0" required defaultValue={initial?.stock_min ?? 10} />
        <Input label="Stock recomendado" name="stock_reco" type="number" min="0" required defaultValue={initial?.stock_reco ?? 30} />
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t border-sina-line">
        <Link href="/productos"><Btn variant="ghost" type="button">Cancelar</Btn></Link>
        <Btn type="submit">Guardar producto</Btn>
      </div>
    </form>
  );
}

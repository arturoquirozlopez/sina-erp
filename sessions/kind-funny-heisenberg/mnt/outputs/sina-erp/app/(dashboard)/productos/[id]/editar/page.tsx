import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { TopBar } from '@/components/layout/topbar';
import { Card } from '@/components/ui/card';
import { ProductForm } from '../../product-form';
import { upsertProductAction } from '../../actions';
import { notFound } from 'next/navigation';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  await requirePermission('inventario.editar');
  const supabase = createClient();
  const [{ data: producto }, { data: suppliers }] = await Promise.all([
    supabase.from('products').select('*').eq('id', params.id).maybeSingle(),
    supabase.from('suppliers').select('id, nombre').eq('activo', true).order('nombre'),
  ]);
  if (!producto) notFound();
  return (
    <>
      <TopBar title={`Editar · ${producto.nombre}`} subtitle={producto.sku} />
      <div className="p-8 max-w-3xl">
        <Card title="Datos del producto">
          <ProductForm action={upsertProductAction} initial={producto} suppliers={suppliers || []} />
        </Card>
      </div>
    </>
  );
}

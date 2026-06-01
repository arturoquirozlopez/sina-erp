import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { TopBar } from '@/components/layout/topbar';
import { Card } from '@/components/ui/card';
import { ProductForm } from '../product-form';
import { upsertProductAction } from '../actions';

export default async function NuevoProductoPage() {
  await requirePermission('inventario.crear');
  const supabase = createClient();
  const { data: suppliers } = await supabase.from('suppliers').select('id, nombre').eq('activo', true).order('nombre');
  return (
    <>
      <TopBar title="Nuevo producto" subtitle="Registra un producto en el catálogo" />
      <div className="p-8 max-w-3xl">
        <Card title="Datos del producto">
          <ProductForm action={upsertProductAction} suppliers={suppliers || []} />
        </Card>
      </div>
    </>
  );
}

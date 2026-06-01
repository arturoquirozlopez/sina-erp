import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { TopBar } from '@/components/layout/topbar';
import { Card } from '@/components/ui/card';
import { ClienteForm } from '../../cliente-form';
import { upsertClienteAction } from '../../actions';
import { notFound } from 'next/navigation';

export default async function EditClientePage({ params }: { params: { id: string } }) {
  await requirePermission('clientes.editar');
  const supabase = createClient();
  const { data: cliente } = await supabase.from('clients').select('*').eq('id', params.id).maybeSingle();
  if (!cliente) notFound();
  return (
    <>
      <TopBar title={`Editar · ${cliente.razon_social}`} subtitle="Actualiza los datos del cliente" />
      <div className="p-8 max-w-3xl">
        <Card title="Datos del cliente">
          <ClienteForm action={upsertClienteAction} initial={cliente} />
        </Card>
      </div>
    </>
  );
}

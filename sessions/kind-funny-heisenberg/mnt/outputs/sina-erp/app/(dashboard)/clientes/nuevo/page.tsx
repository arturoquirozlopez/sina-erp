import { TopBar } from '@/components/layout/topbar';
import { Card } from '@/components/ui/card';
import { ClienteForm } from '../cliente-form';
import { upsertClienteAction } from '../actions';
import { requirePermission } from '@/lib/auth/permissions';

export default async function NuevoClientePage() {
  await requirePermission('clientes.crear');
  return (
    <>
      <TopBar title="Nuevo cliente" subtitle="Registra un cliente nuevo en la cartera" />
      <div className="p-8 max-w-3xl">
        <Card title="Datos del cliente">
          <ClienteForm action={upsertClienteAction} />
        </Card>
      </div>
    </>
  );
}

import { TabsNav } from '@/components/ui/tabs';
import { TopBar } from '@/components/layout/topbar';

export default function UsuariosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar title="Usuarios y Permisos" subtitle="RBAC · invitaciones, roles, permisos granulares" />
      <TabsNav tabs={[
        { href: '/usuarios',                label: 'Usuarios' },
        { href: '/usuarios/invitaciones',   label: 'Invitaciones' },
        { href: '/usuarios/auditoria',      label: 'Auditoría' },
      ]} />
      {children}
    </>
  );
}

import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { getCurrentProfile } from '@/lib/auth/permissions';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile)  redirect('/login');
  if (!profile.activo) redirect('/login?inactive=1');
  return (
    <div className="flex min-h-screen bg-sina-bg">
      <Sidebar profile={profile} />
      <main className="flex-1 min-w-0 flex flex-col">{children}</main>
    </div>
  );
}

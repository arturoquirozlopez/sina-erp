'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { SinaLogo } from '@/components/brand/sina-logo';
import type { ProfileWithRole } from '@/lib/types';
import { can } from '@/lib/auth/can';
import { signOut } from '@/app/(dashboard)/actions';
import {
  LayoutGrid, Boxes, Users, ShoppingCart, FileText, Wallet, Truck,
  MapPin, Landmark, CreditCard, MessageCircle, Sparkles, BarChart3, Shield, Settings, LogOut,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard',         label: 'Dashboard',          icon: LayoutGrid,   perm: null as any },
  { href: '/inventario',        label: 'Inventario',         icon: Boxes,        perm: 'inventario.ver' },
  { href: '/clientes',          label: 'Clientes',           icon: Users,        perm: 'clientes.ver' },
  { href: '/ventas',            label: 'Ventas',             icon: ShoppingCart, perm: 'ventas.ver' },
  { href: '/facturacion',       label: 'Facturación',        icon: FileText,     perm: 'facturacion.ver' },
  { href: '/cobranza',          label: 'Cobranza',           icon: Wallet,       perm: 'cobranza.ver' },
  { href: '/compras',           label: 'Compras',            icon: Truck,        perm: 'compras.ver' },
  { href: '/puntos',            label: 'Puntos de Retiro',   icon: MapPin,       perm: 'puntos_retiro.ver' },
  { href: '/finanzas',          label: 'Finanzas',           icon: Landmark,     perm: 'finanzas.ver' },
  { href: '/deuda',             label: 'Deuda y Préstamos',  icon: CreditCard,   perm: 'deuda.ver' },
  { href: '/mensajeria',        label: 'Mensajería',         icon: MessageCircle,perm: 'mensajeria.ver' },
  { href: '/automatizaciones',  label: 'Automatizaciones',   icon: Sparkles,     perm: 'automatizaciones.ver' },
  { href: '/reportes',          label: 'Reportes',           icon: BarChart3,    perm: 'reportes.ver' },
  { href: '/usuarios',          label: 'Usuarios y Permisos',icon: Shield,       perm: 'usuarios.gestionar' },
];

export function Sidebar({ profile }: { profile: ProfileWithRole }) {
  const pathname = usePathname() || '';
  const initial = profile.nombre?.charAt(0).toUpperCase() || '?';
  return (
    <aside className="w-60 bg-white border-r border-sina-line flex flex-col h-screen sticky top-0">
      <div className="px-6 pt-6 pb-5"><SinaLogo /></div>
      <nav className="flex-1 overflow-y-auto scrollbar px-3 py-2">
        {NAV.filter(n => !n.perm || can(profile, n.perm)).map(n => {
          const active = pathname.startsWith(n.href);
          const Icon = n.icon;
          return (
            <Link key={n.href} href={n.href}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2 mb-0.5 rounded-md text-[13px] transition',
                active ? 'bg-sina-skySoft text-sina-navy font-medium' : 'text-sina-body hover:bg-sina-lineSoft hover:text-sina-ink'
              )}
            >
              <Icon className="w-4 h-4" strokeWidth={1.6} />
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-sina-line">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sina-navy text-white flex items-center justify-center text-xs font-semibold">{initial}</div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-sina-ink truncate">{profile.nombre} {profile.apellido}</div>
            <div className="text-[11px] text-sina-muted truncate">{profile.role?.nombre || profile.email}</div>
          </div>
          <form action={signOut}>
            <button type="submit" title="Cerrar sesión" className="text-sina-muted hover:text-sina-rose">
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

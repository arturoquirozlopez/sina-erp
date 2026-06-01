'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

export function TabsNav({ tabs }: { tabs: { href: string; label: string }[] }) {
  const pathname = usePathname() || '';
  return (
    <div className="border-b border-sina-line bg-white px-8">
      <div className="flex gap-1">
        {tabs.map(t => {
          const active = pathname === t.href || pathname.startsWith(t.href + '/');
          return (
            <Link key={t.href} href={t.href}
              className={clsx(
                'px-4 py-3 text-[13px] -mb-px border-b-2 transition',
                active ? 'border-sina-navy text-sina-navy font-medium' : 'border-transparent text-sina-muted hover:text-sina-ink'
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

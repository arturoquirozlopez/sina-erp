import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'Sina ERP',
  description: 'Sistema operativo de Sina Pinturas SpA',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans bg-sina-bg text-sina-ink antialiased">{children}</body>
    </html>
  );
}

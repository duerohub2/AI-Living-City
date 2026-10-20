import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'AI Living City', description: 'Kota isometrik persisten.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="id"><body className="bg-ink text-slate-200 min-h-screen antialiased">{children}</body></html>);
}

import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { ArrowUp } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { QuickView } from '@/components/QuickView';

export function Layout({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  const [top, setTop] = useState(false);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [loc]);
  useEffect(() => { const h = () => setTop(window.scrollY > 600); window.addEventListener('scroll', h, { passive: true }); return () => window.removeEventListener('scroll', h); }, []);
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer /><QuickView />
      <button aria-label="Back to top" data-testid="button-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-20 end-4 z-30 grid size-11 place-items-center rounded-full bg-primary text-white shadow-lg transition-all md:bottom-6 ${top ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}><ArrowUp className="size-5" /></button>
    </div>
  );
}

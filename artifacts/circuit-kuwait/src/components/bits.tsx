import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { Star, PackageSearch, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLang } from '@/lib/i18n';
import { kwd, discountPct } from '@/lib/format';
import type { Product } from '@workspace/api-client-react';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" data-testid="link-logo">
      <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="size-9" />
      <span className={cn('font-display text-lg font-bold leading-none', light ? 'text-white' : 'text-primary')}>
        Circuit<span className="text-amber"> Kuwait</span>
      </span>
    </Link>
  );
}

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.08 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={cn('reveal', seen && 'in', className)}>{children}</div>;
}

export function Stars({ value, count, size = 14 }: { value: number; count?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" data-testid="rating-stars">
      <span className="flex">{[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={i <= Math.round(value) ? 'fill-amber text-amber' : 'text-border'} />
      ))}</span>
      {count !== undefined && <span>({count})</span>}
    </span>
  );
}

export function Price({ p, big = false }: { p: Product; big?: boolean }) {
  const d = discountPct(p);
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className={cn('font-display font-bold text-primary', big ? 'text-3xl' : 'text-base')} data-testid={`text-price-${p.id}`}>{kwd(p.price)}</span>
      {d > 0 && <span className="text-xs text-muted-foreground line-through">{kwd(p.oldPrice!)}</span>}
      {d > 0 && big && <span className="rounded-md bg-amber px-2 py-0.5 text-xs font-bold text-foreground">-{d}%</span>}
    </div>
  );
}

export function Stock({ p }: { p: Product }) {
  const { tr } = useLang();
  const c = p.stock <= 0 ? ['bg-red-500', tr('Out of stock', 'غير متوفر')] : p.stock < 10 ? ['bg-amber', tr(`Only ${p.stock} left`, `متبقي ${p.stock} فقط`)] : ['bg-emerald-500', tr('In stock', 'متوفر')];
  return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><span className={cn('size-2 rounded-full', c[0])} />{c[1]}</span>;
}

export function Empty({ title, text, action, href }: { title: string; text?: string; action?: string; href?: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-14 text-center" data-testid="state-empty">
      <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-muted text-secondary circuit-bg"><PackageSearch className="size-7" /></div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>}
      {action && href && <Button asChild className="mt-5"><Link href={href}>{action}</Link></Button>}
    </div>
  );
}

export function ErrorState({ onRetry, text }: { onRetry?: () => void; text?: string }) {
  const { tr } = useLang();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border bg-card px-6 py-12 text-center" data-testid="state-error">
      <TriangleAlert className="mb-3 size-9 text-destructive" />
      <h3 className="font-semibold">{text ?? tr('Something went wrong', 'حدث خطأ ما')}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{tr('Check your connection and try again.', 'تحقق من اتصالك وحاول مرة أخرى.')}</p>
      {onRetry && <Button className="mt-4" onClick={onRetry} data-testid="button-retry">{tr('Retry', 'إعادة المحاولة')}</Button>}
    </div>
  );
}

export function GridSkeleton({ n = 8 }: { n?: number }) {
  return <>{Array.from({ length: n }).map((_, i) => (
    <div key={i} className="rounded-2xl border bg-card p-3">
      <div className="skel aspect-square rounded-xl" /><div className="skel mt-3 h-3 w-1/3 rounded" /><div className="skel mt-2 h-4 w-4/5 rounded" /><div className="skel mt-3 h-8 rounded-lg" />
    </div>
  ))}</>;
}

export function PageHead({ title, sub, crumbs }: { title: string; sub?: string; crumbs?: { label: string; href?: string }[] }) {
  return (
    <div className="hero-grad relative overflow-hidden text-white">
      <div className="circuit-bg absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 py-10 md:py-14">
        {crumbs && <div className="mb-3 flex items-center gap-2 text-xs text-white/70">{crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">{c.href ? <Link href={c.href} className="hover:text-white">{c.label}</Link> : c.label}{i < crumbs.length - 1 && <span>/</span>}</span>
        ))}</div>}
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        {sub && <p className="mt-2 max-w-2xl text-white/75">{sub}</p>}
      </div>
    </div>
  );
}

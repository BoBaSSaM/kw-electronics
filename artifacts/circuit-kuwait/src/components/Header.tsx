import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Search, User, Heart, ShoppingCart, Menu, Languages, GitCompareArrows, Phone, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useListProducts, useListCategories } from '@workspace/api-client-react';
import { useLang } from '@/lib/i18n';
import { useShop } from '@/lib/shop';
import { imgOf, kwd } from '@/lib/format';
import { Logo } from '@/components/bits';
import { cn } from '@/lib/utils';

function SearchBox({ className }: { className?: string }) {
  const { tr, pn, lang } = useLang();
  const [, nav] = useLocation();
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { const t = setTimeout(() => setDq(q.trim()), 200); return () => clearTimeout(t); }, [q]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);
  const { data, isFetching } = useListProducts({ q: dq, limit: 5 }, { query: { enabled: dq.length > 0, queryKey: ['search', dq] } });
  const cats = useListCategories();
  const matchCats = dq ? (cats.data ?? []).filter((c) => (c.name + c.nameAr + c.children.join(' ')).toLowerCase().includes(dq.toLowerCase())).slice(0, 3) : [];
  const go = (e?: React.FormEvent) => { e?.preventDefault(); if (q.trim()) { nav(`/products?q=${encodeURIComponent(q.trim())}`); setOpen(false); } };
  return (
    <div ref={box} className={cn('relative', className)}>
      <form onSubmit={go} className="flex h-11 items-center rounded-xl border bg-card pe-1 ps-3 shadow-sm focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20">
        <Search className="size-4 text-muted-foreground" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} data-testid="input-search"
          placeholder={tr('Search Arduino, sensors, SKU...', 'ابحث عن أردوينو، حساسات، رمز المنتج...')} className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" />
        {q && <button type="button" aria-label="Clear" onClick={() => setQ('')} className="p-1.5 text-muted-foreground"><X className="size-4" /></button>}
        <button type="submit" data-testid="button-search" className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-secondary">{tr('Search', 'بحث')}</button>
      </form>
      {open && dq && (
        <div className="absolute inset-x-0 top-12 z-50 overflow-hidden rounded-xl border bg-card shadow-xl" data-testid="panel-search">
          {matchCats.map((c) => (
            <Link key={c.id} href={`/products?category=${encodeURIComponent(c.name)}`} onClick={() => setOpen(false)} className="flex items-center justify-between border-b px-4 py-2.5 text-sm hover:bg-muted">
              <span>{lang === 'ar' ? c.nameAr || c.name : c.name}</span><span className="text-xs text-secondary">{tr('Category', 'فئة')}</span>
            </Link>
          ))}
          {isFetching && !data ? <div className="p-4 text-sm text-muted-foreground">{tr('Searching...', 'جارٍ البحث...')}</div> :
            (data?.products ?? []).map((p) => (
              <Link key={p.id} href={`/products/${p.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-muted" data-testid={`link-suggest-${p.id}`}>
                <img src={imgOf(p)} alt="" className="size-10 rounded-lg bg-muted object-cover" />
                <span className="min-w-0 flex-1"><span className="line-clamp-1 text-sm font-medium">{pn(p)}</span><span className="font-mono text-[11px] text-muted-foreground">{p.sku}</span></span>
                <span className="text-sm font-bold text-primary">{kwd(p.price)}</span>
              </Link>
            ))}
          {data && data.products.length === 0 && matchCats.length === 0 && <div className="p-4 text-sm text-muted-foreground">{tr('No matches. Try another term.', 'لا نتائج. جرّب كلمة أخرى.')}</div>}
          {data && data.total > 5 && <button onClick={() => go()} className="w-full bg-muted/60 px-4 py-2.5 text-start text-sm font-semibold text-secondary">{tr(`See all ${data.total} results`, `عرض كل ${data.total} نتيجة`)}</button>}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { tr, lang, setLang } = useLang();
  const { cartCount, setDrawerOpen, wishlist, compare } = useShop();
  const [menu, setMenu] = useState(false);
  const [loc] = useLocation();
  const links = [
    ['/', tr('Home', 'الرئيسية')], ['/products', tr('Products', 'المنتجات')], ['/categories', tr('Categories', 'الفئات')], ['/brands', tr('Brands', 'العلامات')],
    ['/new-arrivals', tr('New Arrivals', 'وصل حديثاً')], ['/offers', tr('Offers', 'العروض')], ['/about', tr('About Us', 'من نحن')], ['/contact', tr('Contact', 'اتصل بنا')],
  ];
  const Badge = ({ n, id }: { n: number; id: string }) => n > 0 ? <span key={n} data-testid={id} className="pop absolute -end-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-amber px-1 text-[10px] font-bold text-foreground">{n}</span> : null;
  const icon = 'relative grid size-10 place-items-center rounded-xl text-foreground transition hover:bg-muted';
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
      <div className="hidden bg-primary text-xs text-white/85 md:block">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4">
          <span>{tr('Fast delivery across Kuwait. Electronic components for students, makers and companies.', 'توصيل سريع داخل الكويت. مكونات إلكترونية للطلاب والمبتكرين والشركات.')}</span>
          <Link href="/contact" className="flex items-center gap-1.5 hover:text-white"><Phone className="size-3" />{tr('Technical support', 'الدعم الفني')}</Link>
        </div>
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <button className={cn(icon, 'lg:hidden')} aria-label="Menu" onClick={() => setMenu(true)} data-testid="button-menu"><Menu className="size-5" /></button>
        <Logo />
        <SearchBox className="mx-4 hidden flex-1 md:block" />
        <div className="ms-auto flex items-center gap-0.5">
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className={cn(icon, 'w-auto gap-1.5 px-2.5 text-sm font-semibold')} data-testid="button-lang"><Languages className="size-4" />{lang === 'en' ? 'العربية' : 'EN'}</button>
          <Link href="/compare" className={cn(icon, 'hidden sm:grid')} aria-label="Compare" data-testid="link-compare"><GitCompareArrows className="size-5" /><Badge n={compare.length} id="badge-compare" /></Link>
          <Link href="/wishlist" className={icon} aria-label="Wishlist" data-testid="link-wishlist"><Heart className="size-5" /><Badge n={wishlist.length} id="badge-wishlist" /></Link>
          <Link href="/account" className={icon} aria-label="Account" data-testid="link-account"><User className="size-5" /></Link>
          <button className={icon} aria-label="Cart" onClick={() => setDrawerOpen(true)} data-testid="button-cart"><ShoppingCart className="size-5" /><Badge n={cartCount} id="badge-cart" /></button>
        </div>
      </div>
      <div className="px-4 pb-3 md:hidden"><SearchBox /></div>
      <nav className="hidden border-t lg:block"><div className="mx-auto flex max-w-7xl gap-1 px-4">
        {links.map(([h, l]) => (
          <Link key={h} href={h} data-testid={`nav-${h.replace('/', '') || 'home'}`} className={cn('relative px-3.5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary', loc === h && 'text-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded after:bg-amber')}>{l}</Link>
        ))}
      </div></nav>
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side={lang === 'ar' ? 'right' : 'left'} className="w-72 p-0">
          <SheetTitle className="p-5"><Logo /></SheetTitle><SheetDescription className="sr-only">Menu</SheetDescription>
          <div className="flex flex-col px-3">{[...links, ['/compare', tr('Compare', 'مقارنة')], ['/faq', tr('FAQ', 'الأسئلة الشائعة')]].map(([h, l]) => (
            <Link key={h} href={h} onClick={() => setMenu(false)} className="rounded-lg px-3 py-3 font-semibold hover:bg-muted">{l}</Link>
          ))}</div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

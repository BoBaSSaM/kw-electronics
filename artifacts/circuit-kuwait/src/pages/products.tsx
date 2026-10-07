import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { LayoutGrid, List, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useListProducts, useListCategories, useListBrands, type ListProductsParams } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLang } from '@/lib/i18n';
import { useSeo } from '@/lib/seo';
import { ProductCard } from '@/components/ProductCard';
import { Empty, ErrorState, GridSkeleton, PageHead, Stars } from '@/components/bits';
import { cn } from '@/lib/utils';

const LIMIT = 12;
export default function Products({ mode }: { mode?: 'new' | 'offers' }) {
  const { tr, lang } = useLang();
  const search = useSearch();
  const [, nav] = useLocation();
  const sp = useMemo(() => new URLSearchParams(search), [search]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [drawer, setDrawer] = useState(false);
  const set = (k: Record<string, string | null>) => {
    const n = new URLSearchParams(search);
    Object.entries(k).forEach(([a, b]) => (b === null || b === '' ? n.delete(a) : n.set(a, b)));
    if (!('page' in k)) n.delete('page');
    const s = n.toString();
    nav(`${window.location.pathname.replace(import.meta.env.BASE_URL.replace(/\/$/, ''), '') || '/'}${s ? `?${s}` : ''}`, { replace: true });
  };
  const [min, setMin] = useState(sp.get('minPrice') ?? '');
  const [max, setMax] = useState(sp.get('maxPrice') ?? '');
  useEffect(() => { const t = setTimeout(() => { if ((sp.get('minPrice') ?? '') !== min || (sp.get('maxPrice') ?? '') !== max) set({ minPrice: min, maxPrice: max }); }, 500); return () => clearTimeout(t); // eslint-disable-next-line
  }, [min, max]);
  const page = Number(sp.get('page') ?? 1);
  const params: ListProductsParams = {
    q: sp.get('q') || undefined, category: sp.get('category') || undefined, brand: sp.get('brand') || undefined,
    sort: sp.get('sort') || (mode === 'new' ? 'newest' : undefined), available: sp.get('available') ? true : undefined,
    minPrice: sp.get('minPrice') ? Number(sp.get('minPrice')) : undefined, maxPrice: sp.get('maxPrice') ? Number(sp.get('maxPrice')) : undefined,
    rating: sp.get('rating') ? Number(sp.get('rating')) : undefined, featured: sp.get('featured') ? true : undefined,
    offers: mode === 'offers' || sp.get('offers') ? true : undefined, page, limit: LIMIT,
  };
  const { data, isLoading, isError, refetch, isFetching } = useListProducts(params);
  const cats = useListCategories(); const brands = useListBrands();
  const title = mode === 'new' ? tr('New Arrivals', 'وصل حديثاً') : mode === 'offers' ? tr('Special Offers', 'عروض خاصة') : tr('All Products', 'كل المنتجات');
  useSeo(title, tr('Browse electronic components, boards, sensors and tools with live filters.', 'تصفح المكونات واللوحات والحساسات والأدوات مع فلاتر مباشرة.'));
  const activeCount = ['category', 'brand', 'available', 'minPrice', 'maxPrice', 'rating', 'q'].filter((k) => sp.get(k)).length;
  const clear = () => { setMin(''); setMax(''); nav(window.location.pathname.replace(import.meta.env.BASE_URL.replace(/\/$/, ''), '') || '/', { replace: true }); };
  const cur = sp.get('category');

  const Filters = (
    <div className="space-y-6">
      <div><h4 className="mb-2 text-sm font-bold">{tr('Category', 'الفئة')}</h4>
        <div className="space-y-0.5 text-sm">
          {(cats.data ?? []).map((c) => (
            <div key={c.id}>
              <button onClick={() => set({ category: cur === c.name ? null : c.name })} data-testid={`filter-category-${c.id}`} className={cn('flex w-full justify-between rounded-md px-2 py-1.5 text-start hover:bg-muted', cur === c.name && 'bg-primary/10 font-semibold text-primary')}>
                <span>{lang === 'ar' ? c.nameAr || c.name : c.name}</span><span className="text-xs text-muted-foreground">{c.count}</span></button>
              {(cur === c.name || c.children.includes(cur ?? '')) && c.children.map((ch) => (
                <button key={ch} onClick={() => set({ category: ch })} className={cn('block w-full rounded-md py-1 ps-6 text-start text-xs text-muted-foreground hover:text-primary', cur === ch && 'font-bold text-primary')}>{ch}</button>))}
            </div>))}
        </div></div>
      <div><h4 className="mb-2 text-sm font-bold">{tr('Brand', 'العلامة')}</h4>
        <div className="space-y-1.5">{(brands.data ?? []).map((b) => (
          <label key={b.id} className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={sp.get('brand') === b.name} onCheckedChange={(v) => set({ brand: v ? b.name : null })} data-testid={`filter-brand-${b.id}`} />{b.name}<span className="ms-auto text-xs text-muted-foreground">{b.count}</span></label>))}</div></div>
      <div><h4 className="mb-2 text-sm font-bold">{tr('Price (KWD)', 'السعر (د.ك)')}</h4>
        <div className="flex items-center gap-2"><Input type="number" min={0} placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)} data-testid="input-min-price" /><span>-</span><Input type="number" min={0} placeholder="Max" value={max} onChange={(e) => setMax(e.target.value)} data-testid="input-max-price" /></div></div>
      <div><h4 className="mb-2 text-sm font-bold">{tr('Availability', 'التوفر')}</h4>
        <label className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={!!sp.get('available')} onCheckedChange={(v) => set({ available: v ? '1' : null })} data-testid="filter-available" />{tr('In stock only', 'المتوفر فقط')}</label></div>
      <div><h4 className="mb-2 text-sm font-bold">{tr('Rating', 'التقييم')}</h4>
        <div className="space-y-1">{[4, 3, 2].map((r) => (
          <button key={r} onClick={() => set({ rating: sp.get('rating') === String(r) ? null : String(r) })} data-testid={`filter-rating-${r}`} className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-muted', sp.get('rating') === String(r) && 'bg-primary/10')}><Stars value={r} />{tr('& up', 'فأكثر')}</button>))}</div></div>
      {activeCount > 0 && <Button variant="outline" className="w-full" onClick={clear} data-testid="button-clear-filters"><X className="size-4" />{tr('Clear filters', 'مسح الفلاتر')}</Button>}
    </div>
  );
  return (
    <div>
      <PageHead title={sp.get('q') ? `${tr('Results for', 'نتائج')} "${sp.get('q')}"` : cur || title} sub={data ? `${data.total} ${tr('products', 'منتج')}` : undefined} crumbs={[{ label: tr('Home', 'الرئيسية'), href: '/' }, { label: title }]} />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block"><div className="sticky top-36 rounded-2xl border bg-card p-5">{Filters}</div></aside>
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button variant="outline" className="lg:hidden" onClick={() => setDrawer(true)} data-testid="button-filters"><SlidersHorizontal className="size-4" />{tr('Filters', 'الفلاتر')}{activeCount > 0 && ` (${activeCount})`}</Button>
            <div className="ms-auto flex items-center gap-2">
              <Select value={sp.get('sort') || (mode === 'new' ? 'newest' : 'featured')} onValueChange={(v) => set({ sort: v })}>
                <SelectTrigger className="w-48 bg-card" data-testid="select-sort"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">{tr('Featured', 'المميز')}</SelectItem><SelectItem value="newest">{tr('Newest', 'الأحدث')}</SelectItem>
                  <SelectItem value="price_asc">{tr('Price: Low to High', 'السعر: الأقل أولاً')}</SelectItem><SelectItem value="price_desc">{tr('Price: High to Low', 'السعر: الأعلى أولاً')}</SelectItem>
                  <SelectItem value="best_selling">{tr('Best Selling', 'الأكثر مبيعاً')}</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex rounded-lg border bg-card p-0.5">
                {([['grid', LayoutGrid], ['list', List]] as const).map(([v, I]) => <button key={v} aria-label={v} data-testid={`button-view-${v}`} onClick={() => setView(v)} className={cn('grid size-8 place-items-center rounded-md', view === v && 'bg-primary text-white')}><I className="size-4" /></button>)}
              </div>
            </div>
          </div>
          {isError ? <ErrorState onRetry={() => refetch()} /> : (
            <div className={cn(view === 'grid' ? 'grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4' : 'space-y-3', isFetching && !isLoading && 'opacity-60 transition-opacity')}>
              {isLoading ? <GridSkeleton n={6} /> : (data?.products ?? []).map((p) => <ProductCard key={p.id} p={p} list={view === 'list'} />)}
            </div>)}
          {!isLoading && !isError && data?.products.length === 0 && <div className="mt-6"><Empty title={tr('No products match', 'لا منتجات مطابقة')} text={tr('Loosen a filter or search another term.', 'خفف أحد الفلاتر أو ابحث بكلمة أخرى.')} /><div className="mt-4 text-center"><Button variant="outline" onClick={clear}>{tr('Reset', 'إعادة ضبط')}</Button></div></div>}
          {data && data.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-1.5" data-testid="pagination">
              <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => set({ page: String(page - 1) })} aria-label="Prev"><ChevronLeft className="size-4 rtl:rotate-180" /></Button>
              {Array.from({ length: data.pages }).map((_, i) => <Button key={i} variant={page === i + 1 ? 'default' : 'outline'} size="icon" onClick={() => set({ page: String(i + 1) })} data-testid={`button-page-${i + 1}`}>{i + 1}</Button>)}
              <Button variant="outline" size="icon" disabled={page >= data.pages} onClick={() => set({ page: String(page + 1) })} aria-label="Next"><ChevronRight className="size-4 rtl:rotate-180" /></Button>
            </div>)}
          <p className="mt-6 text-center text-xs text-muted-foreground"><Link href="/categories" className="hover:underline">{tr('Browse by category', 'تصفح حسب الفئة')}</Link></p>
        </div>
      </div>
      <Sheet open={drawer} onOpenChange={setDrawer}><SheetContent side="left" className="w-80 overflow-y-auto"><SheetTitle>{tr('Filters', 'الفلاتر')}</SheetTitle><SheetDescription className="sr-only">Filters</SheetDescription><div className="mt-4">{Filters}</div></SheetContent></Sheet>
    </div>
  );
}

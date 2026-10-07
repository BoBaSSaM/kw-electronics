import { Link } from 'wouter';
import { useListCategories } from '@workspace/api-client-react';
import { useLang } from '@/lib/i18n';
import { useSeo } from '@/lib/seo';
import { catIcon } from '@/lib/icons';
import { PageHead, Reveal, ErrorState, Empty } from '@/components/bits';

export default function Categories() {
  const { tr, lang } = useLang();
  const { data, isLoading, isError, refetch } = useListCategories();
  useSeo(tr('Categories', 'الفئات'), tr('Browse every electronics category and subcategory.', 'تصفح جميع فئات الإلكترونيات.'));
  return (
    <div>
      <PageHead title={tr('Categories', 'الفئات')} sub={tr('Pick a family, then narrow down to the exact part.', 'اختر عائلة ثم حدد القطعة.')} crumbs={[{ label: tr('Home', 'الرئيسية'), href: '/' }, { label: tr('Categories', 'الفئات') }]} />
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 md:grid-cols-2 lg:grid-cols-3">
        {isError ? <div className="col-span-full"><ErrorState onRetry={() => refetch()} /></div> : isLoading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skel h-52 rounded-2xl" />) :
          !data?.length ? <div className="col-span-full"><Empty title={tr('No categories', 'لا فئات')} /></div> :
          data.map((c, i) => { const I = catIcon(c.name, c.icon); return (
            <Reveal key={c.id} delay={i * 50}><div className="h-full rounded-2xl border bg-card p-6 transition hover:shadow-lg hover:shadow-primary/10" data-testid={`card-category-${c.id}`}>
              <div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-xl bg-primary text-white"><I className="size-6" /></span>
                <div><Link href={`/products?category=${encodeURIComponent(c.name)}`} className="font-display text-lg font-bold hover:text-secondary">{lang === 'ar' ? c.nameAr || c.name : c.name}</Link><p className="text-xs text-muted-foreground">{c.count} {tr('items', 'منتج')}</p></div></div>
              <div className="mt-4 flex flex-wrap gap-2">{c.children.map((ch) => <Link key={ch} href={`/products?category=${encodeURIComponent(ch)}`} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-secondary hover:text-white">{ch}</Link>)}</div>
            </div></Reveal>); })}
      </div>
    </div>
  );
}

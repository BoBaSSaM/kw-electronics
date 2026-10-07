import { Link } from 'wouter';
import { useListBrands } from '@workspace/api-client-react';
import { useLang } from '@/lib/i18n';
import { useSeo } from '@/lib/seo';
import { PageHead, Reveal, ErrorState, Empty } from '@/components/bits';

export default function Brands() {
  const { tr } = useLang();
  const { data, isLoading, isError, refetch } = useListBrands();
  useSeo(tr('Brands', 'العلامات التجارية'), tr('Shop by manufacturer.', 'تسوق حسب المصنّع.'));
  return (
    <div>
      <PageHead title={tr('Brands', 'العلامات التجارية')} sub={tr('Boards, chips and tools from makers you know.', 'لوحات ورقائق وأدوات من علامات تعرفها.')} crumbs={[{ label: tr('Home', 'الرئيسية'), href: '/' }, { label: tr('Brands', 'العلامات') }]} />
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-10 md:grid-cols-3 lg:grid-cols-4">
        {isError ? <div className="col-span-full"><ErrorState onRetry={() => refetch()} /></div> : isLoading ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="skel h-32 rounded-2xl" />) :
          !data?.length ? <div className="col-span-full"><Empty title={tr('No brands', 'لا علامات')} /></div> :
          data.map((b, i) => (
            <Reveal key={b.id} delay={i * 40}><Link href={`/products?brand=${encodeURIComponent(b.name)}`} data-testid={`card-brand-${b.id}`} className="group flex h-32 flex-col items-center justify-center gap-1 rounded-2xl border bg-card transition hover:-translate-y-0.5 hover:border-secondary hover:shadow-lg hover:shadow-primary/10">
              <span className="font-display text-xl font-bold text-primary group-hover:text-secondary">{b.name}</span><span className="text-xs text-muted-foreground">{b.count} {tr('products', 'منتج')}</span></Link></Reveal>))}
      </div>
    </div>
  );
}

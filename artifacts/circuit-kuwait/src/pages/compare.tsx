import { Link } from 'wouter';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShop } from '@/lib/shop';
import { useLang } from '@/lib/i18n';
import { useSeo } from '@/lib/seo';
import { imgOf } from '@/lib/format';
import { PageHead, Empty, Price, Stars, Stock } from '@/components/bits';

export default function Compare() {
  const { compare, toggleCompare, clearCompare, addToCart } = useShop();
  const { tr, pn } = useLang();
  useSeo(tr('Compare products', 'مقارنة المنتجات'), tr('Compare specifications side by side.', 'قارن المواصفات جنباً إلى جنب.'));
  const keys = Array.from(new Set(compare.flatMap((p) => Object.keys(p.specifications ?? {}))));
  return (
    <div>
      <PageHead title={tr('Compare', 'مقارنة')} sub={tr('Up to four products side by side.', 'حتى أربعة منتجات جنباً إلى جنب.')} />
      <div className="mx-auto max-w-7xl px-4 py-10">
        {compare.length === 0 ? <Empty title={tr('Nothing to compare', 'لا شيء للمقارنة')} text={tr('Use the compare icon on product cards.', 'استخدم أيقونة المقارنة في بطاقات المنتجات.')} action={tr('Browse products', 'تصفح المنتجات')} href="/products" /> : (
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr><th className="w-40 p-4" />{compare.map((p) => (
                <th key={p.id} className="relative min-w-52 p-4 text-start align-top" data-testid={`compare-col-${p.id}`}>
                  <button aria-label="Remove" onClick={() => toggleCompare(p)} className="absolute end-2 top-2 rounded-full bg-muted p-1" data-testid={`button-compare-remove-${p.id}`}><X className="size-3.5" /></button>
                  <img src={imgOf(p)} alt="" className="mb-3 aspect-square w-32 rounded-xl bg-muted object-cover" />
                  <Link href={`/products/${p.slug}`} className="line-clamp-2 font-semibold hover:text-secondary">{pn(p)}</Link>
                  <div className="mt-1"><Price p={p} /></div>
                  <Button size="sm" className="mt-2" disabled={p.stock <= 0} onClick={() => addToCart(p)}>{tr('Add to cart', 'أضف للسلة')}</Button>
                </th>))}</tr></thead>
              <tbody>
                {[[tr('Brand', 'العلامة'), (p: typeof compare[0]) => p.brand], [tr('SKU', 'الرمز'), (p: typeof compare[0]) => <span className="font-mono text-xs">{p.sku}</span>], [tr('Rating', 'التقييم'), (p: typeof compare[0]) => <Stars value={p.rating} count={p.reviewCount} />], [tr('Availability', 'التوفر'), (p: typeof compare[0]) => <Stock p={p} />]].map(([l, f], i) => (
                  <tr key={i} className="border-t"><th className="p-4 text-start font-semibold">{l as string}</th>{compare.map((p) => <td key={p.id} className="p-4">{(f as (p: typeof compare[0]) => React.ReactNode)(p)}</td>)}</tr>))}
                {keys.map((k) => <tr key={k} className="border-t odd:bg-muted/40"><th className="p-4 text-start font-semibold">{k}</th>{compare.map((p) => <td key={p.id} className="p-4 font-mono text-[13px]">{p.specifications?.[k] ?? '-'}</td>)}</tr>)}
              </tbody>
            </table>
          </div>)}
        {compare.length > 0 && <Button variant="outline" className="mt-4" onClick={clearCompare} data-testid="button-clear-compare">{tr('Clear all', 'مسح الكل')}</Button>}
      </div>
    </div>
  );
}

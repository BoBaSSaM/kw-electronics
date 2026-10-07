import { Link } from 'wouter';
import { Heart, Eye, GitCompareArrows, ShoppingCart } from 'lucide-react';
import type { Product } from '@workspace/api-client-react';
import { useShop } from '@/lib/shop';
import { useLang } from '@/lib/i18n';
import { discountPct, imgOf } from '@/lib/format';
import { Price, Stars, Stock } from '@/components/bits';
import { cn } from '@/lib/utils';

export function ProductCard({ p, list = false }: { p: Product; list?: boolean }) {
  const { addToCart, toggleWish, inWishlist, toggleCompare, inCompare, setQuick } = useShop();
  const { tr, pn } = useLang();
  const d = discountPct(p);
  const wished = inWishlist(p.id);
  return (
    <article className={cn('group relative flex overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10', list ? 'flex-row' : 'flex-col')} data-testid={`card-product-${p.id}`}>
      <div className={cn('relative shrink-0 bg-muted/60', list ? 'w-36 sm:w-52' : 'aspect-square')}>
        <Link href={`/products/${p.slug}`} className="block size-full">
          <img src={imgOf(p)} alt={pn(p)} loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </Link>
        <div className="absolute start-2 top-2 flex flex-col gap-1">
          {d > 0 && <span className="rounded-md bg-amber px-2 py-0.5 text-xs font-bold text-foreground">-{d}%</span>}
          {p.isNew && <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-white">{tr('New', 'جديد')}</span>}
        </div>
        <div className="absolute end-2 top-2 flex flex-col gap-1.5">
          <button aria-label="Wishlist" onClick={() => toggleWish(p)} data-testid={`button-wish-${p.id}`} className="grid size-8 place-items-center rounded-full bg-white/95 shadow transition-transform hover:scale-110">
            <Heart key={String(wished)} className={cn('size-4', wished ? 'pop fill-red-500 text-red-500' : 'text-foreground')} />
          </button>
          <button aria-label="Quick view" onClick={() => setQuick(p)} data-testid={`button-quick-${p.id}`} className="grid size-8 place-items-center rounded-full bg-white/95 opacity-100 shadow transition md:translate-x-2 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100">
            <Eye className="size-4" />
          </button>
          <button aria-label="Compare" onClick={() => toggleCompare(p)} data-testid={`button-compare-${p.id}`} className={cn('grid size-8 place-items-center rounded-full shadow transition md:translate-x-2 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100', inCompare(p.id) ? 'bg-secondary text-white opacity-100' : 'bg-white/95')}>
            <GitCompareArrows className="size-4" />
          </button>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">{p.brand}</span>
        <Link href={`/products/${p.slug}`} className="line-clamp-2 text-sm font-semibold leading-snug hover:text-secondary" data-testid={`link-product-${p.id}`}>{pn(p)}</Link>
        <Stars value={p.rating} count={p.reviewCount} />
        {list && <p className="line-clamp-2 hidden text-sm text-muted-foreground sm:block">{p.description}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="space-y-1"><Price p={p} /><Stock p={p} /></div>
          <button disabled={p.stock <= 0} onClick={() => addToCart(p)} data-testid={`button-add-${p.id}`} aria-label={tr('Add to cart', 'أضف للسلة')}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-white transition active:scale-90 hover:bg-secondary disabled:opacity-40">
            <ShoppingCart className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

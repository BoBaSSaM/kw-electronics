import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Heart, Minus, Plus, GitCompareArrows, Truck, FileText, ShoppingCart, Star } from 'lucide-react';
import { useGetProduct, getGetProductQueryKey, useListProducts, useListReviews, getListReviewsQueryKey, useAddReview } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useLang } from '@/lib/i18n';
import { useShop } from '@/lib/shop';
import { useSeo } from '@/lib/seo';
import { imgOf, fmtDate, kwd } from '@/lib/format';
import { ProductCard } from '@/components/ProductCard';
import { Price, Stars, Stock, ErrorState, Empty } from '@/components/bits';
import { cn } from '@/lib/utils';

export default function ProductDetail() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { tr, pn } = useLang();
  const { addToCart, toggleWish, inWishlist, toggleCompare, inCompare, pushRecent, cartBusy } = useShop();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, nav] = useLocation();
  const { data: p, isLoading, isError, refetch } = useGetProduct(slug, { query: { enabled: !!slug, queryKey: getGetProductQueryKey(slug), retry: false } });
  const rel = useListProducts({ category: p?.category, limit: 6 }, { query: { enabled: !!p, queryKey: ['related', p?.category] } });
  const reviews = useListReviews(p?.id ?? 0, { query: { enabled: !!p, queryKey: getListReviewsQueryKey(p?.id ?? 0) } });
  const addReview = useAddReview();
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  useEffect(() => { if (p) { pushRecent(p); setImg(0); setQty(1); } }, [p?.id]); // eslint-disable-line
  useSeo(p ? pn(p) : tr('Product', 'منتج'), p?.description.slice(0, 155) ?? '', p ? {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.sku, image: p.images.map((i) => window.location.origin + i), description: p.description, brand: { '@type': 'Brand', name: p.brand },
    aggregateRating: p.reviewCount ? { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviewCount } : undefined,
    offers: { '@type': 'Offer', priceCurrency: 'KWD', price: p.price, availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
  } : null, p ? imgOf(p) : undefined);

  if (isError) return <div className="py-20"><ErrorState onRetry={() => refetch()} text={tr('Product not found', 'المنتج غير موجود')} /></div>;
  if (isLoading || !p) return <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-2"><div className="skel aspect-square rounded-2xl" /><div className="space-y-4"><div className="skel h-8 w-3/4 rounded" /><div className="skel h-5 w-1/3 rounded" /><div className="skel h-24 rounded" /></div></div>;
  const gallery = p.images.length ? p.images : [imgOf(p)];
  const specs = Object.entries(p.specifications ?? {});
  const submit = () => addReview.mutate({ productId: p.id, data: { rating, text } }, {
    onSuccess: () => { setText(''); qc.invalidateQueries({ queryKey: getListReviewsQueryKey(p.id) }); qc.invalidateQueries({ queryKey: getGetProductQueryKey(slug) }); toast({ title: tr('Review posted', 'تم نشر التقييم') }); },
    onError: () => toast({ title: tr('Could not post review', 'تعذر نشر التقييم'), description: tr('Please sign in and write at least 3 characters.', 'يرجى تسجيل الدخول وكتابة 3 أحرف على الأقل.'), variant: 'destructive' }),
  });
  const Qty = (
    <div className="flex items-center rounded-xl border bg-card">
      <button className="p-3" aria-label="Decrease" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="size-4" /></button>
      <span className="w-10 text-center font-semibold" data-testid="text-qty">{qty}</span>
       <button className="p-3" aria-label="Increase" disabled={qty >= p.stock} onClick={() => setQty(Math.min(p.stock, 100, qty + 1))}><Plus className="size-4" /></button>
    </div>);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-28 md:pb-8">
      <div className="mb-5 flex gap-2 text-xs text-muted-foreground"><Link href="/" className="hover:text-primary">{tr('Home', 'الرئيسية')}</Link>/<Link href={`/products?category=${encodeURIComponent(p.category)}`} className="hover:text-primary">{p.category}</Link>/<span className="line-clamp-1">{pn(p)}</span></div>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <div className="relative aspect-square cursor-zoom-in overflow-hidden rounded-3xl border bg-muted/60" data-testid="gallery-main"
            onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }} onMouseLeave={() => setZoom(null)}>
            <img src={gallery[img]} alt={pn(p)} className="size-full object-cover transition-transform duration-150" style={zoom ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} />
          </div>
          {gallery.length > 1 && <div className="mt-3 flex gap-2">{gallery.map((g, i) => <button key={i} onClick={() => setImg(i)} className={cn('size-20 overflow-hidden rounded-xl border-2', i === img ? 'border-secondary' : 'border-transparent')}><img src={g} alt="" className="size-full object-cover" /></button>)}</div>}
        </div>
        <div className="space-y-4">
          <Link href={`/products?brand=${encodeURIComponent(p.brand)}`} className="text-xs font-bold uppercase tracking-wider text-secondary">{p.brand}</Link>
          <h1 className="text-2xl font-bold md:text-4xl" data-testid="text-product-name">{pn(p)}</h1>
          <div className="flex flex-wrap items-center gap-4"><Stars value={p.rating} count={p.reviewCount} size={16} /><span className="font-mono text-xs text-muted-foreground" data-testid="text-sku">SKU {p.sku}</span><Stock p={p} /></div>
          <Price p={p} big />
          <p className="text-muted-foreground">{p.description}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            {Qty}
            <Button size="lg" disabled={p.stock <= 0 || cartBusy} onClick={() => addToCart(p, qty)} className="h-12 flex-1 bg-amber px-8 text-foreground hover:bg-amber/90" data-testid="button-add-to-cart"><ShoppingCart className="size-4" />{tr('Add to Cart', 'أضف للسلة')}</Button>
             <Button size="lg" disabled={p.stock <= 0 || cartBusy} onClick={async () => { if (await addToCart(p, qty, false)) nav('/checkout'); }} className="h-12 px-8" data-testid="button-buy-now">{tr('Buy Now', 'اشترِ الآن')}</Button>
          </div>
          <div className="flex gap-3 text-sm">
            <button onClick={() => toggleWish(p)} data-testid="button-wishlist" className="flex items-center gap-1.5 font-semibold hover:text-secondary"><Heart className={cn('size-4', inWishlist(p.id) && 'fill-red-500 text-red-500')} />{inWishlist(p.id) ? tr('In wishlist', 'في المفضلة') : tr('Add to wishlist', 'أضف للمفضلة')}</button>
            <button onClick={() => toggleCompare(p)} data-testid="button-compare" className="flex items-center gap-1.5 font-semibold hover:text-secondary"><GitCompareArrows className="size-4" />{inCompare(p.id) ? tr('Remove from compare', 'إزالة من المقارنة') : tr('Compare', 'قارن')}</button>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-primary/5 p-4 text-sm"><Truck className="size-5 text-secondary" />{tr('Delivery across Kuwait. Pickup available.', 'توصيل داخل الكويت. الاستلام متاح.')}</div>
        </div>
      </div>
      <Tabs defaultValue="desc" className="mt-12">
        <TabsList className="h-auto flex-wrap justify-start">{[['desc', tr('Description', 'الوصف')], ['specs', tr('Specifications', 'المواصفات')], ['datasheet', tr('Datasheet', 'ورقة البيانات')], ['tech', tr('Technical Info', 'معلومات فنية')], ['ship', tr('Shipping', 'الشحن')], ['reviews', `${tr('Reviews', 'التقييمات')} (${p.reviewCount})`]].map(([v, l]) => <TabsTrigger key={v} value={v} data-testid={`tab-${v}`}>{l}</TabsTrigger>)}</TabsList>
        <div className="mt-4 rounded-2xl border bg-card p-6">
          <TabsContent value="desc"><p className="max-w-3xl leading-relaxed">{p.description}</p></TabsContent>
          <TabsContent value="specs">{specs.length ? <table className="w-full max-w-2xl text-sm"><tbody>{specs.map(([k, v], i) => <tr key={k} className={i % 2 ? '' : 'bg-muted/50'}><th className="w-1/2 px-4 py-2.5 text-start font-semibold">{k}</th><td className="px-4 py-2.5 font-mono text-[13px]">{v}</td></tr>)}</tbody></table> : <p className="text-muted-foreground">{tr('No specifications listed.', 'لا توجد مواصفات.')}</p>}</TabsContent>
          <TabsContent value="datasheet">{p.datasheet ? <Button asChild variant="outline"><a href={p.datasheet} target="_blank" rel="noreferrer" data-testid="link-datasheet"><FileText className="size-4" />{tr('Open datasheet', 'فتح ورقة البيانات')}</a></Button> : <p className="text-muted-foreground">{tr('A datasheet is not available for this product yet. Contact support for documentation.', 'ورقة البيانات غير متوفرة بعد. تواصل مع الدعم.')}</p>}</TabsContent>
          <TabsContent value="tech"><ul className="space-y-1.5 text-sm"><li>{tr('Category', 'الفئة')}: {p.category}{p.subcategory && ` / ${p.subcategory}`}</li><li>{tr('Brand', 'العلامة')}: {p.brand}</li><li>SKU: <span className="font-mono">{p.sku}</span></li><li>{tr('Units sold', 'الوحدات المباعة')}: {p.soldCount}</li></ul></TabsContent>
          <TabsContent value="ship"><p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{tr('Orders ship within Kuwait with standard and express delivery, or collect in store. See our shipping and returns pages for details.', 'تشحن الطلبات داخل الكويت بتوصيل عادي أو سريع أو استلام من المتجر. راجع صفحتي الشحن والإرجاع.')} <Link href="/shipping" className="font-semibold text-secondary">{tr('Shipping policy', 'سياسة الشحن')}</Link></p></TabsContent>
          <TabsContent value="reviews">
            <div className="grid gap-8 md:grid-cols-[1fr_340px]">
              <div className="space-y-4">{reviews.isLoading ? <div className="skel h-20 rounded-xl" /> : (reviews.data ?? []).length === 0 ? <Empty title={tr('No reviews yet', 'لا تقييمات بعد')} text={tr('Be the first to review this product.', 'كن أول من يقيّم.')} /> : (reviews.data ?? []).map((r) => (
                <div key={r.id} className="rounded-xl border p-4" data-testid={`review-${r.id}`}><div className="flex items-center justify-between"><span className="font-semibold">{r.name}</span><span className="text-xs text-muted-foreground">{fmtDate(r.createdAt)}</span></div><Stars value={r.rating} /><p className="mt-2 text-sm">{r.text}</p></div>))}</div>
              <div className="h-fit space-y-3 rounded-xl bg-muted/50 p-4"><h4 className="font-semibold">{tr('Write a review', 'اكتب تقييماً')}</h4>
                <div className="flex gap-1">{[1, 2, 3, 4, 5].map((i) => <button key={i} aria-label={`${i} stars`} onClick={() => setRating(i)}><Star className={cn('size-6', i <= rating ? 'fill-amber text-amber' : 'text-border')} /></button>)}</div>
                <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder={tr('Share how you used it', 'شاركنا تجربتك')} data-testid="input-review" />
                <Button onClick={submit} disabled={addReview.isPending || text.trim().length < 3} data-testid="button-submit-review">{tr('Post review', 'نشر')}</Button></div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
      {(rel.data?.products ?? []).filter((x) => x.id !== p.id).length > 0 && <section className="mt-14"><h2 className="mb-5 text-2xl font-bold">{tr('Related Products', 'منتجات ذات صلة')}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">{rel.data!.products.filter((x) => x.id !== p.id).slice(0, 5).map((x) => <ProductCard key={x.id} p={x} />)}</div></section>}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t bg-background/95 p-3 backdrop-blur md:hidden" data-testid="bar-sticky-cart">
        <div className="min-w-0"><p className="line-clamp-1 text-xs text-muted-foreground">{pn(p)}</p><p className="font-display font-bold text-primary">{kwd(p.price)}</p></div>
         <Button disabled={p.stock <= 0 || cartBusy} onClick={() => addToCart(p, qty)} className="ms-auto h-11 bg-amber px-6 text-foreground hover:bg-amber/90" data-testid="button-sticky-add">{tr('Add to Cart', 'أضف للسلة')}</Button>
      </div>
    </div>
  );
}

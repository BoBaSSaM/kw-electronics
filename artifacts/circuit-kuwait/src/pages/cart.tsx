import { useState } from 'react';
import { Link } from 'wouter';
import { Minus, Plus, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useShop } from '@/lib/shop';
import { useLang } from '@/lib/i18n';
import { useSeo } from '@/lib/seo';
import { imgOf, kwd } from '@/lib/format';
import { PageHead, Empty } from '@/components/bits';

export function Totals({ delivery: selectedDelivery }: { delivery?: number } = {}) {
  const { cart } = useShop(); const { tr } = useLang();
  if (!cart) return null;
  const delivery = selectedDelivery ?? cart.delivery;
  const total = Math.round((cart.subtotal + delivery - cart.discount) * 1000) / 1000;
  const R = ({ l, v, c = '' }: { l: string; v: string; c?: string }) => <div className={`flex justify-between text-sm ${c}`}><span className="text-muted-foreground">{l}</span><span className="font-semibold">{v}</span></div>;
   return <div className="space-y-2.5"><R l={tr('Subtotal', 'المجموع الفرعي')} v={kwd(cart.subtotal)} /><R l={tr('Delivery', 'التوصيل')} v={delivery ? kwd(delivery) : tr('Free', 'مجاني')} />{cart.discount > 0 && <R l={`${tr('Discount', 'الخصم')} ${cart.coupon}`} v={`-${kwd(cart.discount)}`} c="text-emerald-600" />}
     <div className="flex justify-between border-t pt-3 font-display text-xl font-bold text-primary"><span>{tr('Total', 'الإجمالي')}</span><span data-testid="text-cart-total">{kwd(total)}</span></div></div>;
}
export function CouponBox() {
  const { cart, applyCoupon, cartBusy } = useShop(); const { tr } = useLang();
  const [code, setCode] = useState('');
  return <div className="flex gap-2"><div className="relative flex-1"><Tag className="absolute start-3 top-3 size-4 text-muted-foreground" /><Input className="ps-9" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={cart?.coupon || tr('Coupon code', 'كود الخصم')} data-testid="input-coupon" /></div>
    <Button variant="outline" disabled={!code || cartBusy} onClick={() => applyCoupon(code).then(() => setCode(''))} data-testid="button-apply-coupon">{tr('Apply', 'تطبيق')}</Button></div>;
}

export default function CartPage() {
  const { cart, cartLoading, setQty, removeLine, clearCart } = useShop();
  const { tr, pn } = useLang();
  useSeo(tr('Shopping cart', 'سلة التسوق'), tr('Review your items.', 'راجع منتجاتك.'));
  const items = cart?.items ?? [];
  return (
    <div>
      <PageHead title={tr('Shopping Cart', 'سلة التسوق')} />
      <div className="mx-auto max-w-7xl px-4 py-10">
        {cartLoading ? <div className="skel h-48 rounded-2xl" /> : items.length === 0 ? <Empty title={tr('Your cart is empty', 'سلتك فارغة')} text={tr('Add a board or two and start building.', 'أضف لوحة أو اثنتين وابدأ البناء.')} action={tr('Shop products', 'تسوق المنتجات')} href="/products" /> : (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="overflow-hidden rounded-2xl border bg-card">
              {items.map((l) => (
                <div key={l.product.id} className="flex gap-4 border-b p-4 last:border-0" data-testid={`row-cart-${l.product.id}`}>
                  <img src={imgOf(l.product)} alt="" className="size-24 rounded-xl bg-muted object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div className="min-w-0"><Link href={`/products/${l.product.slug}`} className="line-clamp-2 font-semibold hover:text-secondary">{pn(l.product)}</Link><p className="font-mono text-xs text-muted-foreground">{l.product.sku}</p><p className="text-sm">{kwd(l.product.price)}</p></div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center rounded-lg border"><button className="p-2" aria-label="Decrease" onClick={() => setQty(l.product.id, l.quantity - 1)}><Minus className="size-4" /></button><span className="w-8 text-center font-semibold" data-testid={`text-cart-qty-${l.product.id}`}>{l.quantity}</span><button className="p-2" aria-label="Increase" onClick={() => setQty(l.product.id, l.quantity + 1)}><Plus className="size-4" /></button></div>
                      <span className="w-24 text-end font-bold text-primary">{kwd(l.product.price * l.quantity)}</span>
                      <button aria-label="Remove" onClick={() => removeLine(l.product.id)} data-testid={`button-remove-${l.product.id}`} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                    </div></div></div>))}
              <div className="p-4"><Button variant="ghost" onClick={clearCart} data-testid="button-clear-cart">{tr('Clear cart', 'إفراغ السلة')}</Button></div>
            </div>
            <aside className="h-fit space-y-5 rounded-2xl border bg-card p-6 lg:sticky lg:top-36"><h2 className="text-lg font-bold">{tr('Order summary', 'ملخص الطلب')}</h2><CouponBox /><Totals />
              <Button asChild className="h-12 w-full bg-amber text-foreground hover:bg-amber/90"><Link href="/checkout" data-testid="link-checkout">{tr('Proceed to checkout', 'إتمام الشراء')}</Link></Button></aside>
          </div>)}
      </div>
    </div>
  );
}

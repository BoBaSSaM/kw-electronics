import { Link } from 'wouter';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useShop } from '@/lib/shop';
import { useLang } from '@/lib/i18n';
import { imgOf, kwd } from '@/lib/format';

export function CartDrawer() {
  const { drawerOpen, setDrawerOpen, cart, cartLoading, setQty, removeLine, cartCount } = useShop();
  const { tr, pn, rtl } = useLang();
  const items = cart?.items ?? [];
  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent side={rtl ? 'left' : 'right'} className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-5 text-start">
          <SheetTitle>{tr('Your cart', 'سلتك')} ({cartCount})</SheetTitle>
          <SheetDescription>{tr('Delivery across Kuwait', 'التوصيل داخل الكويت')}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-5">
          {cartLoading ? <Skeleton className="h-24 w-full" /> : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-muted"><ShoppingBag className="size-7 text-secondary" /></div>
              <p className="font-semibold">{tr('Your cart is empty', 'سلتك فارغة')}</p>
              <Button asChild className="mt-4" onClick={() => setDrawerOpen(false)}><Link href="/products">{tr('Start shopping', 'ابدأ التسوق')}</Link></Button>
            </div>
          ) : (
            <ul className="space-y-4">{items.map((l) => (
              <li key={l.product.id} className="flex gap-3" data-testid={`row-drawer-${l.product.id}`}>
                <img src={imgOf(l.product)} alt="" className="size-20 rounded-xl bg-muted object-cover" />
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${l.product.slug}`} onClick={() => setDrawerOpen(false)} className="line-clamp-2 text-sm font-semibold">{pn(l.product)}</Link>
                  <p className="text-xs text-muted-foreground">{kwd(l.product.price)}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-lg border">
                      <button className="p-1.5" aria-label="Decrease" onClick={() => setQty(l.product.id, l.quantity - 1)}><Minus className="size-3.5" /></button>
                      <span className="w-7 text-center text-sm font-semibold">{l.quantity}</span>
                      <button className="p-1.5" aria-label="Increase" onClick={() => setQty(l.product.id, l.quantity + 1)}><Plus className="size-3.5" /></button>
                    </div>
                    <span className="text-sm font-bold text-primary">{kwd(l.product.price * l.quantity)}</span>
                    <button aria-label="Remove" onClick={() => removeLine(l.product.id)} data-testid={`button-drawer-remove-${l.product.id}`} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                  </div>
                </div>
              </li>
            ))}</ul>
          )}
        </div>
        {items.length > 0 && cart && (
          <div className="space-y-3 border-t bg-muted/40 p-5">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{tr('Subtotal', 'المجموع الفرعي')}</span><span className="font-semibold">{kwd(cart.subtotal)}</span></div>
            {cart.discount > 0 && <div className="flex justify-between text-sm text-emerald-600"><span>{tr('Discount', 'الخصم')}</span><span>-{kwd(cart.discount)}</span></div>}
            <div className="flex justify-between font-display text-lg font-bold text-primary"><span>{tr('Total', 'الإجمالي')}</span><span>{kwd(cart.total)}</span></div>
            <Button asChild className="h-11 w-full bg-amber text-foreground hover:bg-amber/90" onClick={() => setDrawerOpen(false)}><Link href="/checkout" data-testid="link-drawer-checkout">{tr('Checkout', 'إتمام الشراء')}</Link></Button>
            <Button asChild variant="outline" className="w-full" onClick={() => setDrawerOpen(false)}><Link href="/cart" data-testid="link-drawer-cart">{tr('View cart', 'عرض السلة')}</Link></Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

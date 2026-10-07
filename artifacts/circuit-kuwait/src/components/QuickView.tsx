import { useState } from 'react';
import { Link } from 'wouter';
import { Minus, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useShop } from '@/lib/shop';
import { useLang } from '@/lib/i18n';
import { imgOf } from '@/lib/format';
import { Price, Stars, Stock } from '@/components/bits';

export function QuickView() {
  const { quick, setQuick, addToCart } = useShop();
  const { tr, pn } = useLang();
  const [qty, setQty] = useState(1);
  return (
    <Dialog open={!!quick} onOpenChange={(o) => { if (!o) { setQuick(null); setQty(1); } }}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        {quick && (
          <div className="grid md:grid-cols-2">
            <img src={imgOf(quick)} alt={pn(quick)} className="aspect-square size-full bg-muted object-cover" />
            <div className="flex flex-col gap-3 p-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary">{quick.brand}</span>
              <DialogTitle className="text-xl">{pn(quick)}</DialogTitle>
              <DialogDescription className="line-clamp-4">{quick.description}</DialogDescription>
              <Stars value={quick.rating} count={quick.reviewCount} />
              <Price p={quick} big /><Stock p={quick} />
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg border">
                  <button className="p-2.5" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease"><Minus className="size-4" /></button>
                  <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                  <button className="p-2.5" onClick={() => setQty(qty + 1)} aria-label="Increase"><Plus className="size-4" /></button>
                </div>
                <Button className="flex-1 bg-amber text-foreground hover:bg-amber/90" disabled={quick.stock <= 0} onClick={() => { addToCart(quick, qty); setQuick(null); setQty(1); }} data-testid="button-quick-add">{tr('Add to cart', 'أضف للسلة')}</Button>
              </div>
              <Link href={`/products/${quick.slug}`} onClick={() => setQuick(null)} className="text-sm font-semibold text-secondary hover:underline" data-testid="link-quick-details">{tr('View full details', 'عرض التفاصيل الكاملة')}</Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

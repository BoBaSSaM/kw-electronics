import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetCart, useUpdateCart, getGetCartQueryKey, useGetWishlist, useUpdateWishlist, getGetWishlistQueryKey,
  type Cart, type Product,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { useLang } from '@/lib/i18n';

interface Shop {
  cart: Cart | undefined; cartLoading: boolean; cartCount: number; cartBusy: boolean;
  addToCart: (p: Product, qty?: number, openDrawer?: boolean) => Promise<boolean>;
  setQty: (productId: number, qty: number) => void;
  removeLine: (productId: number) => void;
  applyCoupon: (code: string) => Promise<boolean>;
  clearCart: () => void;
  wishlist: Product[]; wishLoading: boolean; inWishlist: (id: number) => boolean; toggleWish: (p: Product) => void;
  compare: Product[]; inCompare: (id: number) => boolean; toggleCompare: (p: Product) => void; clearCompare: () => void;
  recent: Product[]; pushRecent: (p: Product) => void;
  drawerOpen: boolean; setDrawerOpen: (b: boolean) => void;
  quick: Product | null; setQuick: (p: Product | null) => void;
}
const C = createContext<Shop | null>(null);
const load = (k: string): Product[] => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } };

export function ShopProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { tr, pn } = useLang();
  const cartQ = useGetCart();
  const wishQ = useGetWishlist();
  const updateCart = useUpdateCart();
  const updateWish = useUpdateWishlist();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quick, setQuick] = useState<Product | null>(null);
  const [compare, setCompare] = useState<Product[]>(() => load('ck-compare'));
  const [recent, setRecent] = useState<Product[]>(() => load('ck-recent'));
  useEffect(() => localStorage.setItem('ck-compare', JSON.stringify(compare)), [compare]);
  useEffect(() => localStorage.setItem('ck-recent', JSON.stringify(recent)), [recent]);

  const cart = cartQ.data;
  const push = useCallback((items: { productId: number; quantity: number }[], coupon?: string) =>
    updateCart.mutateAsync({ data: { items, coupon: coupon || undefined } }).then((c) => { qc.setQueryData(getGetCartQueryKey(), c); return c; }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
   [qc, updateCart.mutateAsync]);
  const lines = () => (cart?.items ?? []).map((l) => ({ productId: l.product.id, quantity: l.quantity }));
  const fail = () => toast({ title: tr('Could not update cart', 'تعذر تحديث السلة'), variant: 'destructive' });

  const addToCart: Shop['addToCart'] = async (p, qty = 1, open = true) => {
    if (updateCart.isPending || cartQ.isLoading) return false;
    const cur = lines(); const f = cur.find((l) => l.productId === p.id);
    const next = f ? cur.map((l) => (l.productId === p.id ? { ...l, quantity: Math.min(100, l.quantity + qty) } : l)) : [...cur, { productId: p.id, quantity: qty }];
    try {
      await push(next, cart?.coupon);
      if (open) setDrawerOpen(true);
      toast({ title: tr('Added to cart', 'تمت الإضافة للسلة'), description: pn(p) });
      return true;
    } catch { fail(); return false; }
  };
  const setQty = (id: number, q: number) => push(lines().map((l) => (l.productId === id ? { ...l, quantity: Math.max(1, Math.min(100, q)) } : l)), cart?.coupon).catch(fail);
  const removeLine = (id: number) => push(lines().filter((l) => l.productId !== id), cart?.coupon).catch(fail);
  const clearCart = () => push([], '').catch(fail);
  const applyCoupon = async (code: string) => {
    try {
      const c = await push(lines(), code);
      const ok = !!c.coupon && c.discount > 0;
      toast(ok ? { title: tr('Coupon applied', 'تم تطبيق الكوبون') } : { title: tr('Coupon not valid', 'الكوبون غير صالح'), variant: 'destructive' });
      return ok;
    } catch { fail(); return false; }
  };

  const wishlist = wishQ.data ?? [];
  const inWishlist = (id: number) => wishlist.some((p) => p.id === id);
  const toggleWish = (p: Product) => {
    if (updateWish.isPending || wishQ.isLoading) return;
    const ids = inWishlist(p.id) ? wishlist.filter((x) => x.id !== p.id).map((x) => x.id) : [...wishlist.map((x) => x.id), p.id];
    const was = inWishlist(p.id);
    updateWish.mutate({ data: { productIds: ids } }, {
      onSuccess: (list) => { qc.setQueryData(getGetWishlistQueryKey(), list); toast({ title: was ? tr('Removed from wishlist', 'أزيل من المفضلة') : tr('Saved to wishlist', 'تمت الإضافة للمفضلة') }); },
      onError: () => toast({ title: tr('Could not update wishlist', 'تعذر تحديث المفضلة'), variant: 'destructive' }),
    });
  };
  const toggleCompare = (p: Product) => setCompare((c) => {
    if (c.some((x) => x.id === p.id)) return c.filter((x) => x.id !== p.id);
    if (c.length >= 4) { toast({ title: tr('Compare up to 4 products', 'قارن حتى 4 منتجات') }); return c; }
    return [...c, p];
  });
  const pushRecent = useCallback((p: Product) => setRecent((r) => [p, ...r.filter((x) => x.id !== p.id)].slice(0, 8)), []);

  const value = useMemo<Shop>(() => ({
    cart, cartLoading: cartQ.isLoading, cartCount: (cart?.items ?? []).reduce((a, l) => a + l.quantity, 0), cartBusy: updateCart.isPending,
    addToCart, setQty, removeLine, applyCoupon, clearCart,
    wishlist, wishLoading: wishQ.isLoading, inWishlist, toggleWish,
    compare, inCompare: (id) => compare.some((x) => x.id === id), toggleCompare, clearCompare: () => setCompare([]),
    recent, pushRecent, drawerOpen, setDrawerOpen, quick, setQuick,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [cart, cartQ.isLoading, updateCart.isPending, wishlist, wishQ.isLoading, compare, recent, drawerOpen, quick, tr]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
export function useShop() { const c = useContext(C); if (!c) throw new Error('ShopProvider missing'); return c; }

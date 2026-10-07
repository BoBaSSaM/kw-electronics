import { useShop } from '@/lib/shop';
import { useLang } from '@/lib/i18n';
import { useSeo } from '@/lib/seo';
import { ProductCard } from '@/components/ProductCard';
import { PageHead, Empty, GridSkeleton } from '@/components/bits';

export default function Wishlist() {
  const { wishlist, wishLoading } = useShop();
  const { tr } = useLang();
  useSeo(tr('Wishlist', 'المفضلة'), tr('Your saved products.', 'منتجاتك المحفوظة.'));
  return (
    <div>
      <PageHead title={tr('Wishlist', 'المفضلة')} sub={`${wishlist.length} ${tr('saved', 'محفوظ')}`} />
      <div className="mx-auto max-w-7xl px-4 py-10">
        {wishLoading ? <div className="grid grid-cols-2 gap-4 md:grid-cols-4"><GridSkeleton n={4} /></div> : wishlist.length === 0 ? <Empty title={tr('Nothing saved yet', 'لا شيء محفوظ')} text={tr('Tap the heart on any product to keep it here.', 'اضغط على القلب في أي منتج لحفظه هنا.')} action={tr('Browse products', 'تصفح المنتجات')} href="/products" /> :
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{wishlist.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
      </div>
    </div>
  );
}

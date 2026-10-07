import { Link, useParams } from 'wouter';
import { useGetOrder, getGetOrderQueryKey } from '@workspace/api-client-react';
import { useLang } from '@/lib/i18n';
import { useSeo } from '@/lib/seo';
import { imgOf, kwd, fmtDate } from '@/lib/format';
import { PageHead, ErrorState } from '@/components/bits';

export const statusColor = (s: string) => ({ Pending: 'bg-amber/25 text-[#8a6100]', Processing: 'bg-secondary/15 text-secondary', Shipped: 'bg-primary/15 text-primary', Delivered: 'bg-emerald-100 text-emerald-700', Cancelled: 'bg-red-100 text-red-700' } as Record<string, string>)[s] ?? 'bg-muted';
export default function OrderDetail() {
  const id = Number(useParams<{ id: string }>().id);
  const { tr, pn } = useLang();
  const { data: o, isLoading, isError, refetch } = useGetOrder(id, { query: { enabled: !!id, queryKey: getGetOrderQueryKey(id), retry: false } });
  useSeo(tr('Order', 'الطلب'), tr('Order details', 'تفاصيل الطلب'));
  return (
    <div>
      <PageHead title={o ? `${tr('Order', 'طلب')} ${o.number}` : tr('Order', 'طلب')} crumbs={[{ label: tr('Account', 'الحساب'), href: '/account' }, { label: tr('Order', 'طلب') }]} />
      <div className="mx-auto max-w-4xl px-4 py-10">
        {isError ? <ErrorState onRetry={() => refetch()} text={tr('Order not found or sign-in required', 'الطلب غير موجود أو يلزم تسجيل الدخول')} /> : isLoading || !o ? <div className="skel h-64 rounded-2xl" /> : (
          <div className="space-y-6" data-testid="order-detail">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5"><div><p className="text-sm text-muted-foreground">{fmtDate(o.createdAt)}</p><p className="font-mono font-bold">{o.number}</p></div>
              <div className="flex items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor(o.status)}`} data-testid="text-order-status">{o.status}</span>{o.simulated && <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{tr('Demo order', 'طلب تجريبي')}</span>}</div></div>
            <div className="overflow-hidden rounded-2xl border bg-card">{o.items.map((l) => <Link key={l.product.id} href={`/products/${l.product.slug}`} className="flex items-center gap-4 border-b p-4 last:border-0"><img src={imgOf(l.product)} alt="" className="size-14 rounded-lg bg-muted object-cover" /><span className="flex-1 text-sm font-semibold">{pn(l.product)}</span><span className="text-sm text-muted-foreground">x {l.quantity}</span><span className="font-bold text-primary">{kwd(l.product.price * l.quantity)}</span></Link>)}</div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border bg-card p-5 text-sm"><h3 className="mb-2 font-bold">{tr('Delivery address', 'عنوان التوصيل')}</h3><p>{o.name}</p><p className="text-muted-foreground">{o.address.governorate}, {o.address.area}, {tr('Block', 'قطعة')} {o.address.block}, {o.address.street}, {o.address.building}</p><p className="mt-2 capitalize text-muted-foreground">{o.deliveryMethod} - {o.paymentMethod}</p></div>
              <div className="space-y-2 rounded-2xl border bg-card p-5 text-sm">{[[tr('Subtotal', 'المجموع الفرعي'), o.subtotal], [tr('Delivery', 'التوصيل'), o.delivery], [tr('Discount', 'الخصم'), -o.discount]].map(([l, v]) => <div key={l as string} className="flex justify-between"><span className="text-muted-foreground">{l}</span><span>{kwd(v as number)}</span></div>)}<div className="flex justify-between border-t pt-2 font-display text-lg font-bold text-primary"><span>{tr('Total', 'الإجمالي')}</span><span>{kwd(o.total)}</span></div></div>
            </div></div>)}
      </div>
    </div>
  );
}

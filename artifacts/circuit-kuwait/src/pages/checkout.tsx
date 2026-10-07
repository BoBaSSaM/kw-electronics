import { useState } from 'react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Check, CircleCheck, Info } from 'lucide-react';
import { useAuth } from '@clerk/react';
import { usePlaceOrder, useListAddresses, getListAddressesQueryKey, getGetCartQueryKey, getListOrdersQueryKey, type AddressInput, type Order, type OrderInput } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useShop } from '@/lib/shop';
import { useLang } from '@/lib/i18n';
import { useSeo } from '@/lib/seo';
import { imgOf, kwd } from '@/lib/format';
import { AddressForm, addressValid, emptyAddress } from '@/components/AddressForm';
import { PageHead, Empty } from '@/components/bits';
import { Totals } from '@/pages/cart';
import { cn } from '@/lib/utils';

type DM = OrderInput['deliveryMethod']; type PM = OrderInput['paymentMethod'];
export default function Checkout() {
  const { cart, cartLoading } = useShop();
  const { tr, pn } = useLang();
  const { isSignedIn } = useAuth();
  const qc = useQueryClient(); const { toast } = useToast();
  const place = usePlaceOrder();
  const addrs = useListAddresses({ query: { enabled: !!isSignedIn, queryKey: getListAddressesQueryKey(), retry: false } });
  const [step, setStep] = useState(0);
  const [cust, setCust] = useState({ name: '', email: '', phone: '' });
  const [addr, setAddr] = useState<AddressInput>(emptyAddress);
  const [dm, setDm] = useState<DM>('standard');
  const [pm, setPm] = useState<PM>('KNET');
  const [done, setDone] = useState<Order | null>(null);
  useSeo(tr('Checkout', 'إتمام الشراء'), tr('Secure demo checkout.', 'إتمام شراء تجريبي.'));
  const items = cart?.items ?? [];
  const steps = [tr('Customer', 'العميل'), tr('Address', 'العنوان'), tr('Delivery', 'التوصيل'), tr('Payment', 'الدفع'), tr('Review', 'المراجعة')];
  const phoneOk = /^\+?[0-9 ]{8,15}$/.test(cust.phone);
  const canNext = [cust.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(cust.email) && phoneOk, addressValid(addr), true, true, true][step];
  const submit = () => place.mutate({ data: { ...cust, address: addr, deliveryMethod: dm, paymentMethod: pm } }, {
     onSuccess: (o) => { setDone(o); qc.invalidateQueries({ queryKey: getGetCartQueryKey() }); qc.invalidateQueries({ queryKey: getListOrdersQueryKey() }); qc.invalidateQueries({ queryKey: ['/api/products'] }); toast({ title: tr('Order placed successfully', 'تم إرسال الطلب بنجاح') }); },
    onError: () => toast({ title: tr('Order could not be placed', 'تعذر إتمام الطلب'), variant: 'destructive' }),
  });
  if (done) return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center" data-testid="order-confirmation">
      <div className="mx-auto mb-5 grid size-20 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CircleCheck className="size-10" /></div>
      <h1 className="text-3xl font-bold">{tr('Order confirmed', 'تم تأكيد الطلب')}</h1>
      <p className="mt-2 text-muted-foreground">{tr('Order number', 'رقم الطلب')}: <span className="font-mono font-bold text-foreground" data-testid="text-order-number">{done.number}</span></p>
      <p className="mt-2 text-sm text-muted-foreground">{tr('Total', 'الإجمالي')} {kwd(done.total)} - {done.paymentMethod}</p>
      <p className="mx-auto mt-4 max-w-sm rounded-xl bg-amber/15 p-3 text-xs">{tr('Demo order: no payment was taken and no card details were collected.', 'طلب تجريبي: لم يتم سحب أي مبلغ ولم تُجمع بيانات بطاقة.')}</p>
      <div className="mt-6 flex justify-center gap-3"><Button asChild><Link href={`/orders/${done.id}`} data-testid="link-view-order">{tr('View order', 'عرض الطلب')}</Link></Button><Button asChild variant="outline"><Link href="/products">{tr('Keep shopping', 'تابع التسوق')}</Link></Button></div>
    </div>);
  if (!cartLoading && items.length === 0) return <div className="py-20"><Empty title={tr('Nothing to check out', 'لا شيء لإتمامه')} action={tr('Shop products', 'تسوق المنتجات')} href="/products" /></div>;
  const opt = (sel: boolean) => cn('flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 transition', sel ? 'border-secondary bg-secondary/5 ring-2 ring-secondary/20' : 'hover:border-secondary/50');
  return (
    <div>
      <PageHead title={tr('Checkout', 'إتمام الشراء')} />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <ol className="mb-8 flex items-center gap-2 overflow-x-auto text-sm">{steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2"><span className={cn('grid size-7 place-items-center rounded-full text-xs font-bold', i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-primary text-white' : 'bg-muted text-muted-foreground')}>{i < step ? <Check className="size-4" /> : i + 1}</span><span className={cn('whitespace-nowrap font-semibold', i > step && 'text-muted-foreground')}>{s}</span>{i < 4 && <span className="h-px w-6 bg-border" />}</li>))}</ol>
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="rounded-2xl border bg-card p-6">
            {step === 0 && <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5 sm:col-span-2"><Label>{tr('Full name', 'الاسم الكامل')} *</Label><Input value={cust.name} onChange={(e) => setCust({ ...cust, name: e.target.value })} data-testid="input-name" /></div>
              <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={cust.email} onChange={(e) => setCust({ ...cust, email: e.target.value })} data-testid="input-email" /></div>
              <div className="space-y-1.5"><Label>{tr('Phone', 'الهاتف')} *</Label><Input value={cust.phone} placeholder="+965 5000 0000" onChange={(e) => setCust({ ...cust, phone: e.target.value })} data-testid="input-phone" />{cust.phone && !phoneOk && <p className="text-xs text-destructive">{tr('8-15 digits', '8-15 رقماً')}</p>}</div></div>}
            {step === 1 && <div className="space-y-5">{(addrs.data ?? []).length > 0 && <div className="flex flex-wrap gap-2">{addrs.data!.map((a) => <button key={a.id} onClick={() => setAddr(a)} className="rounded-full border px-3 py-1.5 text-xs font-semibold hover:border-secondary" data-testid={`button-use-address-${a.id}`}>{a.label || `${a.area}, Block ${a.block}`}</button>)}</div>}<AddressForm value={addr} onChange={setAddr} /></div>}
            {step === 2 && <div className="space-y-3">{([['standard', tr('Standard delivery', 'توصيل عادي'), tr('1-3 working days across Kuwait', '1-3 أيام عمل داخل الكويت')], ['express', tr('Express delivery', 'توصيل سريع'), tr('Same or next day where available', 'في نفس اليوم أو اليوم التالي')], ['pickup', tr('Store pickup', 'استلام من المتجر'), tr('Collect when your order is ready', 'استلم عند جاهزية الطلب')]] as const).map(([v, t, d]) => (
              <label key={v} className={opt(dm === v)} onClick={() => setDm(v)} data-testid={`option-delivery-${v}`}><div><p className="font-semibold">{t}</p><p className="text-xs text-muted-foreground">{d}</p></div><span className={cn('size-4 rounded-full border-2', dm === v && 'border-secondary bg-secondary')} /></label>))}</div>}
            {step === 3 && <div className="space-y-3"><div className="flex gap-2 rounded-xl bg-amber/15 p-3 text-sm"><Info className="mt-0.5 size-4 shrink-0" />{tr('Demo checkout: choosing a method records it on the order only. No payment is processed and no card data is collected.', 'دفع تجريبي: اختيار الطريقة يُسجل في الطلب فقط. لا تتم معالجة أي دفعة ولا تُجمع بيانات بطاقة.')}</div>
              <div className="grid gap-3 sm:grid-cols-2">{(['KNET', 'Visa', 'Mastercard', 'Apple Pay', 'Cash on Delivery'] as const).map((m) => <label key={m} className={opt(pm === m)} onClick={() => setPm(m)} data-testid={`option-payment-${m.replace(/ /g, '-')}`}><span className="font-semibold">{m}</span><span className={cn('size-4 rounded-full border-2', pm === m && 'border-secondary bg-secondary')} /></label>)}</div></div>}
            {step === 4 && <div className="space-y-4 text-sm"><div><h3 className="font-bold">{tr('Customer', 'العميل')}</h3><p>{cust.name} - {cust.email} - {cust.phone}</p></div><div><h3 className="font-bold">{tr('Address', 'العنوان')}</h3><p>{addr.governorate}, {addr.area}, {tr('Block', 'قطعة')} {addr.block}, {addr.street}{addr.avenue && `, ${addr.avenue}`}, {addr.building}{addr.floor && `, F${addr.floor}`}{addr.apartment && `, Apt ${addr.apartment}`}</p></div><div><h3 className="font-bold">{tr('Delivery and payment', 'التوصيل والدفع')}</h3><p className="capitalize">{dm} - {pm} ({tr('demo', 'تجريبي')})</p></div></div>}
            <div className="mt-6 flex justify-between"><Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)} data-testid="button-back">{tr('Back', 'رجوع')}</Button>
              {step < 4 ? <Button disabled={!canNext} onClick={() => setStep(step + 1)} data-testid="button-next">{tr('Continue', 'متابعة')}</Button> : <Button disabled={place.isPending} onClick={submit} className="bg-amber text-foreground hover:bg-amber/90" data-testid="button-place-order">{place.isPending ? tr('Placing...', 'جارٍ الإرسال...') : tr('Place demo order', 'إتمام الطلب التجريبي')}</Button>}</div>
          </div>
          <aside className="h-fit space-y-4 rounded-2xl border bg-card p-6 lg:sticky lg:top-36"><h2 className="font-bold">{tr('Your order', 'طلبك')}</h2>
             <ul className="space-y-3">{items.map((l) => <li key={l.product.id} className="flex items-center gap-3 text-sm"><img src={imgOf(l.product)} alt="" className="size-12 rounded-lg bg-muted object-cover" /><span className="line-clamp-2 flex-1">{pn(l.product)} x {l.quantity}</span><span className="font-semibold">{kwd(l.product.price * l.quantity)}</span></li>)}</ul><Totals delivery={dm === 'pickup' ? 0 : dm === 'express' ? 3.5 : (cart?.subtotal ?? 0) >= 25 ? 0 : 2} /></aside>
        </div>
      </div>
    </div>
  );
}

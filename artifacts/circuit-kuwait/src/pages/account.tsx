import { useState } from 'react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Show, useClerk, useUser } from '@clerk/react';
import { Plus, Trash2, LogOut, ShieldCheck } from 'lucide-react';
import { useGetAccount, getGetAccountQueryKey, useListOrders, getListOrdersQueryKey, useListAddresses, getListAddressesQueryKey, useSaveAddress, useDeleteAddress, type AddressInput } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLang } from '@/lib/i18n';
import { useSeo } from '@/lib/seo';
import { kwd, fmtDate } from '@/lib/format';
import { AddressForm, addressValid, emptyAddress } from '@/components/AddressForm';
import { PageHead, Empty, ErrorState } from '@/components/bits';
import { statusColor } from '@/pages/order-detail';

function Profile() {
  const { user } = useUser(); const { tr } = useLang(); const { toast } = useToast();
  const [first, setFirst] = useState(user?.firstName ?? ''); const [last, setLast] = useState(user?.lastName ?? '');
  const [cur, setCur] = useState(''); const [nw, setNw] = useState(''); const [busy, setBusy] = useState(false);
  const err = (e: unknown) => toast({ title: (e as { errors?: { message: string }[] })?.errors?.[0]?.message ?? tr('Update failed', 'فشل التحديث'), variant: 'destructive' });
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-3 rounded-2xl border bg-card p-6"><h3 className="font-bold">{tr('Profile', 'الملف الشخصي')}</h3>
        <div className="space-y-1.5"><Label>{tr('First name', 'الاسم الأول')}</Label><Input value={first} onChange={(e) => setFirst(e.target.value)} data-testid="input-first-name" /></div>
        <div className="space-y-1.5"><Label>{tr('Last name', 'اسم العائلة')}</Label><Input value={last} onChange={(e) => setLast(e.target.value)} data-testid="input-last-name" /></div>
        <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
        <Button disabled={busy} onClick={() => { setBusy(true); user?.update({ firstName: first, lastName: last }).then(() => toast({ title: tr('Profile saved', 'تم الحفظ') })).catch(err).finally(() => setBusy(false)); }} data-testid="button-save-profile">{tr('Save', 'حفظ')}</Button></div>
      <div className="space-y-3 rounded-2xl border bg-card p-6"><h3 className="font-bold">{tr('Change password', 'تغيير كلمة المرور')}</h3>
        <div className="space-y-1.5"><Label>{tr('Current password', 'كلمة المرور الحالية')}</Label><Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} data-testid="input-current-password" /></div>
        <div className="space-y-1.5"><Label>{tr('New password', 'كلمة المرور الجديدة')}</Label><Input type="password" value={nw} onChange={(e) => setNw(e.target.value)} data-testid="input-new-password" /></div>
        <Button disabled={busy || !cur || nw.length < 8} onClick={() => { setBusy(true); user?.updatePassword({ currentPassword: cur, newPassword: nw }).then(() => { toast({ title: tr('Password updated', 'تم تحديث كلمة المرور') }); setCur(''); setNw(''); }).catch(err).finally(() => setBusy(false)); }} data-testid="button-change-password">{tr('Update password', 'تحديث')}</Button>
        <p className="text-xs text-muted-foreground">{tr('Signed in with Google or another provider? Manage your password there.', 'سجلت عبر مزود خارجي؟ أدر كلمة المرور من هناك.')}</p></div>
    </div>
  );
}

function Addresses() {
  const { tr } = useLang(); const qc = useQueryClient(); const { toast } = useToast();
  const { data, isLoading, isError, refetch } = useListAddresses({ query: { queryKey: getListAddressesQueryKey(), retry: false } });
  const save = useSaveAddress(); const del = useDeleteAddress();
  const [open, setOpen] = useState(false); const [a, setA] = useState<AddressInput>(emptyAddress);
  const inv = () => qc.invalidateQueries({ queryKey: getListAddressesQueryKey() });
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  return (
    <div>
      <Button onClick={() => { setA(emptyAddress); setOpen(true); }} data-testid="button-add-address"><Plus className="size-4" />{tr('Add address', 'إضافة عنوان')}</Button>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {isLoading ? <div className="skel h-32 rounded-2xl" /> : !data?.length ? <div className="md:col-span-2"><Empty title={tr('No saved addresses', 'لا عناوين محفوظة')} /></div> : data.map((x) => (
          <div key={x.id} className="rounded-2xl border bg-card p-5 text-sm" data-testid={`card-address-${x.id}`}><div className="flex justify-between"><h4 className="font-bold">{x.label || tr('Address', 'عنوان')}</h4>
            <button aria-label="Delete" onClick={() => del.mutate({ id: x.id }, { onSuccess: inv, onError: () => toast({ title: tr('Could not delete', 'تعذر الحذف'), variant: 'destructive' }) })} data-testid={`button-delete-address-${x.id}`} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button></div>
            <p className="mt-1 text-muted-foreground">{x.governorate}, {x.area}, {tr('Block', 'قطعة')} {x.block}, {x.street}{x.avenue && `, ${x.avenue}`}, {x.building}{x.floor && `, F${x.floor}`}{x.apartment && `, Apt ${x.apartment}`}</p></div>))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>{tr('New address', 'عنوان جديد')}</DialogTitle></DialogHeader>
        <AddressForm value={a} onChange={setA} showLabel />
        <Button disabled={!addressValid(a) || save.isPending} data-testid="button-save-address" onClick={() => save.mutate({ data: a }, { onSuccess: () => { inv(); setOpen(false); }, onError: () => toast({ title: tr('Could not save', 'تعذر الحفظ'), variant: 'destructive' }) })}>{tr('Save address', 'حفظ العنوان')}</Button></DialogContent></Dialog>
    </div>
  );
}

function Signed() {
  const { tr } = useLang(); const { signOut } = useClerk();
  const acc = useGetAccount({ query: { queryKey: getGetAccountQueryKey(), retry: false } });
  const orders = useListOrders({ query: { queryKey: getListOrdersQueryKey(), retry: false } });
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5">
        <div><p className="text-lg font-bold" data-testid="text-account-name">{acc.data?.name ?? '...'}</p><p className="text-sm text-muted-foreground">{acc.data?.email} - {acc.data?.orderCount ?? 0} {tr('orders', 'طلبات')}</p></div>
        <div className="flex gap-2">{acc.data?.role === 'admin' && <Button asChild variant="outline"><Link href="/admin" data-testid="link-admin"><ShieldCheck className="size-4" />{tr('Admin', 'الإدارة')}</Link></Button>}
          <Button variant="outline" onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL || '/' })} data-testid="button-logout"><LogOut className="size-4" />{tr('Log out', 'تسجيل الخروج')}</Button></div></div>
      <Tabs defaultValue="orders"><TabsList><TabsTrigger value="orders" data-testid="tab-orders">{tr('Orders', 'الطلبات')}</TabsTrigger><TabsTrigger value="addresses" data-testid="tab-addresses">{tr('Addresses', 'العناوين')}</TabsTrigger><TabsTrigger value="profile" data-testid="tab-profile">{tr('Profile', 'الملف')}</TabsTrigger></TabsList>
        <TabsContent value="orders" className="mt-4">{orders.isError ? <ErrorState onRetry={() => orders.refetch()} /> : orders.isLoading ? <div className="skel h-24 rounded-2xl" /> : !orders.data?.length ? <Empty title={tr('No orders yet', 'لا طلبات بعد')} action={tr('Start shopping', 'ابدأ التسوق')} href="/products" /> :
          <div className="space-y-3">{orders.data.map((o) => <Link key={o.id} href={`/orders/${o.id}`} data-testid={`row-order-${o.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 transition hover:border-secondary"><div><p className="font-mono font-bold">{o.number}</p><p className="text-xs text-muted-foreground">{fmtDate(o.createdAt)} - {o.items.length} {tr('items', 'منتج')}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor(o.status)}`}>{o.status}</span><span className="font-bold text-primary">{kwd(o.total)}</span></Link>)}</div>}</TabsContent>
        <TabsContent value="addresses" className="mt-4"><Addresses /></TabsContent>
        <TabsContent value="profile" className="mt-4"><Profile /></TabsContent></Tabs>
    </div>
  );
}

export default function Account() {
  const { tr } = useLang();
  useSeo(tr('My account', 'حسابي'), tr('Orders, addresses and profile.', 'الطلبات والعناوين والملف.'));
  return (<div><PageHead title={tr('My Account', 'حسابي')} />
    <Show when="signed-in"><Signed /></Show>
    <Show when="signed-out"><div className="py-16"><Empty title={tr('Sign in to see your account', 'سجّل الدخول لعرض حسابك')} text={tr('Track orders and save delivery addresses.', 'تتبع الطلبات واحفظ العناوين.')} action={tr('Sign in', 'تسجيل الدخول')} href="/sign-in" /></div></Show></div>);
}

import { useState } from 'react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Show } from '@clerk/react';
import { Plus, Pencil, Trash2, Star, Upload, Lock } from 'lucide-react';
import {
  useGetAccount, getGetAccountQueryKey, useGetAdminSummary, getGetAdminSummaryQueryKey, useListProducts, getListProductsQueryKey, useListCategories, getListCategoriesQueryKey, useListBrands, getListBrandsQueryKey,
  useListAdminOrders, getListAdminOrdersQueryKey, useListCustomers, getListCustomersQueryKey, useListDiscounts, getListDiscountsQueryKey,
  useCreateProduct, useUpdateProduct, useDeleteProduct, useUpdateOrderStatus, useSaveTaxonomy, useSaveDiscount, useRequestUploadUrl,
  type Product, type ProductInput,
} from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLang } from '@/lib/i18n';
import { useSeo } from '@/lib/seo';
import { imgOf, kwd, fmtDate } from '@/lib/format';
import { PageHead, Empty, ErrorState } from '@/components/bits';
import { statusColor } from '@/pages/order-detail';

const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;
const blank: ProductInput = { name: '', nameAr: '', brand: '', category: '', subcategory: '', sku: '', price: 0, oldPrice: null, stock: 0, image: '', images: [], description: '', specifications: {}, datasheet: '', featured: false, isNew: false };
const toInput = (p: Product): ProductInput => ({ name: p.name, nameAr: p.nameAr, brand: p.brand, category: p.category, subcategory: p.subcategory, sku: p.sku, price: p.price, oldPrice: p.oldPrice ?? null, stock: p.stock, image: p.image, images: p.images, description: p.description, specifications: p.specifications, datasheet: p.datasheet, featured: p.featured, isNew: p.isNew });

function useInv() { const qc = useQueryClient(); return (...k: (readonly unknown[])[]) => k.forEach((x) => qc.invalidateQueries({ queryKey: x })); }

function Overview() {
  const { tr, pn } = useLang();
  const { data, isLoading, isError, refetch } = useGetAdminSummary({ query: { queryKey: getGetAdminSummaryQueryKey() } });
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (isLoading || !data) return <div className="skel h-32 rounded-2xl" />;
  return (<div className="space-y-6"><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[[tr('Total sales', 'إجمالي المبيعات'), kwd(data.totalSales)], [tr('Orders', 'الطلبات'), data.orders], [tr('Customers', 'العملاء'), data.customers], [tr('Products', 'المنتجات'), data.products]].map(([l, v]) => <div key={l as string} className="rounded-2xl border bg-card p-5"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-1 font-display text-2xl font-bold text-primary" data-testid={`stat-${(l as string).toLowerCase().replace(/ /g, '-')}`}>{v}</p></div>)}</div>
    <div className="rounded-2xl border bg-card p-5"><h3 className="mb-3 font-bold">{tr('Low stock', 'مخزون منخفض')}</h3>{data.lowStock.length === 0 ? <p className="text-sm text-muted-foreground">{tr('All stocked.', 'المخزون جيد.')}</p> : data.lowStock.map((p) => <div key={p.id} className="flex justify-between border-b py-2 text-sm last:border-0"><span>{pn(p)}</span><span className="font-bold text-red-600">{p.stock}</span></div>)}</div></div>);
}

function ProductForm({ edit, onClose }: { edit: Product | null; onClose: () => void }) {
  const { tr } = useLang(); const { toast } = useToast(); const inv = useInv();
  const cats = useListCategories(); const brands = useListBrands();
  const create = useCreateProduct(); const update = useUpdateProduct(); const upload = useRequestUploadUrl();
  const [f, setF] = useState<ProductInput>(edit ? toInput(edit) : blank);
  const [specs, setSpecs] = useState(Object.entries(edit?.specifications ?? {}).map(([k, v]) => `${k}: ${v}`).join('\n'));
  const [busy, setBusy] = useState(false);
  const set = (k: keyof ProductInput, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  const pick = async (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: tr('Max 5 MB', 'الحد 5 ميجا'), variant: 'destructive' }); return; }
    setBusy(true);
    try {
      const r = await upload.mutateAsync({ data: { name: file.name, size: file.size, contentType: file.type as 'image/png' } });
      const put = await fetch(r.uploadURL, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!put.ok) throw new Error('upload');
      setF((x) => ({ ...x, image: r.objectPath, images: [r.objectPath] }));
      toast({ title: tr('Image uploaded', 'تم رفع الصورة') });
    } catch { toast({ title: tr('Upload failed', 'فشل الرفع'), variant: 'destructive' }); } finally { setBusy(false); }
  };
  const save = () => {
    const specifications = Object.fromEntries(specs.split('\n').map((l) => l.split(/:(.*)/s)).filter((a) => a[0]?.trim() && a[1]?.trim()).map((a) => [a[0].trim(), a[1].trim()]));
    const data: ProductInput = { ...f, specifications, price: Number(f.price), stock: Number(f.stock), oldPrice: f.oldPrice ? Number(f.oldPrice) : null, images: f.images?.length ? f.images : f.image ? [f.image] : [] };
    const opts = { onSuccess: () => { inv(getListProductsQueryKey(), getGetAdminSummaryQueryKey()); toast({ title: tr('Product saved', 'تم حفظ المنتج') }); onClose(); }, onError: () => toast({ title: tr('Could not save product', 'تعذر الحفظ'), variant: 'destructive' }) };
    edit ? update.mutate({ id: edit.id, data }, opts) : create.mutate({ data }, opts);
  };
  const cat = (cats.data ?? []).find((c) => c.name === f.category);
  const T = (k: keyof ProductInput, l: string, type = 'text') => <div className="space-y-1.5"><Label>{l}</Label><Input type={type} value={(f[k] as string | number | null) ?? ''} onChange={(e) => set(k, e.target.value)} data-testid={`input-product-${k}`} /></div>;
  const S = (k: 'brand' | 'category', opts: string[]) => <div className="space-y-1.5"><Label>{k === 'brand' ? tr('Brand', 'العلامة') : tr('Category', 'الفئة')}</Label><Select value={f[k]} onValueChange={(v) => set(k, v)}><SelectTrigger data-testid={`select-product-${k}`}><SelectValue placeholder="-" /></SelectTrigger><SelectContent>{opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>;
  return (<div className="grid max-h-[70vh] gap-4 overflow-y-auto pe-1 sm:grid-cols-2">
    {T('name', 'Name')}{T('nameAr', 'الاسم')}{S('brand', (brands.data ?? []).map((b) => b.name))}{S('category', (cats.data ?? []).map((c) => c.name))}
    <div className="space-y-1.5"><Label>{tr('Subcategory', 'الفئة الفرعية')}</Label><Select value={f.subcategory || undefined} onValueChange={(v) => set('subcategory', v)}><SelectTrigger><SelectValue placeholder="-" /></SelectTrigger><SelectContent>{(cat?.children ?? []).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
    {T('sku', 'SKU')}{T('price', 'Price (KWD)', 'number')}{T('oldPrice', 'Old price', 'number')}{T('stock', 'Stock', 'number')}
    <div className="space-y-1.5 sm:col-span-2"><Label>{tr('Image', 'الصورة')}</Label><div className="flex items-center gap-3">{f.image && <img src={imgOf({ image: f.image, slug: '' })} alt="" className="size-14 rounded-lg bg-muted object-cover" />}
      <Input value={f.image} onChange={(e) => set('image', e.target.value)} placeholder="/images/slug.png" data-testid="input-product-image" />
      <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"><Upload className="size-4" />{busy ? '...' : tr('Upload', 'رفع')}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} data-testid="input-product-upload" /></label></div></div>
    <div className="space-y-1.5 sm:col-span-2"><Label>{tr('Description', 'الوصف')}</Label><Textarea rows={3} value={f.description ?? ''} onChange={(e) => set('description', e.target.value)} data-testid="input-product-description" /></div>
    <div className="space-y-1.5 sm:col-span-2"><Label>{tr('Specifications (Key: value per line)', 'المواصفات (مفتاح: قيمة في كل سطر)')}</Label><Textarea rows={4} value={specs} onChange={(e) => setSpecs(e.target.value)} className="font-mono text-xs" data-testid="input-product-specs" /></div>
    {T('datasheet', 'Datasheet URL')}
    <div className="flex items-center gap-6"><label className="flex items-center gap-2 text-sm"><Switch checked={!!f.featured} onCheckedChange={(v) => set('featured', v)} />{tr('Featured', 'مميز')}</label><label className="flex items-center gap-2 text-sm"><Switch checked={!!f.isNew} onCheckedChange={(v) => set('isNew', v)} />{tr('New', 'جديد')}</label></div>
    <div className="flex justify-end gap-2 sm:col-span-2"><Button variant="outline" onClick={onClose}>{tr('Cancel', 'إلغاء')}</Button><Button onClick={save} disabled={busy || create.isPending || update.isPending || !f.name || !f.brand || !f.category || !f.sku || !f.image} data-testid="button-save-product">{tr('Save product', 'حفظ المنتج')}</Button></div></div>);
}

function ProductsTab({ featuredOnly = false }: { featuredOnly?: boolean }) {
  const { tr, pn } = useLang(); const { toast } = useToast(); const inv = useInv();
  const [q, setQ] = useState(''); const [edit, setEdit] = useState<Product | null>(null); const [open, setOpen] = useState(false); const [del, setDel] = useState<Product | null>(null);
  const { data, isLoading, isError, refetch } = useListProducts({ q: q || undefined, limit: 100 });
  const update = useUpdateProduct(); const remove = useDeleteProduct();
  const refresh = () => inv(getListProductsQueryKey(), getGetAdminSummaryQueryKey());
  const rows = (data?.products ?? []).filter((p) => !featuredOnly || true);
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  return (<div className="space-y-4"><div className="flex gap-2"><Input placeholder={tr('Search products', 'ابحث')} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" data-testid="input-admin-search" />{!featuredOnly && <Button onClick={() => { setEdit(null); setOpen(true); }} data-testid="button-new-product"><Plus className="size-4" />{tr('New product', 'منتج جديد')}</Button>}</div>
    <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full min-w-[720px] text-sm"><thead className="bg-muted/60 text-xs uppercase text-muted-foreground"><tr>{['', tr('Product', 'المنتج'), 'SKU', tr('Price', 'السعر'), tr('Stock', 'المخزون'), tr('Featured', 'مميز'), ''].map((h, i) => <th key={i} className="p-3 text-start font-semibold">{h}</th>)}</tr></thead>
      <tbody>{isLoading ? <tr><td colSpan={7} className="p-6"><div className="skel h-8 rounded" /></td></tr> : rows.map((p) => (
        <tr key={p.id} className="border-t" data-testid={`row-admin-product-${p.id}`}><td className="p-3"><img src={imgOf(p)} alt="" className="size-10 rounded-lg bg-muted object-cover" /></td><td className="p-3 font-semibold">{pn(p)}<div className="text-xs font-normal text-muted-foreground">{p.brand}</div></td><td className="p-3 font-mono text-xs">{p.sku}</td><td className="p-3">{kwd(p.price)}</td><td className={`p-3 font-bold ${p.stock < 10 ? 'text-red-600' : ''}`}>{p.stock}</td>
          <td className="p-3"><button aria-label="Toggle featured" data-testid={`button-feature-${p.id}`} onClick={() => update.mutate({ id: p.id, data: { ...toInput(p), featured: !p.featured } }, { onSuccess: refresh, onError: () => toast({ title: tr('Update failed', 'فشل التحديث'), variant: 'destructive' }) })}><Star className={`size-5 ${p.featured ? 'fill-amber text-amber' : 'text-border'}`} /></button></td>
          <td className="p-3 text-end"><button aria-label="Edit" className="p-1.5" onClick={() => { setEdit(p); setOpen(true); }} data-testid={`button-edit-${p.id}`}><Pencil className="size-4" /></button><button aria-label="Delete" className="p-1.5 text-destructive" onClick={() => setDel(p)} data-testid={`button-delete-${p.id}`}><Trash2 className="size-4" /></button></td></tr>))}</tbody></table></div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{edit ? tr('Edit product', 'تعديل المنتج') : tr('New product', 'منتج جديد')}</DialogTitle></DialogHeader>{open && <ProductForm edit={edit} onClose={() => setOpen(false)} />}</DialogContent></Dialog>
    <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{tr('Delete product?', 'حذف المنتج؟')}</AlertDialogTitle><AlertDialogDescription>{del?.name}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{tr('Cancel', 'إلغاء')}</AlertDialogCancel><AlertDialogAction data-testid="button-confirm-delete" onClick={() => del && remove.mutate({ id: del.id }, { onSuccess: () => { refresh(); setDel(null); }, onError: () => toast({ title: tr('Delete failed', 'فشل الحذف'), variant: 'destructive' }) })}>{tr('Delete', 'حذف')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>);
}

function Taxonomy({ kind }: { kind: 'category' | 'brand' }) {
  const { tr } = useLang(); const { toast } = useToast(); const inv = useInv(); const save = useSaveTaxonomy();
  const cats = useListCategories({ query: { queryKey: getListCategoriesQueryKey(), enabled: kind === 'category' } }); const brands = useListBrands({ query: { queryKey: getListBrandsQueryKey(), enabled: kind === 'brand' } });
  const [name, setName] = useState(''); const [nameAr, setNameAr] = useState(''); const [children, setChildren] = useState('');
  const [editId, setEditId] = useState<number | undefined>();
  const list: { id: number; name: string; count: number; nameAr?: string; children?: string[] }[] = kind === 'category' ? cats.data ?? [] : brands.data ?? [];
  const run = (body: Parameters<typeof save.mutate>[0]['data']) => save.mutate({ data: body }, { onSuccess: () => { inv(getListCategoriesQueryKey(), getListBrandsQueryKey()); setName(''); setNameAr(''); setChildren(''); setEditId(undefined); toast({ title: tr('Saved', 'تم الحفظ') }); }, onError: () => toast({ title: tr('Failed', 'فشل'), variant: 'destructive' }) });
  return (<div className="space-y-4"><div className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4">
    <div className="space-y-1"><Label>{tr('Name', 'الاسم')}</Label><Input value={name} onChange={(e) => setName(e.target.value)} data-testid={`input-${kind}-name`} /></div>
    {kind === 'category' && <><div className="space-y-1"><Label>{tr('Arabic name', 'الاسم بالعربية')}</Label><Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} /></div><div className="space-y-1"><Label>{tr('Subcategories (comma separated)', 'الفئات الفرعية')}</Label><Input value={children} onChange={(e) => setChildren(e.target.value)} className="w-72" /></div></>}
    <Button disabled={!name.trim() || save.isPending} data-testid={`button-save-${kind}`} onClick={() => run({ kind, id: editId, name: name.trim(), ...(kind === 'category' ? { nameAr, children: children.split(',').map((s) => s.trim()).filter(Boolean) } : {}) })}>{editId ? tr('Update', 'تحديث') : tr('Add', 'إضافة')}</Button></div>
    <div className="overflow-hidden rounded-2xl border bg-card">{list.length === 0 ? <div className="p-6"><Empty title={tr('Nothing yet', 'لا شيء بعد')} /></div> : list.map((x) => (
      <div key={x.id} className="flex items-center gap-3 border-b p-3 text-sm last:border-0" data-testid={`row-${kind}-${x.id}`}><span className="flex-1 font-semibold">{x.name}{!!x.children?.length && <span className="ms-2 text-xs font-normal text-muted-foreground">{x.children!.join(', ')}</span>}</span><span className="text-xs text-muted-foreground">{x.count}</span>
        <button aria-label="Edit" onClick={() => { setEditId(x.id); setName(x.name); if (x.children) { setNameAr(x.nameAr ?? ''); setChildren(x.children.join(', ')); } }}><Pencil className="size-4" /></button>
        <button aria-label="Remove" className="text-destructive" data-testid={`button-remove-${kind}-${x.id}`} onClick={() => run({ kind, id: x.id, name: x.name, remove: true })}><Trash2 className="size-4" /></button></div>))}</div></div>);
}

function OrdersTab() {
  const { tr } = useLang(); const { toast } = useToast(); const inv = useInv(); const upd = useUpdateOrderStatus();
  const { data, isLoading, isError, refetch } = useListAdminOrders({ query: { queryKey: getListAdminOrdersQueryKey() } });
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (isLoading) return <div className="skel h-24 rounded-2xl" />;
  if (!data?.length) return <Empty title={tr('No orders yet', 'لا طلبات')} />;
  return <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full min-w-[640px] text-sm"><tbody>{data.map((o) => (
    <tr key={o.id} className="border-b last:border-0" data-testid={`row-admin-order-${o.id}`}><td className="p-3"><Link href={`/orders/${o.id}`} className="font-mono font-bold hover:text-secondary">{o.number}</Link><div className="text-xs text-muted-foreground">{fmtDate(o.createdAt)}</div></td><td className="p-3">{o.name}<div className="text-xs text-muted-foreground">{o.email}</div></td><td className="p-3 font-bold">{kwd(o.total)}</td>
      <td className="p-3"><Select value={o.status} onValueChange={(v) => upd.mutate({ id: o.id, data: { status: v as typeof STATUSES[number] } }, { onSuccess: () => inv(getListAdminOrdersQueryKey(), getGetAdminSummaryQueryKey()), onError: () => toast({ title: tr('Failed', 'فشل'), variant: 'destructive' }) })}><SelectTrigger className={`w-36 ${statusColor(o.status)}`} data-testid={`select-status-${o.id}`}><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></td></tr>))}</tbody></table></div>;
}

function CustomersTab() {
  const { tr } = useLang(); const { data, isLoading, isError, refetch } = useListCustomers({ query: { queryKey: getListCustomersQueryKey() } });
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (isLoading) return <div className="skel h-24 rounded-2xl" />;
  if (!data?.length) return <Empty title={tr('No customers yet', 'لا عملاء')} />;
  return <div className="overflow-hidden rounded-2xl border bg-card">{data.map((c) => <div key={c.id} className="flex items-center justify-between border-b p-3 text-sm last:border-0" data-testid={`row-customer-${c.id}`}><div><p className="font-semibold">{c.name}</p><p className="text-xs text-muted-foreground">{c.email}</p></div><span className="text-xs">{c.orderCount} {tr('orders', 'طلبات')} - {c.role}</span></div>)}</div>;
}

function DiscountsTab() {
  const { tr } = useLang(); const { toast } = useToast(); const inv = useInv(); const save = useSaveDiscount();
  const { data, isLoading, isError, refetch } = useListDiscounts({ query: { queryKey: getListDiscountsQueryKey() } });
  const [code, setCode] = useState(''); const [pct, setPct] = useState('10');
  const run = (d: { code: string; percent: number; active: boolean }) => save.mutate({ data: d }, { onSuccess: () => { inv(getListDiscountsQueryKey()); setCode(''); }, onError: () => toast({ title: tr('Failed', 'فشل'), variant: 'destructive' }) });
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  return (<div className="space-y-4"><div className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4"><div className="space-y-1"><Label>{tr('Code', 'الكود')}</Label><Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} data-testid="input-discount-code" /></div><div className="space-y-1"><Label>%</Label><Input type="number" min={1} max={90} value={pct} onChange={(e) => setPct(e.target.value)} className="w-24" data-testid="input-discount-percent" /></div><Button disabled={code.length < 2 || save.isPending} onClick={() => run({ code, percent: Number(pct), active: true })} data-testid="button-save-discount">{tr('Create', 'إنشاء')}</Button></div>
    <div className="overflow-hidden rounded-2xl border bg-card">{isLoading ? <div className="skel h-16" /> : !data?.length ? <div className="p-6"><Empty title={tr('No discount codes', 'لا أكواد خصم')} /></div> : data.map((d) => <div key={d.id} className="flex items-center justify-between border-b p-3 text-sm last:border-0" data-testid={`row-discount-${d.id}`}><span className="font-mono font-bold">{d.code}</span><span>{d.percent}%</span><Switch checked={d.active} onCheckedChange={(v) => run({ code: d.code, percent: d.percent, active: v })} data-testid={`switch-discount-${d.id}`} /></div>)}</div></div>);
}

function Panel() {
  const { tr } = useLang();
  const acc = useGetAccount({ query: { queryKey: getGetAccountQueryKey(), retry: false } });
  if (acc.isLoading) return <div className="mx-auto max-w-5xl px-4 py-10"><div className="skel h-40 rounded-2xl" /></div>;
  if (acc.data?.role !== 'admin') return <Denied />;
  return (<div className="mx-auto max-w-6xl px-4 py-10"><Tabs defaultValue="overview"><TabsList className="h-auto flex-wrap justify-start">{[['overview', tr('Overview', 'نظرة عامة')], ['products', tr('Products', 'المنتجات')], ['categories', tr('Categories', 'الفئات')], ['brands', tr('Brands', 'العلامات')], ['orders', tr('Orders', 'الطلبات')], ['customers', tr('Customers', 'العملاء')], ['discounts', tr('Discounts', 'الخصومات')], ['featured', tr('Featured', 'المميز')]].map(([v, l]) => <TabsTrigger key={v} value={v} data-testid={`tab-admin-${v}`}>{l}</TabsTrigger>)}</TabsList>
    <div className="mt-5"><TabsContent value="overview"><Overview /></TabsContent><TabsContent value="products"><ProductsTab /></TabsContent><TabsContent value="categories"><Taxonomy kind="category" /></TabsContent><TabsContent value="brands"><Taxonomy kind="brand" /></TabsContent><TabsContent value="orders"><OrdersTab /></TabsContent><TabsContent value="customers"><CustomersTab /></TabsContent><TabsContent value="discounts"><DiscountsTab /></TabsContent><TabsContent value="featured"><p className="mb-3 text-sm text-muted-foreground">{tr('Tap the star to feature a product on the homepage.', 'اضغط النجمة لإبراز المنتج في الرئيسية.')}</p><ProductsTab featuredOnly /></TabsContent></div></Tabs></div>);
}

function Denied() {
  const { tr } = useLang();
  return <div className="mx-auto max-w-md px-4 py-20 text-center" data-testid="admin-denied"><div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-red-100 text-red-600"><Lock className="size-7" /></div><h2 className="text-2xl font-bold">{tr('Admin access only', 'للمسؤولين فقط')}</h2><p className="mt-2 text-muted-foreground">{tr('Your account does not have permission to manage this store.', 'حسابك لا يملك صلاحية إدارة المتجر.')}</p><Button asChild className="mt-5"><Link href="/">{tr('Back to store', 'العودة للمتجر')}</Link></Button></div>;
}

export default function Admin() {
  const { tr } = useLang();
  useSeo(tr('Store admin', 'إدارة المتجر'), tr('Manage the store.', 'إدارة المتجر.'));
  return (<div><PageHead title={tr('Store Admin', 'إدارة المتجر')} /><Show when="signed-in"><Panel /></Show><Show when="signed-out"><div className="py-16"><Empty title={tr('Sign in required', 'يلزم تسجيل الدخول')} action={tr('Sign in', 'تسجيل الدخول')} href="/sign-in" /></div></Show></div>);
}

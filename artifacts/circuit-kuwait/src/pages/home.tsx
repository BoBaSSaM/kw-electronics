import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Truck, BadgeCheck, ShieldCheck, Layers, Headset, ChevronLeft, ChevronRight } from 'lucide-react';
import { useListProducts, useListCategories, useListBrands, useSubscribeNewsletter } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLang } from '@/lib/i18n';
import { useShop } from '@/lib/shop';
import { useSeo } from '@/lib/seo';
import { catIcon } from '@/lib/icons';
import { asset } from '@/lib/format';
import { ProductCard } from '@/components/ProductCard';
import { Reveal, GridSkeleton, ErrorState } from '@/components/bits';

function Section({ title, sub, href, children }: { title: string; sub?: string; href?: string; children: React.ReactNode }) {
  const { tr, rtl } = useLang();
  return (
    <section className="mx-auto max-w-7xl px-4 pt-16">
      <Reveal className="mb-6 flex items-end justify-between gap-4">
        <div><h2 className="text-2xl font-bold md:text-3xl">{title}</h2>{sub && <p className="mt-1 text-muted-foreground">{sub}</p>}</div>
        {href && <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-secondary hover:gap-2">{tr('View all', 'عرض الكل')}<ArrowRight className={`size-4 transition-all ${rtl ? 'rotate-180' : ''}`} /></Link>}
      </Reveal>
      {children}
    </section>
  );
}

function Row({ q }: { q: Parameters<typeof useListProducts>[0] }) {
  const { tr } = useLang();
  const { data, isLoading, isError, refetch } = useListProducts(q);
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {isLoading ? <GridSkeleton n={5} /> : (data?.products ?? []).map((p, i) => <Reveal key={p.id} delay={i * 40}><ProductCard p={p} /></Reveal>)}
      {!isLoading && !data?.products.length && <p className="col-span-full text-muted-foreground">{tr('Nothing here yet.', 'لا توجد منتجات بعد.')}</p>}
    </div>
  );
}

export default function Home() {
  const { tr, lang } = useLang();
  const { recent } = useShop();
  const { toast } = useToast();
  const cats = useListCategories();
  const brands = useListBrands();
  const sub = useSubscribeNewsletter();
  const [email, setEmail] = useState('');
  const [scroll, setScroll] = useState<HTMLDivElement | null>(null);
  useSeo(tr('Electronic components and hardware in Kuwait', 'مكونات إلكترونية وأجهزة في الكويت'), tr('Arduino, Raspberry Pi, sensors, ICs, tools and hardware for students, engineers and makers in Kuwait.', 'أردوينو وراسبيري باي وحساسات ودوائر متكاملة وأدوات للطلاب والمهندسين والمبتكرين في الكويت.'), null, '/images/hero.png');
  const why = [
    [Truck, tr('Fast delivery across Kuwait', 'توصيل سريع داخل الكويت'), tr('Standard, express and store pickup options.', 'خيارات توصيل عادي وسريع واستلام.')],
    [BadgeCheck, tr('Quality components', 'مكونات عالية الجودة'), tr('Tested stock from known manufacturers.', 'مخزون مختبر من مصنّعين معروفين.')],
    [ShieldCheck, tr('Secure payments', 'دفع آمن'), tr('KNET, cards and cash on delivery (demo checkout).', 'كي نت وبطاقات ودفع عند الاستلام (دفع تجريبي).')],
    [Layers, tr('Large product selection', 'تشكيلة واسعة'), tr('From resistors to single-board computers.', 'من المقاومات إلى الحواسيب أحادية اللوحة.')],
    [Headset, tr('Technical support', 'دعم فني'), tr('Help choosing parts for your project.', 'مساعدة في اختيار القطع لمشروعك.')],
  ] as const;
  return (
    <div>
      <section className="hero-grad relative overflow-hidden text-white">
        <div className="circuit-bg absolute inset-0 opacity-30" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber ring-1 ring-white/15">{tr('Kuwait electronics supplier', 'مورد إلكترونيات في الكويت')}</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] md:text-6xl">{tr('Everything You Need to Build Your Next Project', 'كل ما تحتاجه لبناء مشروعك القادم')}</h1>
            <p className="mt-5 max-w-lg text-lg text-white/80">{tr('Electronic components, development boards, sensors, tools and hardware for students, engineers and makers.', 'مكونات إلكترونية ولوحات تطوير وحساسات وأدوات وأجهزة للطلاب والمهندسين والمبتكرين.')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 bg-amber px-7 text-foreground hover:bg-amber/90"><Link href="/products" data-testid="link-hero-shop">{tr('Shop Products', 'تسوق المنتجات')}</Link></Button>
              <Button asChild size="lg" variant="outline" className="h-12 border-white/30 bg-white/5 px-7 text-white hover:bg-white/10"><Link href="/categories" data-testid="link-hero-categories">{tr('Browse Categories', 'تصفح الفئات')}</Link></Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-secondary/30 blur-3xl" />
            <img src={asset('/images/hero.png')} alt="" className="floaty relative aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl ring-1 ring-white/20" />
          </div>
        </div>
      </section>

      <Section title={tr('Popular Categories', 'الفئات الشائعة')} href="/categories">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cats.isLoading ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="skel h-28 rounded-2xl" />) :
            cats.isError ? <div className="col-span-full"><ErrorState onRetry={() => cats.refetch()} /></div> :
            (cats.data ?? []).slice(0, 8).map((c, i) => { const I = catIcon(c.name, c.icon); return (
              <Reveal key={c.id} delay={i * 40}><Link href={`/products?category=${encodeURIComponent(c.name)}`} data-testid={`card-category-${c.id}`} className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-secondary hover:shadow-lg hover:shadow-primary/10">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white"><I className="size-5" /></span>
                <span className="font-semibold leading-tight">{lang === 'ar' ? c.nameAr || c.name : c.name}</span>
                <span className="text-xs text-muted-foreground">{c.count} {tr('items', 'منتج')}</span>
              </Link></Reveal>); })}
        </div>
      </Section>

      <Section title={tr('Featured Products', 'منتجات مميزة')} sub={tr('Hand-picked parts our customers build with.', 'قطع مختارة يبني بها عملاؤنا.')} href="/products?featured=1"><Row q={{ featured: true, limit: 10 }} /></Section>

      <section className="mt-16 bg-primary/[0.04] py-14">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal className="mb-6 flex items-end justify-between"><h2 className="text-2xl font-bold md:text-3xl">{tr('New Arrivals', 'وصل حديثاً')}</h2>
            <div className="flex gap-2">
              <button aria-label="Previous" onClick={() => scroll?.scrollBy({ left: -320, behavior: 'smooth' })} className="grid size-9 place-items-center rounded-full border bg-card"><ChevronLeft className="size-4 rtl:rotate-180" /></button>
              <button aria-label="Next" onClick={() => scroll?.scrollBy({ left: 320, behavior: 'smooth' })} className="grid size-9 place-items-center rounded-full border bg-card"><ChevronRight className="size-4 rtl:rotate-180" /></button>
            </div></Reveal>
          <NewRow setRef={setScroll} />
        </div>
      </section>

      <Section title={tr('Special Offers', 'عروض خاصة')} sub={tr('Price drops on boards, tools and modules.', 'تخفيضات على اللوحات والأدوات والوحدات.')} href="/offers"><Row q={{ offers: true, limit: 5 }} /></Section>

      <Section title={tr('Brands We Stock', 'العلامات التجارية')} href="/brands">
        <div className="flex flex-wrap gap-3">
          {brands.isLoading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skel h-14 w-36 rounded-xl" />) :
            (brands.data ?? []).map((b) => (
              <Link key={b.id} href={`/products?brand=${encodeURIComponent(b.name)}`} data-testid={`link-brand-${b.id}`} className="flex h-14 min-w-36 items-center justify-center rounded-xl border bg-card px-6 font-display font-bold text-primary/80 transition hover:border-secondary hover:text-secondary">{b.name}</Link>
            ))}
        </div>
      </Section>

      <Section title={tr('Why Choose Circuit Kuwait', 'لماذا سيركت الكويت')}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {why.map(([I, t, d], i) => (
            <Reveal key={i} delay={i * 50}><div className="h-full rounded-2xl border bg-card p-5">
              <span className="mb-3 grid size-10 place-items-center rounded-xl bg-amber/20 text-amber-700"><I className="size-5 text-[#b37f00]" /></span>
              <h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-muted-foreground">{d}</p></div></Reveal>
          ))}
        </div>
      </Section>

      {recent.length > 0 && <Section title={tr('Recently Viewed', 'شوهد مؤخراً')}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">{recent.slice(0, 5).map((p) => <ProductCard key={p.id} p={p} />)}</div></Section>}

      <section className="mx-auto mt-16 max-w-7xl px-4">
        <div className="hero-grad relative overflow-hidden rounded-3xl p-8 text-white md:p-12">
          <div className="circuit-bg absolute inset-0 opacity-30" />
          <div className="relative grid items-center gap-6 md:grid-cols-2">
            <div><h2 className="text-2xl font-bold md:text-3xl">{tr('New parts and offers, straight to your inbox', 'قطع وعروض جديدة إلى بريدك')}</h2><p className="mt-2 text-white/75">{tr('One email when stock lands. No spam.', 'رسالة واحدة عند وصول المخزون. بلا إزعاج.')}</p></div>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); sub.mutate({ data: { email } }, { onSuccess: () => { toast({ title: tr('You are subscribed', 'تم الاشتراك') }); setEmail(''); }, onError: () => toast({ title: tr('Enter a valid email', 'أدخل بريداً صالحاً'), variant: 'destructive' }) }); }}>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" data-testid="input-newsletter" className="h-12 border-white/20 bg-white text-foreground" />
              <Button disabled={sub.isPending} className="h-12 bg-amber px-6 text-foreground hover:bg-amber/90" data-testid="button-subscribe">{tr('Subscribe', 'اشترك')}</Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

function NewRow({ setRef }: { setRef: (e: HTMLDivElement | null) => void }) {
  const { data, isLoading } = useListProducts({ sort: 'newest', limit: 10 });
  return (
    <div ref={setRef} className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
      {isLoading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skel h-72 w-56 shrink-0 rounded-2xl" />) :
        (data?.products ?? []).map((p) => <div key={p.id} className="w-56 shrink-0 snap-start"><ProductCard p={p} /></div>)}
    </div>
  );
}

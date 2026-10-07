import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/i18n';
import { useSeo } from '@/lib/seo';
import { asset } from '@/lib/format';
import { PageHead, Reveal } from '@/components/bits';

export default function About() {
  const { tr } = useLang();
  useSeo(tr('About us', 'من نحن'), tr('Circuit Kuwait supplies electronics and hardware to students, technicians, makers and companies.', 'سيركت الكويت توفر الإلكترونيات للطلاب والفنيين والمبتكرين والشركات.'), null, '/images/about.png');
  const v = [[tr('For builders', 'للمبتكرين'), tr('Boards, sensors and parts chosen for real projects, from first blink to final-year prototype.', 'لوحات وحساسات وقطع مختارة لمشاريع حقيقية، من أول وميض إلى نموذج التخرج.')], [tr('Honest specs', 'مواصفات صادقة'), tr('Every listing shows the parameters engineers actually check before buying.', 'كل منتج يعرض المعايير التي يتحقق منها المهندسون قبل الشراء.')], [tr('Made for Kuwait', 'مصمم للكويت'), tr('Local address formats, KWD pricing and delivery across the governorates.', 'عناوين محلية وأسعار بالدينار وتوصيل إلى جميع المحافظات.')]];
  return (<div><PageHead title={tr('About Circuit Kuwait', 'عن سيركت الكويت')} sub={tr('An electronics and hardware supplier for people who build things.', 'مورد إلكترونيات وأجهزة لمن يبنون الأشياء.')} crumbs={[{ label: tr('Home', 'الرئيسية'), href: '/' }, { label: tr('About', 'من نحن') }]} />
    <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 md:grid-cols-2"><Reveal><img src={asset('/images/about.png')} alt="" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-xl" /></Reveal>
      <Reveal delay={100}><h2 className="text-3xl font-bold">{tr('Parts you can trust, close to home', 'قطع موثوقة قريبة منك')}</h2><p className="mt-4 leading-relaxed text-muted-foreground">{tr('Circuit Kuwait serves engineering students, technicians, makers and companies with development boards, sensors, ICs, tools and power gear. We focus on clear specifications, fair KWD pricing and support that understands the project behind your order.', 'تخدم سيركت الكويت طلاب الهندسة والفنيين والمبتكرين والشركات بلوحات التطوير والحساسات والدوائر والأدوات ومعدات الطاقة. نركز على مواصفات واضحة وأسعار عادلة بالدينار ودعم يفهم مشروعك.')}</p><Button asChild className="mt-6"><Link href="/products">{tr('Shop products', 'تسوق المنتجات')}</Link></Button></Reveal></div>
    <div className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-3">{v.map(([t, d], i) => <Reveal key={i} delay={i * 80}><div className="h-full rounded-2xl border bg-card p-6"><h3 className="font-bold">{t}</h3><p className="mt-2 text-sm text-muted-foreground">{d}</p></div></Reveal>)}</div></div>);
}

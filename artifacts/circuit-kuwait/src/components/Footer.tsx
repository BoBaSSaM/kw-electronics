import { Link } from 'wouter';
import { Logo } from '@/components/bits';
import { useLang } from '@/lib/i18n';

export function Footer() {
  const { tr } = useLang();
  const cols = [
    [tr('Shop', 'تسوق'), [['/products', tr('All products', 'كل المنتجات')], ['/categories', tr('Categories', 'الفئات')], ['/brands', tr('Brands', 'العلامات')], ['/new-arrivals', tr('New arrivals', 'وصل حديثاً')], ['/offers', tr('Offers', 'العروض')]]],
    [tr('Support', 'الدعم'), [['/shipping', tr('Shipping', 'الشحن')], ['/returns', tr('Returns', 'الإرجاع')], ['/faq', tr('FAQ', 'الأسئلة الشائعة')], ['/contact', tr('Contact', 'اتصل بنا')], ['/account', tr('My account', 'حسابي')]]],
    [tr('Company', 'الشركة'), [['/about', tr('About us', 'من نحن')], ['/privacy', tr('Privacy policy', 'سياسة الخصوصية')], ['/terms', tr('Terms of service', 'شروط الخدمة')], ['/admin', tr('Store admin', 'إدارة المتجر')]]],
  ] as const;
  return (
    <footer className="hero-grad mt-20 text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div><Logo light /><p className="mt-4 max-w-xs text-sm">{tr('Development boards, sensors, components and tools for Kuwait\'s engineers, students and makers.', 'لوحات التطوير والحساسات والمكونات والأدوات لمهندسي وطلاب ومبتكري الكويت.')}</p>
          <p className="mt-4 text-xs text-white/60">{tr('Demo store: payments are simulated and no card data is collected.', 'متجر تجريبي: الدفع محاكى ولا يتم جمع بيانات البطاقات.')}</p></div>
        {cols.map(([t, ls]) => (
          <div key={t}><h4 className="mb-3 text-sm font-bold text-white">{t}</h4><ul className="space-y-2 text-sm">{ls.map(([h, l]) => <li key={h}><Link href={h} className="transition hover:text-amber">{l}</Link></li>)}</ul></div>
        ))}
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">© {new Date().getFullYear()} Circuit Kuwait</div>
    </footer>
  );
}

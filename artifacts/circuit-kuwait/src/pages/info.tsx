import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLang } from '@/lib/i18n';
import { useSeo } from '@/lib/seo';
import { PageHead } from '@/components/bits';

type K = 'shipping' | 'returns' | 'privacy' | 'terms' | 'faq';
export default function Info({ kind }: { kind: K }) {
  const { tr } = useLang();
  const D: Record<K, { t: [string, string]; s: [string, string][] }> = {
    shipping: { t: ['Shipping', 'الشحن'], s: [['Delivery methods', 'طرق التوصيل'], ['Standard delivery takes 1-3 working days within Kuwait. Express is offered where available, and store pickup is free.', 'يستغرق التوصيل العادي 1-3 أيام عمل داخل الكويت. التوصيل السريع حيث يتوفر، والاستلام من المتجر مجاني.'], ['Addresses', 'العناوين'], ['Enter your governorate, area, block, street and building so the courier can find you.', 'أدخل المحافظة والمنطقة والقطعة والشارع والمبنى ليجدك المندوب.']].reduce<[string, string][]>((a, x, i, arr) => (i % 2 ? a : [...a, [x[0] + '|' + x[1], arr[i + 1][0] + '|' + arr[i + 1][1]]]), []) },
    returns: { t: ['Returns', 'الإرجاع'], s: [['Unused items in original packaging can be returned. Soldered, damaged or opened static-sensitive parts may not qualify. Contact us with your order number to start a return.|الأصناف غير المستخدمة في عبوتها الأصلية قابلة للإرجاع. القطع الملحومة أو التالفة أو المفتوحة الحساسة للكهرباء الساكنة قد لا تُقبل. تواصل معنا مع رقم الطلب.', '']] },
    privacy: { t: ['Privacy policy', 'سياسة الخصوصية'], s: [['We collect only what is needed to process orders and support you: name, email, phone and delivery address. This demo store does not collect card details. We do not sell personal data.|نجمع فقط ما يلزم لمعالجة الطلبات ودعمك: الاسم والبريد والهاتف وعنوان التوصيل. لا يجمع هذا المتجر التجريبي بيانات البطاقات. لا نبيع البيانات الشخصية.', '']] },
    terms: { t: ['Terms of service', 'شروط الخدمة'], s: [['This is a demonstration storefront. Orders are saved for demonstration, payments are simulated and no goods are charged or shipped. Prices are shown in Kuwaiti dinar (KWD).|هذا متجر تجريبي. تُحفظ الطلبات للعرض فقط والدفع محاكى ولا يتم تحصيل أو شحن بضائع. الأسعار بالدينار الكويتي.', '']] },
    faq: { t: ['Frequently asked questions', 'الأسئلة الشائعة'], s: [] },
  };
  const faqs: [string, string, string, string][] = [
    ['Which boards are good for beginners?', 'ما اللوحات المناسبة للمبتدئين؟', 'An Arduino Uno-class board is the usual starting point, paired with a breadboard, jumper wires and a few sensors.', 'لوحة بمستوى أردوينو أونو هي نقطة البداية المعتادة مع بريد بورد وأسلاك وبعض الحساسات.'],
    ['Is payment real?', 'هل الدفع حقيقي؟', 'No. Checkout is a demo: methods are recorded on the order but nothing is charged and no card data is collected.', 'لا. الدفع تجريبي: تُسجل الطريقة في الطلب دون أي تحصيل أو جمع بيانات بطاقة.'],
    ['Do you deliver to all governorates?', 'هل توصلون لكل المحافظات؟', 'Delivery covers Kuwait\'s six governorates.', 'يشمل التوصيل محافظات الكويت الست.'],
    ['Can I get datasheets?', 'هل تتوفر أوراق البيانات؟', 'Where a datasheet is available it is linked on the product page.', 'تُربط ورقة البيانات في صفحة المنتج حيثما توفرت.'],
  ];
  const d = D[kind];
  useSeo(tr(...d.t), tr(`${d.t[0]} for Circuit Kuwait.`, `${d.t[1]} لسيركت الكويت.`));
  return (<div><PageHead title={tr(...d.t)} />
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-12">
      {kind === 'faq' ? <Accordion type="single" collapsible className="rounded-2xl border bg-card px-5">{faqs.map((f, i) => <AccordionItem key={i} value={`q${i}`}><AccordionTrigger data-testid={`faq-${i}`} className="text-start font-semibold">{tr(f[0], f[1])}</AccordionTrigger><AccordionContent className="text-muted-foreground">{tr(f[2], f[3])}</AccordionContent></AccordionItem>)}</Accordion> :
        d.s.map(([a, b], i) => { const [ae, aa] = a.split('|'); const [be, ba] = b.split('|'); return <div key={i} className="rounded-2xl border bg-card p-6"><p className="leading-relaxed">{tr(ae, aa)}</p>{b && <p className="mt-2 leading-relaxed text-muted-foreground">{tr(be, ba)}</p>}</div>; })}
    </div></div>);
}

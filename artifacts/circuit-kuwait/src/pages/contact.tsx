import { useState } from 'react';
import { Mail, Clock, MessageSquare } from 'lucide-react';
import { useSendContact } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLang } from '@/lib/i18n';
import { useSeo } from '@/lib/seo';
import { PageHead } from '@/components/bits';

export default function Contact() {
  const { tr } = useLang(); const { toast } = useToast(); const send = useSendContact();
  const [f, setF] = useState({ name: '', email: '', message: '' });
  useSeo(tr('Contact', 'اتصل بنا'), tr('Ask our team about parts, stock and projects.', 'اسأل فريقنا عن القطع والمخزون والمشاريع.'));
  return (<div><PageHead title={tr('Contact us', 'اتصل بنا')} sub={tr('Tell us what you are building and we will help you pick parts.', 'أخبرنا بما تبنيه وسنساعدك في اختيار القطع.')} />
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-[1fr_300px]">
      <form className="space-y-4 rounded-2xl border bg-card p-6" onSubmit={(e) => { e.preventDefault(); send.mutate({ data: f }, { onSuccess: () => { toast({ title: tr('Message sent', 'تم الإرسال') }); setF({ name: '', email: '', message: '' }); }, onError: () => toast({ title: tr('Could not send', 'تعذر الإرسال'), variant: 'destructive' }) }); }}>
        <div className="space-y-1.5"><Label>{tr('Name', 'الاسم')}</Label><Input required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} data-testid="input-contact-name" /></div>
        <div className="space-y-1.5"><Label>Email</Label><Input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} data-testid="input-contact-email" /></div>
        <div className="space-y-1.5"><Label>{tr('Message', 'الرسالة')}</Label><Textarea required minLength={5} rows={6} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} data-testid="input-contact-message" /></div>
        <Button disabled={send.isPending} data-testid="button-send-contact">{send.isPending ? tr('Sending...', 'جارٍ الإرسال...') : tr('Send message', 'إرسال')}</Button></form>
      <div className="space-y-3">{[[Mail, tr('Write to us', 'راسلنا'), tr('Use the form and we reply by email.', 'استخدم النموذج وسنرد بالبريد.')], [Clock, tr('Response time', 'وقت الرد'), tr('We aim to reply within one working day.', 'نهدف للرد خلال يوم عمل.')], [MessageSquare, tr('Technical help', 'مساعدة فنية'), tr('Include part numbers or a short project description.', 'أرفق أرقام القطع أو وصفاً موجزاً.')]].map(([I, t, d], i) => { const Ic = I as typeof Mail; return <div key={i} className="flex gap-3 rounded-2xl border bg-card p-4"><Ic className="mt-0.5 size-5 text-secondary" /><div><p className="font-semibold">{t as string}</p><p className="text-sm text-muted-foreground">{d as string}</p></div></div>; })}</div>
    </div></div>);
}

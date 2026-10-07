import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/i18n';

export default function NotFound() {
  const { tr } = useLang();
  return (<div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-4 text-center" data-testid="page-404">
    <p className="font-mono text-7xl font-bold text-primary">4<span className="text-amber">0</span>4</p>
    <h1 className="mt-3 text-2xl font-bold">{tr('This trace is open-circuit', 'هذا المسار مفتوح الدائرة')}</h1>
    <p className="mt-2 text-muted-foreground">{tr('The page you wanted does not exist.', 'الصفحة المطلوبة غير موجودة.')}</p>
    <Button asChild className="mt-6"><Link href="/">{tr('Back to the store', 'العودة للمتجر')}</Link></Button></div>);
}

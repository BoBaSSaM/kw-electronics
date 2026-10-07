import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Product } from '@workspace/api-client-react';

type Lang = 'en' | 'ar';
interface Ctx { lang: Lang; setLang: (l: Lang) => void; tr: (en: string, ar: string) => string; pn: (p: Pick<Product, 'name' | 'nameAr'>) => string; rtl: boolean; }
const C = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('ck-lang') === 'ar' ? 'ar' : 'en'));
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('ck-lang', lang);
  }, [lang]);
  const value: Ctx = {
    lang, rtl: lang === 'ar', setLang: setLangState,
    tr: (en, ar) => (lang === 'ar' && ar ? ar : en),
    pn: (p) => (lang === 'ar' && p.nameAr ? p.nameAr : p.name),
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}
export function useLang() { const c = useContext(C); if (!c) throw new Error('LangProvider missing'); return c; }

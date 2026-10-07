import { useEffect } from 'react';
function meta(attr: string, key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', content);
}
export function useSeo(title: string, description: string, jsonLd?: object | null, image?: string) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    const full = `${title} | Circuit Kuwait`;
    document.title = full;
    meta('name', 'description', description);
    meta('property', 'og:title', full);
    meta('property', 'og:description', description);
    meta('property', 'og:type', ld ? 'product' : 'website');
    if (image) meta('property', 'og:image', window.location.origin + image);
    let s = document.getElementById('ld-json');
    if (ld) {
      if (!s) { s = document.createElement('script'); s.id = 'ld-json'; s.setAttribute('type', 'application/ld+json'); document.head.appendChild(s); }
      s.textContent = ld;
    } else s?.remove();
    return () => { document.getElementById('ld-json')?.remove(); };
  }, [title, description, ld, image]);
}

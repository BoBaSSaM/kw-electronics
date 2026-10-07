import { useEffect, useRef, useState } from 'react';

/** Reveal once, without hiding content from reduced-motion visitors. */
export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let observer: IntersectionObserver | undefined;
    const show = () => { setSeen(true); observer?.disconnect(); };
    const onPreferenceChange = () => { if (preference.matches) show(); };

    // A parent already reveals this group; don't double-animate its cards.
    if (preference.matches || element.parentElement?.closest('.reveal') || !('IntersectionObserver' in window)) {
      show();
      return;
    }
    observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) show();
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    observer.observe(element);
    preference.addEventListener('change', onPreferenceChange);
    return () => {
      observer?.disconnect();
      preference.removeEventListener('change', onPreferenceChange);
    };
  }, []);

  return { ref, seen };
}

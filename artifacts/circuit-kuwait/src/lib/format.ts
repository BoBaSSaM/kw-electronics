import type { Product } from '@workspace/api-client-react';
export const kwd = (n: number) => `${Number(n).toFixed(3)} KWD`;
export const discountPct = (p: Pick<Product, 'price' | 'oldPrice'>) =>
  p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
export const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const imgOf = (p: Pick<Product, 'image' | 'slug'>) => p.image || `/images/${p.slug}.png`;
export const asset = (path: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`;

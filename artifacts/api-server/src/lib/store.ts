import { db, cartsTable, productsTable, discountsTable, orderItemsTable, type ProductRecord } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
export const money=(n:number)=>Math.round(n*1000)/1000;
export function productSlug(name:string){return name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
export async function readCart(owner:string){
  const [saved]=await db.select().from(cartsTable).where(eq(cartsTable.owner,owner));
  const ids=saved?.items.map(i=>i.productId)||[];
  const products=ids.length ? await db.select().from(productsTable).where(inArray(productsTable.id,ids)) : [];
  const items=(saved?.items||[]).flatMap(i=>{
    const product=products.find(p=>p.id===i.productId);
    return product ? [{product,quantity:i.quantity}] : [];
  });
  return calculateCart(items,saved?.coupon||"");
}
export async function calculateCart(items:{product:ProductRecord;quantity:number}[],coupon:string){
  const subtotal=money(items.reduce((sum,i)=>sum+i.product.price*i.quantity,0));
  let discount=0;
  if(coupon){
    const [code]=await db.select().from(discountsTable).where(eq(discountsTable.code,coupon.toUpperCase()));
    if(code?.active)discount=money(subtotal*code.percent/100);
  }
  const delivery=!items.length||subtotal>=25 ? 0 : 2;
  return {items,subtotal,delivery,discount,total:money(subtotal+delivery-discount),coupon};
}
export async function orderWithItems<T extends {id:number;createdAt:Date}>(order:T){
  const lines=await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId,order.id));
  return {...order,createdAt:order.createdAt.toISOString(),items:lines.map(l=>({product:l.product,quantity:l.quantity}))};
}

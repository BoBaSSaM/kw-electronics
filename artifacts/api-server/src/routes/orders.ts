import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db, ordersTable, orderItemsTable, productsTable, cartsTable, discountsTable } from "@workspace/db";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import * as V from "@workspace/api-zod";
import { orderWithItems, money } from "../lib/store";
const router=Router();
router.get("/orders",async(req,res)=>{
  const orders=await db.select().from(ordersTable).where(eq(ordersTable.owner,req.storeOwner)).orderBy(desc(ordersTable.createdAt));
  res.json(V.ListOrdersResponse.parse(await Promise.all(orders.map(orderWithItems))));
});
router.get("/orders/:id",async(req,res):Promise<void>=>{
  const {id}=V.GetOrderParams.parse(req.params);
  const [order]=await db.select().from(ordersTable).where(and(eq(ordersTable.id,id),eq(ordersTable.owner,req.storeOwner)));
  if(!order){res.status(404).json({error:"Order not found"});return;}
  res.json(V.GetOrderResponse.parse(await orderWithItems(order)));
});
router.post("/orders",async(req,res):Promise<void>=>{
  const input=V.PlaceOrderBody.safeParse(req.body);
  if(!input.success){res.status(400).json({error:"Please complete all checkout details correctly."});return;}
  try{
    const order=await db.transaction(async tx=>{
      const [cart]=await tx.select().from(cartsTable).where(eq(cartsTable.owner,req.storeOwner)).for("update");
      if(!cart?.items.length)throw new Error("Your cart is empty.");
      const products=await tx.select().from(productsTable).where(inArray(productsTable.id,cart.items.map(i=>i.productId))).orderBy(productsTable.id).for("update");
      for(const line of cart.items){
        const p=products.find(p=>p.id===line.productId);
        if(!p||p.stock<line.quantity)throw new Error(`${p?.name||"A product"} is no longer available in the requested quantity.`);
      }
      const subtotal=money(cart.items.reduce((s,i)=>s+products.find(p=>p.id===i.productId)!.price*i.quantity,0));
      let discount=0;
      if(cart.coupon){
        const [code]=await tx.select().from(discountsTable).where(and(eq(discountsTable.code,cart.coupon),eq(discountsTable.active,true)));
        if(!code)throw new Error("Your discount code has expired. Remove it and try again.");
        discount=money(subtotal*code.percent/100);
      }
      const delivery=input.data.deliveryMethod==="pickup"?0:input.data.deliveryMethod==="express"?3.5:subtotal>=25?0:2;
      const [order]=await tx.insert(ordersTable).values({...input.data,owner:req.storeOwner,number:`CK-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0,4).toUpperCase()}`,
        subtotal,delivery,discount,total:money(subtotal+delivery-discount),simulated:true}).returning();
      const items=cart.items.map(i=>({orderId:order.id,productId:i.productId,quantity:i.quantity,product:products.find(p=>p.id===i.productId)!}));
      await tx.insert(orderItemsTable).values(items);
      for(const i of cart.items)await tx.update(productsTable).set({stock:sql`${productsTable.stock}-${i.quantity}`,soldCount:sql`${productsTable.soldCount}+${i.quantity}`}).where(eq(productsTable.id,i.productId));
      await tx.update(cartsTable).set({items:[],coupon:""}).where(eq(cartsTable.owner,req.storeOwner));
      return {...order,createdAt:order.createdAt.toISOString(),items:items.map(i=>({product:i.product,quantity:i.quantity}))};
    });
    res.status(201).json(V.PlaceOrderResponse.parse(order));
  }catch(error){
    if(error instanceof Error && !("code" in error)){res.status(400).json({error:error.message});return;}
    throw error;
  }
});
export default router;

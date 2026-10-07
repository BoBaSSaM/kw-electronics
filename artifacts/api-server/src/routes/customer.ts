import { Router } from "express";
import { db, productsTable, cartsTable, wishlistTable, addressesTable, ordersTable, newslettersTable, messagesTable, discountsTable } from "@workspace/db";
import { eq, and, inArray, count } from "drizzle-orm";
import * as V from "@workspace/api-zod";
import { signedIn } from "../middlewares/storeSession";
import { readCart } from "../lib/store";
const router=Router();
router.get("/cart",async(req,res)=>{res.json(V.GetCartResponse.parse(await readCart(req.storeOwner)));});
router.put("/cart",async(req,res):Promise<void>=>{
  const input=V.UpdateCartBody.safeParse(req.body);
  if(!input.success){res.status(400).json({error:"Invalid cart quantities."});return;}
  const merged=new Map<number,number>();
  for(const i of input.data.items)merged.set(i.productId,(merged.get(i.productId)||0)+i.quantity);
  const items=[...merged].map(([productId,quantity])=>({productId,quantity}));
  if(items.length){
    const products=await db.select().from(productsTable).where(inArray(productsTable.id,items.map(i=>i.productId)));
    for(const i of items){
      const p=products.find(p=>p.id===i.productId);
      if(!p||p.stock<i.quantity||i.quantity>100){res.status(400).json({error:`Not enough stock for ${p?.name||"this product"}.`});return;}
    }
  }
  const coupon=(input.data.coupon||"").trim().toUpperCase();
  if(coupon){
    const [discount]=await db.select().from(discountsTable).where(and(eq(discountsTable.code,coupon),eq(discountsTable.active,true)));
    if(!discount){res.status(400).json({error:"This discount code is invalid or inactive."});return;}
  }
  await db.insert(cartsTable).values({owner:req.storeOwner,items,coupon}).onConflictDoUpdate({target:cartsTable.owner,set:{items,coupon}});
  res.json(V.UpdateCartResponse.parse(await readCart(req.storeOwner)));
});
async function wishlist(owner:string){
  const [saved]=await db.select().from(wishlistTable).where(eq(wishlistTable.owner,owner));
  return saved?.productIds.length ? db.select().from(productsTable).where(inArray(productsTable.id,saved.productIds)) : [];
}
router.get("/wishlist",async(req,res)=>{res.json(V.GetWishlistResponse.parse(await wishlist(req.storeOwner)));});
router.put("/wishlist",async(req,res):Promise<void>=>{
  const input=V.UpdateWishlistBody.safeParse(req.body);
  if(!input.success){res.status(400).json({error:"Invalid wishlist"});return;}
  const ids=[...new Set(input.data.productIds)].slice(0,200);
  const products=ids.length ? await db.select().from(productsTable).where(inArray(productsTable.id,ids)) : [];
  const productIds=products.map(p=>p.id);
  await db.insert(wishlistTable).values({owner:req.storeOwner,productIds}).onConflictDoUpdate({target:wishlistTable.owner,set:{productIds}});
  res.json(V.UpdateWishlistResponse.parse(products));
});
router.get("/account",signedIn,async(req,res)=>{
  const [n]=await db.select({n:count()}).from(ordersTable).where(eq(ordersTable.owner,req.storeOwner));
  res.json(V.GetAccountResponse.parse({...req.storeUser,orderCount:n.n}));
});
router.get("/addresses",signedIn,async(req,res)=>{
  const addresses=await db.select().from(addressesTable).where(eq(addressesTable.owner,req.storeOwner));
  res.json(V.ListAddressesResponse.parse(addresses.map(a=>({...a.data,id:a.id}))));
});
router.post("/addresses",signedIn,async(req,res):Promise<void>=>{
  const input=V.SaveAddressBody.safeParse(req.body);
  if(!input.success){res.status(400).json({error:"Please complete your Kuwait delivery address."});return;}
  const [address]=await db.insert(addressesTable).values({owner:req.storeOwner,data:input.data}).returning();
  res.status(201).json(V.SaveAddressResponse.parse({...address.data,id:address.id}));
});
router.delete("/addresses/:id",signedIn,async(req,res):Promise<void>=>{
  const {id}=V.DeleteAddressParams.parse(req.params);
  const deleted=await db.delete(addressesTable).where(and(eq(addressesTable.id,id),eq(addressesTable.owner,req.storeOwner))).returning();
  if(!deleted.length){res.status(404).json({error:"Address not found"});return;}
  res.json({message:"Address removed"});
});
router.post("/newsletter",async(req,res):Promise<void>=>{
  const input=V.SubscribeNewsletterBody.safeParse(req.body);
  if(!input.success){res.status(400).json({error:"Enter a valid email address"});return;}
  await db.insert(newslettersTable).values({email:input.data.email.toLowerCase()}).onConflictDoNothing();
  res.json({message:"You're on the list! Receive updates when newsletters are sent."});
});
router.post("/contact",async(req,res):Promise<void>=>{
  const input=V.SendContactBody.safeParse(req.body);
  if(!input.success){res.status(400).json({error:"Please enter your name, a valid email and a message."});return;}
  await db.insert(messagesTable).values(input.data);
  res.json({message:"Your message has been saved for the Circuit Kuwait team."});
});
export default router;

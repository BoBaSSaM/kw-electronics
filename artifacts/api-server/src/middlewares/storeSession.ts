import { randomUUID } from "node:crypto";
import { getAuth, clerkClient } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable, cartsTable, wishlistTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      storeOwner: string;
      storeUser?: {id:string;name:string;email:string;role:"admin"|"customer"};
    }
  }
}
const cache = new Map<string,{user:NonNullable<Request["storeUser"]>;expires:number}>();
export async function storeSession(req:Request,res:Response,next:NextFunction) {
  let guest = req.cookies?.circuit_guest;
  if (typeof guest !== "string" || !/^[a-f0-9-]{36}$/.test(guest)) {
    guest = randomUUID();
    res.cookie("circuit_guest",guest,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:365*86400000,path:"/"});
  }
  req.storeOwner = `guest:${guest}`;
  const { userId } = getAuth(req);
  if (userId) {
    const cached = cache.get(userId);
    let user = cached && cached.expires>Date.now() ? cached.user : undefined;
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      user = {id:userId,name:[clerkUser.firstName,clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || "Customer",
        email:clerkUser.emailAddresses.find(e=>e.id===clerkUser.primaryEmailAddressId)?.emailAddress || "",
        role:clerkUser.publicMetadata.role==="admin" ? "admin" : "customer"};
      await db.insert(usersTable).values(user).onConflictDoUpdate({target:usersTable.id,set:user});
      cache.set(userId,{user,expires:Date.now()+30000});
    }
    req.storeUser=user;
    const guestOwner=req.storeOwner;
    req.storeOwner=userId;
    await db.transaction(async tx=>{
      await tx.update(ordersTable).set({owner:userId}).where(eq(ordersTable.owner,guestOwner));
      const [guestCart]=await tx.select().from(cartsTable).where(eq(cartsTable.owner,guestOwner)).for("update");
      if(guestCart?.items.length){
        const [existing]=await tx.select().from(cartsTable).where(eq(cartsTable.owner,userId));
        const merged=new Map((existing?.items||[]).map(i=>[i.productId,i.quantity]));
        for(const i of guestCart.items) merged.set(i.productId,Math.min(100,(merged.get(i.productId)||0)+i.quantity));
        const items=[...merged].map(([productId,quantity])=>({productId,quantity}));
        await tx.insert(cartsTable).values({owner:userId,items,coupon:existing?.coupon||guestCart.coupon}).onConflictDoUpdate({target:cartsTable.owner,set:{items}});
        await tx.delete(cartsTable).where(eq(cartsTable.owner,guestOwner));
      }
      const [guestWishlist]=await tx.select().from(wishlistTable).where(eq(wishlistTable.owner,guestOwner)).for("update");
      if(guestWishlist?.productIds.length){
        const [existing]=await tx.select().from(wishlistTable).where(eq(wishlistTable.owner,userId));
        const productIds=[...new Set([...(existing?.productIds||[]),...guestWishlist.productIds])];
        await tx.insert(wishlistTable).values({owner:userId,productIds}).onConflictDoUpdate({target:wishlistTable.owner,set:{productIds}});
        await tx.delete(wishlistTable).where(eq(wishlistTable.owner,guestOwner));
      }
    });
  }
  next();
}
export function signedIn(req:Request,res:Response,next:NextFunction) {
  if(!req.storeUser){res.status(401).json({error:"Please sign in to continue."});return;}
  next();
}
export function adminOnly(req:Request,res:Response,next:NextFunction){
  if(!req.storeUser){res.status(401).json({error:"Please sign in as a store administrator."});return;}
  if(req.storeUser.role!=="admin"){res.status(403).json({error:"Administrator access required."});return;}
  next();
}

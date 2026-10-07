import { Router } from "express";
import { db, productsTable, ordersTable, orderItemsTable, usersTable, categoriesTable, brandsTable, discountsTable } from "@workspace/db";
import { eq, desc, count, lte, sql } from "drizzle-orm";
import * as V from "@workspace/api-zod";
import { adminOnly } from "../middlewares/storeSession";
import { orderWithItems, productSlug } from "../lib/store";
const router=Router();
router.use("/admin",adminOnly);
router.get("/admin/summary",async(_req,res)=>{
  const [orders]=await db.select({n:count(),total:sql<number>`coalesce(sum(${ordersTable.total}) filter (where ${ordersTable.status} != 'Cancelled'),0)::float`}).from(ordersTable);
  const [customers]=await db.select({n:count()}).from(usersTable);
  const [products]=await db.select({n:count()}).from(productsTable);
  const lowStock=await db.select().from(productsTable).where(lte(productsTable.stock,5));
  res.json(V.GetAdminSummaryResponse.parse({totalSales:orders.total,orders:orders.n,customers:customers.n,products:products.n,lowStock}));
});
router.post("/admin/products",async(req,res):Promise<void>=>{
  const input=V.CreateProductBody.safeParse(req.body);
  if(!input.success){res.status(400).json({error:"Please enter valid product details."});return;}
  const slug=productSlug(input.data.name)||`product-${Date.now()}`;
  const exists=await db.select({id:productsTable.id}).from(productsTable).where(eq(productsTable.slug,slug));
  const [product]=await db.insert(productsTable).values({...input.data,slug:exists.length?`${slug}-${Date.now()}`:slug,images:input.data.images||[input.data.image]})
    .onConflictDoNothing().returning();
  if(!product){res.status(409).json({error:"A product with this SKU already exists."});return;}
  res.status(201).json(V.CreateProductResponse.parse(product));
});
router.put("/admin/products/:id",async(req,res):Promise<void>=>{
  const {id}=V.UpdateProductParams.parse(req.params);
  const input=V.UpdateProductBody.safeParse(req.body);
  if(!input.success){res.status(400).json({error:"Please enter valid product details."});return;}
  const [product]=await db.update(productsTable).set({...input.data,images:input.data.images||[input.data.image]}).where(eq(productsTable.id,id)).returning();
  if(!product){res.status(404).json({error:"Product not found"});return;}
  res.json(V.UpdateProductResponse.parse(product));
});
router.delete("/admin/products/:id",async(req,res):Promise<void>=>{
  const {id}=V.DeleteProductParams.parse(req.params);
  const deleted=await db.delete(productsTable).where(eq(productsTable.id,id)).returning();
  if(!deleted.length){res.status(404).json({error:"Product not found"});return;}
  res.json({message:"Product deleted"});
});
router.get("/admin/orders",async(_req,res)=>{
  const orders=await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  res.json(V.ListAdminOrdersResponse.parse(await Promise.all(orders.map(orderWithItems))));
});
router.patch("/admin/orders/:id",async(req,res):Promise<void>=>{
  const {id}=V.UpdateOrderStatusParams.parse(req.params);
  const input=V.UpdateOrderStatusBody.safeParse(req.body);
  if(!input.success){res.status(400).json({error:"Invalid order status"});return;}
  const result=await db.transaction(async tx=>{
    const [previous]=await tx.select().from(ordersTable).where(eq(ordersTable.id,id)).for("update");
    if(!previous)return null;
    if(previous.status==="Cancelled"&&input.data.status!=="Cancelled")return "cancelled" as const;
    if(input.data.status==="Cancelled"&&previous.status!=="Cancelled"){
      const items=await tx.select().from(orderItemsTable).where(eq(orderItemsTable.orderId,id));
      for(const i of items)await tx.update(productsTable).set({stock:sql`${productsTable.stock}+${i.quantity}`,soldCount:sql`greatest(0,${productsTable.soldCount}-${i.quantity})`}).where(eq(productsTable.id,i.productId));
    }
    const [order]=await tx.update(ordersTable).set(input.data).where(eq(ordersTable.id,id)).returning();
    return order;
  });
  if(!result){res.status(404).json({error:"Order not found"});return;}
  if(result==="cancelled"){res.status(400).json({error:"Cancelled orders cannot be reopened. Create a new order."});return;}
  res.json(V.UpdateOrderStatusResponse.parse(await orderWithItems(result)));
});
router.get("/admin/customers",async(_req,res)=>{
  const users=await db.select().from(usersTable);
  const counts=await db.select({owner:ordersTable.owner,n:count()}).from(ordersTable).groupBy(ordersTable.owner);
  res.json(V.ListCustomersResponse.parse(users.map(u=>({...u,orderCount:counts.find(c=>c.owner===u.id)?.n||0}))));
});
router.post("/admin/taxonomy",async(req,res):Promise<void>=>{
  const input=V.SaveTaxonomyBody.safeParse(req.body);
  if(!input.success){res.status(400).json({error:"Please enter a valid category or brand."});return;}
  const d=input.data;
  const table=d.kind==="category"?categoriesTable:brandsTable;
  const [existing]=d.id?await db.select().from(table).where(eq(table.id,d.id)):[];
  if(d.id&&!existing){res.status(404).json({error:"Category or brand not found"});return;}
  if(d.remove&&existing){
    const [n]=await db.select({n:count()}).from(productsTable).where(eq(d.kind==="category"?productsTable.category:productsTable.brand,existing.name));
    if(n.n){res.status(409).json({error:"Move associated products before deleting this category or brand."});return;}
    await db.delete(table).where(eq(table.id,d.id!));
  }else if(d.kind==="category"){
    const values={name:d.name,nameAr:d.nameAr||"",slug:productSlug(d.name),children:d.children||[]};
    if(d.id)await db.update(categoriesTable).set(values).where(eq(categoriesTable.id,d.id));
    else await db.insert(categoriesTable).values(values).onConflictDoNothing();
  }else{
    if(d.id)await db.update(brandsTable).set({name:d.name}).where(eq(brandsTable.id,d.id));
    else await db.insert(brandsTable).values({name:d.name}).onConflictDoNothing();
  }
  if(existing&&!d.remove&&existing.name!==d.name)await db.update(productsTable).set(d.kind==="category"?{category:d.name}:{brand:d.name}).where(eq(d.kind==="category"?productsTable.category:productsTable.brand,existing.name));
  res.json({message:d.remove?"Removed successfully":"Saved successfully"});
});
router.get("/admin/discounts",async(_req,res)=>{res.json(V.ListDiscountsResponse.parse(await db.select().from(discountsTable)));});
router.post("/admin/discounts",async(req,res):Promise<void>=>{
  const input=V.SaveDiscountBody.safeParse(req.body);
  if(!input.success){res.status(400).json({error:"Discount must be between 1% and 90%."});return;}
  const data={...input.data,code:input.data.code.trim().toUpperCase()};
  const [discount]=await db.insert(discountsTable).values(data).onConflictDoUpdate({target:discountsTable.code,set:data}).returning();
  res.json(V.SaveDiscountResponse.parse(discount));
});
export default router;

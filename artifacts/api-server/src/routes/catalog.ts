import { Router } from "express";
import { db, productsTable, categoriesTable, brandsTable, reviewsTable } from "@workspace/db";
import { eq, and, or, ilike, gte, lte, gt, desc, asc, count, sql } from "drizzle-orm";
import * as V from "@workspace/api-zod";
import { signedIn } from "../middlewares/storeSession";
const router=Router();
router.get("/products",async(req,res):Promise<void>=>{
  const parsed=V.ListProductsQueryParams.safeParse(req.query);
  if(!parsed.success){res.status(400).json({error:"Invalid filters"});return;}
  const q=parsed.data;
  const predicates=[];
  if(q.q)predicates.push(or(ilike(productsTable.name,`%${q.q}%`),ilike(productsTable.nameAr,`%${q.q}%`),ilike(productsTable.sku,`%${q.q}%`),ilike(productsTable.category,`%${q.q}%`),ilike(productsTable.subcategory,`%${q.q}%`)));
  if(q.category){
    const [category]=await db.select().from(categoriesTable).where(or(eq(categoriesTable.slug,q.category),eq(categoriesTable.name,q.category)));
    predicates.push(or(eq(productsTable.category,category?.name||q.category),eq(productsTable.subcategory,q.category)));
  }
  if(q.brand)predicates.push(eq(productsTable.brand,q.brand));
  if(req.query.available==="true")predicates.push(gt(productsTable.stock,0));
  if(req.query.featured==="true")predicates.push(eq(productsTable.featured,true));
  if(req.query.offers==="true")predicates.push(gt(productsTable.oldPrice,productsTable.price));
  if(q.minPrice!=null)predicates.push(gte(productsTable.price,q.minPrice));
  if(q.maxPrice!=null)predicates.push(lte(productsTable.price,q.maxPrice));
  if(q.rating!=null)predicates.push(gte(productsTable.rating,q.rating));
  const sorts:Record<string,ReturnType<typeof desc>>={
    price_asc:asc(productsTable.price),price_desc:desc(productsTable.price),best_selling:desc(productsTable.soldCount),
    newest:desc(productsTable.id),"price-low":asc(productsTable.price),"price-high":desc(productsTable.price),
    "price-asc":asc(productsTable.price),"price-desc":desc(productsTable.price),
    "price-low-to-high":asc(productsTable.price),"price-high-to-low":desc(productsTable.price),
    "best-selling":desc(productsTable.soldCount),bestselling:desc(productsTable.soldCount),
  };
  const page=Math.max(1,q.page||1),limit=Math.min(100,Math.max(1,q.limit||12));
  const [total]=await db.select({n:count()}).from(productsTable).where(and(...predicates));
  const products=await db.select().from(productsTable).where(and(...predicates)).orderBy(sorts[q.sort||""]||desc(productsTable.featured),asc(productsTable.id)).limit(limit).offset((page-1)*limit);
  res.json(V.ListProductsResponse.parse({products,total:total.n,page,pages:Math.ceil(total.n/limit)}));
});
router.get("/products/:slug",async(req,res):Promise<void>=>{
  const {slug}=V.GetProductParams.parse(req.params);
  const [product]=await db.select().from(productsTable).where(eq(productsTable.slug,slug));
  if(!product){res.status(404).json({error:"Product not found"});return;}
  res.json(V.GetProductResponse.parse(product));
});
router.get("/categories",async(_req,res)=>{
  const categories=await db.select().from(categoriesTable).orderBy(asc(categoriesTable.id));
  const counts=await db.select({category:productsTable.category,n:count()}).from(productsTable).groupBy(productsTable.category);
  res.json(V.ListCategoriesResponse.parse(categories.map(c=>({...c,count:counts.find(x=>x.category===c.name)?.n||0}))));
});
router.get("/brands",async(_req,res)=>{
  const brands=await db.select().from(brandsTable).orderBy(asc(brandsTable.id));
  const counts=await db.select({brand:productsTable.brand,n:count()}).from(productsTable).groupBy(productsTable.brand);
  res.json(V.ListBrandsResponse.parse(brands.map(b=>({...b,count:counts.find(x=>x.brand===b.name)?.n||0}))));
});
router.get("/reviews/:productId",async(req,res)=>{
  const {productId}=V.ListReviewsParams.parse(req.params);
  const reviews=await db.select().from(reviewsTable).where(eq(reviewsTable.productId,productId)).orderBy(desc(reviewsTable.createdAt));
  res.json(V.ListReviewsResponse.parse(reviews.map(r=>({...r,createdAt:r.createdAt.toISOString()}))));
});
router.post("/reviews/:productId",signedIn,async(req,res):Promise<void>=>{
  const input=V.AddReviewBody.safeParse(req.body);
  if(!input.success){res.status(400).json({error:"Rating must be 1–5 and review at least 3 characters."});return;}
  const {productId}=V.AddReviewParams.parse(req.params);
  const [product]=await db.select().from(productsTable).where(eq(productsTable.id,productId));
  if(!product){res.status(404).json({error:"Product not found"});return;}
  const [review]=await db.insert(reviewsTable).values({...input.data,productId,owner:req.storeUser!.id,name:req.storeUser!.name})
    .onConflictDoUpdate({target:[reviewsTable.productId,reviewsTable.owner],set:input.data}).returning();
  const [stats]=await db.select({n:count(),rating:sql<number>`avg(${reviewsTable.rating})::float`}).from(reviewsTable).where(eq(reviewsTable.productId,productId));
  await db.update(productsTable).set({rating:Math.round(stats.rating*10)/10,reviewCount:stats.n}).where(eq(productsTable.id,productId));
  res.status(201).json(V.AddReviewResponse.parse({...review,createdAt:review.createdAt.toISOString()}));
});
export default router;

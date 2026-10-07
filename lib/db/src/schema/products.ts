import { pgTable, serial, text, integer, doublePrecision, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull().default(""),
  brand: text("brand").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory").notNull().default(""),
  sku: text("sku").notNull().unique(),
  price: doublePrecision("price").notNull(),
  oldPrice: doublePrecision("old_price"),
  stock: integer("stock").notNull().default(0),
  rating: doublePrecision("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  image: text("image").notNull(),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  description: text("description").notNull().default(""),
  specifications: jsonb("specifications").$type<Record<string,string>>().notNull().default({}),
  datasheet: text("datasheet").notNull().default(""),
  featured: boolean("featured").notNull().default(false),
  isNew: boolean("is_new").notNull().default(false),
  soldCount: integer("sold_count").notNull().default(0),
});
export const insertProductSchema = createInsertSchema(productsTable).omit({id:true});
export type ProductRecord = typeof productsTable.$inferSelect;

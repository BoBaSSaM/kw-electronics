import { pgTable, serial, text, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(), name:text("name").notNull().unique(),nameAr:text("name_ar").notNull().default(""),
  slug:text("slug").notNull().unique(),icon:text("icon").notNull().default("Cpu"),children:jsonb("children").$type<string[]>().notNull().default([]),
});
export const brandsTable = pgTable("brands",{id:serial("id").primaryKey(),name:text("name").notNull().unique()});
export const discountsTable = pgTable("discount_codes",{id:serial("id").primaryKey(),code:text("code").notNull().unique(),percent:integer("percent").notNull(),active:boolean("active").notNull().default(true)});
export const insertCategorySchema = createInsertSchema(categoriesTable).omit({id:true});
export const insertBrandSchema = createInsertSchema(brandsTable).omit({id:true});
export const insertDiscountSchema = createInsertSchema(discountsTable).omit({id:true});

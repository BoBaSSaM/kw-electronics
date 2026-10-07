import { pgTable, text, serial, jsonb, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const usersTable = pgTable("users",{
  id:text("id").primaryKey(),name:text("name").notNull(),email:text("email").notNull(),role:text("role").notNull().default("customer"),
  createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});
export const cartsTable = pgTable("cart",{
  owner:text("owner").primaryKey(),
  items:jsonb("items").$type<{productId:number;quantity:number}[]>().notNull().default([]),
  coupon:text("coupon").notNull().default(""),
});
export const wishlistTable = pgTable("wishlist",{
  owner:text("owner").primaryKey(), productIds:jsonb("product_ids").$type<number[]>().notNull().default([]),
});
export const addressesTable = pgTable("addresses",{
  id:serial("id").primaryKey(),owner:text("owner").notNull().references(()=>usersTable.id),data:jsonb("data").$type<Record<string,string>>().notNull(),
});
export const reviewsTable = pgTable("reviews",{
  id:serial("id").primaryKey(),productId:integer("product_id").notNull(),owner:text("owner").notNull(),name:text("name").notNull(),
  rating:integer("rating").notNull(),text:text("text").notNull(),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("review_product_owner").on(t.productId,t.owner)]);
export const newslettersTable = pgTable("newsletter",{email:text("email").primaryKey(),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()});
export const messagesTable = pgTable("contact_messages",{id:serial("id").primaryKey(),name:text("name").notNull(),email:text("email").notNull(),message:text("message").notNull(),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()});
export const uploadsTable = pgTable("product_image_uploads",{path:text("path").primaryKey(),owner:text("owner").notNull(),contentType:text("content_type").notNull(),size:integer("size").notNull(),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()});
export const insertUserSchema=createInsertSchema(usersTable);
export const insertCartSchema=createInsertSchema(cartsTable);
export const insertWishlistSchema=createInsertSchema(wishlistTable);
export const insertAddressSchema=createInsertSchema(addressesTable).omit({id:true});
export const insertReviewSchema=createInsertSchema(reviewsTable).omit({id:true,createdAt:true});

import { pgTable, serial, text, jsonb, doublePrecision, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const ordersTable = pgTable("orders",{
  id:serial("id").primaryKey(),owner:text("owner").notNull(),number:text("number").notNull().unique(),name:text("name").notNull(),
  email:text("email").notNull(),phone:text("phone").notNull(),address:jsonb("address").$type<Record<string,string>>().notNull(),
  deliveryMethod:text("delivery_method").notNull(),paymentMethod:text("payment_method").notNull(),status:text("status").notNull().default("Pending"),
  subtotal:doublePrecision("subtotal").notNull(),delivery:doublePrecision("delivery").notNull(),discount:doublePrecision("discount").notNull(),
  total:doublePrecision("total").notNull(),simulated:boolean("simulated").notNull().default(true),
  createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});
export const orderItemsTable = pgTable("order_items",{
  id:serial("id").primaryKey(),orderId:integer("order_id").notNull().references(()=>ordersTable.id),
  productId:integer("product_id").notNull(),quantity:integer("quantity").notNull(),product:jsonb("product").$type<Record<string,unknown>>().notNull(),
});
export const insertOrderSchema=createInsertSchema(ordersTable).omit({id:true,createdAt:true});
export const insertOrderItemSchema=createInsertSchema(orderItemsTable).omit({id:true});

import { pgTable, text, serial, integer, boolean, jsonb, varchar, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Field types
export const FieldTypeEnum = z.enum([
  "TEXT", "PARAGRAPH", "NUMBER", "SINGLE_CHOICE", "MULTI_CHOICE", "DATE",
  "INPUT", "CACHE", "AUDIO_RECORD", "SCREEN_RECORD", "IMPORT", "EXPORT",
  "QR_SCAN", "GPS", "CHOOSE", "SELECT", "SEARCH", "FILTER", "DASHBOARD", "PHOTO"
]);

export type FieldType = z.infer<typeof FieldTypeEnum>;


export const forms = pgTable("forms", {
  id: uuid("id").primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFormSchema = createInsertSchema(forms).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true 
});

export type InsertForm = z.infer<typeof insertFormSchema>;
export type Form = typeof forms.$inferSelect;

// Dynamic field schema
export const fields = pgTable("fields", {
  id: uuid("id").primaryKey().notNull(),
  formId: uuid("form_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  fieldType: text("field_type").notNull(),
  options: jsonb("options"),
  required: boolean("required").default(false),
  status: text("status").notNull().default("Active"),
  order: integer("order").default(0),
});

export const insertFieldSchema = createInsertSchema(fields).omit({
  id: true
});

export type InsertField = z.infer<typeof insertFieldSchema>;
export type Field = typeof fields.$inferSelect;

// Form submission schema
export const formSubmissions = pgTable("form_submissions", {
  id: serial("id").primaryKey(),
  formId: uuid("form_id").notNull(),
  data: jsonb("data").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const insertFormSubmissionSchema = createInsertSchema(formSubmissions).omit({
  id: true,
  submittedAt: true
});

export type InsertFormSubmission = z.infer<typeof insertFormSubmissionSchema>;
export type FormSubmission = typeof formSubmissions.$inferSelect;

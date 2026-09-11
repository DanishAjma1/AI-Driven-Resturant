import { z } from "zod";

export const menuItemInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(500),
  price: z.number().positive("Price must be greater than 0"),
  category: z.string().trim().min(2).max(40),
  imageUrl: z.string().url("Enter a valid image URL"),
  isAvailable: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  popular: z.boolean().default(false),
  calories: z.number().int().positive().nullable().optional(),
  ingredients: z.array(z.string().trim().min(1)).default([]),
});
export type MenuItemInput = z.infer<typeof menuItemInputSchema>;

export const updateMenuItemSchema = menuItemInputSchema.partial();
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;

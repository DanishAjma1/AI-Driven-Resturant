import { z } from "zod";
import { OrderStatus } from "../types/domain";

export const createOrderItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});
export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;

/* ---------------------------------------------------------------------- */
/*  Fulfillment + payment verification                                    */
/*                                                                          */
/*  DINE_IN orders must be paid upfront to hold the table. The card/wallet */
/*  fields below are validated with format checks (Luhn, expiry, OTP) as a */
/*  DEMO verification step only — this is not a real PCI-compliant charge, */
/*  no funds move and no processor is called. See lib/payments/mockVerify. */
/* ---------------------------------------------------------------------- */

export const cardPaymentSchema = z.object({
  method: z.literal("CARD"),
  cardNumber: z
    .string()
    .regex(/^\d{13,19}$/, "Card number must be 13–19 digits"),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry must be in MM/YY format"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV must be 3–4 digits"),
});
export type CardPaymentInput = z.infer<typeof cardPaymentSchema>;

export const mobileWalletPaymentSchema = z.object({
  method: z.literal("MOBILE_WALLET"),
  walletNumber: z
    .string()
    .regex(/^03\d{9}$/, "Enter an 11-digit mobile wallet number starting with 03"),
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP"),
});
export type MobileWalletPaymentInput = z.infer<typeof mobileWalletPaymentSchema>;

export const paymentInputSchema = z.discriminatedUnion("method", [
  cardPaymentSchema,
  mobileWalletPaymentSchema,
]);
export type PaymentInput = z.infer<typeof paymentInputSchema>;

export const deliveryFulfillmentSchema = z.object({
  type: z.literal("DELIVERY"),
  deliveryAddress: z.string().min(5, "Enter a delivery address"),
  contactPhone: z.string().min(7, "Enter a contact phone number"),
});

export const dineInFulfillmentSchema = z.object({
  type: z.literal("DINE_IN"),
  tableNumber: z.number().int().min(1).max(200),
  payment: paymentInputSchema,
});

export const fulfillmentInputSchema = z.discriminatedUnion("type", [
  deliveryFulfillmentSchema,
  dineInFulfillmentSchema,
]);
export type FulfillmentInput = z.infer<typeof fulfillmentInputSchema>;

export const createOrderSchema = z.object({
  items: z.array(createOrderItemSchema).min(1, "Cart cannot be empty"),
  fulfillment: fulfillmentInputSchema,
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

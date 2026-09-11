/**
 * Domain types shared across `apps/web` (UI + API route handlers).
 * These intentionally mirror `packages/db/prisma/schema.prisma` so that
 * front-end and back-end code never diverge on shape.
 */

export const UserRole = {
  CUSTOMER: "CUSTOMER",
  COOK: "COOK",
  DRIVER: "DRIVER",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Navigation-layer role, including the signed-out visitor. Not a DB value. */
export type NavRole = UserRole | "ANONYMOUS";

export const OrderStatus = {
  RECEIVED: "RECEIVED",
  PREPARING: "PREPARING",
  PREPARED: "PREPARED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const FulfillmentType = {
  DELIVERY: "DELIVERY",
  DINE_IN: "DINE_IN",
} as const;
export type FulfillmentType = (typeof FulfillmentType)[keyof typeof FulfillmentType];

export const PaymentMethod = {
  CARD: "CARD",
  MOBILE_WALLET: "MOBILE_WALLET",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const DiscountType = {
  PERCENTAGE: "PERCENTAGE",
  FIXED_AMOUNT: "FIXED_AMOUNT",
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export const DiscountScope = {
  GLOBAL: "GLOBAL",
  CATEGORY: "CATEGORY",
  SELECTIVE_ITEMS: "SELECTIVE_ITEMS",
} as const;
export type DiscountScope = (typeof DiscountScope)[keyof typeof DiscountScope];

export const DietaryTag = {
  VEGAN: "Vegan",
  VEGETARIAN: "Vegetarian",
  GLUTEN_FREE: "Gluten-Free",
  HALAL: "Halal",
  NUT_FREE: "Nut-Free",
  SPICY: "Spicy",
} as const;
export type DietaryTag = (typeof DietaryTag)[keyof typeof DietaryTag];

export interface AuthUserDTO {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface ActiveDiscountDTO {
  ruleId: string;
  code: string;
  label: string;
  originalPrice: number;
  finalPrice: number;
}

export interface MenuItemDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  tags: DietaryTag[];
  rating: number;
  popular: boolean;
  calories: number | null;
  ingredients: string[];
  /** Best-applicable active discount for this item, if any. */
  discount: ActiveDiscountDTO | null;
}

export interface OrderItemDTO {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  priceAtTime: number;
}

export interface OrderDTO {
  id: string;
  /** Human-friendly code shown to staff/customers, e.g. "EG-1048". */
  displayId: string;
  customerId: string;
  customerName: string;
  cookId: string | null;
  driverId: string | null;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItemDTO[];
  fulfillmentType: FulfillmentType;
  deliveryAddress: string | null;
  contactPhone: string | null;
  tableNumber: number | null;
  paymentMethod: PaymentMethod | null;
  paymentVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountRuleDTO {
  id: string;
  code: string;
  discountType: DiscountType;
  value: number;
  scope: DiscountScope;
  category: string | null;
  targetItemIds: string[];
  isScheduled: boolean;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Ordered lifecycle used by the kitchen/driver consoles to validate transitions. */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  OrderStatus.RECEIVED,
  OrderStatus.PREPARING,
  OrderStatus.PREPARED,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

/**
 * Valid next-states per current status. DINE_IN orders may jump straight
 * from PREPARING/PREPARED to DELIVERED ("served") since there's no driver
 * handoff — see `lib/data/orders.ts#updateOrderStatus` for the role/
 * fulfillment-type guard that enforces who may take which transition.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  RECEIVED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.PREPARED, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  PREPARED: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

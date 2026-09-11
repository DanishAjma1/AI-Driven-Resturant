import { prisma, Prisma } from "@ember-grain/db";
import {
  ALLOWED_TRANSITIONS,
  FulfillmentType,
  OrderStatus,
  type FulfillmentInput,
  type OrderDTO,
} from "@ember-grain/shared";
import { HttpError, NotFoundError, ValidationError } from "@/lib/api-handler";
import { verifyPayment } from "@/lib/payments/mockVerify";
import { applyDiscounts, listLiveDiscountRules } from "@/lib/data/discounts";

type PrismaOrder = Awaited<ReturnType<typeof getOrderById>>;

function toDTO(order: NonNullable<PrismaOrder>): OrderDTO {
  return {
    id: order.id,
    displayId: order.displayId,
    customerId: order.customerId,
    customerName: order.customer.name,
    cookId: order.cookId,
    driverId: order.driverId,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    items: order.items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.menuItem.name,
      quantity: item.quantity,
      priceAtTime: Number(item.priceAtTime),
    })),
    fulfillmentType: order.fulfillmentType,
    deliveryAddress: order.deliveryAddress,
    contactPhone: order.contactPhone,
    tableNumber: order.tableNumber,
    paymentMethod: order.paymentMethod,
    paymentVerified: order.paymentVerified,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

const ORDER_INCLUDE = {
  customer: true,
  items: { include: { menuItem: true } },
} as const;

async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: ORDER_INCLUDE,
  });
}

async function nextDisplayId(): Promise<string> {
  // PostgreSQL allocates sequence values atomically across all application
  // instances, so concurrent orders cannot calculate the same display ID.
  const rows = await prisma.$queryRaw<Array<{ value: bigint }>>(
    Prisma.sql`SELECT nextval('order_display_id_seq') AS value`,
  );
  const row = rows[0];
  if (!row) throw new Error("The order display ID sequence returned no value.");
  return `EG-${row.value.toString()}`;
}

export interface CreateOrderItemInput {
  menuItemId: string;
  quantity: number;
}

export async function createOrder(
  customerId: string,
  items: CreateOrderItemInput[],
  fulfillment: FulfillmentInput,
): Promise<OrderDTO> {
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: items.map((i) => i.menuItemId) } },
  });
  const byId = new Map(menuItems.map((m) => [m.id, m]));

  for (const line of items) {
    const menuItem = byId.get(line.menuItemId);
    if (!menuItem) {
      throw new ValidationError(`Menu item ${line.menuItemId} does not exist.`);
    }
    if (!menuItem.isAvailable) {
      throw new ValidationError(`${menuItem.name} is currently unavailable.`);
    }
  }

  // Re-derive the effective (post-discount) price server-side — never trust
  // a client-submitted price, and never let a discount that expired between
  // page load and checkout silently apply.
  const liveRules = await listLiveDiscountRules();
  const discountByItemId = applyDiscounts(
    menuItems.map((m) => ({ id: m.id, category: m.category, price: Number(m.price) })),
    liveRules,
  );
  const effectivePrice = (menuItemId: string): number => {
    const menuItem = byId.get(menuItemId)!;
    return discountByItemId.get(menuItemId)?.finalPrice ?? Number(menuItem.price);
  };
  const totalAmount = items.reduce(
    (sum, line) => sum + effectivePrice(line.menuItemId) * line.quantity,
    0,
  );

  // DINE_IN reserves a table, so payment must clear *before* the order is
  // ever persisted or reaches the kitchen queue — an unverified dine-in
  // order is rejected outright, never created in a pending state.
  let paymentMethod: "CARD" | "MOBILE_WALLET" | null = null;
  let paymentVerified = false;

  if (fulfillment.type === FulfillmentType.DINE_IN) {
    const result = verifyPayment(fulfillment.payment);
    if (!result.verified) {
      throw new ValidationError(
        result.reason ?? "Payment could not be verified for this dine-in order.",
      );
    }
    paymentMethod = fulfillment.payment.method;
    paymentVerified = true;
  }

  const displayId = await nextDisplayId();
  const created = await prisma.order.create({
    data: {
      displayId,
      customerId,
      status: OrderStatus.RECEIVED,
      totalAmount,
      fulfillmentType: fulfillment.type,
      deliveryAddress: fulfillment.type === FulfillmentType.DELIVERY ? fulfillment.deliveryAddress : null,
      contactPhone: fulfillment.type === FulfillmentType.DELIVERY ? fulfillment.contactPhone : null,
      tableNumber: fulfillment.type === FulfillmentType.DINE_IN ? fulfillment.tableNumber : null,
      paymentMethod,
      paymentVerified,
      items: {
        create: items.map((line) => {
          const menuItem = byId.get(line.menuItemId)!;
          return {
            menuItemId: menuItem.id,
            quantity: line.quantity,
            priceAtTime: effectivePrice(line.menuItemId),
          };
        }),
      },
    },
    include: ORDER_INCLUDE,
  });

  return toDTO(created);
}

export async function getOrderForCustomer(
  orderId: string,
  customerId: string,
): Promise<OrderDTO> {
  const order = await getOrderById(orderId);
  if (!order || order.customerId !== customerId) {
    throw new NotFoundError("Order not found.");
  }
  return toDTO(order);
}

/** Public tracking lookup — no ownership check, since the link itself is the access control. */
export async function getOrderForTracking(orderId: string): Promise<OrderDTO> {
  const order =
    (await getOrderById(orderId)) ??
    (await prisma.order.findUnique({
      where: { displayId: orderId },
      include: ORDER_INCLUDE,
    }));
  if (!order) throw new NotFoundError("Order not found.");
  return toDTO(order);
}

export async function listOrdersForCustomer(customerId: string): Promise<OrderDTO[]> {
  const orders = await prisma.order.findMany({
    where: { customerId },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return orders.map(toDTO);
}

export async function listKitchenQueue(): Promise<OrderDTO[]> {
  const orders = await prisma.order.findMany({
    where: { status: { in: [OrderStatus.RECEIVED, OrderStatus.PREPARING] } },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
  return orders.map(toDTO);
}

/** DELIVERY orders only — DINE_IN never needs a driver. */
export async function listDriverBoard(): Promise<OrderDTO[]> {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: [OrderStatus.PREPARED, OrderStatus.OUT_FOR_DELIVERY] },
      fulfillmentType: FulfillmentType.DELIVERY,
    },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
  return orders.map(toDTO);
}

export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
  actor: { id: string; role: "COOK" | "DRIVER" | "ADMIN" },
): Promise<OrderDTO> {
  const order = await getOrderById(orderId);
  if (!order) throw new NotFoundError("Order not found.");

  const allowed = ALLOWED_TRANSITIONS[order.status];
  if (!allowed.includes(nextStatus)) {
    throw new ValidationError(`Cannot move an order from ${order.status} to ${nextStatus}.`);
  }

  // Role guard: cooks drive RECEIVED->PREPARING->PREPARED, and may serve a
  // DINE_IN order straight to DELIVERED ("served") since there's no driver
  // handoff for dine-in. Drivers only claim PREPARED->OUT_FOR_DELIVERY->
  // DELIVERED, and only for DELIVERY orders. Admins can do either.
  const isDineInServe =
    nextStatus === OrderStatus.DELIVERED && order.fulfillmentType === FulfillmentType.DINE_IN;

  const cookMoves: OrderStatus[] = [OrderStatus.PREPARING, OrderStatus.PREPARED];
  const driverMoves: OrderStatus[] = [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED];

  if (actor.role === "COOK" && !cookMoves.includes(nextStatus) && !isDineInServe) {
    throw new HttpError(403, "FORBIDDEN", "Cooks cannot set that status.");
  }
  if (actor.role === "DRIVER") {
    if (order.fulfillmentType === FulfillmentType.DINE_IN) {
      throw new HttpError(403, "FORBIDDEN", "Dine-in orders don't need a driver.");
    }
    if (!driverMoves.includes(nextStatus)) {
      throw new HttpError(403, "FORBIDDEN", "Drivers cannot set that status.");
    }
  }

  const data: {
    status: OrderStatus;
    cookId?: string;
    driverId?: string;
  } = { status: nextStatus };

  if ((nextStatus === OrderStatus.PREPARING || isDineInServe) && actor.role !== "DRIVER") {
    data.cookId = actor.id;
  }
  if (nextStatus === OrderStatus.OUT_FOR_DELIVERY && actor.role !== "COOK") {
    data.driverId = actor.id;
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data,
    include: ORDER_INCLUDE,
  });

  return toDTO(updated);
}

export interface HistoricalOrderLine {
  itemId: string;
  name: string;
  timestamp: string;
  quantity: number;
}

export async function listHistoricalOrderLines(windowDays: number): Promise<HistoricalOrderLine[]> {
  const since = new Date();
  since.setDate(since.getDate() - windowDays);

  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: { createdAt: { gte: since }, status: { not: OrderStatus.CANCELLED } },
    },
    include: { order: true, menuItem: true },
  });

  return orderItems.map((line) => ({
    itemId: line.menuItemId,
    name: line.menuItem.name,
    timestamp: line.order.createdAt.toISOString(),
    quantity: line.quantity,
  }));
}

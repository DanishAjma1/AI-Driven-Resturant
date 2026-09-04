import type { CartItem, Order, OrderStatus } from "@/types";

const statuses: OrderStatus[] = [
  "Received",
  "In Kitchen",
  "Out for Delivery",
  "Completed",
];

const orders = new Map<string, Order>([
  [
    "EG-1048",
    {
      id: "EG-1048",
      customer: "Maya R.",
      items: [],
      total: 39,
      status: "Received",
      createdAt: new Date().toISOString(),
    },
  ],
  [
    "EG-1048",
    {
      id: "EG-1048",
      customer: "Maya R.",
      items: [],
      total: 39,
      status: "Received",
      createdAt: new Date().toISOString(),
    },
  ],
]);

export function listOrders() {
  return [...orders.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function getOrder(id: string) {
  return orders.get(id);
}

export function createOrder(items: CartItem[], customer = "Guest") {
  const id = `EG-${Math.floor(1000 + Math.random() * 9000)}`;
  const order: Order = {
    id,
    customer,
    items,
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    status: "Received",
    createdAt: new Date().toISOString(),
  };
  orders.set(id, order);
  return order;
}

export function advanceOrder(id: string) {
  const order = orders.get(id);
  if (!order) return undefined;
  const next =
    statuses[Math.min(statuses.indexOf(order.status) + 1, statuses.length - 1)];
  const updated = { ...order, status: next };
  orders.set(id, updated);
  return updated;
}

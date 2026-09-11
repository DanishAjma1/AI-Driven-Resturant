import { prisma } from "@ember-grain/db";
import { OrderStatus } from "@ember-grain/shared";

export type Timeframe = "daily" | "weekly" | "monthly";

export interface RevenuePoint {
  bucket: string;
  revenue: number;
  orders: number;
}

export interface TopItemPoint {
  name: string;
  category: string;
  unitsSold: number;
}

export interface DashboardKpis {
  averageOrderValue: number;
  activeKitchenOrders: number;
  averageDeliveryMinutes: number;
  totalRevenue: number;
  totalOrders: number;
}

function bucketRange(timeframe: Timeframe): { since: Date; bucketFn: (d: Date) => string; labels: string[] } {
  const now = new Date();

  if (timeframe === "daily") {
    const since = new Date(now);
    since.setHours(0, 0, 0, 0);
    const labels = Array.from({ length: 24 }, (_, h) => `${h.toString().padStart(2, "0")}:00`);
    return {
      since,
      bucketFn: (d) => `${d.getHours().toString().padStart(2, "0")}:00`,
      labels,
    };
  }

  if (timeframe === "weekly") {
    const since = new Date(now);
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return {
      since,
      bucketFn: (d) => dayNames[d.getDay()]!,
      labels: Array.from({ length: 7 }, (_, i) => {
        const d = new Date(since);
        d.setDate(d.getDate() + i);
        return dayNames[d.getDay()]!;
      }),
    };
  }

  // monthly -> last 30 days, bucketed by date
  const since = new Date(now);
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);
  const labels = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  return {
    since,
    bucketFn: (d) => `${d.getMonth() + 1}/${d.getDate()}`,
    labels,
  };
}

export async function getRevenueSeries(timeframe: Timeframe): Promise<RevenuePoint[]> {
  const { since, bucketFn, labels } = bucketRange(timeframe);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, status: { not: OrderStatus.CANCELLED } },
    select: { createdAt: true, totalAmount: true },
  });

  const byBucket = new Map<string, { revenue: number; orders: number }>();
  for (const label of labels) byBucket.set(label, { revenue: 0, orders: 0 });

  for (const order of orders) {
    const key = bucketFn(order.createdAt);
    const entry = byBucket.get(key);
    if (entry) {
      entry.revenue += Number(order.totalAmount);
      entry.orders += 1;
    }
  }

  return labels.map((label) => ({
    bucket: label,
    revenue: Number((byBucket.get(label)?.revenue ?? 0).toFixed(2)),
    orders: byBucket.get(label)?.orders ?? 0,
  }));
}

export async function getTopItems(timeframe: Timeframe, limit = 8): Promise<TopItemPoint[]> {
  const { since } = bucketRange(timeframe);

  const lines = await prisma.orderItem.findMany({
    where: {
      order: { createdAt: { gte: since }, status: { not: OrderStatus.CANCELLED } },
    },
    include: { menuItem: true },
  });

  const byItem = new Map<string, TopItemPoint>();
  for (const line of lines) {
    const existing = byItem.get(line.menuItemId);
    if (existing) {
      existing.unitsSold += line.quantity;
    } else {
      byItem.set(line.menuItemId, {
        name: line.menuItem.name,
        category: line.menuItem.category,
        unitsSold: line.quantity,
      });
    }
  }

  return Array.from(byItem.values())
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, limit);
}

export async function getDashboardKpis(timeframe: Timeframe): Promise<DashboardKpis> {
  const { since } = bucketRange(timeframe);

  const [orders, activeKitchenOrders, deliveredOrders] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { not: OrderStatus.CANCELLED } },
      select: { totalAmount: true },
    }),
    prisma.order.count({
      where: { status: { in: [OrderStatus.RECEIVED, OrderStatus.PREPARING] } },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: since },
        status: OrderStatus.DELIVERED,
      },
      select: { createdAt: true, updatedAt: true },
      take: 200,
    }),
  ]);

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const deliveryMinutes = deliveredOrders.map(
    (o) => (o.updatedAt.getTime() - o.createdAt.getTime()) / 60000,
  );
  const averageDeliveryMinutes =
    deliveryMinutes.length > 0
      ? deliveryMinutes.reduce((a, b) => a + b, 0) / deliveryMinutes.length
      : 0;

  return {
    averageOrderValue: Number(averageOrderValue.toFixed(2)),
    activeKitchenOrders,
    averageDeliveryMinutes: Number(averageDeliveryMinutes.toFixed(1)),
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalOrders,
  };
}

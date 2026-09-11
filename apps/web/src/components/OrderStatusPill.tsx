import type { OrderStatus } from "@ember-grain/shared";

const STATUS_LABEL: Record<OrderStatus, string> = {
  RECEIVED: "Received",
  PREPARING: "Preparing",
  PREPARED: "Prepared",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  RECEIVED: "var(--color-received)",
  PREPARING: "var(--color-preparing)",
  PREPARED: "var(--color-prepared)",
  OUT_FOR_DELIVERY: "var(--color-out)",
  DELIVERED: "var(--color-delivered)",
  CANCELLED: "var(--color-cancelled)",
};

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{
        borderColor: STATUS_COLOR[status],
        color: STATUS_COLOR[status],
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: STATUS_COLOR[status] }}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

export { STATUS_LABEL };

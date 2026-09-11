import { notFound } from "next/navigation";
import { getOrderForTracking } from "@/lib/data/orders";
import { OrderTracker } from "@/components/OrderTracker";

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  let order;
  try {
    order = await getOrderForTracking(orderId);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="mb-8 font-[family-name:var(--font-display)] text-3xl">
        Track your order
      </h1>
      <OrderTracker initialOrder={order} />
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowLeft, Check, Clock, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "@/types";

const statuses: OrderStatus[] = [
  "Received",
  "In Kitchen",
  "Out for Delivery",
  "Completed",
];

export default function OrderTracker({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [orderId, setOrderId] = useState("");
  useEffect(() => {
    params.then(({ id }) => setOrderId(id));
  }, [params]);
  useEffect(() => {
    if (!orderId) return;
    const load = () =>
      fetch(`/api/orders/${orderId}`)
        .then((response) => (response.ok ? response.json() : null))
        .then(setOrder);
    load();
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, [orderId]);
  if (!order)
    return (
      <main className="center-page">
        <p>Loading order…</p>
      </main>
    );
  const current = statuses.indexOf(order.status);
  return (
    <main className="center-page">
      <div className="tracker-card">
        <Link href="/" className="text-link">
          <ArrowLeft size={15} /> Back to Ember & Grain
        </Link>
        <div className="brand tracker-brand">
          <Flame color="#ff6b35" fill="#ff6b35" size={22} /> EMBER & GRAIN
        </div>
        <div className="eyebrow">ORDER {order.id}</div>
        <h1 className="serif">Fire is on the way.</h1>
        <p className="muted">We’ll keep this page updated automatically.</p>
        <div className="status-list">
          {statuses.map((status, index) => (
            <div
              className={`status-step ${index <= current ? "done" : ""}`}
              key={status}
            >
              <span>
                {index < current ? (
                  <Check size={15} />
                ) : index === current ? (
                  <Clock size={15} />
                ) : (
                  index + 1
                )}
              </span>
              <div>
                <b>{status}</b>
                {index === current && <p>Current status</p>}
              </div>
            </div>
          ))}
        </div>
        <div className="order-summary">
          <b>Order summary</b>
          {order.items.length ? (
            order.items.map((item) => (
              <div key={item.id}>
                <span>
                  {item.quantity} × {item.name}
                </span>
                <span>${item.price * item.quantity}</span>
              </div>
            ))
          ) : (
            <p className="muted">Kitchen demo order</p>
          )}
          <div className="cart-total">
            <span>Total</span>
            <b>${order.total}</b>
          </div>
        </div>
      </div>
    </main>
  );
}

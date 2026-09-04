"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ChefHat,
  ChevronRight,
  Clock,
  Package,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Order } from "@/types";

type Forecast = {
  itemName: string;
  recommendedPrepQty: number;
  riskLevel: string;
  reasoning: string;
};

export default function Admin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [forecast, setForecast] = useState<Forecast[]>([]);
  const loadOrders = () =>
    fetch("/api/orders")
      .then((response) => response.json())
      .then((data) => setOrders(data.orders || []));
  useEffect(() => {
    loadOrders();
    fetch("/api/ai/forecast")
      .then((response) => response.json())
      .then((data) => setForecast(data.forecast || []));
    const timer = setInterval(loadOrders, 3000);
    return () => clearInterval(timer);
  }, []);
  const advance = async (id: string) => {
    await fetch(`/api/orders/${id}`, { method: "PATCH" });
    loadOrders();
  };
  const stats = [
    { label: "Live orders", value: orders.length, Icon: Clock },
    {
      label: "Prep items",
      value:
        forecast.reduce((sum, item) => sum + item.recommendedPrepQty, 0) || 40,
      Icon: Package,
    },
    {
      label: "Today’s revenue",
      value: `$${orders.reduce((sum, order) => sum + order.total, 0)}`,
      Icon: TrendingUp,
    },
  ];
  return (
    <main>
      <header className="glass">
        <div className="shell nav-row">
          <div className="brand">
            <ChefHat color="#ff6b35" /> EMBER & GRAIN
          </div>
          <Link href="/" className="text-link">
            <ArrowLeft size={15} /> Customer view
          </Link>
        </div>
      </header>
      <div className="shell admin-page">
        <div className="eyebrow">KITCHEN CONSOLE · LIVE</div>
        <h1 className="serif page-title">Service at a glance.</h1>
        <div className="stats-grid">
          {stats.map(({ label, value, Icon }) => (
            <div className="card stat-card" key={label}>
              <span className="muted">
                {label}
                <Icon size={17} color="#ff6b35" />
              </span>
              <b>{value}</b>
              <small>Updates every 3 seconds</small>
            </div>
          ))}
        </div>
        <div className="admin-grid">
          <section className="card panel">
            <h2 className="serif">Incoming orders</h2>
            <p className="muted">
              Advance a status and the customer tracker updates automatically.
            </p>
            {orders.length ? (
              orders.map((order) => (
                <div className="order-row" key={order.id}>
                  <div>
                    <b>{order.id}</b>
                    <p>
                      {order.customer} ·{" "}
                      {order.items.map((item) => item.name).join(", ") ||
                        "Demo order"}
                    </p>
                  </div>
                  <button
                    className="outline"
                    disabled={order.status === "Completed"}
                    onClick={() => advance(order.id)}
                  >
                    {order.status}
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className="muted">No orders yet. Place one from the menu.</p>
            )}
          </section>
          <section className="card panel">
            <div className="ai-heading">
              <TrendingUp size={17} /> AI demand prep forecast
            </div>
            <p className="muted">
              Gemini analyzes historical order patterns for the next shift.
            </p>
            {forecast.map((item) => (
              <div className="forecast-row" key={item.itemName}>
                <div>
                  <b>{item.itemName}</b>
                  <p>{item.reasoning}</p>
                </div>
                <span className="tag">
                  {item.recommendedPrepQty} units · {item.riskLevel}
                </span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}

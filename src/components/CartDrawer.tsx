"use client";

import { useEffect, useState } from "react";
import { Check, Minus, Plus, Sparkles, X } from "lucide-react";
import { menuItems } from "@/data/menu";
import { useCart } from "@/components/CartProvider";
import type { Order } from "@/types";
import { toast } from "sonner";

export function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { cart, add, change, total, clear } = useCart();
  const [recommendations, setRecommendations] = useState<
    { itemId: string; name: string; reason: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order[] | null>(null);
  useEffect(() => {
    if (!open || !cart.length) return;
    setLoading(true);
    fetch("/api/ai/recommend", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cartItems: cart }),
    })
      .then((response) => response.json())
      .then((data) => setRecommendations(data.recommendations || []))
      .catch(() => setRecommendations([]))
      .finally(() => setLoading(false));
  }, [open, cart]);
  if (!open) return null;
  const placeOrder = async () => {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: cart }),
    });
    const data = await response.json();
    if (response.ok) {
      setOrder((prev) => [...(prev || []), data]);
      clear();
      toast.success(`Order ${data.id} placed successfully!`);
    }
  };
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="drawer">
        <button className="outline close-button" onClick={onClose}>
          <X size={18} />
        </button>
        {order &&
          (order.length === 1 ? (
            <div className="empty-state">
              <Check size={46} color="#79d69a" />
              <h2 className="serif">Order received.</h2>
              <p>
                Your order <b>{order[0].id}</b> is now being prepared.
              </p>
              <a className="orange button-link" href={`/order/${order[0].id}`}>
                Track live order
              </a>
            </div>
          ) : (
            <div className="empty-state">
              <Check size={46} color="#79d69a" />
              <h2 className="serif">Order received.</h2>
              <p>Your orders are now being prepared.</p>
              {order &&
                order.map((order) => (
                  <a
                    className="orange button-link"
                    href={`/order/${order.id}`}
                    key={order.id}
                  >
                    Track live order {order.id}
                  </a>
                ))}
            </div>
          ))}
        <>
          {!order?.length ? (
            <>
              <div className="eyebrow">YOUR ORDER</div>
              <h2 className="serif drawer-title">A table for one?</h2>
            </>
          ) : (
            !cart.length && (
              <h2 className="serif drawer-title">Want to add something?</h2>
            )
          )}
          {!cart.length ? (
            <p className="muted">
              Your cart is waiting for something fire-kissed.
            </p>
          ) : (
            <>
              <div className="cart-list">
                {cart.map((item) => (
                  <div className="cart-row" key={item.id}>
                    <div>
                      <b>{item.name}</b>
                      <div className="price">${item.price * item.quantity}</div>
                    </div>
                    <div className="quantity">
                      <button
                        className="outline"
                        onClick={() => change(item.id, -1)}
                      >
                        <Minus size={13} />
                      </button>
                      {item.quantity}
                      <button
                        className="outline"
                        onClick={() => change(item.id, 1)}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-total">
                <span>Total</span>
                <b>${total}</b>
              </div>
              <button className="orange full-button" onClick={placeOrder}>
                Place mock order · ${total} 
              </button>
              <section className="ai-panel">
                <div className="ai-heading">
                  <Sparkles size={16} /> AI pairings
                </div>
                {loading ? (
                  <p className="muted">Finding your best matches…</p>
                ) : (
                  recommendations.map((recommendation) => {
                    const item = menuItems.find(
                      (x) => x.id === recommendation.itemId,
                    );
                    return (
                      <div
                        className="recommendation"
                        key={recommendation.itemId}
                      >
                        <div>
                          <b>{recommendation.name}</b>
                          <p>{recommendation.reason}</p>
                        </div>
                        {item && (
                          <button className="outline" onClick={() => add(item)}>
                            Add
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </section>
            </>
          )}
        </>
      </aside>
    </>
  );
}

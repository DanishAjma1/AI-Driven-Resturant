"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Truck, UtensilsCrossed, ShieldCheck } from "lucide-react";
import type { FulfillmentInput, PaymentInput } from "@ember-grain/shared";
import { useCart, effectivePrice } from "@/components/CartProvider";
import { DishPrice } from "@/components/DishPrice";

const DEMO_OTP = "123456";

export default function CheckoutPage() {
  const { lines, subtotal, clear } = useCart();
  const [placing, setPlacing] = useState(false);
  const router = useRouter();

  const [fulfillmentType, setFulfillmentType] = useState<"DELIVERY" | "DINE_IN">("DELIVERY");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "MOBILE_WALLET">("CARD");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [walletNumber, setWalletNumber] = useState("");
  const [otp, setOtp] = useState("");

  function buildFulfillment(): FulfillmentInput | null {
    if (fulfillmentType === "DELIVERY") {
      if (!deliveryAddress.trim() || !contactPhone.trim()) {
        toast.error("Enter a delivery address and contact phone.");
        return null;
      }
      return { type: "DELIVERY", deliveryAddress, contactPhone };
    }

    const table = parseInt(tableNumber, 10);
    if (!table || table < 1) {
      toast.error("Enter a valid table number.");
      return null;
    }

    let payment: PaymentInput;
    if (paymentMethod === "CARD") {
      if (!cardNumber.trim() || !expiry.trim() || !cvv.trim()) {
        toast.error("Fill in your card details.");
        return null;
      }
      payment = { method: "CARD", cardNumber: cardNumber.replace(/\s+/g, ""), expiry, cvv };
    } else {
      if (!walletNumber.trim() || !otp.trim()) {
        toast.error("Fill in your wallet number and OTP.");
        return null;
      }
      payment = { method: "MOBILE_WALLET", walletNumber, otp };
    }

    return { type: "DINE_IN", tableNumber: table, payment };
  }

  async function handlePlaceOrder() {
    const fulfillment = buildFulfillment();
    if (!fulfillment) return;

    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ menuItemId: l.item.id, quantity: l.quantity })),
          fulfillment,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Couldn't place your order.");
      clear();
      toast.success("Order placed! Tracking it now…");
      router.push(`/tracking/${json.data.displayId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't place your order.");
    } finally {
      setPlacing(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center text-[var(--color-text-dim)]">
        <p>Your cart is empty — add something from the menu first.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-14">
      <h1 className="mb-8 font-[family-name:var(--font-display)] text-3xl">Checkout</h1>

      <ul className="mb-6 space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        {lines.map(({ item, quantity }) => (
          <li key={item.id} className="flex items-center justify-between text-sm">
            <span>
              {quantity} × {item.name}
            </span>
            <DishPrice
              item={{ ...item, price: effectivePrice(item) * quantity, discount: null }}
              className="text-sm"
            />
          </li>
        ))}
        <li className="flex justify-between border-t border-[var(--color-border)] pt-3 text-base font-medium">
          <span>Total</span>
          <span className="font-[family-name:var(--font-mono)]">${subtotal.toFixed(2)}</span>
        </li>
      </ul>

      {/* Fulfillment selector */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <button
          onClick={() => setFulfillmentType("DELIVERY")}
          className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm ${
            fulfillmentType === "DELIVERY"
              ? "border-[var(--color-ember)] bg-[var(--color-ember)]/10 text-[var(--color-ember)]"
              : "border-[var(--color-border)] text-[var(--color-text-dim)]"
          }`}
        >
          <Truck className="h-5 w-5" />
          Delivery
        </button>
        <button
          onClick={() => setFulfillmentType("DINE_IN")}
          className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm ${
            fulfillmentType === "DINE_IN"
              ? "border-[var(--color-ember)] bg-[var(--color-ember)]/10 text-[var(--color-ember)]"
              : "border-[var(--color-border)] text-[var(--color-text-dim)]"
          }`}
        >
          <UtensilsCrossed className="h-5 w-5" />
          Dine-in
        </button>
      </div>

      {fulfillmentType === "DELIVERY" ? (
        <div className="mb-6 space-y-3">
          <textarea
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Delivery address"
            rows={2}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-ember)]"
          />
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="Contact phone"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-ember)]"
          />
          <p className="text-xs text-[var(--color-text-faint)]">
            Delivery orders are paid on receipt — no payment needed now.
          </p>
        </div>
      ) : (
        <div className="mb-6 space-y-4">
          <input
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="Table number"
            inputMode="numeric"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-ember)]"
          />

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-[var(--color-text-faint)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Dine-in tables are held with upfront payment. This is a demo
              verification only — no real charge is made.
            </div>

            <div className="mb-3 flex gap-2">
              <button
                onClick={() => setPaymentMethod("CARD")}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium ${
                  paymentMethod === "CARD"
                    ? "bg-[var(--color-ember)] text-[var(--color-bg)]"
                    : "bg-[var(--color-surface-2)] text-[var(--color-text-dim)]"
                }`}
              >
                Card
              </button>
              <button
                onClick={() => setPaymentMethod("MOBILE_WALLET")}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium ${
                  paymentMethod === "MOBILE_WALLET"
                    ? "bg-[var(--color-ember)] text-[var(--color-bg)]"
                    : "bg-[var(--color-surface-2)] text-[var(--color-text-dim)]"
                }`}
              >
                Mobile wallet
              </button>
            </div>

            {paymentMethod === "CARD" ? (
              <div className="space-y-2">
                <input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="Card number"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ember)]"
                />
                <div className="flex gap-2">
                  <input
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-1/2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ember)]"
                  />
                  <input
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="CVV"
                    inputMode="numeric"
                    className="w-1/2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ember)]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  value={walletNumber}
                  onChange={(e) => setWalletNumber(e.target.value)}
                  placeholder="Wallet number (03XXXXXXXXX)"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ember)]"
                />
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder={`OTP (demo: ${DEMO_OTP})`}
                  inputMode="numeric"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ember)]"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handlePlaceOrder}
        disabled={placing}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-ember)] py-3 text-sm font-medium text-[var(--color-bg)] hover:bg-[var(--color-ember-dim)] disabled:opacity-60"
      >
        {placing && <Loader2 className="h-4 w-4 animate-spin" />}
        {fulfillmentType === "DINE_IN" ? "Pay & reserve table" : "Place order"}
      </button>
    </div>
  );
}

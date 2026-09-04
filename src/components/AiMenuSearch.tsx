"use client";

import { Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { menuItems } from "@/data/menu";
import { useCart } from "@/components/CartProvider";
import { toast } from "sonner";

export function AiMenuSearch() {
  const { add, count } = useCart();
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<
    { itemId: string; name: string; reason: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const search = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    if (count === 0) {
      toast.warning(
        "AI recommendations are based on an empty cart. Please clear your cart to get accurate recommendations.",
      );
      setLoading(false);
      return;
    }
    const response = await fetch("/api/ai/recommend", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cartItems: [], query: prompt }),
    });
    const data = await response.json();
    setResult(data.recommendations || []);
    setLoading(false);
  };
  return (
    <section className="ai-search">
      <div className="ai-heading">
        <Sparkles size={18} /> AI menu guide
      </div>
      <h2 className="serif">Tell us what you’re craving.</h2>
      <p className="muted">
        Try “a light halal dinner” or “something smoky and sweet”.
      </p>
      <div className="ai-input">
        <Search size={17} />
        <input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && search()}
          placeholder="Ask Ember's guide..."
        />
        <button className="orange" onClick={search}>
          {loading ? "Thinking…" : "Recommend"}
        </button>
      </div>
      {result.length > 0 && (
        <div className="ai-results">
          {result.map((item) => {
            const menuItem = menuItems.find(
              (candidate) => candidate.id === item.itemId,
            );
            return (
              <div className="recommendation" key={item.itemId}>
                <div>
                  <b>{item.name}</b>
                  <p>{item.reason}</p>
                </div>
                {menuItem && (
                  <button className="outline" onClick={() => add(menuItem)}>
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

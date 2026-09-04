"use client";

import Image from "next/image";
import { Plus, Search, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { toast } from "sonner";

const categories = ["All", "Starters", "Mains", "Desserts", "Drinks"];
const dietaryTags = ["Vegan", "Gluten-Free", "Halal"];

export function MenuCatalog({ cate }: { cate: string | null }) {
  const { add } = useCart();
  const [category, setCategory] = useState(cate || "All");
  const [search, setSearch] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  const loadMenuItems = () =>
    fetch("/api/items")
      .then((response) => response.json())
      .then((data) => setMenuItems(data.menuItems || []));
  useEffect(() => {
    loadMenuItems();
  }, []);

  const filtered = useMemo(
    () =>
      menuItems.filter(
        (item) =>
          (category === "All" ||
            item.category.toLowerCase() === category.toLowerCase()) &&
          (!tags.length ||
            tags.every((tag) => item.tags.includes(tag as never))) &&
          `${item.name} ${item.description}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [category, search, tags, menuItems],
  );
  return (
    <div>
      <div className="catalog-tools">
        <div className="search-box">
          <Search size={17} />
          <input
            aria-label="Search menu"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search dishes..."
          />
        </div>
        <div className="filter-row">
          {categories.map((item) => (
            <button
              className={`pill ${category.toLowerCase() === item.toLowerCase() ? "active" : ""}`}
              key={item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
          {dietaryTags.map((tag) => (
            <button
              className={`pill ${tags.includes(tag) ? "active" : ""}`}
              key={tag}
              onClick={() =>
                setTags((current) =>
                  current.includes(tag)
                    ? current.filter((x) => x !== tag)
                    : [...current, tag],
                )
              }
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      <div className="grid-menu">
        {filtered.map((item) => (
          <article className="card" key={item.id}>
            <div className="menu-image">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 50vw, 280px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="card-body">
              <div className="item-heading">
                <h3>{item.name}</h3>
                <b className="price">${item.price}</b>
              </div>
              <p>{item.description}</p>
              <div className="item-footer">
                <span className="rating">
                  <Star size={13} fill="currentColor" /> {item.rating}
                </span>
                <button
                  className="orange"
                  onClick={() => {
                    add(item);
                    toast.info(`${item.name} added to cart.`);
                  }}
                >
                  <Plus size={15} /> Add
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <p className="empty-state muted">No plates match those filters.</p>
      )}
    </div>
  );
}

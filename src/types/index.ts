export type DietaryTag =
  | "Vegan"
  | "Vegetarian"
  | "Gluten-Free"
  | "Halal"
  | "Nut-Free";
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  tags: DietaryTag[];
  rating: number;
  popular?: boolean;
}
export interface CartItem extends MenuItem {
  quantity: number;
  note?: string;
}
export type OrderStatus =
  | "Received"
  | "In Kitchen"
  | "Out for Delivery"
  | "Completed";
export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  customer: string;
}

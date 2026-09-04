import { MenuItem } from "@/types";
const img = (id: string) =>
  `https://images.unsplash.com/${id}?q=80&w=900&auto=format&fit=crop`;
export const menuItems: MenuItem[] = [
  {
    id: "short-rib",
    name: "Smoked Short Rib",
    description:
      "12-hour smoked beef, charred shallot jus, ember-roasted roots.",
    price: 28,
    category: "Mains",
    image: img("photo-1544025162-d76694265947"),
    tags: ["Gluten-Free", "Halal"],
    rating: 4.8,
    popular: true,
  },
  {
    id: "tiger-prawns",
    name: "Flame-Grilled Tiger Prawns",
    description:
      "Chili-lime prawns over charcoal with coconut-lemongrass reduction.",
    price: 24,
    category: "Mains",
    image: img("photo-1565557623262-b51c2513a641"),
    tags: ["Gluten-Free", "Halal"],
    rating: 4.7,
  },
  {
    id: "mushroom-risotto",
    name: "Ember Mushroom Risotto",
    description:
      "Wild mushrooms, smoked parmesan and a whisper of truffle oil.",
    price: 21,
    category: "Mains",
    image: img("photo-1476124369491-e7addf5db371"),
    tags: ["Vegetarian", "Gluten-Free", "Nut-Free"],
    rating: 4.6,
  },
  {
    id: "octopus",
    name: "Charred Octopus",
    description:
      "Slow-braised, flame-finished with paprika aioli and crisp chorizo.",
    price: 26,
    category: "Starters",
    image: img("photo-1599487488170-d11ec9c172f0"),
    tags: ["Gluten-Free", "Halal"],
    rating: 4.9,
    popular: true,
  },
  {
    id: "beet-tartare",
    name: "Crimson Beet Tartare",
    description:
      "Heirloom beets, smoked cashew cream and pickled mustard seed.",
    price: 16,
    category: "Starters",
    image: img("photo-1540189549336-e6e99c3679fe"),
    tags: ["Vegan", "Vegetarian", "Gluten-Free"],
    rating: 4.5,
  },
  {
    id: "elote",
    name: "Smoked Corn Elote",
    description: "Charred street corn, chili aioli, cotija and torched lime.",
    price: 11,
    category: "Starters",
    image: img("photo-1601050690597-df0568f70950"),
    tags: ["Vegetarian", "Gluten-Free"],
    rating: 4.5,
  },
  {
    id: "chocolate-torte",
    name: "Obsidian Chocolate Torte",
    description: "70% cocoa, smoked salt caramel and espresso crumble.",
    price: 13,
    category: "Desserts",
    image: img("photo-1606313564200-e75d5e30476c"),
    tags: ["Vegetarian"],
    rating: 4.9,
    popular: true,
  },
  {
    id: "pineapple",
    name: "Charred Pineapple Sundae",
    description:
      "Fire-caramelized pineapple, brown butter ice cream, toasted coconut.",
    price: 10,
    category: "Desserts",
    image: img("photo-1488900128323-21503983a07e"),
    tags: ["Vegetarian", "Gluten-Free"],
    rating: 4.6,
  },
  {
    id: "old-fashioned",
    name: "Flame Old Fashioned",
    description: "Smoked bourbon, charred orange and oak-aged bitters.",
    price: 15,
    category: "Drinks",
    image: img("photo-1470337458703-46ad1756a187"),
    tags: ["Vegan", "Vegetarian", "Gluten-Free", "Nut-Free"],
    rating: 4.7,
  },
];
export const historicalOrdersSeed = [
  {
    hour: 12,
    day: "Friday",
    weather: "warm",
    items: ["mushroom-risotto", "short-rib", "elote"],
  },
  {
    hour: 19,
    day: "Friday",
    weather: "clear",
    items: ["short-rib", "chocolate-torte", "old-fashioned"],
  },
  {
    hour: 20,
    day: "Saturday",
    weather: "rain",
    items: ["tiger-prawns", "octopus", "pineapple"],
  },
  {
    hour: 19,
    day: "Sunday",
    weather: "clear",
    items: ["mushroom-risotto", "chocolate-torte"],
  },
];

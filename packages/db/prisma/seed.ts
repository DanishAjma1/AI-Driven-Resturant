import {
  PrismaClient,
  OrderStatus,
  UserRole,
  FulfillmentType,
  PaymentMethod,
  DiscountType,
  DiscountScope,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { menuSeedItems } from "./menu-seed-data";

const prisma = new PrismaClient();

/** Deterministic PRNG so re-running the seed produces stable demo data. */
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)] as T;

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

async function main() {
  console.log("Seeding Ember & Grain database...");

  // ---------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------
  const passwordHash = await bcrypt.hash("1234", 10);

  const [admin, cook, driver, ...customers] = await Promise.all([
    upsertUser("admin@embergrain.dev", "Ada Reyes", UserRole.ADMIN, passwordHash),
    upsertUser("cook@embergrain.dev", "Kofi Mensah", UserRole.COOK, passwordHash),
    upsertUser("driver@embergrain.dev", "Priya Nair", UserRole.DRIVER, passwordHash),
    upsertUser("jordan@example.com", "Jordan Blake", UserRole.CUSTOMER, passwordHash),
    upsertUser("sam@example.com", "Sam Whitfield", UserRole.CUSTOMER, passwordHash),
    upsertUser("lena@example.com", "Lena Ortiz", UserRole.CUSTOMER, passwordHash),
  ]);

  // ---------------------------------------------------------------------
  // Menu
  // ---------------------------------------------------------------------
  const menuItems = await Promise.all(
    menuSeedItems.map((item) =>
      prisma.menuItem.upsert({
        where: { slug: item.slug },
        update: {
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          imageUrl: item.imageUrl,
          tags: item.tags,
          rating: item.rating,
          popular: item.popular ?? false,
          isAvailable: true,
          calories: item.calories,
          ingredients: item.ingredients,
        },
        create: {
          slug: item.slug,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          imageUrl: item.imageUrl,
          tags: item.tags,
          rating: item.rating,
          popular: item.popular ?? false,
          calories: item.calories,
          ingredients: item.ingredients,
        },
      }),
    ),
  );
  const bySlug = new Map(menuItems.map((m) => [m.slug, m]));
  const menuItemFor = (slug: string) => {
    const menuItem = bySlug.get(slug);
    if (!menuItem) throw new Error(`Missing seeded menu item: ${slug}`);
    return menuItem;
  };

  // ---------------------------------------------------------------------
  // Historical orders: 21 days back, with deliberate demand patterns so
  // the /api/ai/forecast endpoint has real signal to analyze:
  //   - short-rib & tiger-prawns spike Fri/Sat dinner (6-9pm)
  //   - mushroom-risotto & beet-tartare spike weekday lunch (12-2pm)
  //   - chocolate-torte & old-fashioned spike weekend evenings
  // ---------------------------------------------------------------------
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});

  const WINDOW_DAYS = 21;
  const now = new Date();
  let orderCounter = 1000;

  const deliveryAddresses = [
    "214 Maple Grove Ave, Portland, OR",
    "88 Birchwood Ct, Portland, OR",
    "1500 Hawthorne Blvd, Portland, OR",
  ];
  const contactPhones = ["555-201-4487", "555-664-2210", "555-330-9981"];

  const weekdayLunchItems = ["mushroom-risotto", "beet-tartare", "elote"];
  const weekendDinnerItems = ["short-rib", "tiger-prawns", "octopus"];
  const dessertDrinkItems = ["chocolate-torte", "old-fashioned", "pineapple-sundae"];

  for (let daysAgo = WINDOW_DAYS; daysAgo >= 0; daysAgo--) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    const dayOfWeek = date.getDay(); // 0 = Sun ... 6 = Sat
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Fri/Sat

    // Each day gets a lunch wave and a dinner wave, weekends busier.
    const ordersToday = isWeekend ? 10 + Math.floor(rand() * 6) : 5 + Math.floor(rand() * 4);

    for (let i = 0; i < ordersToday; i++) {
      const isDinner = rand() > 0.4;
      const hour = isDinner
        ? 18 + Math.floor(rand() * 3) // 18:00-20:59
        : 12 + Math.floor(rand() * 2); // 12:00-13:59
      const minute = Math.floor(rand() * 60);

      const createdAt = new Date(date);
      createdAt.setHours(hour, minute, 0, 0);

      const pool = isDinner && isWeekend
        ? [...weekendDinnerItems, ...dessertDrinkItems]
        : !isDinner
          ? weekdayLunchItems
          : [...weekendDinnerItems, ...weekdayLunchItems];

      const itemCount = 1 + Math.floor(rand() * 3);
      const chosenSlugs = new Set<string>();
      while (chosenSlugs.size < itemCount) {
        chosenSlugs.add(pick(pool));
      }

      const orderItemsData = Array.from(chosenSlugs).map((slug) => {
        const menuItem = menuItemFor(slug);
        const quantity = 1 + Math.floor(rand() * 2);
        return { menuItem, quantity };
      });

      const totalAmount = orderItemsData.reduce(
        (sum, { menuItem, quantity }) => sum + Number(menuItem.price) * quantity,
        0,
      );

      const customer = pick(customers);
      const isPast = daysAgo > 0;

      const isDineIn = rand() < 0.2;
      orderCounter += 1;
      await prisma.order.create({
        data: {
          displayId: `EG-${orderCounter}`,
          customerId: customer.id,
          cookId: isPast ? cook.id : null,
          driverId: isPast && !isDineIn ? driver.id : null,
          status: isPast ? OrderStatus.DELIVERED : OrderStatus.RECEIVED,
          totalAmount,
          createdAt,
          updatedAt: createdAt,
          fulfillmentType: isDineIn ? FulfillmentType.DINE_IN : FulfillmentType.DELIVERY,
          deliveryAddress: isDineIn ? null : pick(deliveryAddresses),
          contactPhone: isDineIn ? null : pick(contactPhones),
          tableNumber: isDineIn ? 1 + Math.floor(rand() * 20) : null,
          paymentMethod: isDineIn ? (rand() > 0.5 ? PaymentMethod.CARD : PaymentMethod.MOBILE_WALLET) : null,
          paymentVerified: isDineIn,
          items: {
            create: orderItemsData.map(({ menuItem, quantity }) => ({
              menuItemId: menuItem.id,
              quantity,
              priceAtTime: menuItem.price,
            })),
          },
        },
      });
    }
  }

  // ---------------------------------------------------------------------
  // A handful of "live" orders today in varying states, for the kitchen /
  // driver / tracking demos.
  // ---------------------------------------------------------------------
  const liveStates: Array<{
    status: OrderStatus;
    cookId: string | null;
    driverId: string | null;
  }> = [
    { status: OrderStatus.RECEIVED, cookId: null, driverId: null },
    { status: OrderStatus.PREPARING, cookId: cook.id, driverId: null },
    { status: OrderStatus.PREPARED, cookId: cook.id, driverId: null },
    { status: OrderStatus.OUT_FOR_DELIVERY, cookId: cook.id, driverId: driver.id },
  ];

  for (const state of liveStates) {
    const slugs = [pick(menuItems).slug, pick(menuItems).slug];
    const uniqueSlugs = Array.from(new Set(slugs));
    const orderItemsData = uniqueSlugs.map((slug) => ({
      menuItem: menuItemFor(slug),
      quantity: 1 + Math.floor(rand() * 2),
    }));
    const totalAmount = orderItemsData.reduce(
      (sum, { menuItem, quantity }) => sum + Number(menuItem.price) * quantity,
      0,
    );
    orderCounter += 1;
    await prisma.order.create({
      data: {
        displayId: `EG-${orderCounter}`,
        customerId: pick(customers).id,
        cookId: state.cookId,
        driverId: state.driverId,
        status: state.status,
        totalAmount,
        fulfillmentType: FulfillmentType.DELIVERY,
        deliveryAddress: pick(deliveryAddresses),
        contactPhone: pick(contactPhones),
        items: {
          create: orderItemsData.map(({ menuItem, quantity }) => ({
            menuItemId: menuItem.id,
            quantity,
            priceAtTime: menuItem.price,
          })),
        },
      },
    });
  }

  // One live DINE_IN order too, so /portal/kitchen shows the "mark served"
  // fast path (no driver hop) alongside the delivery flow above.
  {
    const slug = pick(menuItems).slug;
    const menuItem = menuItemFor(slug);
    const quantity = 1 + Math.floor(rand() * 2);
    orderCounter += 1;
    await prisma.order.create({
      data: {
        displayId: `EG-${orderCounter}`,
        customerId: pick(customers).id,
        cookId: cook.id,
        status: OrderStatus.PREPARING,
        totalAmount: Number(menuItem.price) * quantity,
        fulfillmentType: FulfillmentType.DINE_IN,
        tableNumber: 7,
        paymentMethod: PaymentMethod.CARD,
        paymentVerified: true,
        items: {
          create: [{ menuItemId: menuItem.id, quantity, priceAtTime: menuItem.price }],
        },
      },
    });
  }

  // Advance the atomic display-ID sequence past every EG-* number this
  // script just assigned directly, so the next real checkout in the app
  // (which allocates via `nextval('order_display_id_seq')`) can never
  // collide with a seeded order.
  await prisma.$executeRawUnsafe(
    `SELECT setval('order_display_id_seq', ${orderCounter}, true)`,
  );

  // ---------------------------------------------------------------------
  // Sample promotional discounts, exercising all three scopes.
  // ---------------------------------------------------------------------
  const shortRib = menuItemFor("short-rib");
  const now2 = new Date();
  const weekFromNow = new Date(now2.getTime() + 7 * 24 * 60 * 60 * 1000);

  await Promise.all([
    prisma.discountRule.upsert({
      where: { code: "HAPPYHOUR" },
      update: {},
      create: {
        code: "HAPPYHOUR",
        discountType: DiscountType.FIXED_AMOUNT,
        value: 3,
        scope: DiscountScope.CATEGORY,
        category: "Drinks",
        isActive: true,
        isScheduled: false,
      },
    }),
    prisma.discountRule.upsert({
      where: { code: "WEEKEND15" },
      update: {},
      create: {
        code: "WEEKEND15",
        discountType: DiscountType.PERCENTAGE,
        value: 15,
        scope: DiscountScope.GLOBAL,
        isActive: true,
        isScheduled: true,
        startDate: now2,
        endDate: weekFromNow,
      },
    }),
    prisma.discountRule.upsert({
      where: { code: "RIBSPECIAL" },
      update: {},
      create: {
        code: "RIBSPECIAL",
        discountType: DiscountType.FIXED_AMOUNT,
        value: 5,
        scope: DiscountScope.SELECTIVE_ITEMS,
        targetItemIds: [shortRib.id],
        isActive: true,
        isScheduled: false,
      },
    }),
  ]);

  console.log(`Seed complete. Day names touched: ${DAY_NAMES.join(", ")}`);
  console.log(`Users: admin=${admin.email}, cook=${cook.email}, driver=${driver.email}`);
  console.log("All demo accounts use password: password123");
}

async function upsertUser(
  email: string,
  name: string,
  role: UserRole,
  passwordHash: string,
) {
  return prisma.user.upsert({
    where: { email },
    update: { name, role },
    create: { email, name, role, passwordHash },
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

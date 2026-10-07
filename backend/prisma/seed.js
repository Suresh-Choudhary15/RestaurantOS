const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding RestaurantOS database...');

  // ── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@restaurantos.local' },
    update: {},
    create: {
      email: 'owner@restaurantos.local',
      passwordHash,
      firstName: 'Alex',
      lastName: 'Owner',
      role: 'OWNER',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@restaurantos.local' },
    update: {},
    create: {
      email: 'manager@restaurantos.local',
      passwordHash,
      firstName: 'Jordan',
      lastName: 'Manager',
      role: 'MANAGER',
    },
  });

  const chef = await prisma.user.upsert({
    where: { email: 'chef@restaurantos.local' },
    update: {},
    create: {
      email: 'chef@restaurantos.local',
      passwordHash,
      firstName: 'Sam',
      lastName: 'Chef',
      role: 'CHEF',
    },
  });

  const waiter = await prisma.user.upsert({
    where: { email: 'waiter@restaurantos.local' },
    update: {},
    create: {
      email: 'waiter@restaurantos.local',
      passwordHash,
      firstName: 'Riley',
      lastName: 'Waiter',
      role: 'WAITER',
    },
  });

  console.log('  ✔ Users created');

  // ── Tables ─────────────────────────────────────────────────────────────────
  for (let i = 1; i <= 5; i++) {
    await prisma.table.upsert({
      where: { number: i },
      update: {},
      create: {
        number: i,
        capacity: i <= 2 ? 2 : i <= 4 ? 4 : 6,
        status: 'AVAILABLE',
      },
    });
  }
  console.log('  ✔ Tables created');

  // ── Suppliers ──────────────────────────────────────────────────────────────
  const freshFarms = await prisma.supplier.create({
    data: {
      name: 'Fresh Farms Co.',
      contactPerson: 'Pat Green',
      email: 'orders@freshfarms.example',
      phone: '+1-555-0101',
      address: '123 Farm Road, Greenville',
    },
  });

  const oceanCatch = await prisma.supplier.create({
    data: {
      name: 'Ocean Catch Seafood',
      contactPerson: 'Morgan Sea',
      email: 'supply@oceancatch.example',
      phone: '+1-555-0202',
      address: '456 Harbor Ave, Portside',
    },
  });
  console.log('  ✔ Suppliers created');

  // ── Ingredients ────────────────────────────────────────────────────────────
  const ingredients = await Promise.all([
    prisma.ingredient.create({ data: { name: 'Chicken Breast', unit: 'kg', currentStock: 20, reorderLevel: 5, costPerUnit: 8.50, supplierId: freshFarms.id } }),
    prisma.ingredient.create({ data: { name: 'Salmon Fillet', unit: 'kg', currentStock: 10, reorderLevel: 3, costPerUnit: 18.00, supplierId: oceanCatch.id } }),
    prisma.ingredient.create({ data: { name: 'Romaine Lettuce', unit: 'head', currentStock: 30, reorderLevel: 10, costPerUnit: 1.50, supplierId: freshFarms.id } }),
    prisma.ingredient.create({ data: { name: 'Olive Oil', unit: 'liter', currentStock: 15, reorderLevel: 5, costPerUnit: 6.00 } }),
    prisma.ingredient.create({ data: { name: 'Pasta', unit: 'kg', currentStock: 25, reorderLevel: 8, costPerUnit: 2.00 } }),
    prisma.ingredient.create({ data: { name: 'Tomato Sauce', unit: 'liter', currentStock: 12, reorderLevel: 4, costPerUnit: 3.50 } }),
    prisma.ingredient.create({ data: { name: 'Chocolate', unit: 'kg', currentStock: 8, reorderLevel: 2, costPerUnit: 12.00 } }),
    prisma.ingredient.create({ data: { name: 'Heavy Cream', unit: 'liter', currentStock: 10, reorderLevel: 3, costPerUnit: 4.00 } }),
  ]);
  console.log('  ✔ Ingredients created');

  // ── Menu Categories & Items ────────────────────────────────────────────────
  const appetizers = await prisma.menuCategory.create({
    data: {
      name: 'Appetizers',
      description: 'Start your meal right',
      sortOrder: 1,
    },
  });

  const mainCourse = await prisma.menuCategory.create({
    data: {
      name: 'Main Course',
      description: 'Hearty entrees',
      sortOrder: 2,
    },
  });

  const desserts = await prisma.menuCategory.create({
    data: {
      name: 'Desserts',
      description: 'Sweet endings',
      sortOrder: 3,
    },
  });

  const beverages = await prisma.menuCategory.create({
    data: {
      name: 'Beverages',
      description: 'Drinks and refreshments',
      sortOrder: 4,
    },
  });

  // Appetizers
  await prisma.menuItem.createMany({
    data: [
      { name: 'Caesar Salad', description: 'Classic romaine with parmesan and croutons', price: 9.50, categoryId: appetizers.id, prepTime: 8 },
      { name: 'Bruschetta', description: 'Toasted bread with tomato and basil', price: 7.00, categoryId: appetizers.id, prepTime: 6 },
      { name: 'Soup of the Day', description: 'Ask your waiter for today\'s selection', price: 6.50, categoryId: appetizers.id, prepTime: 5 },
    ],
  });

  // Main Course
  await prisma.menuItem.createMany({
    data: [
      { name: 'Grilled Chicken', description: 'Herb-marinated chicken breast with roasted vegetables', price: 18.00, categoryId: mainCourse.id, prepTime: 20 },
      { name: 'Pan-Seared Salmon', description: 'Atlantic salmon with lemon butter sauce', price: 24.00, categoryId: mainCourse.id, prepTime: 18 },
      { name: 'Pasta Bolognese', description: 'Classic Italian meat sauce over penne', price: 15.00, categoryId: mainCourse.id, prepTime: 15 },
    ],
  });

  // Desserts
  await prisma.menuItem.createMany({
    data: [
      { name: 'Chocolate Lava Cake', description: 'Warm molten chocolate cake with vanilla ice cream', price: 10.00, categoryId: desserts.id, prepTime: 12 },
      { name: 'Tiramisu', description: 'Classic Italian coffee-flavored dessert', price: 8.50, categoryId: desserts.id, prepTime: 5 },
    ],
  });

  // Beverages
  await prisma.menuItem.createMany({
    data: [
      { name: 'Fresh Lemonade', description: 'House-made with real lemons', price: 4.00, categoryId: beverages.id, prepTime: 3 },
      { name: 'Espresso', description: 'Double shot Italian espresso', price: 3.50, categoryId: beverages.id, prepTime: 2 },
      { name: 'Sparkling Water', description: '500ml bottle', price: 2.50, categoryId: beverages.id, prepTime: 1 },
    ],
  });

  console.log('  ✔ Menu categories & items created');
  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

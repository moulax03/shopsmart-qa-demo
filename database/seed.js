const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./db');

async function seed() {
  const db = getDb();

  console.log('[seed] Starting database seed...');

  // Clear existing data
  db.exec(`
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM cart_items;
    DELETE FROM carts;
    DELETE FROM products;
    DELETE FROM users;
  `);

  // ── Users ──────────────────────────────────────────────────────────────────
  const passwordHash1 = bcrypt.hashSync('TestPass1!', 10);
  const passwordHash2 = bcrypt.hashSync('ShopTest2@', 10);
  const passwordHash3 = bcrypt.hashSync('Brownie3#', 10);

  const userId1 = 'user_001';
  const userId2 = 'user_002';
  const userId3 = 'user_003';

  const insertUser = db.prepare(`
    INSERT INTO users (id, firstName, lastName, email, password, phone, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(userId1, 'John', 'Doe', 'john.doe@testshop.com', passwordHash1, '+15125550101', new Date().toISOString());
  insertUser.run(userId2, 'Sara', 'Lee', 'sara.lee@testshop.com', passwordHash2, '+447911123456', new Date().toISOString());
  insertUser.run(userId3, 'Mike', 'Brown', 'mike.brown@testshop.com', passwordHash3, '+15125550303', new Date().toISOString());

  console.log('[seed] Users created: 3');

  // ── Products ───────────────────────────────────────────────────────────────
  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, description, category, price, stockCount, imageUrl, rating, reviewCount, sku)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    {
      id: 'prod_001',
      name: 'Wireless Noise-Cancelling Headphones',
      description: 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear audio. Perfect for work, travel, and everyday listening.',
      category: 'electronics',
      price: 89.99,
      stockCount: 24,
      imageUrl: 'https://placehold.co/400x300/e2e8f0/64748b?text=Headphones',
      rating: 4.5,
      reviewCount: 128,
      sku: 'ELEC-HDR-001'
    },
    {
      id: 'prod_002',
      name: 'Ergonomic Office Chair',
      description: 'Fully adjustable ergonomic chair with lumbar support, breathable mesh back, and armrests. Designed for long hours of comfortable sitting.',
      category: 'furniture',
      price: 249.00,
      stockCount: 8,
      imageUrl: 'https://placehold.co/400x300/e2e8f0/64748b?text=Office+Chair',
      rating: 4.3,
      reviewCount: 76,
      sku: 'FURN-CHR-002'
    },
    {
      id: 'prod_003',
      name: 'Stainless Steel Water Bottle 32oz',
      description: 'Double-wall insulated stainless steel water bottle. Keeps drinks cold for 24 hours and hot for 12 hours. BPA-free and leak-proof.',
      category: 'kitchen',
      price: 24.95,
      stockCount: 150,
      imageUrl: 'https://placehold.co/400x300/e2e8f0/64748b?text=Water+Bottle',
      rating: 4.7,
      reviewCount: 312,
      sku: 'KTCH-BTL-003'
    },
    {
      id: 'prod_004',
      name: 'Yoga Mat Non-Slip',
      description: 'Extra-thick non-slip yoga mat with alignment lines. Made from eco-friendly TPE material. Includes carrying strap. 72" x 24" x 6mm.',
      category: 'sports',
      price: 34.99,
      stockCount: 0,
      imageUrl: 'https://placehold.co/400x300/e2e8f0/64748b?text=Yoga+Mat',
      rating: 4.2,
      reviewCount: 89,
      sku: 'SPRT-YGA-004'
    },
    {
      id: 'prod_005',
      name: "Running Shoes Men's Size 10",
      description: "Lightweight men's running shoes with responsive cushioning and breathable mesh upper. Ideal for road running and daily training.",
      category: 'sports',
      price: 74.95,
      stockCount: 5,
      imageUrl: "https://placehold.co/400x300/e2e8f0/64748b?text=Running+Shoes",
      rating: 4.4,
      reviewCount: 203,
      sku: 'SPRT-SHO-005'
    },
    {
      // BUG-003: Negative price — intentional bug for QA training
      id: 'prod_006',
      name: 'Bluetooth Speaker Portable',
      description: 'Compact waterproof Bluetooth speaker with 360-degree sound, 12-hour battery, and built-in microphone. Perfect for outdoor adventures.',
      category: 'electronics',
      price: -5.00,
      stockCount: 30,
      imageUrl: 'https://placehold.co/400x300/e2e8f0/64748b?text=BT+Speaker',
      rating: 4.1,
      reviewCount: 57,
      sku: 'ELEC-SPK-006'
    },
    {
      id: 'prod_007',
      name: 'Standing Desk Converter',
      description: 'Adjustable standing desk converter that sits on your existing desk. 11 height settings, spacious work surface for monitor and keyboard.',
      category: 'furniture',
      price: 189.00,
      stockCount: 12,
      imageUrl: 'https://placehold.co/400x300/e2e8f0/64748b?text=Desk+Converter',
      rating: 4.0,
      reviewCount: 44,
      sku: 'FURN-DSK-007'
    },
    {
      id: 'prod_008',
      name: 'French Press Coffee Maker',
      description: 'Classic 34oz French press with double-wall stainless steel construction. Brews rich, full-bodied coffee in just 4 minutes. Dishwasher safe.',
      category: 'kitchen',
      price: 39.99,
      stockCount: 60,
      imageUrl: 'https://placehold.co/400x300/e2e8f0/64748b?text=French+Press',
      rating: 4.6,
      reviewCount: 188,
      sku: 'KTCH-CFE-008'
    },
    {
      id: 'prod_009',
      name: 'Resistance Bands Set',
      description: 'Set of 5 resistance bands with varying tension levels (10-50 lbs). Includes door anchor, ankle straps, and carrying bag. Great for home workouts.',
      category: 'sports',
      price: 19.99,
      stockCount: 100,
      imageUrl: 'https://placehold.co/400x300/e2e8f0/64748b?text=Resistance+Bands',
      rating: 4.3,
      reviewCount: 267,
      sku: 'SPRT-RBD-009'
    },
    {
      id: 'prod_010',
      name: 'USB-C Hub 7-in-1',
      description: '7-in-1 USB-C hub with 4K HDMI, 2x USB-A 3.0, USB-C PD charging, SD card reader, and Ethernet port. Compatible with all USB-C laptops.',
      category: 'electronics',
      price: 49.99,
      stockCount: 45,
      imageUrl: 'https://placehold.co/400x300/e2e8f0/64748b?text=USB-C+Hub',
      rating: 4.2,
      reviewCount: 95,
      sku: 'ELEC-HUB-010'
    },
    {
      id: 'prod_011',
      name: 'Throw Pillow Set of 2',
      description: 'Decorative throw pillow set with removable covers. Soft velvet fabric in neutral tones. 18" x 18" inserts included. Machine washable covers.',
      category: 'furniture',
      price: 29.99,
      stockCount: 35,
      imageUrl: 'https://placehold.co/400x300/e2e8f0/64748b?text=Throw+Pillows',
      rating: 4.5,
      reviewCount: 142,
      sku: 'FURN-PLW-011'
    },
    {
      id: 'prod_012',
      name: 'Cast Iron Skillet 10-inch',
      description: 'Pre-seasoned 10-inch cast iron skillet. Works on all stovetops including induction and open flame. Even heat distribution for perfect cooking.',
      category: 'kitchen',
      price: 44.99,
      stockCount: 28,
      imageUrl: 'https://placehold.co/400x300/e2e8f0/64748b?text=Cast+Iron+Skillet',
      rating: 4.8,
      reviewCount: 421,
      sku: 'KTCH-SKL-012'
    },
    {
      id: 'prod_013',
      name: 'Gym Gloves',
      description: 'Full-finger gym gloves with wrist support and anti-slip grip. Breathable neoprene material. Available in unisex sizing. Machine washable.',
      category: 'sports',
      price: 14.99,
      stockCount: 80,
      imageUrl: 'https://placehold.co/400x300/e2e8f0/64748b?text=Gym+Gloves',
      rating: 4.1,
      reviewCount: 63,
      sku: 'SPRT-GLV-013'
    },
    {
      id: 'prod_014',
      name: 'Mechanical Keyboard Wireless',
      description: 'Compact TKL wireless mechanical keyboard with blue switches. RGB backlight, 2.4GHz wireless and Bluetooth 5.0. 40-hour battery life.',
      category: 'electronics',
      price: 129.99,
      stockCount: 15,
      imageUrl: 'https://placehold.co/400x300/e2e8f0/64748b?text=Mech+Keyboard',
      rating: 4.6,
      reviewCount: 178,
      sku: 'ELEC-KBD-014'
    },
    {
      id: 'prod_015',
      name: 'Bookshelf 5-Tier',
      description: 'Modern 5-tier bookshelf with open shelves and metal frame. Holds up to 50 lbs per shelf. Easy assembly. 71" tall x 24" wide x 12" deep.',
      category: 'furniture',
      price: 159.00,
      stockCount: 6,
      imageUrl: 'https://placehold.co/400x300/e2e8f0/64748b?text=Bookshelf',
      rating: 4.0,
      reviewCount: 33,
      sku: 'FURN-BSH-015'
    },
    {
      id: 'prod_016',
      name: 'Air Fryer 4QT',
      description: '4-quart digital air fryer with 8 preset cooking modes. Uses 85% less oil than traditional frying. Non-stick basket, dishwasher safe. 1500W.',
      category: 'kitchen',
      price: 79.99,
      stockCount: 20,
      imageUrl: 'https://placehold.co/400x300/e2e8f0/64748b?text=Air+Fryer',
      rating: 4.5,
      reviewCount: 356,
      sku: 'KTCH-AFR-016'
    },
    {
      id: 'prod_017',
      name: 'Dumbbell Set 20lb',
      description: 'Adjustable dumbbell set ranging from 5 to 20 lbs per dumbbell. Quick-change weight system. Compact storage tray included. Cast iron with rubber coating.',
      category: 'sports',
      price: 54.99,
      stockCount: 0,
      imageUrl: 'https://placehold.co/400x300/e2e8f0/64748b?text=Dumbbells',
      rating: 4.4,
      reviewCount: 112,
      sku: 'SPRT-DMB-017'
    },
    {
      id: 'prod_018',
      name: 'Webcam 1080p HD',
      description: '1080p Full HD webcam with built-in stereo microphones and auto light correction. Plug-and-play USB. Compatible with Zoom, Teams, Skype, and more.',
      category: 'electronics',
      price: 59.99,
      stockCount: 33,
      imageUrl: 'https://placehold.co/400x300/e2e8f0/64748b?text=Webcam',
      rating: 4.2,
      reviewCount: 87,
      sku: 'ELEC-CAM-018'
    },
    {
      id: 'prod_019',
      name: 'Desk Lamp LED Adjustable',
      description: 'LED desk lamp with 5 color temperatures and 5 brightness levels. Flexible gooseneck arm, USB charging port built-in, and memory function.',
      category: 'furniture',
      price: 34.99,
      stockCount: 50,
      imageUrl: 'https://placehold.co/400x300/e2e8f0/64748b?text=Desk+Lamp',
      rating: 4.3,
      reviewCount: 199,
      sku: 'FURN-LMP-019'
    },
    {
      id: 'prod_020',
      name: 'Blender High-Speed',
      description: 'High-speed countertop blender with 1200W motor and 64oz BPA-free pitcher. Self-cleaning, 5-speed settings + pulse. Crushes ice and frozen fruit effortlessly.',
      category: 'kitchen',
      price: 69.99,
      stockCount: 18,
      imageUrl: 'https://placehold.co/400x300/e2e8f0/64748b?text=Blender',
      rating: 4.4,
      reviewCount: 241,
      sku: 'KTCH-BLD-020'
    }
  ];

  for (const p of products) {
    insertProduct.run(p.id, p.name, p.description, p.category, p.price, p.stockCount, p.imageUrl, p.rating, p.reviewCount, p.sku);
  }

  console.log('[seed] Products created: 20');

  // ── Sample Orders for john.doe@testshop.com ────────────────────────────────
  const now = new Date();

  const order1Id = 'order_001';
  const order1Date = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const order1Subtotal = 89.99 + (24.95 * 2); // prod_001 x1 + prod_003 x2
  const order1Shipping = 5.99;
  const order1Total = order1Subtotal + order1Shipping;
  const order1Address = JSON.stringify({ firstName: 'John', lastName: 'Doe', address1: '123 Main St', city: 'Austin', state: 'TX', zip: '78701', country: 'US' });

  db.prepare(`INSERT INTO orders (id, userId, status, subtotal, shipping, total, shippingAddress, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    order1Id, userId1, 'confirmed', order1Subtotal, order1Shipping, order1Total, order1Address, order1Date
  );
  db.prepare(`INSERT INTO order_items (id, orderId, productId, productName, quantity, unitPrice, lineTotal) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    uuidv4(), order1Id, 'prod_001', 'Wireless Noise-Cancelling Headphones', 1, 89.99, 89.99
  );
  db.prepare(`INSERT INTO order_items (id, orderId, productId, productName, quantity, unitPrice, lineTotal) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    uuidv4(), order1Id, 'prod_003', 'Stainless Steel Water Bottle 32oz', 2, 24.95, 49.90
  );

  const order2Id = 'order_002';
  const order2Date = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const order2Subtotal = 74.95; // prod_005 x1
  const order2Shipping = 5.99;
  const order2Total = order2Subtotal + order2Shipping;
  const order2Address = JSON.stringify({ firstName: 'John', lastName: 'Doe', address1: '123 Main St', city: 'Austin', state: 'TX', zip: '78701', country: 'US' });

  db.prepare(`INSERT INTO orders (id, userId, status, subtotal, shipping, total, shippingAddress, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    order2Id, userId1, 'shipped', order2Subtotal, order2Shipping, order2Total, order2Address, order2Date
  );
  db.prepare(`INSERT INTO order_items (id, orderId, productId, productName, quantity, unitPrice, lineTotal) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    uuidv4(), order2Id, 'prod_005', "Running Shoes Men's Size 10", 1, 74.95, 74.95
  );

  const order3Id = 'order_003';
  const order3Date = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const order3Subtotal = 39.99 + (19.99 * 2) + 14.99; // prod_008 x1, prod_009 x2, prod_013 x1
  const order3Shipping = 5.99;
  const order3Total = order3Subtotal + order3Shipping;
  const order3Address = JSON.stringify({ firstName: 'John', lastName: 'Doe', address1: '123 Main St', city: 'Austin', state: 'TX', zip: '78701', country: 'US' });

  db.prepare(`INSERT INTO orders (id, userId, status, subtotal, shipping, total, shippingAddress, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    order3Id, userId1, 'delivered', order3Subtotal, order3Shipping, order3Total, order3Address, order3Date
  );
  db.prepare(`INSERT INTO order_items (id, orderId, productId, productName, quantity, unitPrice, lineTotal) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    uuidv4(), order3Id, 'prod_008', 'French Press Coffee Maker', 1, 39.99, 39.99
  );
  db.prepare(`INSERT INTO order_items (id, orderId, productId, productName, quantity, unitPrice, lineTotal) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    uuidv4(), order3Id, 'prod_009', 'Resistance Bands Set', 2, 19.99, 39.98
  );
  db.prepare(`INSERT INTO order_items (id, orderId, productId, productName, quantity, unitPrice, lineTotal) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    uuidv4(), order3Id, 'prod_013', 'Gym Gloves', 1, 14.99, 14.99
  );

  console.log('[seed] Sample orders created: 3 (for john.doe@testshop.com)');
  console.log('[seed] Database seed complete!');
}

// Run directly
seed().catch(err => {
  console.error('[seed] Error:', err);
  process.exit(1);
});

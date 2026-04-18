const express = require('express');
const cors = require('cors');
const path = require('path');
const { isSeeded } = require('./database/db');

const app = express();
const PORT = 3001;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ─────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const orderRoutes = require('./routes/orders');
const profileRoutes = require('./routes/profile');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);

// ── SPA Fallback: serve 404.html for unknown routes ────────────────────────────
app.use((req, res) => {
  // Only redirect non-API requests to 404 page
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      status: 'error',
      code: 'NOT_FOUND',
      message: 'API endpoint not found.'
    });
  }
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ── Auto-seed if database is empty ────────────────────────────────────────────
async function autoSeedIfEmpty() {
  if (!isSeeded()) {
    console.log('[server] Database is empty — running auto-seed...');
    try {
      // Run seed inline (require it, which executes the seed function)
      const seed = require('./database/seed');
    } catch (err) {
      console.error('[server] Auto-seed failed:', err.message);
    }
  } else {
    console.log('[server] Database already seeded — skipping auto-seed.');
  }
}

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║   ShopSmart Dev Server                   ║`);
  console.log(`║   http://localhost:${PORT}                  ║`);
  console.log(`╚══════════════════════════════════════════╝\n`);

  await autoSeedIfEmpty();

  console.log('\n[server] Ready! Visit http://localhost:3001\n');
});

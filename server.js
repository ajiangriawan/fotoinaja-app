// server.js — FotoinAja Backend (Node.js + Express)
// Jalankan: npm install && node server.js

const express = require('express');
const cors = require('cors');
const midtransClient = require('midtrans-client');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// KONFIGURASI — Ganti dengan nilai asli Anda
// ============================================================
const CONFIG = {
  MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY, 
  MIDTRANS_CLIENT_KEY: process.env.MIDTRANS_CLIENT_KEY,
  // MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-JXRpAuUv6DPPtc_J6EI1j2K5',
  // MIDTRANS_CLIENT_KEY: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-dSgDuAoxFydvJJbNs',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  SECRET_TOKEN: process.env.SECRET_TOKEN || crypto.randomBytes(32).toString('hex'),
  ALLOWED_ORIGINS: ['https://fotoinaja.onrender.com', 'http://localhost:3000']
};

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors({ origin: CONFIG.ALLOWED_ORIGINS }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// ============================================================
// MIDTRANS SETUP
// ============================================================
const snap = new midtransClient.Snap({
  isProduction: CONFIG.IS_PRODUCTION,
  serverKey: CONFIG.MIDTRANS_SERVER_KEY,
  clientKey: CONFIG.MIDTRANS_CLIENT_KEY
});

const coreApi = new midtransClient.CoreApi({
  isProduction: CONFIG.IS_PRODUCTION,
  serverKey: CONFIG.MIDTRANS_SERVER_KEY
});

// ============================================================
// IN-MEMORY ORDER STORE (Gunakan Redis/DB di production)
// ============================================================
const pendingOrders = new Map(); // orderId -> { amount, email, status }
const usedTokens = new Set();   // one-time download tokens

// ============================================================
// API ROUTES
// ============================================================

// Generate Midtrans Snap Token
app.post('/api/payment/token', async (req, res) => {
  const { email, theme, layout, promoCode } = req.body;

  if (!email || !theme || !layout) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }

  // Validate and calculate price server-side (PENTING: jangan percaya frontend)
  // server.js (Bagian dalam route /api/payment/token)

  // Validate and calculate price server-side (PENTING: jangan percaya frontend)
  const prices = {
    single: 2000,
    polaroid: 3000,
    strip2: 4000,
    strip3: 5000,
    strip4: 6000,
    strip6: 8000,
    grid4: 6000,
    grid6: 8000,
    grid9: 10000,
    triptych: 7000,
    collage5: 9000
  };

  const promoCodes = {
    // 'SNAPGRATIS': { discount: 1.0, type: 'percent' },
    // 'DISKON50': { discount: 0.5, type: 'percent' },
    // 'DISKON20': { discount: 0.2, type: 'percent' },
    // 'HEMAT1K': { discount: 1000, type: 'fixed' }, // <--- Sesuaikan juga di sini
    // 'TEMAN10': { discount: 0.1, type: 'percent' },
    // 'SNAPLAUNCH': { discount: 0.3, type: 'percent' }
  };

  let basePrice = prices[layout] || 2000; // <--- Default jika error jadi 2000
  let discount = 0;

  if (promoCode && promoCodes[promoCode]) {
    const promo = promoCodes[promoCode];
    if (promo.type === 'percent') {
      discount = Math.floor(basePrice * promo.discount);
    } else {
      discount = Math.min(promo.discount, basePrice);
    }
  }

  const finalPrice = Math.max(0, basePrice - discount);

  // If free, issue token directly
  if (finalPrice === 0) {
    const downloadToken = generateSecureToken();
    pendingOrders.set('FREE-' + downloadToken, {
      amount: 0, email, status: 'paid', downloadToken
    });
    return res.json({ free: true, downloadToken });
  }

  const orderId = `SNAP-${Date.now()}-${Math.floor(Math.random() * 9999)}`;

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: finalPrice
    },
    customer_details: {
      email
    },
    item_details: [{
      id: `${theme}-${layout}`,
      price: finalPrice,
      quantity: 1,
      name: `FotoinAja - ${theme} ${layout}`
    }],
    credit_card: {
      secure: true
    },
    expiry: {
      duration: 1,
      unit: 'hours'
    }
  };

  try {
    const transaction = await snap.createTransaction(parameter);

    // Store pending order
    pendingOrders.set(orderId, {
      amount: finalPrice,
      email,
      status: 'pending',
      theme,
      layout,
      downloadToken: null
    });

    res.json({
      token: transaction.token,
      orderId,
      amount: finalPrice
    });

  } catch (error) {
    console.error('Midtrans error:', error);
    res.status(500).json({ error: 'Gagal membuat transaksi. Coba lagi.' });
  }
});

// Midtrans Payment Notification Webhook
app.post('/api/payment/notification', async (req, res) => {
  try {
    const notification = await snap.transaction.notification(req.body);
    const {
      order_id,
      transaction_status,
      fraud_status,
      signature_key,
      gross_amount
    } = notification;

    // Verify signature (WAJIB di production)
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${notification.status_code}${gross_amount}${CONFIG.MIDTRANS_SERVER_KEY}`)
      .digest('hex');

    if (signature_key !== expectedSignature) {
      console.error('Invalid signature for order:', order_id);
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const order = pendingOrders.get(order_id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    let isSuccess = false;

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') isSuccess = true;
    } else if (transaction_status === 'settlement') {
      isSuccess = true;
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      order.status = 'failed';
      pendingOrders.set(order_id, order);
    }

    if (isSuccess) {
      const downloadToken = generateSecureToken();
      order.status = 'paid';
      order.downloadToken = downloadToken;
      pendingOrders.set(order_id, order);

      // In production: send email with download token
      // sendDownloadEmail(order.email, downloadToken);

      console.log(`✅ Payment success: ${order_id} | Token: ${downloadToken}`);
    }

    res.json({ status: 'OK' });

  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify payment and get download token
app.post('/api/payment/verify', async (req, res) => {
  const { orderId } = req.body;

  const order = pendingOrders.get(orderId);
  if (!order) {
    return res.status(404).json({ paid: false, error: 'Order tidak ditemukan' });
  }

  if (order.status === 'paid' && order.downloadToken) {
    // Token valid 30 menit
    const token = order.downloadToken;
    setTimeout(() => {
      usedTokens.add(token);
    }, 30 * 60 * 1000);

    return res.json({ paid: true, downloadToken: token });
  }

  return res.json({ paid: false, status: order.status });
});

// Validate download token (called by frontend before rendering HD)
app.post('/api/download/validate', (req, res) => {
  const { token } = req.body;

  if (!token || token.length !== 64) {
    return res.status(403).json({ valid: false });
  }

  if (usedTokens.has(token)) {
    return res.status(403).json({ valid: false, error: 'Token sudah digunakan' });
  }

  // Check if token exists in any paid order
  let found = false;
  for (const [, order] of pendingOrders) {
    if (order.downloadToken === token && order.status === 'paid') {
      found = true;
      break;
    }
  }

  if (!found) {
    return res.status(403).json({ valid: false });
  }

  // Mark as used (one-time)
  usedTokens.add(token);

  res.json({ valid: true });
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'FotoinAja API',
    version: '1.0.0',
    environment: CONFIG.IS_PRODUCTION ? 'production' : 'sandbox',
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// HELPERS
// ============================================================
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`\n📸 FotoinAja Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${CONFIG.IS_PRODUCTION ? 'PRODUCTION' : 'SANDBOX'}`);
  console.log(`🔗 http://localhost:${PORT}\n`);
});

module.exports = app;

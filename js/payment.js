// payment.js — Midtrans Payment Integration

// ============================================================
// KONFIGURASI MIDTRANS
// Ganti dengan kredensial asli Anda dari dashboard Midtrans
// ============================================================
const MIDTRANS_CONFIG = {
  clientKey: "Mid-client-Zynxgxkq4ntIWD8g", // Ganti dengan Client Key Anda
  serverUrl: "/api/payment/token", // URL backend Anda untuk generate token
  isProduction: true, // true = production, false = sandbox
};

// Format rupiah
function formatRupiah(amount) {
  return "Rp " + amount.toLocaleString("id-ID");
}

// Calculate price based on layout
function calculatePrice(layout, promoCode) {
  const layoutData = LAYOUTS[layout];
  let base = layoutData.price;
  let discount = 0;
  let discountLabel = "";

  if (promoCode && PROMO_CODES[promoCode]) {
    const promo = PROMO_CODES[promoCode];
    if (promo.type === "percent") {
      discount = Math.floor(base * promo.discount);
    } else {
      discount = Math.min(promo.discount, base);
    }
    discountLabel = promo.label;
  }

  const final = Math.max(0, base - discount);
  return { base, discount, final, discountLabel };
}

function applyPromo() {
  const input = document.getElementById("promoInput");
  const msgEl = document.getElementById("promoMessage");
  const code = input ? input.value.trim().toUpperCase() : "";

  if (!code) {
    showPromoMessage("Masukkan kode promo terlebih dahulu.", "error");
    return;
  }

  if (PROMO_CODES[code]) {
    AppState.promoCode = code;
    const promo = PROMO_CODES[code];
    showPromoMessage(
      "✅ " + promo.label + " Kode berhasil diterapkan!",
      "success",
    );
    updateOrderSummary();
  } else {
    AppState.promoCode = null;
    showPromoMessage(
      "❌ Kode promo tidak valid atau sudah kadaluarsa.",
      "error",
    );
    updateOrderSummary();
  }
}

function showPromoMessage(msg, type) {
  const el = document.getElementById("promoMessage");
  if (el) {
    el.textContent = msg;
    el.className = "promo-message " + type;
  }
}

function updateOrderSummary() {
  const pricing = calculatePrice(AppState.currentLayout, AppState.promoCode);
  const theme = THEMES[AppState.currentTheme];
  const layout = LAYOUTS[AppState.currentLayout];

  AppState.basePrice = pricing.base;
  AppState.finalPrice = pricing.final;

  const themeNameEl = document.getElementById("orderThemeName");
  const layoutNameEl = document.getElementById("orderLayoutName");
  const basePriceEl = document.getElementById("orderBasePrice");
  const discountRow = document.getElementById("discountRow");
  const discountEl = document.getElementById("discountAmount");
  const totalEl = document.getElementById("orderTotal");

  if (themeNameEl) themeNameEl.textContent = theme ? theme.name : "-";
  if (layoutNameEl) layoutNameEl.textContent = layout ? layout.name : "-";
  if (basePriceEl) basePriceEl.textContent = formatRupiah(pricing.base);

  if (pricing.discount > 0 && discountRow) {
    discountRow.style.display = "flex";
    if (discountEl)
      discountEl.textContent = "- " + formatRupiah(pricing.discount);
  } else if (discountRow) {
    discountRow.style.display = "none";
  }

  if (totalEl) {
    totalEl.innerHTML = "<strong>" + formatRupiah(pricing.final) + "</strong>";
  }
}

// Generate order ID
function generateOrderId() {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 10000);
  return `SNAP-${ts}-${rand}`;
}

// Generate a secure one-time token (in production, this comes from your backend)
function generateSecureToken() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
/*
async function initPayment() {
  const email = document.getElementById('customerEmail')?.value;
  const payBtn = document.getElementById('payBtn');

  if (!email || !email.includes('@')) {
    alert('Masukkan email yang valid terlebih dahulu! 📧');
    return;
  }

  if (AppState.uploadedImages.length === 0) {
    alert('Kamu belum upload foto! 📷');
    return;
  }

  // If free (100% promo), skip payment
  if (AppState.finalPrice <= 0) {
    handleFreeDownload();
    return;
  }

  payBtn.disabled = true;
  payBtn.textContent = '⏳ Memproses...';

  try {
    // In production: call your backend to get Midtrans snap token
    // const response = await fetch(MIDTRANS_CONFIG.serverUrl, { ... });
    // const { token } = await response.json();

    // DEMO MODE: Simulate payment flow
    await simulateMidtransPayment(email);

  } catch (err) {
    console.error('Payment error:', err);
    payBtn.disabled = false;
    payBtn.textContent = '💳 Bayar via Midtrans';
    alert('Terjadi kesalahan. Coba lagi ya! 🙏');
  }
}
*/

async function initPayment() {
  const email = document.getElementById("customerEmail")?.value;
  const payBtn = document.getElementById("payBtn");

  if (!email || !email.includes("@")) {
    alert("Masukkan email yang valid terlebih dahulu! 📧");
    return;
  }

  if (AppState.finalPrice <= 0) {
    handleFreeDownload();
    return;
  }

  payBtn.disabled = true;
  payBtn.textContent = "⏳ Membuka Pembayaran...";

  try {
    const response = await fetch("/api/payment/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        theme: AppState.currentTheme,
        layout: AppState.currentLayout,
        promoCode: AppState.promoCode,
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    if (data.free) {
      handleFreeDownload();
      return;
    }

    initMidtransSnap(data.token);
  } catch (err) {
    console.error("Payment error:", err);
    payBtn.disabled = false;
    payBtn.textContent = "💳 Bayar via Midtrans";
    alert("Gagal memuat pembayaran: " + err.message);
  }
}

// DEMO: Simulate Midtrans payment
async function simulateMidtransPayment(email) {
  const payBtn = document.getElementById("payBtn");

  // In real production, use:
  // window.snap.pay(snapToken, { onSuccess, onError, onClose });

  // Demo simulation
  const confirmed = confirm(
    `[MODE DEMO]\n\nTotal: ${formatRupiah(AppState.finalPrice)}\n\n` +
      `Email: ${email}\n\nDalam produksi asli, ini akan membuka Midtrans Snap untuk pembayaran GoPay/OVO/Dana/kartu kredit dll.\n\n` +
      `Klik OK untuk simulasi pembayaran berhasil.`,
  );

  if (confirmed) {
    await onPaymentSuccess({
      order_id: generateOrderId(),
      status_code: "200",
      gross_amount: AppState.finalPrice.toString(),
    });
  } else {
    payBtn.disabled = false;
    payBtn.textContent = "💳 Bayar via Midtrans";
  }
}

// Real Midtrans integration (untuk production)
function initMidtransSnap(snapToken) {
  window.snap.pay(snapToken, {
    onSuccess: async (result) => {
      AppState.paymentToken = "SECURE_TOKEN_" + Date.now(); // Simulasi token
      await goToStep(5);
      startDownloadProcess();
    },
    onPending: (result) => alert("Pembayaran pending!"),
    onError: (result) => {
      document.getElementById("payBtn").disabled = false;
      alert("Pembayaran gagal!");
    },
    onClose: () => {
      document.getElementById("payBtn").disabled = false;
    },
  });
}

async function handleFreeDownload() {
  AppState.paymentToken = "FREE_TOKEN_" + Date.now();
  await goToStep(5);
  startDownloadProcess();
}

function startDownloadProcess() {
  const progressBar = document.getElementById("progressBar");
  const statusEl = document.getElementById("downloadStatus");
  const downloadBtn = document.getElementById("downloadBtn");

  const steps = [
    { pct: 30, msg: "Mempersiapkan foto...", delay: 500 },
    { pct: 70, msg: "Menerapkan stiker & filter HD...", delay: 1500 },
    { pct: 100, msg: "✅ Selesai! Foto siap didownload!", delay: 2500 },
  ];

  steps.forEach((step) => {
    setTimeout(() => {
      if (progressBar) progressBar.style.width = step.pct + "%";
      if (statusEl) statusEl.textContent = step.msg;
    }, step.delay);
  });

  setTimeout(() => {
    if (downloadBtn) {
      downloadBtn.style.display = "inline-flex";
      downloadFinal(); // Auto-trigger
    }
  }, 2800);
}

async function onPaymentSuccess(result) {
  console.log("Payment success:", result);

  // Generate one-time secure token
  AppState.paymentToken = generateSecureToken();
  AppState.orderId = result.order_id;

  // Go to success step
  await goToStep(5);
  startDownloadProcess();
}

function downloadFinal() {
  if (!AppState.paymentToken) return;

  const downloadBtn = document.getElementById("downloadBtn");
  const originalText = downloadBtn.innerHTML;

  // UX: Cegah double click & beri info loading
  downloadBtn.disabled = true;
  downloadBtn.innerHTML = "⏳ Merender HD...";

  setTimeout(() => {
    try {
      const hdCanvas = generateHDCanvas();
      hdCanvas.toBlob(
        (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `FotoinAja-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          downloadBtn.innerHTML = "✅ Berhasil!";
          setTimeout(() => {
            URL.revokeObjectURL(url);
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = originalText;
          }, 3000);
        },
        "image/png",
        1.0,
      );
    } catch (err) {
      alert("Gagal mendownload, coba lagi!");
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = originalText;
    }
  }, 100);
}

// ============================================================
// BACKEND TEMPLATE (Node.js / Express)
// Salin kode ini ke backend server Anda
// ============================================================
/*
// backend/payment.js

const midtransClient = require('midtrans-client');

const snap = new midtransClient.Snap({
  isProduction: false, // true untuk production
  serverKey: 'YOUR_SERVER_KEY',
  clientKey: 'YOUR_CLIENT_KEY'
});

app.post('/api/payment/token', async (req, res) => {
  const { orderId, amount, email, theme, layout } = req.body;

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount
    },
    customer_details: {
      email: email
    },
    item_details: [{
      id: `${theme}-${layout}`,
      price: amount,
      quantity: 1,
      name: `FotoinAja - ${theme} ${layout}`
    }],
    expiry: {
      duration: 1,
      unit: 'hours'
    }
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    res.json({ token: transaction.token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook untuk notifikasi pembayaran
app.post('/api/payment/notification', async (req, res) => {
  const notification = await snap.transaction.notification(req.body);
  const { order_id, transaction_status, fraud_status } = notification;

  if (transaction_status === 'capture' || transaction_status === 'settlement') {
    if (fraud_status === 'accept') {
      // Tandai order sebagai lunas
      // Kirim email konfirmasi
      console.log('Payment success for order:', order_id);
    }
  }

  res.json({ status: 'OK' });
});
*/

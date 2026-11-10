// ========================================
// MINI POS - KASIR DIGITAL SMK NEGERI 9
// ========================================

// FORMAT RUPIAH
function rupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(number);
}

// GAMBAR PRODUK
const defaultProducts = [
  {
    id: 1,
    name: "Nasi Goreng",
    price: 15000,
    stock: 15,
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500"
  },
  {
    id: 2,
    name: "Mie Goreng",
    price: 12000,
    stock: 12,
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500"
  },
  {
    id: 3,
    name: "Burger",
    price: 18000,
    stock: 10,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500"
  },
  {
    id: 4,
    name: "Kentang Goreng",
    price: 10000,
    stock: 20,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500"
  },
  {
    id: 5,
    name: "Pizza",
    price: 25000,
    stock: 8,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500"
  },
  {
    id: 6,
    name: "Es Kopi",
    price: 8000,
    stock: 25,
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500"
  },
  {
    id: 7,
    name: "Jus Jeruk",
    price: 10000,
    stock: 18,
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500"
  },
  {
    id: 8,
    name: "Donat",
    price: 7000,
    stock: 14,
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500"
  },
  {
    id: 9,
    name: "Sandwich",
    price: 13000,
    stock: 9,
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500"
  },
  {
    id: 10,
    name: "Teh Es",
    price: 5000,
    stock: 30,
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500"
  }
];

// DATABASE LOCAL STORAGE
function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.error("Gagal membaca data:", error);
    return fallback;
  }
}

let products = loadData("miniPOS_products", defaultProducts);
let transactions = loadData("miniPOS_transactions", []);
let cart = [];
let paymentMethod = "Tunai";
let lastReceipt = null;

// SIMPAN DATA
function saveData() {
  localStorage.setItem("miniPOS_products", JSON.stringify(products));
  localStorage.setItem("miniPOS_transactions", JSON.stringify(transactions));
}

// CEK GAMBAR
function safeImage(url) {
  return url || "https://placehold.co/500x350/f0eafa/8976ba?text=Produk";
}

// ========================================
// TAMPILKAN PRODUK
// ========================================

function renderProducts() {
  const list = document.getElementById("productList");
  const search = document.getElementById("searchProduct").value.toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search)
  );

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="col-12 text-center text-secondary p-5">
        Produk tidak ditemukan.
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(product => {

    let badgeClass = "stock-safe";
    let badgeText = "Stok Aman";

    if (product.stock === 0) {
      badgeClass = "stock-empty";
      badgeText = "Stok Habis";
    } else if (product.stock < 5) {
      badgeClass = "stock-low";
      badgeText = "Stok Menipis";
    }

    return `
      <div class="col-6 col-md-4">
        <div class="card product-card">

          <img
            src="${safeImage(product.image)}"
            class="product-img"
            alt="${escapeHTML(product.name)}"
            onerror="this.src='https://placehold.co/500x350/f0eafa/8976ba?text=Produk'">

          <div class="card-body">

            <div class="d-flex justify-content-between mb-2">
              <span class="stock-badge ${badgeClass}">
                ${badgeText}
              </span>
              <small class="text-secondary">
                ${product.stock} pcs
              </small>
            </div>

            <div class="product-name">
              ${escapeHTML(product.name)}
            </div>

            <div class="price mb-3">
              ${rupiah(product.price)}
            </div>

            <button
              class="btn btn-buy w-100 py-2"
              onclick="addToCart(${product.id})"
              ${product.stock <= 0 ? "disabled" : ""}>
              ${product.stock <= 0 ? "Stok Habis" : "+ Beli"}
            </button>

          </div>
        </div>
      </div>
    `;
  }).join("");
}

// MENCEGAH HTML INJECTION
function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

// ========================================
// TAMBAH PRODUK KE KERANJANG
// ========================================

function addToCart(id) {
  const product = products.find(p => p.id === id);

  if (!product || product.stock <= 0) {
    alert("Stok produk habis!");
    return;
  }

  const existing = cart.find(item => item.id === id);

  if (existing) {
    if (existing.qty >= product.stock) {
      alert("Jumlah pembelian melebihi stok!");
      return;
    }

    existing.qty++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: 1
    });
  }

  renderCart();
}

// ========================================
// KERANJANG BELANJA
// ========================================

function renderCart() {
  const list = document.getElementById("cartList");

  if (cart.length === 0) {
    list.innerHTML = `
      <div class="empty-cart">
        🛍️<br>Keranjang masih kosong
      </div>`;
  } else {
    list.innerHTML = cart.map(item => `
      <div class="cart-item">

        <img src="${safeImage(item.image)}"
          alt="${escapeHTML(item.name)}"
          onerror="this.src='https://placehold.co/100x100/f0eafa/8976ba?text=Produk'">

        <div class="flex-grow-1">
          <div class="cart-name">
            ${escapeHTML(item.name)}
          </div>
          <div class="cart-price">
            ${rupiah(item.price)}
          </div>

          <div class="d-flex align-items-center gap-2 mt-2">

            <button class="qty-btn"
              onclick="changeQty(${item.id}, -1)">−</button>

            <span class="qty-number">${item.qty}</span>

            <button class="qty-btn"
              onclick="changeQty(${item.id}, 1)">+</button>

          </div>
        </div>

        <div class="text-end">
          <div class="cart-name mb-2">
            ${rupiah(item.price * item.qty)}
          </div>

          <button class="remove-btn"
            onclick="removeItem(${item.id})">
            🗑
          </button>
        </div>

      </div>
    `).join("");
  }

  updateTotal();
}

// HITUNG TOTAL
function getTotal() {
  return cart.reduce(
    (total, item) => total + item.price * item.qty,
    0
  );
}

// JUMLAH BARANG
function getCount() {
  return cart.reduce(
    (total, item) => total + item.qty,
    0
  );
}

// UBAH JUMLAH BARANG
function changeQty(id, change) {
  const item = cart.find(p => p.id === id);
  const product = products.find(p => p.id === id);

  if (!item || !product) return;

  const newQty = item.qty + change;

  if (newQty <= 0) {
    removeItem(id);
    return;
  }

  if (newQty > product.stock) {
    alert("Stok tidak mencukupi!");
    return;
  }

  item.qty = newQty;
  renderCart();
}

// HAPUS BARANG
function removeItem(id) {
  cart = cart.filter(item => item.id !== id);
  renderCart();
}

// UPDATE TOTAL BELANJA
function updateTotal() {
  const total = getTotal();

  document.getElementById("cartTotal").textContent = rupiah(total);
  document.getElementById("cartCount").textContent = getCount();

  calculateChange();
  updateCheckoutButton();
}

// ========================================
// METODE PEMBAYARAN
// ========================================

function selectPayment(method) {
  paymentMethod = method;

  document.querySelectorAll(".payment-option")
    .forEach(el => el.classList.remove("active"));

  const labels = {
    "Tunai": "labelTunai",
    "QRIS": "labelQRIS",
    "Transfer Bank": "labelTransfer"
  };

  document.getElementById(labels[method]).classList.add("active");

  document.getElementById("cashArea").style.display =
    method === "Tunai" ? "block" : "none";

  document.getElementById("qrisArea").style.display =
    method === "QRIS" ? "block" : "none";

  document.getElementById("transferArea").style.display =
    method === "Transfer Bank" ? "block" : "none";

  calculateChange();
  updateCheckoutButton();
}

// HITUNG KEMBALIAN
function calculateChange() {
  const total = getTotal();
  const cash = Number(document.getElementById("cashInput").value) || 0;

  const change = cash - total;

  const display = document.getElementById("changeAmount");

  if (change >= 0) {
    display.textContent = rupiah(change);
    display.className = "text-success fw-bold";
  } else {
    display.textContent = "Kurang " + rupiah(Math.abs(change));
    display.className = "text-danger fw-bold";
  }

  updateCheckoutButton();
}

// VALIDASI TOMBOL BAYAR
function updateCheckoutButton() {
  const button = document.getElementById("checkoutBtn");
  const total = getTotal();

  let valid = cart.length > 0;

  if (paymentMethod === "Tunai") {
    const cash = Number(document.getElementById("cashInput").value) || 0;
    valid = valid && cash >= total;
  }

  if (paymentMethod === "Transfer Bank") {
    const bank = document.getElementById("bankInput").value.trim();
    valid = valid && bank.length > 0;
  }

  button.disabled = !valid;
}

// ========================================
// PROSES TRANSAKSI
// ========================================

function checkout() {
  if (cart.length === 0) {
    alert("Keranjang masih kosong!");
    return;
  }

  // VALIDASI STOK TERAKHIR
  for (const item of cart) {
    const product = products.find(p => p.id === item.id);

    if (!product || product.stock < item.qty) {
      alert("Stok " + item.name + " tidak mencukupi!");
      return;
    }
  }

  const total = getTotal();
  const cash = Number(document.getElementById("cashInput").value) || 0;

  if (paymentMethod === "Tunai" && cash < total) {
    alert("Uang pembayaran masih kurang!");
    return;
  }

  if (paymentMethod === "Transfer Bank" &&
      !document.getElementById("bankInput").value.trim()) {
    alert("Masukkan nama bank!");
    return;
  }

  const now = new Date();

  const transaction = {
    id: "TRX-" + now.getTime(),
    date: now.toISOString(),
    items: cart.map(item => ({...item})),
    total: total,
    payment: paymentMethod,
    cash: paymentMethod === "Tunai" ? cash : total,
    change: paymentMethod === "Tunai" ? cash - total : 0,
    bank: paymentMethod === "Transfer Bank"
      ? document.getElementById("bankInput").value.trim()
      : ""
  };

  // KURANGI STOK
  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    product.stock -= item.qty;
  });

  // SIMPAN TRANSAKSI
  transactions.push(transaction);
  lastReceipt = transaction;

  saveData();

  // KOSONGKAN KERANJANG
  cart = [];

  document.getElementById("cashInput").value = "";
  document.getElementById("bankInput").value = "";

  renderProducts();
  renderCart();
  renderDashboard();
  renderHistory();

  // CETAK NOTA
  showReceipt(transaction);

  alert("Transaksi berhasil disimpan!");

  // Reset form pembayaran
  document.getElementById("cashInput").value = "";
  calculateChange();
}

// ========================================
// TAMBAH PRODUK BARU
// ========================================

document.getElementById("productForm")
  .addEventListener("submit", function(e) {

    e.preventDefault();

    const name = document.getElementById("newName").value.trim();
    const price = Number(document.getElementById("newPrice").value);
    const stock = Number(document.getElementById("newStock").value);
    const image = document.getElementById("newImage").value.trim();

    if (!name || !Number.isSafeInteger(price) || price <= 0 ||
        !Number.isSafeInteger(stock) || stock < 0) {
      alert("Periksa kembali nama, harga, dan stok produk!");
      return;
    }

    const product = {
      id: Date.now(),
      name: name,
      price: price,
      stock: stock,
      image: image || "https://placehold.co/500x350/f0eafa/8976ba?text=Produk"
    };

    products.push(product);

    saveData();

    renderProducts();
    renderDashboard();

    this.reset();

    bootstrap.Modal.getInstance(
      document.getElementById("modalProduk")
    ).hide();

    alert("Produk berhasil ditambahkan!");
  });

// ========================================
// DASHBOARD
// ========================================

function renderDashboard() {
  const today = new Date().toDateString();

  const todayTransactions = transactions.filter(transaction =>
    new Date(transaction.date).toDateString() === today
  );

  const omzet = todayTransactions.reduce(
    (sum, transaction) => sum + transaction.total, 0
  );

  const stock = products.reduce(
    (sum, product) => sum + product.stock, 0
  );

  document.getElementById("totalOmzet").textContent = rupiah(omzet);

  document.getElementById("totalStok").textContent = stock;

  document.getElementById("totalTransaksi").textContent =
    todayTransactions.length;
}

// ========================================
// RIWAYAT TRANSAKSI
// ========================================

function renderHistory() {
  const list = document.getElementById("historyList");

  if (transactions.length === 0) {
    list.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-secondary p-4">
          Belum ada transaksi.
        </td>
      </tr>`;
    return;
  }

  list.innerHTML = [...transactions].reverse().map((trx, index) => {

    const date = new Date(trx.date).toLocaleString("id-ID");

    const itemNames = trx.items.map(item =>
      escapeHTML(item.name) + " (" + item.qty + ")"
    ).join(", ");

    return `
      <tr>
        <td>${index + 1}</td>
        <td>${date}</td>
        <td>${itemNames}</td>
        <td>${escapeHTML(trx.payment)}</td>
        <td class="fw-bold">${rupiah(trx.total)}</td>
        <td>
          <button class="btn btn-soft btn-sm"
            onclick="printTransaction('${trx.id}')">
            🖨 Cetak
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

// ========================================
// CETAK NOTA
// ========================================

function showReceipt(trx) {
  const receipt = document.getElementById("receipt");

  const itemHTML = trx.items.map(item => `
    <div style="margin:8px 0">
      ${escapeHTML(item.name)}<br>
      ${item.qty} x ${rupiah(item.price)}
      <span style="float:right">
        ${rupiah(item.price * item.qty)}
      </span>
    </div>
  `).join("");

  receipt.innerHTML = `
    <div style="text-align:center">
      <h3>MINI POS</h3>
      <strong>SMK NEGERI 9 MEDAN</strong>
      <p>Kasir Digital</p>
    </div>

    <hr>

    <small>
      No: ${escapeHTML(trx.id)}<br>
      Tanggal: ${new Date(trx.date).toLocaleString("id-ID")}
    </small>

    <hr>

    ${itemHTML}

    <hr>

    <p>
      Total:
      <strong style="float:right">${rupiah(trx.total)}</strong>
    </p>

    <p>
      Pembayaran:
      <strong style="float:right">${escapeHTML(trx.payment)}</strong>
    </p>

    ${trx.payment === "Tunai" ? `
      <p>
        Uang:
        <strong style="float:right">${rupiah(trx.cash)}</strong>
      </p>
      <p>
        Kembalian:
        <strong style="float:right">${rupiah(trx.change)}</strong>
      </p>
    ` : ""}

    ${trx.bank ? `
      <p>Bank: ${escapeHTML(trx.bank)}</p>
    ` : ""}

    <hr>

    <div style="text-align:center">
      Terima kasih telah berbelanja!<br>
      Simpan nota ini sebagai bukti transaksi.
    </div>
  `;

  setTimeout(() => {
    window.print();
  }, 300);
}

// CETAK ULANG NOTA
function printTransaction(id) {
  const trx = transactions.find(item => item.id === id);

  if (!trx) return;

  showReceipt(trx);
}

// ========================================
// JALANKAN APLIKASI
// ========================================

document.getElementById("bankInput")
  .addEventListener("input", updateCheckoutButton);

renderProducts();
renderCart();
renderDashboard();
renderHistory();
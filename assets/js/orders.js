const products = [
  {
    id: 1,
    name: "សាប៊ូកក់&ស្បាសក់ JELY",
    price: 15,
    category: "Hair",
    image: "../images/products/hair/សាប៊ូកក់សក់ និងស្បាសក់ JELY.png",
    detail: "សាប៊ូកក់សក់ និងស្បាសក់ JELY"
  },
  {
    id: 2,
    name: "សាប៊ូកក់&ម៉ាសសក់ CCR",
    price: 16,
    category: "Hair",
    image: "../images/products/hair/សាប៊ូកក់សក់ និងម៉ាសសក់ CCR.png",
    detail: "សាប៊ូកក់ និងម៉ាសសក់ CCR"
  },
  {
    id: 3,
    name: "ស្ព្រាយបាញ់សក់ CCR",
    price: 10,
    category: "Hair",
    image: "../images/products/hair/ស្រ្ពៃបាញ់សក់.png",
    detail: "ស្ព្រាយបាញ់សក់ CCR Hair Spray"
  },
  {
    id: 4,
    name: "សាប៊ូកក់&ម៉ាសសក់ VIP 5in1 CCR",
    price: 16,
    category: "Hair",
    image: "../images/products/hair/សក់និងម៉ាស 5in1.png",
    detail: "សាប៊ូកក់ និងម៉ាសសក់ VIP 5in1 CCR"
  },
  {
    id: 5,
    name: "សាប៊ូកក់&ម៉ាសសក់ Premium CCR",
    price: 16,
    category: "Hair",
    image: "../images/products/hair/សក់និងម៉ាស Premium CCR.png",
    detail: "សាប៊ូកក់ និងម៉ាសសក់ Premium CCR"
  },
  {
    id: 6,
    name: "ប្រេងលាបសក់/សេរ៉ូមសក់ VIP CCR",
    price: 12,
    category: "Hair",
    image: "../images/products/hair/ប្រេងលាបសក់ CCR.png",
    detail: "ប្រេងលាបសក់ CCR VIP"
  },
  {
    id: 7,
    name: "ឡេលាបខ្លួន Gluta SUDO",
    price: 16,
    category: "Body",
    image: "../images/products/body/ឡេលាបខ្លួន Gluta SUDO.png",
    detail: "ឡេលាបខ្លួន Gluta SUDO"
  },
  {
    id: 8,
    name: "សេរ៉ូមលាបខ្លួន JELY",
    price: 15,
    category: "Body",
    image: "../images/products/body/សេរ៉ូមលាបខ្លួន JELY BODY ESSENCE VC WHITENGING.png",
    detail: "សេរ៉ូមលាបខ្លួន Body Serum JELY"
  },
  {
    id: 9,
    name: "ស្រ្ពៃក្លៀក/ឡេក្លៀក SUDO",
    price: 10,
    category: "Body",
    image: "../images/products/body/ស្រ្ពៃក្លៀក និងឡេកលៀត.png",
    detail: "ស្រ្ពៃក្លៀក/ឡេក្លៀក SUDO"
  },
  {
    id: 10,
    name: "សាប៊ូដុសខ្លួន CCR (ក្លិនទឹកអប់)",
    price: 12,
    category: "Body",
    image: "../images/products/body/សាប៊ូដុសខ្លួនមាសក្លិនទឹកអប់អូតែលផ្កាយ 5.png",
    detail: "សាប៊ូដុសខ្លួន CCR (ក្លិនទឹកអប់)"
  },
  {
    id: 11,
    name: "សាប៊ូដុសខ្លួនកុលាប CCR",
    price: 12,
    category: "Body",
    image: "../images/products/body/សាប៊ូដុសខ្លួនកុលាប.png",
    detail: "សាប៊ូដុសខ្លួនកុលាប BodyWash Rose CCR"
  },
  {
    id: 12,
    name: "ឡេលាបខ្លួន JELY",
    price: 15,
    category: "Body",
    image: "../images/products/body/ឡេលាបខ្លួន JELY BODY LOTION.png",
    detail: "ឡេលាបខ្លួន BODY LOTION JELY"
  },
  {
    id: 13,
    name: "សាប៊ូកក់&ដុសខ្លួនក្មេង CCR",
    price: 12,
    category: "Body",
    image: "../images/products/body/សាប៊ូកក់សក់និងដុសខ្លួនក្មេង CCR.png",
    detail: "សាប៊ូកក់ និងដុសខ្លួនក្មេង CCR"
  },
  {
    id: 14,
    name: "ទឹកអនាម័យស្រ្ដី JELY",
    price: 12,
    category: "Body",
    image: "../images/products/body/ទឹកអនាម័យស្រ្ដី JELY.png",
    detail: "ទឹកអនាម័យស្រ្ដី Feminine Wash​ JELY"
  },
  {
    id: 15,
    name: "ក្រដាស់សើម CCR",
    price: 10,
    category: "Face",
    image: "../images/products/face/ក្រដាស់សើម Remove MakeUp CCR.png",
    detail: "ក្រដាស់សើម Remove MakeUp CCR"
  },
  {
    id: 16,
    name: "សំឡីវីតាមីន JELY Mask Pad",
    price: 15,
    category: "Face",
    image: "../images/products/face/សំឡីវីតាមីន​ JELY.png",
    detail: "សំឡីវីតាមីន JELY Mask Pad"
  },
  {
    id: 17,
    name: "BB Cream CCR",
    price: 9.5,
    category: "Face",
    image: "../images/products/face/BB Cream.png",
    detail: "BB Cream CCR"
  },
  {
    id: 18,
    name: "SUNSCREEN Cream CCR",
    price: 9.5,
    category: "Face",
    image: "../images/products/face/SUNSCREEN CCR.png",
    detail: "SUNSCREEN Cream CCR"
  },
  {
    id: 19,
    name: "សាប៊ូមុខ JELY Gluta",
    price: 8.5,
    category: "Face",
    image: "../images/products/face/សាប៊ូដុសមុខ JELY Gluta.png",
    detail: "សាប៊ូមុខ​​​ ​JELY Gluta"
  },
  {
    id: 20,
    name: "សាប៊ូមុខយិនសិន CCR",
    price: 8.5,
    category: "Face",
    image: "../images/products/face/សាប៊ូដុសមុខ យិនសិន CCR.png",
    detail: "សាប៊ូមុខយិនសិន Ginseng CCR"
  },
  {
    id: 21,
    name: "CC SERUM JELY",
    price: 15,
    category: "Face",
    image: "../images/products/face/CC SERUM JELY.png",
    detail: "CC Serum Pink Tone JELY"
  },
  {
    id: 22,
    name: "ឈុតមុខស្អាត JELY",
    price: 25,
    category: "Face",
    image: "../images/products/face/ឈុតមុខស្អាត JELY.png",
    detail: "ឈុតមុខស្អាត JELY Essence + Milk + Night Cream"
  },
  {
    id: 23,
    name: "ថ្នាំដុសធ្មេញ CCR",
    price: 10,
    category: "Face",
    image: "../images/products/face/ថ្នាំដុសធ្មេញ CCR.png",
    detail: "ថ្នាំដុសធ្មេញ CCR"
  },
  {
    id: 24,
    name: "ម៉ាស់បិទមុខ 6D CCR",
    price: 15,
    category: "Face",
    image: "../images/products/face/ម៉ាស់បិទមុខ 6D CCR.png",
    detail: "ម៉ាស់បិទមុខ 6D CCR"
  },
  {
    id: 25,
    name: "ហ្វៃប័រផាសសិន CCR",
    price: 18,
    category: "Drink",
    image: "../images/products/drink/Fibery Passion Fruit.png",
    detail: "ហ្វៃប័រផាសសិន Fiber CCR"
  },
  {
    id: 26,
    name: "កាហ្វេសម្រក CCR",
    price: 18,
    category: "Drink",
    image: "../images/products/drink/CoffeeCCR.png",
    detail: "កាហ្វេសម្រក Coffee CCR"
  }
];

let items = [];
let activeCategory = "All";
let savedOrders = [];
let showQrEnabled = true;
let currentEditRowId = null;

const $ = (id) => document.getElementById(id);

const els = {
  productGrid: $("productGrid"),
  itemsTableBody: $("itemsTableBody"),
  grandTotal: $("grandTotal"),
  payment: $("payment"),
  paymentOptions: $("paymentOptions"),
  manualProductInput: $("manualProductInput"),
  manualQty: $("manualQty"),
  manualPrice: $("manualPrice"),
  manualDiscount: $("manualDiscount"),
  manualAddBtn: $("manualAddBtn"),
  themeToggle: $("themeToggle"),
  status: $("status"),
  page: $("page"),
  closeBy: $("closeBy"),
  customer: $("customer"),
  phone: $("phone"),
  date: $("date"),
  province: $("province"),
  addressDetail: $("addressDetail"),
  deliveryName: $("deliveryName"),
  deliveryFee: $("deliveryFee"),
  note: $("note"),
  receiptNo: $("receiptNo"),
  toggleQrBtn: $("toggleQrBtn"),
  printBtn: $("printBtn"),
  copyBtn: $("copyBtn"),
  saveBtn: $("saveBtn"),
  shareBtn: $("shareBtn"),
  printArea: $("printArea"),
  toastContainer: $("toastContainer"),
  productDrawer: $("productDrawer"),
  drawerOverlay: $("drawerOverlay"),
  closeProductDrawerBtn: $("closeProductDrawerBtn"),
  drawerCancelBtn: $("drawerCancelBtn"),
  drawerSaveBtn: $("drawerSaveBtn"),
  drawerDeleteBtn: $("drawerDeleteBtn"),
  drawerEditName: $("drawerEditName"),
  drawerEditQty: $("drawerEditQty"),
  drawerEditPrice: $("drawerEditPrice"),
  drawerEditDiscount: $("drawerEditDiscount"),
  drawerLineSubtotal: $("drawerLineSubtotal"),
  drawerPreviewSubtotal: $("drawerPreviewSubtotal"),
};

const APPS_SCRIPT_URL = (window.APPS_SCRIPT_URL || "").trim();

function getAssetUrl(path) {
  if (!path) return "";
  try {
    return new URL(path, window.location.href).href;
  } catch {
    return path;
  }
}

function init() {
  try {
    savedOrders = JSON.parse(localStorage.getItem("camboOrders") || "[]");
  } catch {
    savedOrders = [];
  }

  setToday();
  initTheme();
  bindCategoryTabs();
  renderProducts();
  renderTable();
  bindPayments();
  bindActions();
}

function setToday() {
  if (!els.date) return;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  if (!els.date.value) els.date.value = `${y}-${m}-${d}`;
}

function initTheme() {
  if (!els.themeToggle) return;
  const savedTheme = localStorage.getItem("camboTheme") || "light";
  document.body.classList.toggle("dark", savedTheme === "dark");
  els.themeToggle.textContent = savedTheme === "dark" ? "🌙" : "☀️";

  els.themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("camboTheme", isDark ? "dark" : "light");
    els.themeToggle.textContent = isDark ? "🌙" : "☀️";
  });
}

function bindCategoryTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.category || "All";
      renderProducts();
    });
  });
}

function getFilteredProducts() {
  return activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory);
}

function renderProducts() {
  const filteredProducts = getFilteredProducts();

  els.productGrid.innerHTML = filteredProducts.map((product) => `
    <div class="product-card">
      <div class="product-image">
        <img src="${product.image}" alt="${escapeHtml(product.name)}" onerror="this.style.display='none'" />
      </div>
      <div class="product-info">
        <h4>${escapeHtml(product.name)}</h4>
        <p>${escapeHtml(product.detail)}</p>
        <div class="product-controls">
          <div class="pc-field">
            <label>QTY</label>
            <input type="number" min="1" step="1" value="1" class="qty-input" data-id="${product.id}" />
          </div>
          <div class="pc-field">
            <label>Price</label>
            <input type="number" min="0" step="0.01" value="${product.price}" class="price-input" data-id="${product.id}" />
          </div>
          <div class="pc-field">
            <label>Discount</label>
            <input type="number" min="0" step="0.01" value="0" class="discount-input" data-id="${product.id}" />
          </div>
          <button class="add-btn add-product-btn" data-id="${product.id}" type="button">+</button>
        </div>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".add-product-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const qty = Number(document.querySelector(`.qty-input[data-id="${id}"]`)?.value || 1);
      const price = Number(document.querySelector(`.price-input[data-id="${id}"]`)?.value || 0);
      const discount = Number(document.querySelector(`.discount-input[data-id="${id}"]`)?.value || 0);
      addItem(id, qty, price, discount);
    });
  });
}

function bindPayments() {

  els.paymentOptions.querySelectorAll(".payment-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      els.paymentOptions.querySelectorAll(".payment-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      els.payment.value = btn.dataset.value || "";
    });
  });
}

function bindActions() {
  els.manualAddBtn.addEventListener("click", () => {
    const name = (els.manualProductInput?.value || "").trim();
    const qty = Number(els.manualQty.value || 1);
    const price = Number(els.manualPrice.value || 0);
    const discount = Number(els.manualDiscount.value || 0);

    if (!name) return toast("Please enter product name first.", "error");
    addManualItem(name, qty, price, discount);
  });

  els.deliveryFee.addEventListener("input", renderTable);

  if (els.toggleQrBtn) {
    syncQrToggleButton();
    els.toggleQrBtn.addEventListener("click", () => {
      showQrEnabled = !showQrEnabled;
      syncQrToggleButton();
    });
  }

  els.printBtn.addEventListener("click", handlePrint);
  els.copyBtn.addEventListener("click", handleCopy);
  els.saveBtn.addEventListener("click", handleSave);
  if (els.shareBtn) els.shareBtn.addEventListener("click", handleShareInvoice);

  bindProductDrawer();
}

function addItem(productId, qty, price, discount) {
  const product = products.find((p) => p.id === productId);
  if (!product) return toast("Product not found.", "error");
  if (!qty || qty < 1) return toast("QTY must be at least 1.", "error");
  if (price < 0 || discount < 0) return toast("Price or discount is invalid.", "error");

  items.push({
    rowId: Date.now() + Math.random(),
    productId: product.id,
    name: product.name,
    qty,
    price,
    discount,
    subtotal: Math.max(0, qty * price - discount),
  });

  renderTable();
  toast("Product added.", "success");
}

function addManualItem(name, qty, price, discount) {
  if (!qty || qty < 1) return toast("QTY must be at least 1.", "error");
  if (price < 0 || discount < 0) return toast("Price or discount is invalid.", "error");

  items.push({
    rowId: Date.now() + Math.random(),
    productId: null,
    name,
    qty,
    price,
    discount,
    subtotal: Math.max(0, qty * price - discount),
  });

  renderTable();
  els.manualProductInput.value = "";
  els.manualQty.value = 1;
  els.manualPrice.value = 0;
  els.manualDiscount.value = 0;
  toast("Product added.", "success");
}

function renderTable() {
  if (!items.length) {
    els.itemsTableBody.innerHTML = `<tr class="empty-row"><td colspan="6">No products added yet.</td></tr>`;
    els.grandTotal.textContent = formatDisplayMoney(getGrandTotal());
    if (currentEditRowId !== null) closeProductDrawer();
    return;
  }

  els.itemsTableBody.innerHTML = items.map((item) => `
    <tr>
      <td>
        <div class="row-action-inline">
          <button class="product-name-btn" data-rowid="${item.rowId}" type="button">${escapeHtml(item.name)}</button>
          <button class="edit-line-btn" data-rowid="${item.rowId}" type="button" aria-label="Edit item">✎</button>
        </div>
      </td>
      <td>${item.qty}</td>
      <td>${formatDisplayMoney(item.price)}</td>
      <td>${formatDisplayMoney(item.discount)}</td>
      <td>${formatDisplayMoney(item.subtotal)}</td>
      <td><button class="delete-btn" data-rowid="${item.rowId}" type="button">×</button></td>
    </tr>
  `).join("");

  attachProductRowActions();
  els.grandTotal.textContent = formatDisplayMoney(getGrandTotal());
}


function attachProductRowActions() {
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const rowId = Number(btn.dataset.rowid);
      const wasEditing = currentEditRowId === rowId;
      items = items.filter((item) => item.rowId !== rowId);
      if (wasEditing) closeProductDrawer();
      renderTable();
      toast("Deleted item.", "info");
    });
  });

  document.querySelectorAll(".product-name-btn, .edit-line-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const rowId = Number(btn.dataset.rowid);
      openProductDrawer(rowId);
    });
  });
}

function bindProductDrawer() {
  if (els.closeProductDrawerBtn) els.closeProductDrawerBtn.addEventListener("click", closeProductDrawer);
  if (els.drawerCancelBtn) els.drawerCancelBtn.addEventListener("click", closeProductDrawer);
  if (els.drawerOverlay) els.drawerOverlay.addEventListener("click", closeProductDrawer);

  [els.drawerEditQty, els.drawerEditPrice, els.drawerEditDiscount, els.drawerEditName].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", updateDrawerSubtotalPreview);
  });

  if (els.drawerSaveBtn) els.drawerSaveBtn.addEventListener("click", saveProductDrawerChanges);
  if (els.drawerDeleteBtn) els.drawerDeleteBtn.addEventListener("click", deleteCurrentDrawerItem);

  document.addEventListener("keydown", (event) => {
    if (!els.productDrawer || !els.productDrawer.classList.contains("show")) return;
    if (event.key === "Escape") closeProductDrawer();
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveProductDrawerChanges();
    }
  });
}

function openProductDrawer(rowId) {
  const item = items.find((entry) => entry.rowId === rowId);
  if (!item || !els.productDrawer) return;

  currentEditRowId = rowId;
  if (els.drawerEditName) els.drawerEditName.value = item.name || "";
  if (els.drawerEditQty) els.drawerEditQty.value = item.qty || 1;
  if (els.drawerEditPrice) els.drawerEditPrice.value = item.price || 0;
  if (els.drawerEditDiscount) els.drawerEditDiscount.value = item.discount || 0;
  updateDrawerSubtotalPreview();

  if (els.drawerOverlay) {
    els.drawerOverlay.hidden = false;
    requestAnimationFrame(() => els.drawerOverlay.classList.add("show"));
  }
  els.productDrawer.classList.add("show");
  els.productDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
}

function closeProductDrawer() {
  currentEditRowId = null;
  if (els.drawerOverlay) {
    els.drawerOverlay.classList.remove("show");
    setTimeout(() => {
      if (!els.drawerOverlay.classList.contains("show")) els.drawerOverlay.hidden = true;
    }, 240);
  }
  if (els.productDrawer) {
    els.productDrawer.classList.remove("show");
    els.productDrawer.setAttribute("aria-hidden", "true");
  }
  document.body.classList.remove("drawer-open");
}

function updateDrawerSubtotalPreview() {
  const qty = Math.max(1, Number(els.drawerEditQty?.value || 1));
  const price = Math.max(0, Number(els.drawerEditPrice?.value || 0));
  const discount = Math.max(0, Number(els.drawerEditDiscount?.value || 0));
  const subtotal = Math.max(0, qty * price - discount);
  const subtotalText = formatDisplayMoney(subtotal);
  if (els.drawerLineSubtotal) els.drawerLineSubtotal.textContent = subtotalText;
  if (els.drawerPreviewSubtotal) els.drawerPreviewSubtotal.textContent = subtotalText;
}

function saveProductDrawerChanges() {
  if (currentEditRowId === null) return;
  const item = items.find((entry) => entry.rowId === currentEditRowId);
  if (!item) return;

  const name = (els.drawerEditName?.value || "").trim();
  const qty = Number(els.drawerEditQty?.value || 0);
  const price = Number(els.drawerEditPrice?.value || 0);
  const discount = Number(els.drawerEditDiscount?.value || 0);

  if (!name) return toast("Please enter product name.", "error");
  if (!qty || qty < 1) return toast("QTY must be at least 1.", "error");
  if (price < 0 || discount < 0) return toast("Price or discount is invalid.", "error");

  item.name = name;
  item.qty = qty;
  item.price = price;
  item.discount = discount;
  item.subtotal = Math.max(0, qty * price - discount);

  renderTable();
  openProductDrawer(item.rowId);
  toast("Product updated.", "success");
}

function deleteCurrentDrawerItem() {
  if (currentEditRowId === null) return;
  items = items.filter((entry) => entry.rowId !== currentEditRowId);
  closeProductDrawer();
  renderTable();
  toast("Deleted item.", "info");
}

function getItemsTotal() {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
}

function getGrandTotal() {
  return getItemsTotal() + Math.max(0, Number(els.deliveryFee.value || 0));
}

function getReceiptNoValue() {
  return (els.receiptNo?.value || "").trim();
}

function syncQrToggleButton() {
  if (!els.toggleQrBtn) return;
  const isOn = !!showQrEnabled;
  els.toggleQrBtn.textContent = `QR Code: ${isOn ? "ON" : "OFF"}`;
  els.toggleQrBtn.classList.toggle("is-on", isOn);
  els.toggleQrBtn.classList.toggle("is-off", !isOn);
  els.toggleQrBtn.setAttribute("aria-pressed", String(isOn));
}

function getSelectedQrMeta() {
  if (!showQrEnabled) return null;

  const method = (els.payment.value || "").trim().toUpperCase();
  const fileMap = {
    ABA: { src: "../images/qr/ABA.png", name: "CHEA CHANROTHA" },
    AC: { src: "../images/qr/AC.png", name: "CHEA CHANROTHA" }
  };

  if (!fileMap[method]) return null;

  return {
    label: method,
    src: fileMap[method].src,
    name: fileMap[method].name || ""
  };
}

function handlePrint() {
  if (!items.length) return toast("No items to print!", "error");

  const receiptHTML = buildReceiptHTML();
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    toast("Browser blocked the print preview window. Please allow pop-ups and try again.", "error");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="km">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Receipt Preview</title>
      <base href="${window.location.href}">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>${getReceiptPrintStyles()}</style>
    </head>
    <body>
      <div class="preview-toolbar no-print">
        <button type="button" class="preview-btn" onclick="window.print()">Print</button>
        <button type="button" class="preview-btn secondary" onclick="window.close()">Close</button>
      </div>

      <div class="print-root">${receiptHTML}</div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
}

async function handleCopy() {
  if (!items.length) return toast("No items to copy!", "error");

  const text = buildSummaryText();
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      fallbackCopy(text);
    }
    toast("Copied receipt ✔", "success");
  } catch {
    try {
      fallbackCopy(text);
      toast("Copied receipt ✔", "success");
    } catch {
      toast("Copy failed ❌", "error");
    }
  }
}

function getDeliveryFeeValue() {
  return Math.max(0, Number(els.deliveryFee.value || 0));
}

function buildOrderPayload() {
  return {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    status: els.status.value,
    page: els.page.value,
    closeBy: els.closeBy.value,
    customer: els.customer.value,
    phone: els.phone.value,
    date: els.date.value,
    province: els.province.value,
    addressDetail: els.addressDetail.value,
    delivery: els.deliveryName.value,
    deliveryFee: getDeliveryFeeValue(),
    payment: els.payment.value,
    showQrEnabled,
    note: els.note.value,
    receiptNo: getReceiptNoValue(),
    items: items.map((item) => ({ ...item })),
    itemsTotal: getItemsTotal(),
    total: getGrandTotal(),
    totalRiel: getGrandTotal() * 4100
  };
}

async function postOrderToAppsScript(order) {
  if (!APPS_SCRIPT_URL) {
    throw new Error("Apps Script URL is missing.");
  }

  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(order)
  });

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Invalid server response: " + text);
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Save failed.");
  }

  return data;
}

async function handleSave() {
  if (!items.length) return toast("No items to save!", "error");

  const order = buildOrderPayload();
  const originalBtnText = els.saveBtn.textContent;

  try {
    els.saveBtn.disabled = true;
    els.saveBtn.textContent = "Saving...";

    const result = await postOrderToAppsScript(order);

    savedOrders.push(order);
    localStorage.setItem("camboOrders", JSON.stringify(savedOrders));

    if (result.telegram && result.telegram.ok === false) {
      toast("Saved to Google Sheet. Telegram failed.", "info");
    } else {
      toast("Saved to Google Sheet successfully.", "success");
    }

    clearOrderForm();
    console.log("Apps Script result:", result);
  } catch (error) {
    console.error("Save failed:", error);
    toast(error.message || "Save failed.", "error");
  } finally {
    els.saveBtn.disabled = false;
    els.saveBtn.textContent = originalBtnText;
  }
}

function renderInvoiceAreaForCapture() {
  if (!els.printArea) throw new Error("Print area not found.");

  const receiptHTML = buildShareReceiptHTML();
  els.printArea.style.display = "block";
  els.printArea.innerHTML = `
    <style id="captureReceiptStyles">${getShareReceiptStyles()}</style>
    <div class="share-capture-stage">
      <div id="invoiceArea" class="share-capture-shell">
        ${receiptHTML}
      </div>
    </div>
  `;

  return els.printArea.querySelector("#invoiceArea");
}

function cleanupInvoiceCaptureArea() {
  if (!els.printArea) return;
  els.printArea.innerHTML = "";
  els.printArea.style.display = "none";
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image blob."));
    reader.readAsDataURL(blob);
  });
}

function waitForImageElement(img) {
  return new Promise((resolve) => {
    if (!img) return resolve();
    if (img.complete && img.naturalWidth > 0) return resolve();
    const done = () => resolve();
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
  });
}

async function imageElementToDataURL(img) {
  await waitForImageElement(img);
  if (!img || !img.naturalWidth || !img.naturalHeight) {
    throw new Error("Image not ready.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable.");
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}

async function inlineInvoiceImages(container) {
  if (!container) return;

  const images = Array.from(container.querySelectorAll("img"));
  await Promise.all(images.map(async (img) => {
    const rawSrc = img.getAttribute("src") || "";
    if (!rawSrc || rawSrc.startsWith("data:")) return;

    const absoluteSrc = getAssetUrl(rawSrc);

    try {
      const response = await fetch(absoluteSrc, { cache: "no-store" });
      if (!response.ok) throw new Error(`Image request failed: ${response.status}`);
      const blob = await response.blob();
      img.src = await blobToDataURL(blob);
      if (img.decode) {
        try { await img.decode(); } catch {}
      }
      return;
    } catch (error) {
      console.warn("Fetch inline failed, trying canvas fallback:", absoluteSrc, error);
    }

    try {
      img.src = await imageElementToDataURL(img);
      if (img.decode) {
        try { await img.decode(); } catch {}
      }
    } catch (fallbackError) {
      console.warn("Canvas inline fallback failed:", absoluteSrc, fallbackError);
      await waitForImageElement(img);
    }
  }));
}

async function captureInvoiceBlob() {
  if (typeof html2canvas !== "function") {
    throw new Error("html2canvas library is missing.");
  }

  const invoiceArea = renderInvoiceAreaForCapture();
  if (!invoiceArea) throw new Error("Invoice area not found.");

  await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 220)));
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch {}
  }

  await inlineInvoiceImages(invoiceArea);

  const captureHeight = Math.max(200, Math.ceil(invoiceArea.scrollHeight || invoiceArea.offsetHeight || 0));

  let lastError = null;

  try {
    const canvas = await html2canvas(invoiceArea, {
      width: 1080,
      height: captureHeight,
      scale: Math.max(2, Math.min(window.devicePixelRatio || 1, 3)),
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 0,
      foreignObjectRendering: false,
      windowWidth: 1080,
      windowHeight: captureHeight,
      scrollX: 0,
      scrollY: 0
    });

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("Failed to create image."));
      }, "image/png", 1);
    });

    return blob;
  } catch (error) {
    lastError = error;
    if (error && /tainted canvases/i.test(String(error.message || error))) {
      throw new Error("Share មិនដំណើរការ ព្រោះមានរូបភាព ឬ QR code មួយចំនួនមិនអនុញ្ញាតឱ្យ browser បម្លែងជា image។ សូមពិនិត្យរូបភាព/QR source ឬសាកបើកតាម localhost/http server។");
    }
    throw lastError || error;
  } finally {
    cleanupInvoiceCaptureArea();
  }
}

async function handleShareInvoice() {
  if (!items.length) return toast("No items to share!", "error");

  const originalText = els.shareBtn ? els.shareBtn.textContent : "📤 Share";

  try {
    if (els.shareBtn) {
      els.shareBtn.disabled = true;
      els.shareBtn.textContent = "📤 Preparing...";
    }

    const blob = await captureInvoiceBlob();
    const fileName = `invoice-${Date.now()}.png`;
    const file = new File([blob], fileName, { type: "image/png" });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: "Invoice",
        text: "Invoice image",
        files: [file]
      });
      toast("Invoice shared successfully.", "success");
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast("Browser does not support Share. Image downloaded instead.", "info");
  } catch (error) {
    if (error && error.name === "AbortError") {
      toast("Share cancelled.", "info");
    } else {
      console.error("Share failed:", error);
      toast(error.message || "Share failed.", "error");
    }
  } finally {
    if (els.shareBtn) {
      els.shareBtn.disabled = false;
      els.shareBtn.textContent = originalText;
    }
  }
}

function clearOrderForm() {
  items = [];
  renderTable();

  if (els.customer) els.customer.value = "";
  if (els.phone) els.phone.value = "";
  if (els.province) els.province.value = "";
  if (els.addressDetail) els.addressDetail.value = "";
  if (els.deliveryName) els.deliveryName.value = "";
  if (els.deliveryFee) els.deliveryFee.value = "0";
  if (els.note) els.note.value = "";
  if (els.payment) els.payment.value = "";
  if (els.receiptNo) els.receiptNo.value = "";
  if (els.status) els.status.value = "Pending";
  if (els.page) els.page.value = "";
  if (els.closeBy) els.closeBy.value = "";
  if (els.manualProductInput) els.manualProductInput.value = "";
  if (els.manualQty) els.manualQty.value = "1";
  if (els.manualPrice) els.manualPrice.value = "0";
  if (els.manualDiscount) els.manualDiscount.value = "0";

  if (els.paymentOptions) {
    els.paymentOptions.querySelectorAll(".payment-btn").forEach((btn) => btn.classList.remove("active"));
  }

  showQrEnabled = true;
  syncQrToggleButton();
  setToday();
  cleanupInvoiceCaptureArea();
}

function buildShareReceiptHTML() {
  const province = (els.province?.value || "").trim();
  const detailAddress = (els.addressDetail?.value || "").trim();
  const fullAddress = [detailAddress, province].filter(Boolean).join(" : ") || "-";
  const deliveryFee = Math.max(0, Number(els.deliveryFee?.value || 0));
  const itemsTotal = getItemsTotal();
  const grand = itemsTotal + deliveryFee;
  const grandRiel = Math.round(grand * 4100);
  const paymentText = (els.payment?.value || "-").trim() || "-";
  const pageText = (els.page?.value || "-").trim() || "-";
  const closeByText = (els.closeBy?.value || "-").trim() || "-";
  const noteText = (els.note?.value || "-").trim() || "-";
  const customerText = (els.customer?.value || "-").trim() || "-";
  const phoneText = (els.phone?.value || "-").trim() || "-";
  const deliveryNameText = (els.deliveryName?.value || "-").trim() || "-";
  const dateText = formatDateKH(els.date?.value);
  const receiptNo = getReceiptNoValue();
  const qrMeta = getSelectedQrMeta();
  const hasBottomBlock = !!(qrMeta || receiptNo);

  const rows = items.map((it, i) => `
    <div class="share-item-row">
      <div class="share-col-product">${i + 1}. ${escapeHtml(it.name)}</div>
      <div class="share-col-qty">${escapeHtml(String(it.qty))} ឈុត</div>
      <div class="share-col-price">${escapeHtml(formatDisplayMoney(it.price))}</div>
      <div class="share-col-subtotal">${escapeHtml(formatDisplayMoney(it.subtotal))}</div>
    </div>
  `).join("");

  const bottomBlock = hasBottomBlock ? `
    <div class="share-dash share-bottom-separator"></div>
    <div class="share-bottom-grid ${!qrMeta ? 'no-qr' : ''} ${!receiptNo ? 'no-number' : ''}">
      ${qrMeta ? `
        <div class="share-qr-side">
          <div class="share-qr-box">
            <img class="share-qr-image" src="${escapeHtml(getAssetUrl(qrMeta.src))}" alt="${escapeHtml(qrMeta.label)} QR Code" />
          </div>
          <div class="share-qr-label">${escapeHtml(qrMeta.label)}</div>
          ${qrMeta.name ? `<div class="share-qr-name">${escapeHtml(qrMeta.name)}</div>` : ""}
        </div>
      ` : ""}
      ${receiptNo ? `
        <div class="share-receipt-side">
          <div class="share-receipt-number">${escapeHtml(receiptNo)}</div>
        </div>
      ` : ""}
    </div>
  ` : `<div class="share-tail-space"></div>`;

  return `
    <div class="share-poster ${hasBottomBlock ? 'has-bottom-block' : 'trim-bottom'}">
      <div class="share-content">
        <div class="share-head">
          <div class="share-title">វិក័យប័ត្រ</div>
          <div class="share-date">កាលបរិច្ឆេទ: ${escapeHtml(dateText)}</div>
        </div>

        <div class="share-dash"></div>

        <div class="share-info-grid">
          <div class="share-info-labels">
            <div>ឈ្មោះ:</div>
            <div>លេខទូរសព្ទ:</div>
            <div>ទីតាំង</div>
            <div>អ្នកដឹកជញ្ជូន</div>
            <div>Note:</div>
          </div>
          <div class="share-info-values">
            <div>${escapeHtml(customerText)}</div>
            <div>${escapeHtml(phoneText)}</div>
            <div>${escapeHtml(fullAddress)}</div>
            <div>${escapeHtml(deliveryNameText)}</div>
            <div>${escapeHtml(noteText)}</div>
          </div>
        </div>

        <div class="share-dash"></div>

        <div class="share-table-head">
          <div class="share-col-product">ផលិតផល</div>
          <div class="share-col-qty">ចំនួន</div>
          <div class="share-col-price">តម្លៃ</div>
          <div class="share-col-subtotal">សរុប</div>
        </div>
        <div class="share-table-line"></div>
        <div class="share-items-wrap">${rows}</div>

        <div class="share-dash"></div>

        <div class="share-total-row"><span>ការទូទាត់</span><span>${escapeHtml(formatDisplayMoney(itemsTotal))}</span></div>
        <div class="share-total-row"><span>សេវាដឹក</span><span>${deliveryFee === 0 ? 'ហ្វ្រីដឹក' : escapeHtml(formatDisplayMoney(deliveryFee))}</span></div>
        <div class="share-pay-row">
          <div class="share-pay-left">ការទូទាត់ <strong>${escapeHtml(paymentText)}</strong></div>
          <div class="share-grand-wrap">
            <div class="share-grand-total">${escapeHtml(formatDisplayMoney(grand))}</div>
          </div>
        </div>
        <div class="share-riel-row"><span>ប្រាក់រៀល</span><span>${escapeHtml(grandRiel.toLocaleString())}៛</span></div>

        <div class="share-dash"></div>

        <div class="share-mini-meta">Page: ${escapeHtml(pageText)} | CloseBy: ${escapeHtml(closeByText)}</div>
        <div class="share-service-row">
          <span>លេខបម្រើអតិថិជន:</span>
          <span>015 58 68 78 / 089 58 68 78</span>
        </div>

        ${bottomBlock}
      </div>
    </div>
  `;
}

function getShareReceiptStyles() {
  return `
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #ffffff; }
    body {
      font-family: "Kantumruy Pro", sans-serif;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      color: #045f80;
    }
    .share-capture-stage {
      width: fit-content;
      margin: 0 auto;
      background: #ffffff;
    }
    .share-capture-shell,
    .share-poster {
      width: 1080px;
      background: #f3f7f9;
      position: relative;
      overflow: hidden;
    }
    .share-content {
      width: 1080px;
      position: relative;
      z-index: 2;
      padding: 54px 50px 50px;
      display: flex;
      flex-direction: column;
    }
    .trim-bottom .share-content {
      padding-bottom: 50px;
    }
    .share-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }
    .share-title {
      font-size: 100px;
      font-weight: 800;
      line-height: 0.88;
      color: #045f80;
      letter-spacing: 0;
    }
    .share-date {
      padding-top: 18px;
      font-size: 27px;
      font-weight: 500;
      color: #9ab6c4;
      white-space: nowrap;
    }
    .share-dash {
      margin: 26px 0 18px;
      border-top: 2px dashed #5f99ae;
    }
    .share-info-grid {
      display: grid;
      grid-template-columns: 245px minmax(0, 1fr);
      gap: 8px 36px;
      font-size: 34px;
      line-height: 1.26;
      color: #045f80;
    }
    .share-info-labels,
    .share-info-values {
      display: grid;
      gap: 5px;
    }
    .share-info-labels,
    .share-info-values { font-weight: 500; }
    .share-table-head,
    .share-item-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 130px 130px 130px;
      column-gap: 16px;
      align-items: start;
    }
    .share-table-head {
      color: #045f80;
      font-size: 31px;
      font-weight: 800;
      padding: 0 0 6px;
    }
    .share-table-line {
      border-top: 4px solid #045f80;
      margin-bottom: 10px;
    }
    .share-item-row {
      padding: 8px 0;
      color: #045f80;
      font-size: 28px;
      line-height: 1.28;
    }
    .share-col-product {
      text-align: left;
      padding-right: 8px;
      word-break: break-word;
    }
    .share-col-qty,
    .share-col-price,
    .share-col-subtotal {
      text-align: right;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .share-total-row,
    .share-pay-row,
    .share-riel-row,
    .share-service-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      color: #045f80;
      font-size: 28px;
      line-height: 1.25;
    }
    .share-total-row { margin: 4px 0; }
    .share-pay-row { margin-top: 10px; }
    .share-pay-left {
      font-size: 28px;
      line-height: 1.2;
    }
    .share-pay-left strong {
      display: inline-block;
      margin-left: 16px;
      font-size: ៥០px;
      line-height: 0.95;
      font-weight: 800;
    }
    .share-grand-wrap {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }
    .share-grand-label {
      font-size: 28px;
      line-height: 1;
    }
    .share-grand-total {
      font-size: 45px;
      line-height: 0.95;
      font-weight: 800;
    }
    .share-riel-row {
      margin-top: 10px;
      font-size: 25px;
      color: #2c7f9c;
    }
    .share-mini-meta {
      color: #2c7f9c;
      font-size: 24px;
      line-height: 1.25;
      margin-bottom: 10px;
    }
    .share-service-row {
      font-size: 24px;
      color: #2c7f9c;
      align-items: center;
    }
    .share-bottom-separator {
      margin-top: 18px;
      margin-bottom: 20px;
    }
    .share-bottom-grid {
      display: grid;
      grid-template-columns: 430px minmax(0, 1fr);
      column-gap: 36px;
      align-items: end;
      min-height: 500px;
    }
    .share-bottom-grid.no-qr {
      grid-template-columns: minmax(0, 1fr);
    }
    .share-bottom-grid.no-number {
      grid-template-columns: 430px;
      justify-content: start;
    }
    .share-qr-side {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
    }
    .share-qr-box {
      width: 470px;
      max-width: 100%;
      aspect-ratio: 1 / 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: transparent;
    }
    .share-qr-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    .share-qr-label {
      margin-top: 16px;
      font-size: 76px;
      line-height: 0.96;
      font-weight: 800;
      color: #045f80;
      text-align: center;
    }
    .share-qr-name {
      margin-top: 6px;
      font-size: 44px;
      line-height: 1.08;
      font-weight: 800;
      color: #045f80;
      text-align: center;
      text-transform: uppercase;
      word-break: break-word;
    }
    .share-receipt-side {
      min-height: 470px;
      border-left: 2px dashed #5f99ae;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-left: 26px;
      padding-bottom: 20px;
    }
    .share-bottom-grid.no-qr .share-receipt-side {
      border-left: none;
      padding-left: 0;
      justify-content: flex-start;
    }
    .share-receipt-number {
      font-size: 190px;
      line-height: 0.88;
      font-weight: 800;
      color: #045f80;
      font-variant-numeric: tabular-nums;
    }
    .share-tail-space {
      height: 50px;
    }
  `;
}

function buildReceiptHTML() {
  const province = els.province.value || "-";
  const detailAddress = els.addressDetail.value || "-";
  const deliveryFee = Math.max(0, Number(els.deliveryFee.value || 0));
  const deliveryText = deliveryFee === 0 ? "ហ្វ្រីដឹក" : formatDisplayMoney(deliveryFee);
  const itemsTotal = getItemsTotal();
  const grand = itemsTotal + deliveryFee;
  const grandRiel = grand * 4100;
  const paymentText = els.payment.value || "-";
  const dateText = formatDateKH(els.date.value);
  const receiptNo = getReceiptNoValue();
  const qrMeta = getSelectedQrMeta();

  const rows = items.map((it, i) => `
    <div class="receipt-grid-row receipt-grid-body-row">
      <div class="col-product">${i + 1}. ${escapeHtml(it.name)}</div>
      <div class="col-qty">${it.qty} ឈុត</div>
      <div class="col-price">${formatDisplayMoney(it.price)}</div>
      <div class="col-subtotal">${formatDisplayMoney(it.subtotal)}</div>
    </div>
  `).join("");

  const showBottomBlock = !!(qrMeta || receiptNo);

  const qrBlock = showBottomBlock ? `
    <div class="receipt-bottom-section">
      <div class="receipt-bottom-grid">
        <div class="receipt-qr-column${!qrMeta ? " receipt-qr-column-empty" : ""}">
          ${qrMeta ? `
            <div class="receipt-qr-frame">
              <img class="receipt-qr-image" src="${escapeHtml(getAssetUrl(qrMeta.src))}" alt="${escapeHtml(qrMeta.label)} QR Code" />
            </div>
            <div class="receipt-qr-caption">${escapeHtml(qrMeta.label)}</div>
            ${qrMeta.name ? `<div class="receipt-qr-name">${escapeHtml(qrMeta.name)}</div>` : ""}
          ` : `
            <div class="receipt-qr-frame receipt-qr-frame-empty"></div>
            <div class="receipt-qr-caption">&nbsp;</div>
            <div class="receipt-qr-name">&nbsp;</div>
          `}
        </div>
        <div class="receipt-number-column">
          <div class="receipt-number-box">
            <div class="receipt-number-value">${escapeHtml(receiptNo)}</div>
          </div>
        </div>
      </div>
    </div>
  ` : "";

  return `
    <div class="print-card receipt-paper">
      <div class="receipt-head">
        <div class="receipt-title">វិក័យប័ត្រ</div>
        <div class="receipt-date">កាលបរិច្ឆេទ ${escapeHtml(dateText)}</div>
      </div>

      <div class="receipt-line"></div>

      <div class="receipt-info"><span>ឈ្មោះ:</span> <strong>${escapeHtml(els.customer.value || "-")}</strong></div>
      <div class="receipt-info"><span>លេខទូរសព្ទ:</span> <strong>${escapeHtml(els.phone.value || "-")}</strong></div>
      <div class="receipt-info"><span>ទីតាំង:</span> <div>${escapeHtml(detailAddress)}${province !== "-" ? ` : ${escapeHtml(province)}` : ""}</div></div>
      <div class="receipt-info"><span>ដឹកជញ្ជូន:</span> <div>${escapeHtml(els.deliveryName.value || "-")}</div></div>
      <div class="receipt-info"><span>Note:</span> <div>${escapeHtml(els.note.value || "-")}</div></div>

      <div class="receipt-line"></div>

      <div class="print-table receipt-table">
        <div class="receipt-grid-row receipt-grid-head-row">
          <div class="col-product">ផលិតផល</div>
          <div class="col-qty">ចំនួន</div>
          <div class="col-price">តម្លៃ</div>
          <div class="col-subtotal">សរុប</div>
        </div>
        <div class="receipt-table-body">${rows}</div>
      </div>

      <div class="receipt-line"></div>

      <div class="receipt-total-row">
        <span>តម្លៃសរុប</span>
        <span>${formatDisplayMoney(itemsTotal)}</span>
      </div>
      <div class="receipt-total-row">
        <span>សេវាដឹក</span>
        <span>${deliveryText}</span>
      </div>

      <div class="receipt-pay-row">
        <div>ការទូទាត់: <strong>${escapeHtml(paymentText)}</strong></div>
        <div class="receipt-grand">${formatDisplayMoney(grand)}</div>
      </div>

      <div class="receipt-pay-row">
        <div>ប្រាក់រៀលៈ</div>
        <div class="receipt-riel">${Math.round(grandRiel).toLocaleString()}៛</div>
      </div>

      <div class="receipt-line"></div>

      <div class="receipt-footer">
        <div>Page: <strong>${escapeHtml(els.page.value || "-")}</strong> | CloseBy: <strong>${escapeHtml(els.closeBy.value || "-")}</strong></div>
        <div class="receipt-phone">លេខបម្រើអតិថិជន 015 58 68 78 / 089 58 68 78</div>
      </div>
      ${qrBlock ? `<div class="receipt-line"></div>${qrBlock}` : ""}
    </div>
  `;
}

function getReceiptPrintStyles() {
  return `
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #111111;
      font-family: "Kantumruy Pro", sans-serif;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .preview-toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      justify-content: center;
      gap: 10px;
      padding: 12px;
      background: #ffffff;
      border-bottom: 1px solid #dddddd;
    }
    .preview-btn {
      border: none;
      border-radius: 999px;
      background: #111111;
      color: #ffffff;
      padding: 10px 18px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    .preview-btn.secondary { background: #666666; }
    .print-root,
    .share-capture-shell {
      width: 92mm;
      margin: 0 auto;
      padding: 4mm 2mm 3mm;
      background: #ffffff;
      overflow: hidden;
    }
    .print-card {
      width: 100%;
      margin: 0 auto;
      background: #ffffff;
      color: #111111;
    }
    .receipt-paper {
      width: 100%;
      font-size: 13px;
      line-height: 1.38;
    }
    .receipt-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .receipt-title {
      font-size: 28px;
      font-weight: 800;
      line-height: 1.05;
      color: #000000;
      letter-spacing: 0;
      word-break: keep-all;
      white-space: nowrap;
    }
    .receipt-date {
      font-size: 12px;
      color: #666666;
      text-align: right;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .receipt-line {
      border-top: 1px dashed #444444;
      margin: 6px 0;
    }
    .receipt-info {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      margin: 2px 0;
      font-size: 13px;
      line-height: 1.35;
    }
    .receipt-info span {
      display: inline-block;
      min-width: 82px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .receipt-info strong,
    .receipt-info div {
      word-break: break-word;
    }
    .receipt-table {
      width: 100%;
      font-size: 11px;
    }
    .receipt-grid-row {
      display: grid;
      grid-template-columns: minmax(0, 1.9fr) minmax(56px, 0.72fr) minmax(56px, 0.72fr) minmax(56px, 0.72fr);
      column-gap: 6px;
      align-items: start;
    }
    .receipt-grid-head-row {
      padding: 0 0 7px;
      border-bottom: 2px solid #111111;
      color: #000000;
      font-weight: 800;
    }
    .receipt-grid-body-row {
      padding: 4px 0;
      color: #222222;
    }
    .receipt-table .col-product {
      text-align: left;
      padding-right: 4px;
      word-break: break-word;
    }
    .receipt-table .col-qty {
      text-align: center;
      white-space: nowrap;
    }
    .receipt-table .col-price,
    .receipt-table .col-subtotal {
      text-align: right;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .share-capture-shell .receipt-table {
      font-size: 12px;
    }
    .share-capture-shell .receipt-table .col-product {
      width: 57%;
      padding-right: 10px;
      line-height: 1.16;
      word-break: normal;
      overflow-wrap: anywhere;
      vertical-align: top;
    }
    .share-capture-shell .receipt-table .col-qty {
      width: 13%;
      text-align: right;
      padding-right: 2px;
    }
    .share-capture-shell .receipt-table .col-price,
    .share-capture-shell .receipt-table .col-subtotal {
      width: 15%;
      text-align: right;
    }
    .share-capture-shell .receipt-table tbody td {
      padding: 4px 0;
    }
    .receipt-total-row,
    .receipt-pay-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
      margin: 4px 0;
      font-size: 12px;
    }
    .receipt-grand {
      font-size: 18px;
      font-weight: 800;
      color: #000000;
      line-height: 1.1;
    }
    .receipt-riel {
      text-align: right;
      font-size: 13px;
      color: #666666;
      margin-top: 2px;
    }
    .receipt-footer {
      font-size: 14px;
      line-height: 1.35;
    }
    .receipt-phone {
      margin-top: 4px;
      color: #666666;
    }
    .receipt-bottom-section {
      margin-top: 8px;
      break-inside: avoid-page;
      page-break-inside: avoid;
    }
    .receipt-bottom-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      column-gap: 10px;
      align-items: stretch;
    }
    .receipt-qr-column,
    .receipt-number-column {
      min-width: 0;
    }
    .receipt-qr-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      text-align: center;
    }
    .receipt-qr-column-empty {
      visibility: hidden;
    }
    .receipt-qr-frame,
    .receipt-number-box {
      width: 100%;
      aspect-ratio: 1 / 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .receipt-qr-frame-empty { background: transparent; }
    .receipt-qr-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    .receipt-qr-caption {
      margin-top: 8px;
      font-size: 18px;
      font-weight: 800;
      line-height: 1.05;
      text-align: center;
    }
    .receipt-qr-name {
      margin-top: 4px;
      font-size: 15px;
      font-weight: 800;
      line-height: 1.12;
      text-align: center;
      word-break: break-word;
    }
    .receipt-number-column {
      padding-left: 10px;
      border-left: 2px solid #111111;
      display: flex;
      align-items: stretch;
    }
    .receipt-number-box {
      padding: 0 2px;
    }
    .receipt-number-value {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 84px;
      line-height: 0.9;
      font-weight: 800;
      color: #000000;
      text-align: center;
      overflow: hidden;
      font-variant-numeric: tabular-nums;
    }
    .no-print { display: flex; }
    @media (max-width: 480px) {
      .receipt-number-value { font-size: 72px; }
      .receipt-qr-caption { font-size: 16px; }
      .receipt-qr-name { font-size: 14px; }
    }
    @media print {
      .no-print { display: none !important; }
    }
    @page {
      size: 80mm auto;
      margin: 0;
    }
  `;
}

function buildSummaryText() {
  const deliveryFee = Math.max(0, Number(els.deliveryFee.value || 0));
  const itemsTotal = getItemsTotal();
  const grand = itemsTotal + deliveryFee;
  const exchangeRate = 4100;
  const grandRiel = grand * exchangeRate;

  const dateText = formatDateKH(els.date.value);
  const customer = els.customer.value || "-";
  const phone = els.phone.value || "-";
  const province = els.province.value || "-";
  const detailAddress = els.addressDetail.value || "-";
  const note = els.note.value || "-";
  const payment = els.payment.value || "-";
  const page = els.page.value || "-";
  const closeBy = els.closeBy.value || "-";

  const money = (n) => formatDisplayMoney(n);
  const moneyRiel = (n) => `${Math.round(n).toLocaleString()}៛`;

  const header = [
    `វិក័យប័ត្រ                    | ${dateText}`,
    `..................................................`,
    `ឈ្មោះ:  ${customer}`,
    `លេខទូរសព្ទ: ${phone}`,
    `ទីតាំង: ${detailAddress} | ${province}`,
    `ដឹកជញ្ជូន:    ${els.deliveryName.value || "-"}`,
    `Note:   ${note}`,
    `..................................................`,
    `បញ្ជីផលិតផល`,
    `..................................................`,
  ].join("\n");

const lines = items.length
  ? items
      .map((it, i) => {
        const product = it.name || "-";
        const qty = it.qty ?? 0;
        const price = money(it.price);
        const subtotal = money(it.subtotal);

        return `${i + 1}. ${product}\n •ចំនួន: ${qty} ឈុត   តម្លៃ: ${price}   សរុប: ${subtotal}`;
      })
      .join("\n\n")
  : `មិនទាន់មានផលិតផល`;

  const footer = [
    `..................................................`,
    `តម្លៃសរុប៖\t\t\t: ${money(itemsTotal)}`,
    `សេវាដឹក៖\t\t\t\t: ${money(deliveryFee)}`,
    `ការទូទាត់៖ ${payment}\t\t : ${money(grand)}`,
    `ប្រាក់រៀល\t\t\t\t: ${moneyRiel(grandRiel)}`,
    `..................................................`,
    `Page: ${page} | ${closeBy}`,
    `លេខបម្រើអតិថិជន៖`,
    `• 015 58 68 78 • 089 58 68 78`,
    `..................................................`,
  ].join("\n");

  return `${header}\n${lines}\n${footer}`;
}

function formatDateKH(dateStr) {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function formatMoney(num) {
  return Number(num || 0).toFixed(2);
}

function formatDisplayMoney(num) {
  const n = Number(num || 0);
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

function toast(message, type = "info") {
  if (!els.toastContainer) return alert(message);
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  els.toastContainer.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(-8px)";
  }, 2200);
  setTimeout(() => el.remove(), 2600);
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  ta.remove();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
}

document.addEventListener("DOMContentLoaded", init);

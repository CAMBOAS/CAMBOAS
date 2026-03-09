// ===== State =====
let items = []; // {id, product, qty, price, discount, subtotal}

const el = (id) => document.getElementById(id);

// ===== Elements =====
const customProductWrapEl = el("customProductWrap");
const customProductEl = el("customProduct");

const productEl = el("product");
const qtyEl = el("qty");
const priceEl = el("price");
const discountEl = el("discount");
const deliveryFeeEl = el("deliveryFee");
const tbody = el("tbody");
const totalEl = el("total");

const noteEl = el("note");
const customerEl = el("customer");
const phoneEl = el("phone");
const dateEl = el("date");
const pageEl = el("page");
const closeByEl = el("closeBy");
const statusEl = el("status");
const deliveryNameEl = el("deliveryName");
const paymentEl = el("payment");

const btnAdd = el("btnAdd");
const btnClearRow = el("btnClearRow");
const btnPrint = el("btnPrint");

/* const btnCopy = el("btnCopy");
 */
btnCopy.addEventListener("click", async () => {
  const summary = buildSummaryText();

  try {
    await navigator.clipboard.writeText(summary);
    alert("Copied!");
  } catch (err) {
    console.error(err);
    alert("Copy failed. Your browser blocked clipboard.");
  }
});
const btnSave = el("btnSave");

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbxBklfyCd1rX9hSyoYf0RBAigRMhWvqgEgUCSyj6VXTo1Om4bZf-uSsO2-icI-zvmktPA/exec";

// ===== Theme Toggle =====
const themeToggleEl = el("themeToggle");

function applyTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("light-mode", isLight);

  if (themeToggleEl) {
    themeToggleEl.textContent = isLight ? "☀️" : "🌙";
    themeToggleEl.title = isLight ? "Switch to dark mode" : "Switch to light mode";
  }

  localStorage.setItem("cambo-theme", theme);
}

(function initTheme() {
  const savedTheme = localStorage.getItem("cambo-theme") || "dark";
  applyTheme(savedTheme);
})();

if (themeToggleEl) {
  themeToggleEl.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("light-mode") ? "dark" : "light";
    applyTheme(nextTheme);
  });
}

// ===== Init default date =====
(function initDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateEl.value = `${yyyy}-${mm}-${dd}`;
})();

// ===== Load saved custom products =====
(function loadSavedProducts() {
  const savedProducts = JSON.parse(localStorage.getItem("products") || "[]");
  const customOpt = [...productEl.options].find((o) => o.value === "__custom__");

  savedProducts.forEach((p) => {
    const exists = [...productEl.options].some((o) => o.value === p.name);
    if (exists) return;

    const opt = document.createElement("option");
    opt.value = p.name;
    opt.textContent = p.name;
    opt.dataset.price = p.price;
    productEl.insertBefore(opt, customOpt);
  });
})();

// ===== Payment buttons =====
el("paymentGroup").addEventListener("click", (e) => {
  const btn = e.target.closest(".seg-btn");
  if (!btn) return;

  document.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  paymentEl.value = btn.dataset.pay;
});

// ===== Product change => auto price =====
productEl.addEventListener("change", () => {
  const selected = productEl.value;

  if (selected === "__custom__") {
    customProductWrapEl.classList.remove("hidden");
    customProductEl.focus();
    priceEl.value = "0.00";
    return;
  }

  customProductWrapEl.classList.add("hidden");
  customProductEl.value = "";

  const opt = productEl.options[productEl.selectedIndex];
  const p = parseFloat(opt?.dataset?.price || "0");
  if (!Number.isNaN(p)) priceEl.value = p.toFixed(2);
});

// ===== Helpers =====
function money(n) {
  const x = Number(n || 0);
  return `$${x.toFixed(2)}`;
}

function calcSubtotal(qty, price, discount) {
  const q = Math.max(1, Number(qty || 1));
  const p = Math.max(0, Number(price || 0));
  const d = Math.max(0, Number(discount || 0));
  return Math.max(0, q * p - d);
}

function saveProducts() {
  const products = [...productEl.options]
    .filter((o) => o.value && o.value !== "__custom__")
    .map((o) => ({
      name: o.value,
      price: o.dataset.price || 0
    }));

  localStorage.setItem("products", JSON.stringify(products));
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clearRow() {
  productEl.value = "";
  customProductEl.value = "";
  customProductWrapEl.classList.add("hidden");
  qtyEl.value = 1;
  priceEl.value = 0;
  discountEl.value = 0;
}

function render() {
  tbody.innerHTML = "";

  items.forEach((it) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(it.product)}</td>
      <td class="num">${it.qty}</td>
      <td class="num">${money(it.price)}</td>
      <td class="num">${money(it.discount)}</td>
      <td class="num"><b>${money(it.subtotal)}</b></td>
      <td class="num">
        <button class="btn danger" style="padding:8px 12px; border-radius:12px;" data-del="${it.id}" type="button">Del</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  const deliveryFee = Math.max(0, Number(deliveryFeeEl.value || 0));
  const itemsTotal = items.reduce((s, it) => s + it.subtotal, 0);
  const grand = itemsTotal + deliveryFee;

  totalEl.textContent = money(grand);
}

function resetAllForm() {
  items = [];
  render();
  clearRow();

  pageEl.value = "";
  closeByEl.value = "";
  statusEl.value = "Pending";
  customerEl.value = "";
  phoneEl.value = "";

  const provinceEl = el("province");
  const addressDetailEl = el("addressDetail");
  if (provinceEl) provinceEl.value = "";
  if (addressDetailEl) addressDetailEl.value = "";

  deliveryNameEl.value = "";
  deliveryFeeEl.value = 0;
  noteEl.value = "";

  paymentEl.value = "";
  document.querySelectorAll("#paymentGroup .seg-btn").forEach((b) => b.classList.remove("active"));

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateEl.value = `${yyyy}-${mm}-${dd}`;
}

// ===== Add item =====
btnAdd.addEventListener("click", () => {
  let product = productEl.value.trim();

  if (!product) {
    productEl.focus();
    return;
  }

  if (product === "__custom__") {
    product = customProductEl.value.trim();

    if (!product) {
      customProductEl.focus();
      return;
    }

    const exists = [...productEl.options].some(
      (opt) => opt.value.trim().toLowerCase() === product.toLowerCase()
    );

    if (!exists) {
      const newOpt = document.createElement("option");
      newOpt.value = product;
      newOpt.textContent = product;
      newOpt.dataset.price = Number(priceEl.value || 0).toFixed(2);

      const customOpt = [...productEl.options].find((opt) => opt.value === "__custom__");
      productEl.insertBefore(newOpt, customOpt);
      saveProducts();
    }
  }

  const qty = Math.max(1, parseInt(qtyEl.value || "1", 10));
  const price = Math.max(0, Number(priceEl.value || 0));
  const discount = Math.max(0, Number(discountEl.value || 0));
  const subtotal = calcSubtotal(qty, price, discount);

  items.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    product,
    qty,
    price,
    discount,
    subtotal
  });

  render();
  clearRow();
});

btnClearRow.addEventListener("click", clearRow);

// ===== Delete row =====
tbody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-del]");
  if (!btn) return;

  const id = btn.dataset.del;
  items = items.filter((x) => x.id !== id);
  render();
});

// ===== Recalc total on delivery fee change =====
deliveryFeeEl.addEventListener("input", render);

// ===== Print helpers =====
function formatDateKH(dateStr) {
  if (!dateStr) return "-";
  const [y, m, d] = String(dateStr).split("-");
  return `${d}/${m}/${y}`;
}

function buildReceiptHTML() {
  const province = el("province")?.value || "-";
  const detailAddress = el("addressDetail")?.value || "-";

  const deliveryFee = Math.max(0, Number(deliveryFeeEl.value || 0));
  const itemsTotal = items.reduce((s, it) => s + it.subtotal, 0);
  const grand = itemsTotal + deliveryFee;

  const rows = items
    .map(
      (it) => `
        <tr>
          <td style="padding-right:6px;">${escapeHtml(it.product)}</td>
          <td class="t-center">${it.qty}</td>
          <td class="t-right">${Number(it.price || 0).toFixed(2)}</td>
          <td class="t-right">${Number(it.subtotal || 0).toFixed(2)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div class="print-card">
      <div class="print-row">
        <div class="print-title">វិក័យប័ត្រ</div>
        <div class="print-muted">កាលបរិច្ឆេទ ${escapeHtml(formatDateKH(dateEl.value))}</div>
      </div>

      <div class="print-hr"></div>

      <div>ឈ្មោះ: <strong>${escapeHtml(customerEl.value || "-")}</strong></div>
      <div>លេខទូរសព្ទ: <strong>${escapeHtml(phoneEl.value || "-")}</strong></div>
      <div>ទីតាំង: ${escapeHtml(province)} <strong>:</strong> ${escapeHtml(detailAddress)}</div>
      <div>Note: ${escapeHtml(noteEl.value || "-")}</div>
      <div>Page: <strong>${escapeHtml(pageEl.value || "-")}</strong> | CloseBy: ${escapeHtml(closeByEl.value || "-")}</div>

      <div class="print-hr"></div>

      <table class="print-table">
        <thead>
          <tr>
            <th style="text-align:left;">ផលិតផល</th>
            <th class="t-center">ចំនួន</th>
           <th class="t-right">តម្លៃ</th>
            <th class="t-right">សរុប</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="4">No items</td></tr>`}
        </tbody>
      </table>
      <div class="print-hr"></div>
      <div class="print-row">
        <div>តម្លៃសរុប</div>
        <div>$${itemsTotal.toFixed(2)}</div>
      </div>
      <div class="print-row">
        <div>សេវាដឹក</div>
        <div>$${deliveryFee.toFixed(2)}</div>
      </div>
      <div class="print-row">
         <div>ការទូទាត់: <strong>${escapeHtml(paymentEl.value || "-")}</strong></div>
         <strong><div>$${grand.toFixed(2)}</div></strong>
      </div>
      <div class="print-hr"></div>
      <div class="print-muted">លេខបម្រើអតិថិជន 015 58 68 78 / 089 58 68 78</div>
      <div class="print-hr"></div>
    </div>
  `;
}

btnPrint.addEventListener("click", () => {
  if (items.length === 0) {
    alert("No items to print!");
    return;
  }

  const printArea = el("printArea");
  printArea.innerHTML = buildReceiptHTML();
  printArea.style.display = "block";

  window.print();

  setTimeout(() => {
    printArea.style.display = "none";
    printArea.innerHTML = "";
  }, 300);
});

// ===== Copy summary =====
function buildSummaryText() {
  const deliveryFee = Math.max(0, Number(deliveryFeeEl.value || 0));
  const itemsTotal = items.reduce((s, it) => s + it.subtotal, 0);
  const grand = itemsTotal + deliveryFee;

  const province = el("province")?.value || "-";
  const detailAddress = el("addressDetail")?.value || "-";
  const dateText = dateEl.value ? formatDateKH(dateEl.value) : "-";

  const customer = customerEl.value || "-";
  const phone = phoneEl.value || "-";
  const page = pageEl.value || "-";
  const closeBy = closeByEl.value || "-";
  const payment = paymentEl.value || "-";
  const note = noteEl.value || "-";

  const header = [
    `វិក័យប័ត្រ \t\t| ${dateText}`,
    `ឈ្មោះ: ${customer}`,
    `លេខទូរសព្ទ: ${phone}`,
    `ទីតាំង: ${province} | ${detailAddress}`,
    `Page: ${page} | CloseBy: ${closeBy}`,
    `Note: ${note}`,
    `-------------------------------------------`,
    `បញ្ជីផលិតផល`,
    `-------------------------------------------`
  ].join("\n");
  const lines = items.length
    ? items.map((it, i) => {
        const product = it.product || "-";
        const qty = it.qty ?? 0;
        const price = money(it.price);
        const subtotal = money(it.subtotal);
        return [
          `${i + 1}. ${product}`,
          `   ចំនួន   : ${qty}`,
          `   តម្លៃ    : ${price}`,
          `   សរុប    : ${subtotal}`
        ].join("\n");
      }).join("\n")
    : `មិនទាន់មានផលិតផល`;
  const footer = [
    `===========================================`,
    `តម្លៃសរុប    : ${money(itemsTotal)}`,
    `សេវាដឹក     : ${money(deliveryFee)}`,
    `ការទូទាត់    : ${payment}`,
    `សរុបត្រូវបង់  : ${money(grand)}`,
    `-------------------------------------------`,
    `លេខបម្រើអតិថិជន 015 58 68 78 / 089 58 68 78`,
    `-------------------------------------------`

    
    
    
  ].join("\n");

  return `${header}\n${lines}\n${footer}`;
}
// ===== Save to Google Sheet =====
function collectPayloadForSheet() {
  const deliveryFee = Math.max(0, Number(deliveryFeeEl.value || 0));
  const itemsTotal = items.reduce((s, it) => s + it.subtotal, 0);
  const grand = itemsTotal + deliveryFee;

  return {
    dateTime: new Date().toISOString(),
    orderId: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    page: pageEl.value || "",
    closeBy: closeByEl.value || "",
    status: statusEl.value || "",
    customer: customerEl.value || "",
    phone: phoneEl.value || "",
    province: el("province")?.value || "",
    detailAddress: el("addressDetail")?.value || "",
    deliveryName: deliveryNameEl.value || "",
    deliveryFee,
    payment: paymentEl.value || "",
    note: noteEl.value || "",
    items,
    total: grand
  };
}

btnSave.addEventListener("click", async () => {
  if (items.length === 0) {
    alert("No items to save!");
    return;
  }

  const payload = collectPayloadForSheet();

  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.ok) {
      macAlert(`Saved successfully\nOrderID: ${data.orderId || "-"}\nItems: ${data.rowsAdded || items.length}`);
      resetAllForm();
    } else {
      macAlert(`Save failed ❌\n${data.error || "Unknown error"}`, "error");
    }
  } catch (err) {
    console.error(err);
    macAlert("Save error ❌\nIf CORS: redeploy Web App as Anyone.", "error");
  }
});

// ===== Initial render =====
render();


function macAlert(message, type="success"){

  const alert = document.getElementById("macAlert")
  const text = document.getElementById("macAlertText")

  alert.classList.remove("error","warn")

  if(type==="error") alert.classList.add("error")
  if(type==="warn") alert.classList.add("warn")

  text.textContent = message

  alert.classList.add("show")

  setTimeout(()=>{
    alert.classList.remove("show")
  },3000)

}

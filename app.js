// ===== State =====
let items = []; // {id, product, qty, price, discount, subtotal}

const el = (id) => document.getElementById(id);

// ===== Elements =====
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

// Buttons
const btnAdd = el("btnAdd");
const btnClearRow = el("btnClearRow");
const btnPrint = el("btnPrint");
const btnCopy = el("btnCopy");
const btnSave = el("btnSave");

// ✅ Your Google Apps Script Web App URL
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbxBklfyCd1rX9hSyoYf0RBAigRMhWvqgEgUCSyj6VXTo1Om4bZf-uSsO2-icI-zvmktPA/exec";

// ===== Init default date =====
(function initDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateEl.value = `${yyyy}-${mm}-${dd}`;
})();

// ===== Payment buttons =====
document.getElementById("paymentGroup").addEventListener("click", (e) => {
  const btn = e.target.closest(".seg-btn");
  if (!btn) return;

  document.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  paymentEl.value = btn.dataset.pay;
});

// ===== Product change => auto price =====
productEl.addEventListener("change", () => {
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

function render() {
  tbody.innerHTML = "";

  // items already newest-first because we use unshift()
  items.forEach((it) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(it.product)}</td>
      <td class="num">${it.qty}</td>
      <td class="num">${money(it.price)}</td>
      <td class="num">${money(it.discount)}</td>
      <td class="num"><b>${money(it.subtotal)}</b></td>
      <td class="num">
        <button class="btn danger" style="padding:8px 12px; border-radius:12px;" data-del="${it.id}">Del</button>
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
  // 1) Clear items + table
  items = [];
  render();

  // 2) Clear Product row inputs
  clearRow();

  // 3) Clear Customer/Order fields
  pageEl.value = "";
  closeByEl.value = "";
  statusEl.value = "Pending"; // default (change if you want)
  customerEl.value = "";
  phoneEl.value = "";

  // Province + Detail Address
  const provinceEl = document.getElementById("province");
  const addressDetailEl = document.getElementById("addressDetail");
  if (provinceEl) provinceEl.value = "";
  if (addressDetailEl) addressDetailEl.value = "";

  // Delivery
  deliveryNameEl.value = "";
  deliveryFeeEl.value = 0;

  // Note
  noteEl.value = "";

  // Payment segmented: clear active + clear text
  paymentEl.value = "";
  document.querySelectorAll("#paymentGroup .seg-btn").forEach(b => b.classList.remove("active"));

  // Search (if exists)
  const searchEl = document.getElementById("search");
  if (searchEl) searchEl.value = "";

  // Date: reset to today (or you can keep current date if you want)
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateEl.value = `${yyyy}-${mm}-${dd}`;
}

function clearRow() {
  productEl.value = "";
  qtyEl.value = 1;
  priceEl.value = 0;
  discountEl.value = 0;
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ===== Add item =====
btnAdd.addEventListener("click", () => {
  const product = productEl.value.trim();
  if (!product) {
    alert("Please select product!");
    productEl.focus();
    return;
  }

  const qty = Math.max(1, parseInt(qtyEl.value || "1", 10));
  const price = Math.max(0, Number(priceEl.value || 0));
  const discount = Math.max(0, Number(discountEl.value || 0));
  const subtotal = calcSubtotal(qty, price, discount);

  items.unshift({
    id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    product,
    qty,
    price,
    discount,
    subtotal,
  });

  render();
  clearRow();
});

// ===== Clear inputs =====
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

// ===== Print =====


function formatDateKH(dateStr) {
  // dateStr from input type="date" => YYYY-MM-DD
  if (!dateStr) return "-";
  const [y,m,d] = String(dateStr).split("-");
  return `${d}/${m}/${y}`;
}

//-------------------------|| Receipt HTML for Print ||-------------------------//
//-- You can customize the receipt design here. It uses inline styles for simplicity, but you can also use CSS classes and define styles in a separate CSS file if you prefer. --//
//-- The buildReceiptHTML function collects all the necessary data from the form and items, and constructs an HTML string that represents the receipt. --//
//-- It includes order details, a table of items, totals, and any other relevant information you want to display on the printed receipt. --// 

function buildReceiptHTML() {
  const province = document.getElementById("province")?.value || "-";
  const detailAddress = document.getElementById("addressDetail")?.value || "-";

  const deliveryFee = Math.max(0, Number(deliveryFeeEl.value || 0));
  const itemsTotal = items.reduce((s, it) => s + it.subtotal, 0);
  const grand = itemsTotal + deliveryFee;

  const rows = items.map((it) => `
    <tr>
      <td style="padding-right:6px;">${escapeHtml(it.product)}</td>
      <td class="t-center">${it.qty}</td>
      <td class="t-right">${Number(it.price || 0).toFixed(0)}</td>
      <td class="t-right">${Number(it.subtotal || 0).toFixed(0)}</td>
    </tr>
  `).join("");

  return `
    <div class="print-card">
      <div class="print-row">
        <div class="print-title">វិក័យប័ត្រ</div>
        <div class="print-muted">កាលបរិច្ឆេទ ${escapeHtml(formatDateKH(dateEl.value))}</div>
      </div>

      <div class="print-hr"></div>

      
      <div>👤 ឈ្មោះ: <strong>${escapeHtml(customerEl.value || "-")}</strong></div>
      <div>📞 លេខទូរសព្ទ: <strong>${escapeHtml(phoneEl.value || "-")}</strong></div>
      <div>💳 ការទូទាត់: <strong>${escapeHtml(paymentEl.value || "-")}</strong></div>
      <div>📍 ទីតាំង: ${escapeHtml(province)} <strong>:</strong>  ​${escapeHtml(detailAddress)}</div>
      <div>📝 Note: ${escapeHtml(noteEl.value || "-")}</div>
      <div>📈 Page: <strong>${escapeHtml(pageEl.value || "-")}</strong> <strong>|</strong> CloseBy: ${escapeHtml(closeByEl.value || "-")}</div>
      <div>🚚 Delivery: ${escapeHtml(deliveryNameEl.value || "-")} <strong>|</strong> Fee: $${deliveryFee.toFixed(0)}</div>


      <div class="print-hr"></div>
      <table class="print-table">
        <thead>
          <tr>
            <th style="text-align:left;">Product</th>
            <th class="t-center">Q</th>
            <th class="t-right">Price</th>
            <th class="t-right">Sub</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="4">No items</td></tr>`}
        </tbody>
      </table>

      <div class="print-hr"></div>

      <div class="print-row">
        <div>Items Total</div>
        <div>$${itemsTotal.toFixed(0)}</div>
      </div>
      <div class="print-row">
        <div>Delivery Fee</div>
        <div>$${deliveryFee.toFixed(0)}</div>
      </div>

      <div class="print-total">$${grand.toFixed(0)}</div>

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

  const printArea = document.getElementById("printArea");
  printArea.innerHTML = buildReceiptHTML();   // (ប្រើ function receipt របស់អ្នក)
  printArea.style.display = "block";

  window.print();

  // បិទក្រោយ print
  setTimeout(() => {
    printArea.style.display = "none";
    printArea.innerHTML = "";
  }, 300);
});

// ===== Copy summary =====


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

function buildSummaryText() {
  const deliveryFee = Math.max(0, Number(deliveryFeeEl.value || 0));
  const itemsTotal = items.reduce((s, it) => s + it.subtotal, 0);
  const grand = itemsTotal + deliveryFee;

  const province = document.getElementById("province")?.value || "-";
  const detailAddress = document.getElementById("addressDetail")?.value || "-";

  const dateText = dateEl.value ? formatDateKH(dateEl.value) : "-";

  const header = [
    `វិក័យប័ត្រ • ${dateText}`,
    `👤 ឈ្មោះ: ${customerEl.value || "-"}`,
    `📞 លេខទូរសព្ទ: ${phoneEl.value || "-"}`,
    `💳 ការទូទាត់: ${paymentEl.value || "-"}`,
    `📍 ទីតាំង: ${province} | ${detailAddress}`,
    
/*     `📝 Note: ${noteEl.value || "-"}`,
 */    
    `📈 Page: ${pageEl.value || "-"} | CloseBy: ${closeByEl.value || "-"}`,
    `🚚 Delivery: ${deliveryNameEl.value || "-"} | Fee: ${money(deliveryFee)}`,noteEl.value ? 
    `📝 Note: ${noteEl.value}` : `📝 Note: -`,
    `--------------------------------`
  ].join("\n");

  const lines = items.map((it, i) => {
    const p = it.product || "-";
    const q = it.qty ?? 0;
    const pr = money(it.price);
    const sub = money(it.subtotal);
    return `${i + 1}) ${p}\n   Q:${q}  Price:${pr}  Sub:${sub}`;
  }).join("\n");

  const footer = [
    `--------------------------------`,
    `Items Total: ${money(itemsTotal)}`,
    `Delivery Fee: ${money(deliveryFee)}`,
    `GRAND TOTAL: ${money(grand)}`
  ].join("\n");

  return `${header}\n${lines}\n${footer}`;
}

// ✅ ===== Save to Google Sheet (CAMBO_ORDERS) =====
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
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.ok) {
      alert(`Saved ✅\nOrderID: ${data.orderId || "-"}\nItems: ${data.rowsAdded || items.length}`);

      // ✅ Clear ALL form after successful save
      resetAllForm();
    } else {
      alert(`Save failed ❌\n${data.error || "Unknown error"}`);
    }
  } catch (err) {
    console.error(err);
    alert("Save error ❌\nIf CORS: redeploy Web App as Anyone.");
  }
});

// ✅ Clear ALL fields in the form
function resetAllForm() {
  // 1) Clear items + table
  items = [];
  render();

  // 2) Clear product row inputs
  clearRow();

  // 3) Clear main form fields
  pageEl.value = "";
  closeByEl.value = "";
  statusEl.value = "Pending"; // default
  customerEl.value = "";
  phoneEl.value = "";

  // Province + Detail Address
  const provinceEl = document.getElementById("province");
  const addressDetailEl = document.getElementById("addressDetail");
  if (provinceEl) provinceEl.value = "";
  if (addressDetailEl) addressDetailEl.value = "";

  // Delivery
  deliveryNameEl.value = "";
  deliveryFeeEl.value = 0;

  // Payment (segmented)
  paymentEl.value = "";
  document.querySelectorAll("#paymentGroup .seg-btn").forEach((b) => b.classList.remove("active"));

  // Note
  noteEl.value = "";

  // Search (if exists)
  const searchEl = document.getElementById("search");
  if (searchEl) searchEl.value = "";

  // Date reset to today
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateEl.value = `${yyyy}-${mm}-${dd}`;
}

// Payload for 1-sheet readable columns (no JSON columns)
function collectPayloadForSheet() {
  const deliveryFee = Math.max(0, Number(deliveryFeeEl.value || 0));
  const itemsTotal = items.reduce((s, it) => s + it.subtotal, 0);
  const grand = itemsTotal + deliveryFee;

  return {
    dateTime: new Date().toISOString(),
    orderId: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),

    page: pageEl.value || "",
    closeBy: closeByEl.value || "",
    status: statusEl.value || "",

    customer: customerEl.value || "",
    phone: phoneEl.value || "",

    province: document.getElementById("province")?.value || "",
    detailAddress: document.getElementById("addressDetail")?.value || "",

    deliveryName: deliveryNameEl.value || "",
    deliveryFee,

    payment: paymentEl.value || "",

  
    note: noteEl.value || "",

    items,
    total: grand,
  };
}

// initial render
render();
const records = [
  {
    id: "ORD-280101",
    date: "2026-03-07",
    customer: "Tata",
    phone: "09823048023",
    page: "Brand1 CCR",
    closeBy: "Admin",
    province: "រាជធានីភ្នំពេញ",
    address: "ភ្នំពេញ តាធំ",
    deliveryName: "J&T",
    deliveryFee: 1.5,
    payment: "ABA",
    status: "Pending",
    note: "ទូរសព្ទសរសេរខុសម្តង ត្រូវឆែកម្តងទៀត",
    products: [
      {
        name: "សាប៊ូដុសខ្លួន ផ្កាកុលាប",
        qty: 1,
        price: 10,
        discount: 0,
        subtotal: 10
      },
      {
        name: "ម៉ាស់បិទមុខ 6D CCR",
        qty: 1,
        price: 15,
        discount: 0,
        subtotal: 15
      }
    ]
  },
  {
    id: "ORD-280102",
    date: "2026-03-06",
    customer: "Sokha",
    phone: "012345678",
    page: "JELY BRAND BY HELEN",
    closeBy: "Srey Phear",
    province: "ខេត្តកំពង់ចាម",
    address: "ផ្សារកំពង់ចាម",
    deliveryName: "Vireak Buntham",
    deliveryFee: 2,
    payment: "Wing",
    status: "Confirmed",
    note: "អតិថិជនស្នើឲ្យប្តូរទីតាំង",
    products: [
      {
        name: "សាប៊ូកក់សក់ និងម៉ាសសក់ CCR",
        qty: 2,
        price: 16,
        discount: 1,
        subtotal: 31
      }
    ]
  },
  {
    id: "ORD-280103",
    date: "2026-03-06",
    customer: "Dalin",
    phone: "0978882233",
    page: "Helen CCR",
    closeBy: "Jonh Helen",
    province: "ខេត្តបាត់ដំបង",
    address: "បាត់ដំបង សង្កាត់ស្វាយប៉ោ",
    deliveryName: "J&T",
    deliveryFee: 2.5,
    payment: "AC",
    status: "Delivered",
    note: "គ្មានបញ្ហា",
    products: [
      {
        name: "កាហ្វេសម្រក CCR",
        qty: 1,
        price: 18,
        discount: 0,
        subtotal: 18
      },
      {
        name: "ហ្វៃប័រផាសិន CCR",
        qty: 1,
        price: 18,
        discount: 0,
        subtotal: 18
      }
    ]
  },
  {
    id: "ORD-280104",
    date: "2026-03-05",
    customer: "Pheakdey",
    phone: "086111222",
    page: "JELY CCR BRAND",
    closeBy: "Bong Phear",
    province: "ខេត្តសៀមរាប",
    address: "សៀមរាប ក្បែរផ្សារចាស់",
    deliveryName: "Other",
    deliveryFee: 1,
    payment: "Delivery",
    status: "Cancel",
    note: "លេខខុស ហៅមិនចូល",
    products: [
      {
        name: "BB Cream CCR",
        qty: 1,
        price: 9.5,
        discount: 0,
        subtotal: 9.5
      }
    ]
  },
  {
    id: "ORD-280105",
    date: "2026-03-04",
    customer: "Helen",
    phone: "015586878",
    page: "Brand1 CCR",
    closeBy: "Admin",
    province: "រាជធានីភ្នំពេញ",
    address: "សែនសុខ",
    deliveryName: "ដឹកខ្លួនឯង",
    deliveryFee: 0,
    payment: "ABA",
    status: "Delivered",
    note: "VIP customer",
    products: [
      {
        name: "សាប៊ូកក់សក់ និងម៉ាសសក់ Premium CCR",
        qty: 1,
        price: 16,
        discount: 0,
        subtotal: 16
      },
      {
        name: "ប្រេងលាបសក់ CCR ឬសេរ៉ូមសក់ VIP",
        qty: 1,
        price: 12,
        discount: 0,
        subtotal: 12
      },
      {
        name: "SUNSCREEN CCR",
        qty: 1,
        price: 9.5,
        discount: 0,
        subtotal: 9.5
      }
    ]
  }
];

let currentRecordId = null;

const $ = (id) => document.getElementById(id);

const resultsBody = $("resultsBody");
const resultText = $("resultText");
const activeFiltersText = $("activeFiltersText");
const searchInput = $("searchInput");
const statusFilter = $("statusFilter");
const pageFilter = $("pageFilter");
const closeByFilter = $("closeByFilter");
const dateFilter = $("dateFilter");
const detailDrawer = $("detailDrawer");
const productLines = $("productLines");

const editOrderId = $("editOrderId");
const editDate = $("editDate");
const editCustomer = $("editCustomer");
const editPhone = $("editPhone");
const editPage = $("editPage");
const editCloseBy = $("editCloseBy");
const editProvince = $("editProvince");
const editDeliveryName = $("editDeliveryName");
const editAddress = $("editAddress");
const editPayment = $("editPayment");
const editStatus = $("editStatus");
const editDeliveryFee = $("editDeliveryFee");
const editGrandTotal = $("editGrandTotal");
const editNote = $("editNote");

function money(v) {
  return "$" + Number(v || 0).toFixed(2);
}

function calcRecordTotal(record) {
  return (
    record.products.reduce((sum, product) => {
      return (
        sum +
        (Number(product.qty || 0) * Number(product.price || 0) -
          Number(product.discount || 0))
      );
    }, 0) + Number(record.deliveryFee || 0)
  );
}

function normalizeRecord(record) {
  record.products = record.products.map((product) => ({
    ...product,
    qty: Number(product.qty || 0),
    price: Number(product.price || 0),
    discount: Number(product.discount || 0),
    subtotal:
      Number(product.qty || 0) * Number(product.price || 0) -
      Number(product.discount || 0)
  }));

  record.total = calcRecordTotal(record);
  return record;
}

records.forEach(normalizeRecord);

function statusClass(status) {
  status = String(status || "").toLowerCase();

  if (status === "pending") return "pending";
  if (status === "confirmed" || status === "delivered") return "confirmed";
  if (status === "cancel") return "cancel";

  return "pending";
}

function getFilteredData() {
  const q = searchInput.value.trim().toLowerCase();

  return records.filter((record) => {
    return (
      (!q ||
        record.customer.toLowerCase().includes(q) ||
        record.phone.toLowerCase().includes(q)) &&
      (!statusFilter.value || record.status === statusFilter.value) &&
      (!pageFilter.value || record.page === pageFilter.value) &&
      (!closeByFilter.value || record.closeBy === closeByFilter.value) &&
      (!dateFilter.value || record.date === dateFilter.value)
    );
  });
}

function fillFilterOptions() {
  [...new Set(records.map((record) => record.page))]
    .sort()
    .forEach((value) => {
      pageFilter.insertAdjacentHTML("beforeend", `<option>${value}</option>`);
    });

  [...new Set(records.map((record) => record.closeBy))]
    .sort()
    .forEach((value) => {
      closeByFilter.insertAdjacentHTML("beforeend", `<option>${value}</option>`);
    });
}

function renderSummary(data) {
  $("totalRecords").textContent = data.length;
  $("pendingCount").textContent = data.filter(
    (record) => record.status === "Pending"
  ).length;
  $("deliveredCount").textContent = data.filter(
    (record) => record.status === "Delivered"
  ).length;
  $("revenueCount").textContent = money(
    data.reduce((sum, record) => sum + record.total, 0)
  );
}

function getProductSummary(record) {
  if (!record.products.length) return "-";
  if (record.products.length === 1) return record.products[0].name;

  return `${record.products[0].name} + ${record.products.length - 1} more`;
}

function renderActiveFilters() {
  const tags = [];

  if (searchInput.value.trim()) {
    tags.push(`Search: ${searchInput.value.trim()}`);
  }

  if (statusFilter.value) {
    tags.push(`Status: ${statusFilter.value}`);
  }

  if (pageFilter.value) {
    tags.push(`Page: ${pageFilter.value}`);
  }

  if (closeByFilter.value) {
    tags.push(`CloseBy: ${closeByFilter.value}`);
  }

  if (dateFilter.value) {
    tags.push(`Date: ${dateFilter.value}`);
  }

  activeFiltersText.textContent = tags.length ? tags.join(" | ") : "No filters";
}

function renderTable() {
  const data = getFilteredData();

  renderSummary(data);
  renderActiveFilters();

  resultsBody.innerHTML = data.length
    ? data
        .map(
          (record) => `
      <tr>
        <td>${record.date}</td>
        <td>
          <span class="click-name" onclick="openDrawer('${record.id}')">
            ${record.customer}
          </span>
        </td>
        <td class="phone">${record.phone}</td>
        <td>${record.page}</td>
        <td>${record.closeBy}</td>
        <td>${record.province}</td>
        <td>${getProductSummary(record)}</td>
        <td class="amount">${money(record.total)}</td>
        <td>${record.payment}</td>
        <td>
          <span class="pill ${statusClass(record.status)}">
            ${record.status}
          </span>
        </td>
        <td>
          <div class="icon-actions">
            <button class="icon-btn" onclick="openDrawer('${record.id}')">✎</button>
            <button class="icon-btn" onclick="openDrawer('${record.id}')">👁</button>
          </div>
        </td>
      </tr>
    `
        )
        .join("")
    : `
      <tr>
        <td colspan="11" style="text-align:center;padding:28px;color:#6b7280;">
          No data found.
        </td>
      </tr>
    `;

  resultText.textContent = `Showing ${data.length} record${
    data.length !== 1 ? "s" : ""
  }`;
}


function syncDetailSummary() {
  $("detailOrderIdText").textContent = editOrderId.value || "-";
  $("detailStatusText").textContent = editStatus.value || "-";
  $("detailGrandTotalText").textContent = editGrandTotal.value || "$0.00";
}

function recalcLiveTotal() {
  let productsTotal = 0;

  [...productLines.querySelectorAll("tr")].forEach((row) => {
    const qty = Number(row.querySelector(".line-qty").value || 0);
    const price = Number(row.querySelector(".line-price").value || 0);
    const discount = Number(row.querySelector(".line-discount").value || 0);
    const subtotal = qty * price - discount;

    row.querySelector(".line-subtotal").textContent = money(subtotal);
    productsTotal += subtotal;
  });

  editGrandTotal.value = money(productsTotal + Number(editDeliveryFee.value || 0));
  syncDetailSummary();
}

function attachLineEvents() {
  productLines
    .querySelectorAll(".line-qty, .line-price, .line-discount")
    .forEach((input) => {
      input.addEventListener("input", recalcLiveTotal);
    });
}

function buildProductRows(products) {
  productLines.innerHTML = products
    .map(
      (product, index) => `
      <tr>
        <td>
          <input class="input line-name" value="${product.name}">
        </td>
        <td>
          <input class="input line-qty" type="number" min="1" step="1" value="${product.qty}">
        </td>
        <td>
          <input class="input line-price" type="number" min="0" step="0.01" value="${product.price}">
        </td>
        <td>
          <input class="input line-discount" type="number" min="0" step="0.01" value="${product.discount}">
        </td>
        <td class="line-subtotal">${money(product.subtotal)}</td>
        <td>
          <button class="ghost-btn row-remove" type="button" onclick="removeLine(${index})">
            Remove
          </button>
        </td>
      </tr>
    `
    )
    .join("");

  attachLineEvents();
  recalcLiveTotal();
}

function openDrawer(id) {
  const record = records.find((item) => item.id === id);
  if (!record) return;

  currentRecordId = id;

  editOrderId.value = record.id;
  editDate.value = record.date;
  editCustomer.value = record.customer;
  editPhone.value = record.phone;
  editPage.value = record.page;
  editCloseBy.value = record.closeBy;
  editProvince.value = record.province;
  editDeliveryName.value = record.deliveryName;
  editAddress.value = record.address;
  editPayment.value = record.payment;
  editStatus.value = record.status;
  editDeliveryFee.value = Number(record.deliveryFee || 0).toFixed(2);
  editNote.value = record.note;

  buildProductRows(record.products);
  syncDetailSummary();
  detailDrawer.classList.add("open");
}

function closeDrawer() {
  detailDrawer.classList.remove("open");
  currentRecordId = null;
}

function removeLine(index) {
  const rows = [...productLines.querySelectorAll("tr")];

  if (rows[index]) {
    rows[index].remove();
  }

  [...productLines.querySelectorAll(".row-remove")].forEach((button, idx) => {
    button.setAttribute("onclick", `removeLine(${idx})`);
  });

  recalcLiveTotal();
}

window.openDrawer = openDrawer;
window.removeLine = removeLine;

function collectProductsFromUI() {
  return [...productLines.querySelectorAll("tr")]
    .map((row) => ({
      name: row.querySelector(".line-name").value.trim(),
      qty: Number(row.querySelector(".line-qty").value || 0),
      price: Number(row.querySelector(".line-price").value || 0),
      discount: Number(row.querySelector(".line-discount").value || 0),
      subtotal:
        Number(row.querySelector(".line-qty").value || 0) *
          Number(row.querySelector(".line-price").value || 0) -
        Number(row.querySelector(".line-discount").value || 0)
    }))
    .filter((item) => item.name);
}

function saveChanges() {
  const record = records.find((item) => item.id === currentRecordId);
  if (!record) return;

  record.date = editDate.value;
  record.customer = editCustomer.value.trim();
  record.phone = editPhone.value.trim();
  record.page = editPage.value.trim();
  record.closeBy = editCloseBy.value.trim();
  record.province = editProvince.value.trim();
  record.deliveryName = editDeliveryName.value.trim();
  record.address = editAddress.value.trim();
  record.payment = editPayment.value.trim();
  record.status = editStatus.value;
  record.deliveryFee = Number(editDeliveryFee.value || 0);
  record.note = editNote.value.trim();
  record.products = collectProductsFromUI();

  normalizeRecord(record);
  renderTable();
  syncDetailSummary();

  alert("Save បានរួចហើយនៅក្នុង UI Demo នេះ។");
}

function deleteCurrentRecord() {
  if (!currentRecordId) return;

  const index = records.findIndex((item) => item.id === currentRecordId);
  if (index === -1) return;

  records.splice(index, 1);
  closeDrawer();
  renderTable();

  alert("Record ត្រូវបានលុបចេញពី UI Demo ហើយ។");
}

function resetFilters() {
  searchInput.value = "";
  statusFilter.value = "";
  pageFilter.value = "";
  closeByFilter.value = "";
  dateFilter.value = "";

  renderTable();
}

[searchInput, statusFilter, pageFilter, closeByFilter, dateFilter].forEach((el) => {
  el.addEventListener("input", renderTable);
  el.addEventListener("change", renderTable);
});

editDeliveryFee.addEventListener("input", recalcLiveTotal);
editStatus.addEventListener("change", syncDetailSummary);

$("clearFiltersBtn").addEventListener("click", resetFilters);
$("drawerBackdrop").addEventListener("click", closeDrawer);
$("closeDrawerBtn").addEventListener("click", closeDrawer);
$("cancelEditBtn").addEventListener("click", closeDrawer);

$("addLineBtn").addEventListener("click", () => {
  const row = document.createElement("tr");

  row.innerHTML = `
    <td><input class="input line-name" value=""></td>
    <td><input class="input line-qty" type="number" min="1" step="1" value="1"></td>
    <td><input class="input line-price" type="number" min="0" step="0.01" value="0"></td>
    <td><input class="input line-discount" type="number" min="0" step="0.01" value="0"></td>
    <td class="line-subtotal">${money(0)}</td>
    <td><button class="ghost-btn row-remove" type="button">Remove</button></td>
  `;

  productLines.appendChild(row);

  [...productLines.querySelectorAll(".row-remove")].forEach((button, idx) => {
    button.setAttribute("onclick", `removeLine(${idx})`);
  });

  attachLineEvents();
  recalcLiveTotal();
});

$("saveEditBtn").addEventListener("click", saveChanges);
$("deleteBtn").addEventListener("click", deleteCurrentRecord);

$("newRecordBtn").addEventListener("click", () => {
  alert("ប៊ូតុងនេះអាចភ្ជាប់ទៅ Form បញ្ចូល Data ថ្មីបាន។");
});

$("printTableBtn").addEventListener("click", () => window.print());
$("printDetailBtn").addEventListener("click", () => window.print());

fillFilterOptions();
renderTable();
renderStockPanel();
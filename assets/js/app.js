const orders = [
  { invoice: "INV-1001", customer: "YAYA", product: "VIP Hair Shampoo", total: "$16", status: "paid" },
  { invoice: "INV-1002", customer: "DARA", product: "Fiber Passion", total: "$18", status: "pending" },
  { invoice: "INV-1003", customer: "SOKHA", product: "Premium Hair Mask", total: "$16", status: "paid" },
  { invoice: "INV-1004", customer: "NITA", product: "Skin Care Set", total: "$25", status: "cancel" },
  { invoice: "INV-1005", customer: "LINDA", product: "Body Lotion", total: "$12", status: "paid" }
];

const tbody = document.getElementById("orderTableBody");
const themeToggle = document.getElementById("themeToggle");
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const menuItems = document.querySelectorAll(".menu-item");
const bottomNavItems = document.querySelectorAll(".bottom-nav-item");
const currentPage = document.body.dataset.page || "dashboard";

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function renderOrders() {
  if (!tbody) return;
  tbody.innerHTML = "";
  orders.forEach(order => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${order.invoice}</td>
      <td>${order.customer}</td>
      <td>${order.product}</td>
      <td>${order.total}</td>
      <td><span class="status ${order.status}">${capitalize(order.status)}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function applyThemeLabel() {
  if (!themeToggle) return;
  const isLight = document.body.classList.contains("light");
  themeToggle.textContent = isLight ? "☀️ Light Mode" : "🌙 Dark Mode";
}

function saveTheme() {
  const isLight = document.body.classList.contains("light");
  localStorage.setItem("camboTheme", isLight ? "light" : "dark");
}

function loadTheme() {
  const savedTheme = localStorage.getItem("camboTheme");
  if (savedTheme === "light") {
    document.body.classList.add("light");
  }
}

function closeSidebar() {
  if (!sidebar || !sidebarOverlay) return;
  sidebar.classList.remove("show");
  sidebarOverlay.classList.remove("show");
}

function setActiveNavigation(page) {
  menuItems.forEach(item => item.classList.toggle("active", item.dataset.page === page));
  bottomNavItems.forEach(item => item.classList.toggle("active", item.dataset.page === page));
}

loadTheme();
applyThemeLabel();
setActiveNavigation(currentPage);
renderOrders();

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    applyThemeLabel();
    saveTheme();
  });
}

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    sidebar.classList.add("show");
    sidebarOverlay.classList.add("show");
  });
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener("click", closeSidebar);
}

window.addEventListener("resize", () => {
  if (window.innerWidth > 920) closeSidebar();
});

menuItems.forEach(item => {
  item.addEventListener("click", () => {
    setActiveNavigation(item.dataset.page);
    if (window.innerWidth <= 920) closeSidebar();
  });
});

bottomNavItems.forEach(item => {
  item.addEventListener("click", () => setActiveNavigation(item.dataset.page));
});

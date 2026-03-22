
(function () {
  function getMenu(basePath) {
    return [
      { key: 'dashboard', label: 'Dashboard', icon: '🏠', href: `${basePath}index.html` },
      { key: 'orders', label: 'Orders', icon: '🧾', href: `${basePath}pages/orders.html` },
      { key: 'products', label: 'Products', icon: '🛍️', href: `${basePath}pages/products.html` },
      { key: 'search-edit', label: 'Search & Edit', icon: '🔍', href: `${basePath}pages/search-edit.html` },
      { key: 'customers', label: 'Customers', icon: '👥', href: `${basePath}pages/customers.html` },
      { key: 'reports', label: 'Reports', icon: '📊', href: `${basePath}pages/reports.html` },
      { key: 'settings', label: 'Settings', icon: '⚙️', href: `${basePath}pages/settings.html` }
    ];
  }

  window.injectLayout = function injectLayout(options = {}) {
    const {
      basePath = '',
      active = 'dashboard',
      title = 'CAMBO MINI',
      subtitle = 'POS Dashboard'
    } = options;

    const root = document.getElementById('layout-root');
    const pageContent = document.getElementById('page-content');
    if (!root || !pageContent) return;

    const menu = getMenu(basePath);
    const sidebarItems = menu.map(item => `
      <a class="menu-item ${item.key === active ? 'active' : ''}" data-page="${item.key}" data-label="${item.label}" href="${item.href}">
        <span class="menu-icon">${item.icon}</span>
        <span class="menu-label">${item.label}</span>
      </a>
    `).join('');

    const bottomItems = [
      menu[0], menu[2], { ...menu[1], label: 'Orders', icon: '➕', create: true }, menu[5], { ...menu[6], label: 'Profile', icon: '👤' }
    ].map(item => `
      <a class="bottom-nav-item ${item.create ? 'create' : ''} ${item.key === active ? 'active' : ''}" data-page="${item.key}" href="${item.href}">
        <span>${item.icon}</span><small>${item.label}</small>
      </a>
    `).join('');

    root.innerHTML = `
      <div class="app-shell shared-layout">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-top">
            <div class="brand brand-desktop">
              <div class="brand-logo">CM</div>
            </div>
            <div class="brand brand-mobile">
              <div class="brand-logo">CM</div>
              <div class="brand-text">
                <h2>CAMBO MINI</h2>
                <p>POS Dashboard</p>
              </div>
            </div>
            <nav class="menu" aria-label="Main navigation">${sidebarItems}</nav>
          </div>
          <div class="sidebar-footer">
            <button id="themeToggle" class="theme-btn" type="button">🌙 Dark Mode</button>
            <div class="profile profile-sidebar">
              <div class="avatar">C</div>
              <div class="profile-text">
                <strong>CAMBO MINI</strong>
                <span>Admin</span>
              </div>
            </div>
          </div>
        </aside>
        <div class="sidebar-overlay" id="sidebarOverlay"></div>
        <main class="main">
          <header class="topbar">
            <div class="topbar-left">
              <button class="icon-btn mobile-menu" id="menuToggle" aria-label="Open menu">☰</button>
              <div>
                <h1>${title}</h1>
                <p>${subtitle}</p>
              </div>
            </div>
            <div class="topbar-right">
              <div class="search-box">
                <span>🔍</span>
                <input type="text" placeholder="Search product, order, customer..." />
              </div>
              <div class="topbar-actions">
                <button class="icon-btn" aria-label="Notifications">🔔</button>
                <button class="icon-btn" aria-label="Messages">💬</button>
              </div>
            </div>
          </header>
          <div class="content-slot"></div>
        </main>
        <nav class="mobile-bottom-nav" aria-label="Mobile navigation">${bottomItems}</nav>
      </div>
    `;

    root.querySelector('.content-slot').appendChild(pageContent);
    pageContent.hidden = false;
  };
})();

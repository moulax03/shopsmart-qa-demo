/* ─────────────────────────────────────────────
   ShopSmart — Shared Utilities (main.js)
   Loaded on every page.
────────────────────────────────────────────── */

// ── API Base ────────────────────────────────────
const API_BASE = '/api';

// ── Auth Helpers ────────────────────────────────
function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch (e) {
    return null;
  }
}

function setAuth(token, user) {
  localStorage.setItem('token', token);
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function isLoggedIn() {
  return !!getToken();
}

// ── API Client ──────────────────────────────────
async function apiRequest(method, path, body = null, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    headers['Authorization'] = `Bearer ${getToken()}`;
  }
  const options = { method, headers };
  if (body !== null) {
    options.body = JSON.stringify(body);
  }
  try {
    const res = await fetch(API_BASE + path, options);
    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = { status: 'error', message: 'Invalid response from server.' };
    }
    return { status: res.status, data };
  } catch (err) {
    return { status: 0, data: { status: 'error', message: 'Network error. Please check your connection.' } };
  }
}

// ── Toast Notifications ─────────────────────────
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  toast.innerHTML = `<span>${icons[type] || icons.info}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ── Format Helpers ──────────────────────────────
function formatPrice(price) {
  const num = parseFloat(price);
  if (isNaN(num)) return '$0.00';
  return '$' + num.toFixed(2);
}

function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

// ── Cart Count ──────────────────────────────────
async function updateCartCount() {
  if (!isLoggedIn()) {
    const badge = document.getElementById('cart-badge');
    if (badge) badge.classList.add('hidden');
    return;
  }
  try {
    const { status, data } = await apiRequest('GET', '/cart', null, true);
    if (status === 200 && data.data) {
      const count = data.data.itemCount || 0;
      const badge = document.getElementById('cart-badge');
      if (badge) {
        if (count > 0) {
          badge.textContent = count > 99 ? '99+' : count;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
    }
  } catch (e) {
    // silently fail — cart badge is non-critical
  }
}

// ── Navbar Rendering ────────────────────────────
function renderNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const user = getUser();
  const loggedIn = isLoggedIn();

  // BUG-015: user may be null even after login because login page only saves token,
  // not user data. The name will only show after a page load that fetches from profile.
  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Account' : 'Account';

  navbar.innerHTML = `
    <div class="container">
      <div class="navbar-inner">
        <a href="/index.html" class="navbar-logo">Shop<span>Smart</span></a>
        <nav class="navbar-nav">
          <a href="/index.html">Home</a>
          <a href="/products.html">Products</a>
          ${loggedIn ? '<a href="/orders.html">Orders</a>' : ''}
        </nav>
        <div class="navbar-actions">
          <a href="/cart.html" class="cart-btn" id="cart-nav-btn" title="Cart">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span id="cart-badge" class="cart-badge hidden">0</span>
          </a>
          ${loggedIn ? `
            <div class="user-menu" id="user-menu">
              <button class="user-btn" id="user-btn" onclick="toggleUserMenu()">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>${displayName}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div class="user-dropdown" id="user-dropdown">
                <a href="/profile.html">My Profile</a>
                <a href="/orders.html">My Orders</a>
                <hr>
                <button onclick="logout()">Sign Out</button>
              </div>
            </div>
          ` : `
            <div class="auth-btns">
              <a href="/login.html" class="btn btn-ghost btn-sm">Sign In</a>
              <a href="/signup.html" class="btn btn-primary btn-sm">Sign Up</a>
            </div>
          `}
        </div>
      </div>
    </div>
  `;

  // Close dropdown when clicking outside
  document.addEventListener('click', function (e) {
    const menu = document.getElementById('user-menu');
    if (menu && !menu.contains(e.target)) {
      const dropdown = document.getElementById('user-dropdown');
      if (dropdown) dropdown.classList.remove('open');
    }
  });

  // Update cart badge
  updateCartCount();
}

function toggleUserMenu() {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) dropdown.classList.toggle('open');
}

// ── Auth Guards ─────────────────────────────────
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
    return false;
  }
  return true;
}

function redirectIfLoggedIn(target) {
  if (isLoggedIn()) {
    window.location.href = target || '/products.html';
  }
}

// ── Logout ──────────────────────────────────────
function logout() {
  clearAuth();
  window.location.href = '/login.html';
}

// ── Loading Overlay ─────────────────────────────
function showLoading() {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'spinner-overlay';
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'none';
}

// ── Form Helpers ────────────────────────────────
function setFieldError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.add('error');
  if (error) {
    error.textContent = message;
    error.classList.add('visible');
  }
}

function clearFieldError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.remove('error');
  if (error) {
    error.textContent = '';
    error.classList.remove('visible');
  }
}

function clearAllErrors(fieldMap) {
  for (const [inputId, errorId] of Object.entries(fieldMap)) {
    clearFieldError(inputId, errorId);
  }
}

// ── URL Helpers ─────────────────────────────────
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// Shared UI helpers: escaping, time formatting, avatars, navbar, search, toast, guards, lightbox.

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString();
}

function fullDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Avatar markup with a graceful fallback to an initial when the image is
// missing or fails to load.
function avatarHtml(user, size = 44) {
  const name = (user?.displayName || user?.username || '?').trim();
  const initial = escapeHtml(name.charAt(0).toUpperCase() || '?');
  const style = `width:${size}px;height:${size}px;font-size:${Math.round(size / 2.3)}px`;
  if (user?.avatarUrl) {
    return `<img class="avatar" style="${style}" src="${escapeHtml(user.avatarUrl)}" alt="${escapeHtml(name)}"
      data-initial="${initial}" onerror="avatarFallback(this)">`;
  }
  return `<span class="avatar avatar-fallback" style="${style}">${initial}</span>`;
}

// Replace a broken avatar <img> with an initial badge.
function avatarFallback(img) {
  const span = document.createElement('span');
  span.className = 'avatar avatar-fallback';
  span.style.cssText = img.style.cssText;
  span.textContent = img.dataset.initial || '?';
  img.replaceWith(span);
}

function profileUrl(username) {
  return `/profile.html?u=${encodeURIComponent(username)}`;
}

function postUrl(id) {
  return `/post.html?id=${encodeURIComponent(id)}`;
}

// SVG logo icon for the brand.
const BRAND_LOGO = `<svg width="26" height="26" viewBox="0 0 32 32" fill="none">
  <defs>
    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#38bdf8"/>
      <stop offset="50%" style="stop-color:#818cf8"/>
      <stop offset="100%" style="stop-color:#a78bfa"/>
    </linearGradient>
  </defs>
  <circle cx="16" cy="16" r="14" stroke="url(#logoGrad)" stroke-width="2.5" fill="none"/>
  <circle cx="16" cy="12" r="4" fill="url(#logoGrad)"/>
  <path d="M8 24c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="url(#logoGrad)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
</svg>`;

const SEARCH_ICON = `<svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

// Render the top navigation bar into <header id="nav">.
function renderNav() {
  const el = document.getElementById('nav');
  if (!el) return;
  const me = Auth.user;
  el.className = 'nav';
  el.innerHTML = `
    <nav class="nav-inner" aria-label="Main navigation">
      <a class="brand" href="/index.html" aria-label="NexusConnect Home">${BRAND_LOGO} NexusConnect</a>
      ${me ? `
        <div class="nav-search">
          ${SEARCH_ICON}
          <input type="search" id="navSearchInput" placeholder="Search users..." autocomplete="off" aria-label="Search users" />
          <div class="search-dropdown" id="searchDropdown"></div>
        </div>
      ` : ''}
      <div class="nav-spacer"></div>
      ${
        me
          ? `<a class="nav-link" href="/index.html">Home</a>
             <a class="nav-user" href="${profileUrl(me.username)}" title="My profile" aria-label="View your profile">
               ${avatarHtml(me, 32)}
             </a>
             <button class="btn btn-ghost btn-sm" id="logoutBtn" aria-label="Log out">Logout</button>`
          : `<a class="nav-link" href="/login.html">Login</a>
             <a class="btn btn-sm" href="/register.html">Sign up</a>`
      }
    </nav>`;

  // Logout handler
  const logout = document.getElementById('logoutBtn');
  if (logout) {
    logout.addEventListener('click', () => {
      Auth.clear();
      location.href = '/login.html';
    });
  }

  // Search handler
  initNavSearch();
}

// Nav search with debounced API calls.
let searchTimer = null;
function initNavSearch() {
  const input = document.getElementById('navSearchInput');
  const dropdown = document.getElementById('searchDropdown');
  if (!input || !dropdown) return;

  input.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = input.value.trim();
    if (q.length < 2) {
      dropdown.classList.remove('show');
      return;
    }
    searchTimer = setTimeout(async () => {
      try {
        const { users } = await API.get(`/search?q=${encodeURIComponent(q)}`);
        if (users.length === 0) {
          dropdown.innerHTML = '<div class="search-empty">No users found</div>';
        } else {
          dropdown.innerHTML = users.map(u => `
            <a href="${profileUrl(u.username)}" class="search-item">
              ${avatarHtml(u, 34)}
              <div>
                <div class="s-name">${escapeHtml(u.displayName)}</div>
                <div class="s-handle">@${escapeHtml(u.username)}</div>
              </div>
            </a>`).join('');
        }
        dropdown.classList.add('show');
      } catch {
        dropdown.classList.remove('show');
      }
    }, 300);
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-search')) {
      dropdown.classList.remove('show');
    }
  });

  // Close on Escape
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdown.classList.remove('show');
      input.blur();
    }
  });
}

// Lightweight toast notifications.
let toastTimer = null;
function toast(message, type = '') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = message;
  t.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.className = 'toast';
  }, 3000);
}

// Pages that require a session: bounce to login if no token present.
function requireAuth() {
  if (!Auth.isAuthed) {
    location.href = '/login.html';
    return false;
  }
  return true;
}

// Auth pages: if already logged in, skip straight to the feed.
function redirectIfAuthed() {
  if (Auth.isAuthed) location.href = '/index.html';
}

// Image lightbox
function openLightbox(src) {
  let lb = document.getElementById('lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.className = 'lightbox';
    lb.innerHTML = `
      <button class="lightbox-close" aria-label="Close lightbox">✕</button>
      <img src="" alt="Full size image" />`;
    document.body.appendChild(lb);
    lb.addEventListener('click', (e) => {
      if (e.target === lb || e.target.classList.contains('lightbox-close')) {
        lb.classList.remove('show');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') lb.classList.remove('show');
    });
  }
  lb.querySelector('img').src = src;
  lb.classList.add('show');
}

// Skeleton post card for loading states
function skeletonCardHtml() {
  return `
    <div class="skeleton">
      <div class="skeleton-head">
        <div class="skeleton-circle"></div>
        <div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line shorter"></div>
        </div>
      </div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    </div>`;
}

// Password visibility toggle
function initPasswordToggle(toggleId, inputId) {
  const toggle = document.getElementById(toggleId);
  const input = document.getElementById(inputId);
  if (!toggle || !input) return;

  const eyeOpen = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const eyeClosed = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

  toggle.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    toggle.innerHTML = isPassword ? eyeClosed : eyeOpen;
  });
}

// Password strength meter
function initPasswordStrength(inputId, barId, labelId) {
  const input = document.getElementById(inputId);
  const barWrap = document.getElementById(barId);
  const label = document.getElementById(labelId);
  if (!input || !barWrap || !label) return;

  const bar = barWrap.querySelector('.bar');

  input.addEventListener('input', () => {
    const val = input.value;
    if (!val) {
      bar.style.width = '0%';
      label.textContent = '';
      return;
    }
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const levels = [
      { width: '20%', color: '#f43f5e', text: 'Very weak' },
      { width: '40%', color: '#fb923c', text: 'Weak' },
      { width: '60%', color: '#fbbf24', text: 'Fair' },
      { width: '80%', color: '#34d399', text: 'Strong' },
      { width: '100%', color: '#22d3ee', text: 'Very strong' },
    ];
    const level = levels[Math.min(score, levels.length) - 1] || levels[0];
    bar.style.width = level.width;
    bar.style.background = level.color;
    label.textContent = level.text;
    label.style.color = level.color;
  });
}

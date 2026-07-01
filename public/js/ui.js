// Shared UI helpers: escaping, time formatting, avatars, navbar, toast, guards.

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

// Render the top navigation bar into <header id="nav">.
function renderNav() {
  const el = document.getElementById('nav');
  if (!el) return;
  const me = Auth.user;
  el.className = 'nav';
  el.innerHTML = `
    <div class="nav-inner">
      <a class="brand" href="/index.html">🌐 Mini Social</a>
      <div class="nav-spacer"></div>
      ${
        me
          ? `<a class="nav-link" href="/index.html">Home</a>
             <a class="nav-user" href="${profileUrl(me.username)}" title="My profile">
               ${avatarHtml(me, 32)}
             </a>
             <button class="btn btn-ghost btn-sm" id="logoutBtn">Logout</button>`
          : `<a class="nav-link" href="/login.html">Login</a>
             <a class="btn btn-sm" href="/register.html">Sign up</a>`
      }
    </div>`;
  const logout = document.getElementById('logoutBtn');
  if (logout) {
    logout.addEventListener('click', () => {
      Auth.clear();
      location.href = '/login.html';
    });
  }
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

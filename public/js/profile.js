if (requireAuth()) {
  renderNav();
  initProfile();
}

function getUsernameParam() {
  const u = new URLSearchParams(location.search).get('u');
  return (u || Auth.user?.username || '').toLowerCase();
}

// Generate a deterministic cover gradient from a username.
function coverGradient(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 40) % 360;
  const h3 = (h1 + 80) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 70%, 45%) 0%, hsl(${h2}, 65%, 40%) 50%, hsl(${h3}, 60%, 35%) 100%)`;
}

async function initProfile() {
  const username = getUsernameParam();
  const card = document.getElementById('profileCard');
  if (!username) {
    card.innerHTML = '<div class="empty">No user specified.</div>';
    return;
  }

  let profile;
  try {
    profile = await API.get(`/users/${encodeURIComponent(username)}`);
  } catch (e) {
    card.innerHTML = `<div class="empty"><h3>${escapeHtml(e.message)}</h3>
      <p><a href="/index.html">Back to feed</a></p></div>`;
    return;
  }

  // Update page title dynamically
  document.title = `${profile.user.displayName} (@${profile.user.username}) — NexusConnect`;

  renderHeader(card, profile);
  loadUserPosts(username);
}

function renderHeader(card, profile) {
  const { user, counts, isFollowing, isMe } = profile;

  card.innerHTML = `
    <div class="profile-cover" style="background:${coverGradient(user.username)}"></div>
    <div class="profile-header">
      ${avatarHtml(user, 88)}
      <div class="pinfo">
        <h1>${escapeHtml(user.displayName)}</h1>
        <div class="handle">@${escapeHtml(user.username)}</div>
        ${user.createdAt ? `<div class="profile-joined">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Joined ${new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>` : ''}
        <div class="stats">
          <div class="stat animate" data-count="${counts.posts}"><b>0</b> <span>Posts</span></div>
          <div class="stat animate" data-count="${counts.followers}" data-list="followers"><b>0</b> <span>Followers</span></div>
          <div class="stat animate" data-count="${counts.following}" data-list="following"><b>0</b> <span>Following</span></div>
        </div>
      </div>
      <div id="profileAction"></div>
    </div>
    ${user.bio ? `<div class="profile-bio">${escapeHtml(user.bio)}</div>` : ''}

    <!-- Profile tabs -->
    <div class="profile-tabs" id="profileTabs">
      <button class="profile-tab active" data-tab="posts">Posts</button>
      <button class="profile-tab" data-tab="followers">Followers</button>
      <button class="profile-tab" data-tab="following">Following</button>
    </div>`;

  // Animate stat counters
  card.querySelectorAll('.stat.animate').forEach(stat => {
    const target = parseInt(stat.dataset.count, 10) || 0;
    const b = stat.querySelector('b');
    animateCount(b, target);
  });

  const actionEl = card.querySelector('#profileAction');
  if (isMe) {
    actionEl.innerHTML = '<button class="btn btn-outline" id="editBtn" aria-label="Edit your profile">Edit profile</button>';
    actionEl.querySelector('#editBtn').addEventListener('click', () => openEditModal(user));
  } else {
    renderFollowButton(actionEl, user, isFollowing);
  }

  // Tab switching
  initTabs(card, user.username);
}

function animateCount(el, target) {
  if (target === 0) { el.textContent = '0'; return; }
  const duration = 600;
  const start = performance.now();
  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = String(Math.round(target * eased));
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

let activeTab = 'posts';
function initTabs(card, username) {
  const tabs = card.querySelectorAll('.profile-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      activeTab = tabName;
      showTabContent(tabName, username);
    });
  });
}

function showTabContent(tabName, username) {
  const postsEl = document.getElementById('userPosts');
  const followersEl = document.getElementById('userFollowers');
  const followingEl = document.getElementById('userFollowing');
  const statusEl = document.getElementById('postsStatus');

  postsEl.style.display = tabName === 'posts' ? 'block' : 'none';
  followersEl.style.display = tabName === 'followers' ? 'block' : 'none';
  followingEl.style.display = tabName === 'following' ? 'block' : 'none';

  if (tabName === 'followers' && !followersEl.dataset.loaded) {
    loadUserList(username, 'followers', followersEl);
  }
  if (tabName === 'following' && !followingEl.dataset.loaded) {
    loadUserList(username, 'following', followingEl);
  }
  if (tabName === 'posts') {
    statusEl.style.display = postsEl.children.length === 0 ? 'block' : 'none';
  } else {
    statusEl.style.display = 'none';
  }
}

async function loadUserList(username, type, container) {
  container.innerHTML = '<div class="spinner">Loading…</div>';
  container.dataset.loaded = '1';
  try {
    const { users } = await API.get(`/users/${encodeURIComponent(username)}/${type}`);
    if (!users.length) {
      container.innerHTML = `<div class="empty" style="padding:24px"><p>No ${type} yet.</p></div>`;
      return;
    }
    container.innerHTML = users.map(u => `
      <a href="${profileUrl(u.username)}" class="card" style="display:flex;align-items:center;gap:12px;padding:14px;text-decoration:none;color:inherit">
        ${avatarHtml(u, 42)}
        <div>
          <div style="font-weight:700;font-size:15px">${escapeHtml(u.displayName)}</div>
          <div style="color:var(--text-muted);font-size:13px">@${escapeHtml(u.username)}</div>
        </div>
      </a>`).join('');
  } catch (e) {
    container.innerHTML = `<div class="muted small" style="padding:16px">${escapeHtml(e.message)}</div>`;
  }
}

function renderFollowButton(el, user, isFollowing) {
  el.innerHTML = `<button class="btn ${isFollowing ? 'btn-ghost' : ''}" id="followBtn" aria-label="${isFollowing ? 'Unfollow' : 'Follow'} ${user.displayName}">${
    isFollowing ? 'Following' : 'Follow'
  }</button>`;
  const btn = el.querySelector('#followBtn');
  let following = isFollowing;
  let busy = false;
  btn.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    btn.disabled = true;
    try {
      const res = following
        ? await API.del(`/users/${user.username}/follow`)
        : await API.post(`/users/${user.username}/follow`, {});
      following = res.following;
      btn.textContent = following ? 'Following' : 'Follow';
      btn.classList.toggle('btn-ghost', following);
      // Update follower count in the header stat.
      const followersStat = document.querySelector('[data-list="followers"] b');
      if (followersStat) {
        const newCount = res.followersCount;
        animateCount(followersStat, newCount);
      }
      toast(following ? `Following @${user.username}` : `Unfollowed @${user.username}`, 'success');
      // Reset followers list so it reloads
      const followersEl = document.getElementById('userFollowers');
      if (followersEl) {
        followersEl.dataset.loaded = '';
        followersEl.innerHTML = '';
      }
    } catch (e) {
      toast(e.message || 'Action failed', 'error');
    } finally {
      busy = false;
      btn.disabled = false;
    }
  });
}

async function loadUserPosts(username) {
  const wrap = document.getElementById('userPosts');
  const status = document.getElementById('postsStatus');

  status.style.display = 'block';
  status.innerHTML = Array(2).fill(skeletonCardHtml()).join('');

  try {
    const { posts } = await API.get(`/users/${encodeURIComponent(username)}/posts?limit=50`);
    if (!posts.length) {
      status.innerHTML = '<div class="empty">No posts yet.</div>';
      return;
    }
    status.style.display = 'none';
    for (const p of posts) {
      wrap.appendChild(createPostCard(p, { onDelete: () => location.reload() }));
    }
  } catch (e) {
    status.textContent = e.message || 'Failed to load posts';
  }
}

// ---- Edit profile modal ----
function openEditModal(user) {
  const backdrop = document.getElementById('editBackdrop');
  const errorBox = document.getElementById('editError');
  errorBox.classList.remove('show');
  document.getElementById('editDisplayName').value = user.displayName || '';
  document.getElementById('editBio').value = user.bio || '';
  document.getElementById('editAvatar').value = user.avatarUrl || '';
  backdrop.classList.add('show');

  const close = () => backdrop.classList.remove('show');
  document.getElementById('editCancel').onclick = close;
  backdrop.onclick = (e) => {
    if (e.target === backdrop) close();
  };

  const form = document.getElementById('editForm');
  form.onsubmit = async (e) => {
    e.preventDefault();
    errorBox.classList.remove('show');
    const saveBtn = document.getElementById('editSave');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    try {
      const { user: updated } = await API.put('/users/me', {
        displayName: document.getElementById('editDisplayName').value.trim(),
        bio: document.getElementById('editBio').value.trim(),
        avatarUrl: document.getElementById('editAvatar').value.trim(),
      });
      Auth.update(updated);
      close();
      toast('Profile updated', 'success');
      // Re-render with fresh data.
      renderNav();
      initProfile();
    } catch (err) {
      errorBox.textContent = err.message || 'Update failed';
      errorBox.classList.add('show');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save';
    }
  };
}

if (requireAuth()) {
  renderNav();
  initProfile();
}

function getUsernameParam() {
  const u = new URLSearchParams(location.search).get('u');
  return (u || Auth.user?.username || '').toLowerCase();
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

  renderHeader(card, profile);
  loadUserPosts(username);
}

function renderHeader(card, profile) {
  const { user, counts, isFollowing, isMe } = profile;
  card.innerHTML = `
    <div class="profile-header">
      ${avatarHtml(user, 88)}
      <div class="pinfo">
        <h1>${escapeHtml(user.displayName)}</h1>
        <div class="handle">@${escapeHtml(user.username)}</div>
        <div class="stats">
          <div class="stat"><b>${counts.posts}</b> <span>Posts</span></div>
          <a class="stat" href="#" data-list="followers" style="color:inherit"><b>${counts.followers}</b> <span>Followers</span></a>
          <a class="stat" href="#" data-list="following" style="color:inherit"><b>${counts.following}</b> <span>Following</span></a>
        </div>
      </div>
      <div id="profileAction"></div>
    </div>
    ${user.bio ? `<div class="profile-bio">${escapeHtml(user.bio)}</div>` : ''}
    <div id="listArea"></div>`;

  const actionEl = card.querySelector('#profileAction');
  if (isMe) {
    actionEl.innerHTML = '<button class="btn btn-outline" id="editBtn">Edit profile</button>';
    actionEl.querySelector('#editBtn').addEventListener('click', () => openEditModal(user));
  } else {
    renderFollowButton(actionEl, user, isFollowing);
  }

  // Followers / following lists
  card.querySelectorAll('[data-list]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      toggleList(card, user.username, link.dataset.list);
    });
  });
}

function renderFollowButton(el, user, isFollowing) {
  el.innerHTML = `<button class="btn ${isFollowing ? 'btn-ghost' : ''}" id="followBtn">${
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
      // Update follower count in the header.
      const followersStat = document.querySelector('[data-list="followers"] b');
      if (followersStat) followersStat.textContent = String(res.followersCount);
      toast(following ? `Following @${user.username}` : `Unfollowed @${user.username}`);
    } catch (e) {
      toast(e.message || 'Action failed', 'error');
    } finally {
      busy = false;
      btn.disabled = false;
    }
  });
}

let openListType = null;
async function toggleList(card, username, type) {
  const area = card.querySelector('#listArea');
  if (openListType === type) {
    area.innerHTML = '';
    openListType = null;
    return;
  }
  openListType = type;
  area.innerHTML = '<div class="spinner">Loading…</div>';
  try {
    const { users } = await API.get(`/users/${encodeURIComponent(username)}/${type}`);
    if (!users.length) {
      area.innerHTML = `<div class="muted small" style="padding:10px 0">No ${type} yet.</div>`;
      return;
    }
    area.innerHTML =
      `<div class="small muted" style="margin:10px 0 6px">${type === 'followers' ? 'Followers' : 'Following'}</div>` +
      users
        .map(
          (u) => `
        <a href="${profileUrl(u.username)}" class="post-head" style="margin-bottom:8px">
          ${avatarHtml(u, 38)}
          <div class="names">
            <span class="name">${escapeHtml(u.displayName)}</span>
            <span class="handle">@${escapeHtml(u.username)}</span>
          </div>
        </a>`
        )
        .join('');
  } catch (e) {
    area.innerHTML = `<div class="muted small">${escapeHtml(e.message)}</div>`;
  }
}

async function loadUserPosts(username) {
  const wrap = document.getElementById('userPosts');
  const status = document.getElementById('postsStatus');
  const heading = document.getElementById('postsHeading');
  status.style.display = 'block';
  status.textContent = 'Loading posts…';
  try {
    const { posts } = await API.get(`/users/${encodeURIComponent(username)}/posts?limit=50`);
    heading.style.display = 'block';
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
      toast('Profile updated');
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

if (requireAuth()) {
  renderNav();
  initFeed();
}

function initFeed() {
  const me = Auth.user;
  document.getElementById('composeAvatar').innerHTML = avatarHtml(me, 44);

  const feedEl = document.getElementById('feed');
  const statusEl = document.getElementById('feedStatus');
  const loadMoreBtn = document.getElementById('loadMore');

  let page = 1;
  let loading = false;
  let hasMorePages = true;

  // Show skeleton loading on initial load
  function showSkeletons(count = 3) {
    feedEl.innerHTML = Array(count).fill(skeletonCardHtml()).join('');
  }

  async function loadPage(reset = false) {
    if (loading) return;
    loading = true;
    loadMoreBtn.disabled = true;

    if (reset) {
      page = 1;
      hasMorePages = true;
      showSkeletons();
    }

    statusEl.style.display = reset ? 'none' : 'block';
    if (!reset) statusEl.textContent = 'Loading…';

    try {
      const { posts, hasMore } = await API.get(`/posts?page=${page}&limit=10`);

      if (reset) feedEl.innerHTML = '';

      if (reset && posts.length === 0) {
        statusEl.style.display = 'block';
        statusEl.innerHTML = `
          <div class="empty">
            <h3>Your feed is empty</h3>
            <p>Follow some people or write your first post above. ✍️</p>
          </div>`;
      } else {
        statusEl.style.display = 'none';
        for (const p of posts) {
          feedEl.appendChild(createPostCard(p, { onDelete: refreshIfEmpty }));
        }
      }

      hasMorePages = hasMore;
      loadMoreBtn.style.display = hasMore ? 'inline-flex' : 'none';
      if (hasMore) page += 1;
    } catch (e) {
      if (reset) feedEl.innerHTML = '';
      statusEl.style.display = 'block';
      statusEl.textContent = e.message || 'Failed to load feed';
    } finally {
      loading = false;
      loadMoreBtn.disabled = false;
    }
  }

  function refreshIfEmpty() {
    if (feedEl.children.length === 0) loadPage(true);
  }

  // Manual load more button
  loadMoreBtn.addEventListener('click', () => loadPage(false));

  // Infinite scroll: auto-load when near bottom
  const scrollThreshold = 400;
  window.addEventListener('scroll', () => {
    if (loading || !hasMorePages) return;
    const distFromBottom = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
    if (distFromBottom < scrollThreshold) {
      loadPage(false);
    }
  });

  // Compose
  const form = document.getElementById('composeForm');
  const contentEl = document.getElementById('composeContent');
  const imageEl = document.getElementById('composeImage');
  const postBtn = document.getElementById('postBtn');
  const hint = document.getElementById('composeHint');

  contentEl.addEventListener('input', () => {
    const n = contentEl.value.length;
    if (n === 0) {
      hint.textContent = '';
      hint.className = 'char-counter';
    } else {
      hint.textContent = `${n}/1000`;
      hint.className = 'char-counter' + (n > 900 ? ' danger' : n > 750 ? ' warning' : '');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = contentEl.value.trim();
    if (!content) return;
    postBtn.disabled = true;
    postBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      Posting…`;
    try {
      const { post } = await API.post('/posts', {
        content,
        imageUrl: imageEl.value.trim() || undefined,
      });
      contentEl.value = '';
      imageEl.value = '';
      hint.textContent = '';
      hint.className = 'char-counter';
      // Hide any "empty feed" message and prepend the new post.
      if (statusEl.querySelector('.empty')) statusEl.style.display = 'none';
      feedEl.prepend(createPostCard(post, { onDelete: refreshIfEmpty }));
      toast('Posted!', 'success');
    } catch (err) {
      toast(err.message || 'Could not create post', 'error');
    } finally {
      postBtn.disabled = false;
      postBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        Post`;
    }
  });

  loadPage(true);
}

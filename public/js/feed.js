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

  async function loadPage(reset = false) {
    if (loading) return;
    loading = true;
    loadMoreBtn.disabled = true;
    if (reset) {
      page = 1;
      feedEl.innerHTML = '';
    }
    statusEl.style.display = 'block';
    statusEl.textContent = 'Loading…';
    try {
      const { posts, hasMore } = await API.get(`/posts?page=${page}&limit=10`);
      if (reset && posts.length === 0) {
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
      loadMoreBtn.style.display = hasMore ? 'inline-flex' : 'none';
      if (hasMore) page += 1;
    } catch (e) {
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

  loadMoreBtn.addEventListener('click', () => loadPage(false));

  // Compose
  const form = document.getElementById('composeForm');
  const contentEl = document.getElementById('composeContent');
  const imageEl = document.getElementById('composeImage');
  const postBtn = document.getElementById('postBtn');
  const hint = document.getElementById('composeHint');

  contentEl.addEventListener('input', () => {
    const n = contentEl.value.length;
    hint.textContent = n > 0 ? `${n}/1000` : '';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = contentEl.value.trim();
    if (!content) return;
    postBtn.disabled = true;
    postBtn.textContent = 'Posting…';
    try {
      const { post } = await API.post('/posts', {
        content,
        imageUrl: imageEl.value.trim() || undefined,
      });
      contentEl.value = '';
      imageEl.value = '';
      hint.textContent = '';
      // Hide any "empty feed" message and prepend the new post.
      if (statusEl.querySelector('.empty')) statusEl.style.display = 'none';
      feedEl.prepend(createPostCard(post, { onDelete: refreshIfEmpty }));
      toast('Posted!');
    } catch (err) {
      toast(err.message || 'Could not create post', 'error');
    } finally {
      postBtn.disabled = false;
      postBtn.textContent = 'Post';
    }
  });

  loadPage(true);
}

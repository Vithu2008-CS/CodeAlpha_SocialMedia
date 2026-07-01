// Reusable post-card component shared by the feed, profile, and single-post pages.
// Renders a post with optimistic like toggle, inline comments, and author delete.

// Two-click confirm so we never trigger a blocking native confirm() dialog.
function armConfirm(el, label, onConfirm) {
  if (el.dataset.armed === '1') {
    clearTimeout(Number(el.dataset.timer));
    el.dataset.armed = '0';
    el.innerHTML = el.dataset.original;
    onConfirm();
    return;
  }
  el.dataset.original = el.innerHTML;
  el.dataset.armed = '1';
  el.innerHTML = label;
  el.dataset.timer = String(
    setTimeout(() => {
      el.dataset.armed = '0';
      el.innerHTML = el.dataset.original;
    }, 3000)
  );
}

function commentHtml(c) {
  const me = Auth.user;
  const canDelete = me && c.author && me.id === c.author.id;
  return `
    <div class="comment" data-comment="${c.id}">
      <a href="${profileUrl(c.author.username)}">${avatarHtml(c.author, 34)}</a>
      <div class="bubble">
        <a class="c-author" href="${profileUrl(c.author.username)}">${escapeHtml(c.author.displayName)}</a>
        <div class="c-text">${escapeHtml(c.content)}</div>
        <div class="c-meta">
          ${timeAgo(c.createdAt)}
          ${canDelete ? ' · <button class="comment-del" data-del-comment>Delete</button>' : ''}
        </div>
      </div>
    </div>`;
}

// Build and return a post-card element.
// opts.expandComments = true keeps the comment thread open (single-post page).
function createPostCard(post, opts = {}) {
  const me = Auth.user;
  const canDelete = me && me.id === post.author.id;
  const card = document.createElement('article');
  card.className = 'card post';
  card.dataset.post = post.id;

  card.innerHTML = `
    <div class="post-head">
      <a href="${profileUrl(post.author.username)}">${avatarHtml(post.author, 44)}</a>
      <div class="names">
        <a class="name" href="${profileUrl(post.author.username)}">${escapeHtml(post.author.displayName)}</a>
        <a class="handle" href="${profileUrl(post.author.username)}">@${escapeHtml(post.author.username)} · ${timeAgo(post.createdAt)}</a>
      </div>
    </div>
    <a href="${postUrl(post.id)}" style="color:inherit">
      <div class="post-content">${escapeHtml(post.content)}</div>
    </a>
    ${post.imageUrl ? `<img class="post-image" src="${escapeHtml(post.imageUrl)}" alt="" onerror="this.remove()">` : ''}
    <div class="post-actions">
      <button class="action-btn like-btn ${post.likedByMe ? 'liked' : ''}" data-like>
        <span class="icon pop">${post.likedByMe ? '❤️' : '🤍'}</span>
        <span class="like-count">${post.likeCount}</span>
      </button>
      <button class="action-btn" data-toggle-comments>
        <span class="icon">💬</span>
        <span class="comment-count">${post.commentCount}</span>
      </button>
      <a class="action-btn" href="${postUrl(post.id)}"><span class="icon">🔗</span> View</a>
      ${canDelete ? '<button class="action-btn danger" data-del-post style="margin-left:auto">🗑️ Delete</button>' : ''}
    </div>
    <div class="comments" data-comments hidden>
      <div class="comment-list" data-comment-list></div>
      ${
        me
          ? `<form class="comment-form" data-comment-form>
               ${avatarHtml(me, 34)}
               <input class="grow" name="content" placeholder="Write a comment..." maxlength="500" autocomplete="off" required>
               <button class="btn btn-sm" type="submit">Send</button>
             </form>`
          : ''
      }
    </div>`;

  // --- Like (optimistic) ---
  const likeBtn = card.querySelector('[data-like]');
  let likeBusy = false;
  likeBtn.addEventListener('click', async () => {
    if (likeBusy) return;
    likeBusy = true;
    const wasLiked = likeBtn.classList.contains('liked');
    const countEl = likeBtn.querySelector('.like-count');
    const iconEl = likeBtn.querySelector('.icon');
    const prevCount = Number(countEl.textContent);

    // optimistic flip
    likeBtn.classList.toggle('liked', !wasLiked);
    iconEl.textContent = !wasLiked ? '❤️' : '🤍';
    countEl.textContent = String(prevCount + (wasLiked ? -1 : 1));

    try {
      const res = wasLiked
        ? await API.del(`/posts/${post.id}/like`)
        : await API.post(`/posts/${post.id}/like`, {});
      countEl.textContent = String(res.likeCount);
      likeBtn.classList.toggle('liked', res.liked);
      iconEl.textContent = res.liked ? '❤️' : '🤍';
    } catch (e) {
      // revert
      likeBtn.classList.toggle('liked', wasLiked);
      iconEl.textContent = wasLiked ? '❤️' : '🤍';
      countEl.textContent = String(prevCount);
      toast(e.message || 'Could not update like', 'error');
    } finally {
      likeBusy = false;
    }
  });

  // --- Comments ---
  const commentsWrap = card.querySelector('[data-comments]');
  const listEl = card.querySelector('[data-comment-list]');
  const commentCountEl = card.querySelector('.comment-count');
  let loaded = false;

  async function loadComments() {
    listEl.innerHTML = '<div class="spinner">Loading comments…</div>';
    try {
      const { comments } = await API.get(`/posts/${post.id}/comments`);
      renderComments(comments);
      commentCountEl.textContent = String(comments.length);
    } catch (e) {
      listEl.innerHTML = `<div class="muted small">${escapeHtml(e.message)}</div>`;
    }
  }

  function renderComments(comments) {
    if (!comments.length) {
      listEl.innerHTML = '<div class="muted small" style="margin-bottom:8px">No comments yet. Be the first!</div>';
      return;
    }
    listEl.innerHTML = comments.map(commentHtml).join('');
    listEl.querySelectorAll('[data-del-comment]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('[data-comment]');
        const id = row.dataset.comment;
        armConfirm(btn, 'Delete?', async () => {
          try {
            await API.del(`/comments/${id}`);
            row.remove();
            commentCountEl.textContent = String(Math.max(0, Number(commentCountEl.textContent) - 1));
            toast('Comment deleted');
          } catch (e) {
            toast(e.message || 'Could not delete comment', 'error');
          }
        });
      });
    });
  }

  async function openComments() {
    commentsWrap.hidden = false;
    if (!loaded) {
      loaded = true;
      await loadComments();
    }
  }

  const toggleBtn = card.querySelector('[data-toggle-comments]');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (commentsWrap.hidden) openComments();
      else commentsWrap.hidden = true;
    });
  }

  const form = card.querySelector('[data-comment-form]');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[name="content"]');
      const content = input.value.trim();
      if (!content) return;
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      try {
        const { comment } = await API.post(`/posts/${post.id}/comments`, { content });
        input.value = '';
        // Remove the "no comments yet" placeholder if present.
        const placeholder = listEl.querySelector('.muted');
        if (placeholder && listEl.children.length === 1) listEl.innerHTML = '';
        listEl.insertAdjacentHTML('beforeend', commentHtml(comment));
        const newRow = listEl.lastElementChild;
        const del = newRow.querySelector('[data-del-comment]');
        if (del) {
          del.addEventListener('click', () => {
            armConfirm(del, 'Delete?', async () => {
              try {
                await API.del(`/comments/${comment.id}`);
                newRow.remove();
                commentCountEl.textContent = String(Math.max(0, Number(commentCountEl.textContent) - 1));
              } catch (err) {
                toast(err.message, 'error');
              }
            });
          });
        }
        commentCountEl.textContent = String(Number(commentCountEl.textContent) + 1);
      } catch (err) {
        toast(err.message || 'Could not post comment', 'error');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // --- Delete post ---
  const delBtn = card.querySelector('[data-del-post]');
  if (delBtn) {
    delBtn.addEventListener('click', () => {
      armConfirm(delBtn, '🗑️ Confirm?', async () => {
        try {
          await API.del(`/posts/${post.id}`);
          card.remove();
          toast('Post deleted');
          if (typeof opts.onDelete === 'function') opts.onDelete(post.id);
        } catch (e) {
          toast(e.message || 'Could not delete post', 'error');
        }
      });
    });
  }

  if (opts.expandComments) openComments();

  return card;
}

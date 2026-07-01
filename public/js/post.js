if (requireAuth()) {
  renderNav();
  initPost();
}

async function initPost() {
  const id = new URLSearchParams(location.search).get('id');
  const container = document.getElementById('postContainer');

  if (!id) {
    container.innerHTML = '<div class="empty">No post specified.</div>';
    return;
  }

  try {
    const { post } = await API.get(`/posts/${encodeURIComponent(id)}`);
    container.innerHTML = '';
    // Expand the comment thread by default on the single-post view.
    container.appendChild(
      createPostCard(post, {
        expandComments: true,
        onDelete: () => {
          location.href = '/index.html';
        },
      })
    );
  } catch (e) {
    container.innerHTML = `<div class="empty"><h3>${escapeHtml(e.message)}</h3>
      <p><a href="/index.html">Back to feed</a></p></div>`;
  }
}

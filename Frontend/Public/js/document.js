let currentUser = null;
let currentDocumentId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const slug = getQueryParam('slug');
  if (!slug) {
    document.getElementById('document-detail').innerHTML = '<p class="error">Không tìm thấy tiêu đề tài liệu.</p>';
    return;
  }

  // Lấy thông tin người dùng
  try {
    const res = await fetch('https://backend-yl09.onrender.com/api/user-info', { credentials: 'include' });
    if (res.ok) {
      currentUser = await res.json();
    }
  } catch (err) {
    console.error("Lỗi lấy thông tin người dùng", err);
  }

  // Tải tài liệu và bình luận
  await loadDocumentAndComments(slug);

  // Xử lý form bình luận chính
  const commentForm = document.querySelector('.comment-form');
  if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const textarea = commentForm.querySelector('textarea');
      const commentText = textarea.value.trim();

      if (!commentText) return showToast('Vui lòng nhập bình luận', 'error');
      if (!currentDocumentId) return showToast('Không tìm thấy ID tài liệu', 'error');

      if (!currentUser) {
        window.location.href = '/login.html';
        return;
      }

      try {
        const res = await fetch(`https://backend-yl09.onrender.com/api/documents/${currentDocumentId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            documentId: currentDocumentId,
            username: currentUser.username,
            email: currentUser.email,
            content: commentText
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.msg || 'Lỗi gửi bình luận');
        }

        const newCommentData = await res.json();
        await renderComment(newCommentData.comment);
        textarea.value = '';
        showToast('Gửi bình luận thành công!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
});

function toDrivePreviewUrl(fileUrl) {
  const match = fileUrl.match(/id=([^&]+)/); // lấy ID từ uc?id=...
  if (!match) return fileUrl;
  const fileId = match[1];
  return `https://drive.google.com/file/d/${fileId}/embed`;
}

async function loadDocumentAndComments(slug) {
  try {
    const res = await fetch(`https://backend-yl09.onrender.com/api/review-documents/by-slug/${slug}?noView=true`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Không tải được tài liệu');

    const data = await res.json();
    const doc = data.document;
    const comments = data.comments || [];
    currentDocumentId = doc._id;

    // Render document
    const container = document.getElementById('document-detail');
    const safeUrl = toDrivePreviewUrl(doc.fileUrl);
    container.innerHTML = `
        <h2>${doc.title}</h2>
        <div class="file-preview" style="height: 800px; margin: 16px 0;">
          <iframe src="${safeUrl}#zoom=90" width="100%" height="100%" frameborder="0" allowfullscreen>
            Trình duyệt của bạn không hỗ trợ xem PDF.
          </iframe>
        </div>
    `;

    // Render comments
    const commentsList = document.querySelector('.comments-list');
    if (!commentsList) return;

    commentsList.innerHTML = '';
    const parentComments = comments.filter(c => !c.parentComment);
    const replies = comments.filter(c => c.parentComment);

    for (const comment of parentComments) {
      const commentElement = await renderComment(comment);
      const commentReplies = replies.filter(r => r.parentComment === comment._id);
      const repliesContainer = commentElement.querySelector('.replies-container');
      for (const reply of commentReplies) {
        await renderReply(reply, repliesContainer);
      }
    }

  } catch (err) {
    document.getElementById('document-detail').innerHTML = `<p class="error">Lỗi tải tài liệu: ${err.message}</p>`;
  }
}

async function renderComment(comment) {
  const commentsList = document.querySelector('.comments-list');
  const div = document.createElement('div');
  div.classList.add('comment-item');
  div.dataset.commentId = comment._id;

  const avatarUrl = await resolveAvatar(comment.email);

  div.innerHTML = `
      <img src="${avatarUrl}" alt="Avatar" class="avatar">
      <div class="comment-content">
          <strong>${escapeHtml(comment.username)}</strong>
          <p>${escapeHtml(comment.content)}</p>
          <button class="reply-button">Phản hồi</button>
          <form class="reply-form" style="display: none;">
              <textarea name="reply-text" placeholder="Viết phản hồi..." rows="2" required></textarea>
              <button type="submit">Gửi</button>
          </form>
          <div class="replies-container"></div>
      </div>
    `;

  const replyButton = div.querySelector('.reply-button');
  const replyForm = div.querySelector('.reply-form');

  replyButton.addEventListener('click', () => {
    if (!currentUser) {
      window.location.href = '/login.html';
      return;
    }
    replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
  });

  replyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const textarea = replyForm.querySelector('textarea');
    const content = textarea.value.trim();
    if (!content) return showToast('Vui lòng nhập nội dung', 'error');

    try {
      const res = await fetch(`https://backend-yl09.onrender.com/api/documents/${currentDocumentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          documentId: currentDocumentId,
          username: currentUser.username,
          email: currentUser.email,
          content: content,
          parentComment: comment._id
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || 'Lỗi gửi phản hồi');
      }
      const newReplyData = await res.json();
      await renderReply(newReplyData.comment, div.querySelector('.replies-container'));
      textarea.value = '';
      replyForm.style.display = 'none';
      showToast('Gửi phản hồi thành công!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  commentsList.appendChild(div);
  return div;
}

async function renderReply(reply, container) {
  if (!container) return;
  const div = document.createElement('div');
  div.classList.add('reply-item');
  const avatarUrl = await resolveAvatar(reply.email);
  div.innerHTML = `
        <img src="${avatarUrl}" alt="Avatar" class="avatar">
        <div class="comment-content">
            <strong>${escapeHtml(reply.username)}</strong>
            <p>${escapeHtml(reply.content)}</p>
        </div>
    `;
  container.appendChild(div);
}

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function md5(string) {
  return CryptoJS.MD5(string).toString();
}

function getGravatarUrl(email) {
  const trimmedEmail = email.trim().toLowerCase();
  const hash = md5(trimmedEmail);
  return `https://www.gravatar.com/avatar/${hash}`;
}

async function resolveAvatar(email) {
    const url = getGravatarUrl(email);
    try {
      const res = await fetch(`${url}?d=404`,{ credentials: 'include'});
      if (res.ok) return url;
    } catch (err) {
      console.warn('Gravatar fetch error:', err);
    }
    return '/assets/default_avaatar.jpg';
}

function escapeHtml(text) {
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showToast(message, type = 'success') {
    const toastEl = document.getElementById('liveToast');
    const toastBody = toastEl.querySelector('.toast-body');
    if (!toastEl || !toastBody) return;

    toastEl.classList.remove('bg-success', 'bg-danger', 'text-white');
    if (type === 'error') {
        toastEl.classList.add('bg-danger', 'text-white');
    } else {
        toastEl.classList.add('bg-success', 'text-white');
    }
    toastBody.innerHTML = message;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

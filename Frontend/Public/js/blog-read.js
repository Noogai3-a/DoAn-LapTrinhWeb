let currentUser = null;
// Lấy query param từ URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

window.addEventListener("DOMContentLoaded", async function () {
  const postId = getQueryParam("post");
  const isPreview = getQueryParam("preview") === "true";
  if (!postId) {
    showError("Không tìm thấy ID bài viết trong URL");
    return;
  }

  try {
    const res = await fetch(`https://backend-yl09.onrender.com/api/blogs/${postId}?preview=${isPreview}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error("Không tìm thấy bài viết");

    const data = await res.json();
    const blog = data.blog;
    const content = data.content || '';

    document.getElementById("post-title").innerText = blog.title;
    document.getElementById("post-date").innerText = formatDate(blog.createdAt);
    document.getElementById("post-author").innerText = `Người viết: ${blog.author}`;
    document.getElementById("post-content").innerHTML = content;

    // Convert Google Drive link to direct download ID
    function getDriveFileId(url) {
      const regex = /(?:\/d\/|id=)([a-zA-Z0-9_-]+)/;
      const match = url.match(regex); 
      return match ? match[1] : null;
    }

    const contentDiv = document.getElementById("post-content");
    const imgs = contentDiv.querySelectorAll('img');

    // Áp dụng lazy load cho tất cả ảnh trong content
    imgs.forEach(img => {
      const fileId = getDriveFileId(img.src);
      if (fileId) {
        const proxyUrl = `https://backend-yl09.onrender.com/api/proxy-image?url=https://drive.google.com/uc?id=${fileId}`;
        const placeholder = '/assets/login_pic.jpg';

        img.src = placeholder;          // gán placeholder
        img.classList.remove('fade-in');
        img.classList.add('lazy-img');  // thêm class lazy-img
        img.setAttribute('data-src', proxyUrl); // đặt url thật vào data-src
      }
    });

    const img = document.getElementById("post-image");
    if (img && blog.thumbnailImage) {
      const fileId = getDriveFileId(blog.thumbnailImage);
      if (fileId) {
        const proxyUrl = `https://backend-yl09.onrender.com/api/proxy-image?url=https://drive.google.com/uc?id=${fileId}`;
        const placeholder = '/assets/login_pic.jpg';

        img.src = placeholder;
        img.classList.remove('fade-in');
        img.classList.add('lazy-img');          // thêm class lazy-img
        img.setAttribute('data-src', proxyUrl); // đặt url thật vào data-src
        img.style.display = 'block';
      } else {
        img.style.display = 'none';
      }
    } else if (img) {
      img.style.display = 'none';
    }

    lazyLoadImages(() => {
      document.querySelectorAll("img.lazy-img").forEach(image => {
        if (image._preloadedSrc) {
          image.src = image._preloadedSrc;
          image.classList.add("fade-in");
        }
      });
    });
  } catch (err) {
    console.error(err);
    showError("Không tìm thấy hoặc tải bài viết thất bại");
  }
});


function formatDate(dateString) {
  const d = new Date(dateString);
  return isNaN(d) ? "Ngày không hợp lệ" : d.toLocaleDateString("vi-VN", {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function showError(msg) {
  document.getElementById("post-title").innerText = msg;
  document.getElementById("post-date").innerText = "";
  const img = document.getElementById("post-image");
  if (img) img.style.display = 'none';
  document.getElementById("post-content").innerHTML = `<p>${msg}</p>`;
}

function getGravatarUrl(email) {
  const trimmedEmail = email.trim().toLowerCase();
  const hash = md5(trimmedEmail);
  return `https://www.gravatar.com/avatar/${hash}`;
}

function md5(string) {
  return CryptoJS.MD5(string).toString();
}

function containsBadWords(text) {
  const badWords = [
      'fuck', 'shit', 'damn', 'bitch', 'ass',
      'đụ', 'địt', 'đéo', 'đcm', 'đcmn', 'đít',
      'lồn', 'cặc', 'đụ', 'đéo', 'đcm', 'đcmn',
      // Thêm các từ cấm khác vào đây
  ];
    
  const lowerText = text.toLowerCase();
  return badWords.some(word => lowerText.includes(word.toLowerCase()));
}

document.addEventListener('DOMContentLoaded', async function () {
  const form = document.querySelector('.comment-form');
  const textarea = form.querySelector('textarea');
  const commentsList = document.querySelector('.comments-list');
  const userAvatarImg = document.querySelector('.user-avatar');

  async function resolveAvatar(email) {
    const url = getGravatarUrl(email);
    try {
      const res = await fetch(`${url}?d=404`,{ credentials: 'include'});
      if (res.ok) return url;
    } catch (err) {
      console.warn('Gravatar fetch error:', err);
    }
    // fallback ảnh mặc định
    return '/assets/default_avaatar.jpg';
  }


  let userInfo = null;
  try {
    const res = await fetch('https://backend-yl09.onrender.com/api/user-info', { credentials: 'include' });
    if (res.ok) {
      userInfo = await res.json();
      if (userInfo?.email && userAvatarImg) {
        const avatarUrl = await resolveAvatar(userInfo.email);
        userAvatarImg.src = avatarUrl;
      }
    }
  } catch (err) {
    console.error('Lỗi lấy user info:', err);
    if (userAvatarImg) userAvatarImg.src = '/assets/default_avaatar.jpg';
  }

  const params = new URLSearchParams(window.location.search);
  const blogId = params.get('post');

  function escapeHtml(text) {
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  async function renderComment(comment) {
      const div = document.createElement('div');
      div.classList.add('comment-item');
      div.dataset.commentId = comment._id;

      const avatarUrl = await resolveAvatar(comment.email);

      div.innerHTML = `
        <img src="${avatarUrl}" alt="Avatar" class="avatar">
        <div class="comment-content">
            <strong>${escapeHtml(comment.username)}</strong>
            <p>${escapeHtml(comment.content)}</p>
            <button class="reply-button">Reply</button>
            <form class="reply-form" style="display: none;">
                <textarea 
                    id="reply-text-${comment._id}" 
                    name="reply-text" 
                    placeholder="Viết phản hồi của bạn..." 
                    rows="2"
                    required
                ></textarea>
                <button type="submit" id="submit-reply-${comment._id}" name="submit-reply">Gửi phản hồi</button>
            </form>
            <div class="replies-container"></div>
        </div>
      `;

      // Xử lý nút reply
      const replyButton = div.querySelector('.reply-button');
      const replyForm = div.querySelector('.reply-form');
      const submitButton = replyForm.querySelector('button[type="submit"]');
      
      replyButton.addEventListener('click', () => {
          replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
      });

      // Xử lý form reply
      replyForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const textarea = replyForm.querySelector('textarea');
          const content = textarea.value.trim();
          
          if (!content) {
            showToast('Vui lòng nhập nội dung phản hồi', 'error');
            return;          
          }
          if (containsBadWords(content)) {
            showToast('Phản hồi chứa từ ngữ không phù hợp', 'error');
            return;
          }
          submitButton.disabled = true;
          submitButton.textContent = 'Đang gửi...';
          
          try {
              const res = await fetch(`https://backend-yl09.onrender.com/api/blogs/${blogId}/comments`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                      blogId: blogId,
                      username: userInfo.username,
                      email: userInfo.email,
                      content: content,
                      parentComment: comment._id
                  })
              });

              if (!res.ok) throw new Error('Failed to post reply');

              const newReply = await res.json();
              await renderReply(newReply.comment, div.querySelector('.replies-container'));
              textarea.value = '';
              replyForm.style.display = 'none';
              showToast('Gửi phản hồi thành công!', 'success');
          } catch (err) {
              console.error('Error posting reply:', err);
              showToast('Lỗi khi gửi phản hồi', 'error');
          } finally {
            // Enable lại form
            submitButton.disabled = false;
            submitButton.textContent = 'Gửi phản hồi';
          }
      });

      commentsList.appendChild(div);
  }

  async function renderReply(reply, container) {
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

  function showToast(message, type = 'success') {
    const toastEl = document.getElementById('liveToast');
    const toastBody = toastEl.querySelector('.toast-body');

    toastEl.classList.remove('bg-success', 'bg-danger', 'text-white');

    if (type === 'error') {
        toastEl.classList.add('bg-danger', 'text-white');
    } else {
        toastEl.classList.add('bg-success', 'text-white');
    }

    toastBody.innerHTML = message;

    const toast = new bootstrap.Toast(toastEl, {
        delay: 2000,
        autohide: true
    });

    toast.show();
  }

// Thêm hàm escapeHtml nếu chưa có
  function escapeHtml(text) {
      return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  async function loadComments() {
    const isPreview = getQueryParam("preview") === "true";
    try {
        const res = await fetch(`https://backend-yl09.onrender.com/api/blogs/${blogId}?preview=${isPreview}`,
            {credentials: 'include'}
        );
        if (!res.ok) throw new Error('Không thể tải bài viết');
        const data = await res.json();

        const comments = data.comments || [];
        const replies = comments.filter(c => c.parentComment);
        const parentComments = comments.filter(c => !c.parentComment);

        commentsList.innerHTML = '';
        for (const comment of parentComments) {
            await renderComment(comment);
            // Load replies cho comment này
            const commentReplies = replies.filter(r => r.parentComment === comment._id);
            for (const reply of commentReplies) {
                const commentElement = commentsList.querySelector(`[data-comment-id="${comment._id}"]`);
                if (commentElement) {
                    await renderReply(reply, commentElement.querySelector('.replies-container'));
                }
            }
        }
    } catch (err) {
        console.error('Lỗi load comments:', err);
    }
  }

  if (blogId) {
    await loadComments();
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const commentText = textarea.value.trim();
    if (!commentText) return alert('Vui lòng nhập bình luận');
    if (!blogId) return alert('Không xác định được bài viết');
    if (containsBadWords(commentText)) {
        showToast('Comment chứa từ ngữ không phù hợp', 'error');
        return;
    }

    if (!userInfo || !userInfo.username || !userInfo.email) {
      window.location.href = '/login'; 
      return;
    }

    try {
      const res = await fetch(`https://backend-yl09.onrender.com/api/blogs/${blogId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          blogId: blogId,
          username: userInfo.username,
          email: userInfo.email,
          content: commentText
        })
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errData = await res.json();
          throw new Error(errData.msg || 'Lỗi gửi bình luận');
        } else {
          const text = await res.text();
          console.error('Error response text:', text);
          throw new Error('Server trả về lỗi không phải JSON');
        }
      }
      // Render comment mới trực tiếp mà không load lại toàn bộ
      const newComment = {
        username: userInfo.username,
        email: userInfo.email,
        content: commentText
      };
      await renderComment(newComment);
      // Xóa textarea để người dùng có thể nhập bình luận mới
      textarea.value = '';
    } catch (err) {
      console.error('Gửi bình luận lỗi:', err);
      alert(err.message);
    }
  });
});

function lazyLoadImages(callback) {
    const lazyImages = document.querySelectorAll("img.lazy-img");
    let loadedCount = 0;
    const total = lazyImages.length;

    if (total === 0) {
      callback();
      return;
    }

    lazyImages.forEach(img => {
      const realSrc = img.getAttribute("data-src");
      if (!realSrc) {
        loadedCount++;
        if (loadedCount === total) callback();
        return;
      }

      const temp = new Image();
      temp.onload = temp.onerror = () => {
        loadedCount++;
        img._preloadedSrc = realSrc;
        if (loadedCount === total) callback();
      };
      temp.src = realSrc;
    });
  }
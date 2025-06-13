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

    const avatarUrl = await resolveAvatar(comment.email);

    div.innerHTML = `
      <img src="${avatarUrl}" alt="Avatar" class="avatar">
      <div class="comment-content">
        <strong>${escapeHtml(comment.username)}</strong>
        <p>${escapeHtml(comment.content)}</p>
      </div>
    `;
    commentsList.appendChild(div);
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

        commentsList.innerHTML = '';
        for (const comment of comments) {
          await renderComment(comment);
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

    if (!userInfo || !userInfo.username || !userInfo.email) {
      // Chuyển trang đến login (thay URL theo dự án của bạn)
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
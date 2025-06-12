document.addEventListener("DOMContentLoaded", async () => {
  const blogListContainer = document.querySelector(".blog-list");

  // Chuyển link Google Drive thành link ảnh trực tiếp
  function getDriveDirectLink(url) {
    const regex = /\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    if (match) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return url;
  }

  // Nếu cần proxy qua server để tránh lỗi CORS
  function proxyImageURL(url) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }

  // Hàm loại bỏ thẻ img trong content
  function stripHTML(html) {
    const div = document.createElement("div");
    div.innerHTML = html;

    const images = div.querySelectorAll("img");
    images.forEach(img => img.remove());

    return div.textContent || div.innerText || "";
  }

  // Hàm tạo HTML cho từng blog, có thêm nút delete
  function createBlogItem(blog) {
    const contentText = stripHTML(blog.content || "");
    const placeholder = "/assets/login_pic.jpg";
    let realImage = placeholder;
    // Xử lý thumbnail từ Google Drive nếu có
    if (blog.thumbnailImage) {
      realImage = proxyImageURL(getDriveDirectLink(blog.thumbnailImage));
    }

    let date = "";
    if (blog.createdAt) {
      const parsedDate = new Date(blog.createdAt);
      if (!isNaN(parsedDate)) {
        date = parsedDate.toLocaleDateString("vi-VN");
      }
    }

    return `
      <div class="blog-item" data-id="${blog._id}">
        <a href="/blog-read?post=${blog._id}" class="blog-link" style="text-decoration: none">
          <img 
            src="${placeholder}" 
            data-src="${realImage}" 
            alt="Thumbnail" 
            class="blog-image lazy-img"
          >
          <h3>${blog.title}</h3>
          <h6>${date}</h6>
          <p>${contentText.substring(0, 50)}...</p>
        </a>
        <button class="fas fa-trash delete-icon"></button>
      </div>
    `;
  }

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

  // Hàm load blog của user và render
  async function loadMyBlogs() {
    try {
      const res = await fetch('https://backend-yl09.onrender.com/api/blogs/my', { credentials: 'include' });
      if (!res.ok) throw new Error("Không lấy được danh sách blog");

      const blogs = await res.json();

      if (!Array.isArray(blogs)) {
        throw new Error("Dữ liệu blogs không hợp lệ");
      }

      if (blogs.length === 0) {
        blogListContainer.innerHTML = `<p>Bạn chưa đăng blog nào.</p>`;
        return;
      }

      blogListContainer.innerHTML = blogs.map(createBlogItem).join('');
      lazyLoadImages(() => {
        document.querySelectorAll("img.lazy-img").forEach(img => {
          if (img._preloadedSrc) {
            img.src = img._preloadedSrc;
            img.classList.add("fade-in");
          }
        });
      });

      // Gắn sự kiện xóa cho từng nút
      document.querySelectorAll(".delete-icon").forEach(button => {
        button.addEventListener("click", async (e) => {
          const blogItem = e.target.closest(".blog-item");
          const blogId = blogItem.getAttribute("data-id");

          showConfirmModal("Bạn có chắc chắn muốn xóa blog này không?", async () => {
            try {
              const deleteRes = await fetch(`https://backend-yl09.onrender.com/api/blogs/${blogId}`, {
                method: 'DELETE',
                credentials: 'include'
              });
              if (!deleteRes.ok) {
                const errData = await deleteRes.json();
                showToast('Xóa thất bại: ' + (errData.msg || deleteRes.statusText), 'error');
                return;
              }

              showToast('Xóa blog thành công!', 'success');
              // Tải lại danh sách blog sau khi xóa
              loadMyBlogs();
            } catch (err) {
              showToast('Lỗi khi xóa blog: ' + err.message, 'error');
            }
          });
        });
      });
    } catch (err) {
      console.error("Lỗi khi load blog người dùng:", err);
      blogListContainer.innerHTML = `<p>Không thể tải bài viết. Vui lòng thử lại sau.</p>`;
    }
  }

  loadMyBlogs();
  loadMyDocuments();

    async function loadMyDocuments() {
    const container = document.getElementById("my-documents");
    try {
      const res = await fetch('https://backend-yl09.onrender.com/api/documents/my', {
        credentials: 'include'
      });

      if (!res.ok) throw new Error("Không thể tải tài liệu");

      const docs = await res.json();
      if (!Array.isArray(docs) || docs.length === 0) {
        container.innerHTML = `<p>Bạn chưa đăng tài liệu nào.</p>`;
        return;
      }

      container.innerHTML = docs.map(doc => {
        const fileUrl = `https://backend-yl09.onrender.com/${doc.fileUrl.replace(/\\/g, '/')}`;
        const title = doc.title || "Tài liệu";
        const desc = doc.description || "";
        const id = doc._id;

        return `
          <div class="document-item" data-id="${id}">
            <div class="doc-content">
              <h3><a href="${fileUrl}" target="_blank">${title}</a></h3>
              <p>${desc}</p>
            </div>
            <div class="doc-action">
              <i class="fas fa-trash delete-icon"></i>
            </div>
          </div>
        `;
      }).join('');

      // Gắn sự kiện xoá
      document.querySelectorAll(".document-item .delete-icon").forEach(button => {
        button.addEventListener("click", async (e) => {
          const docItem = e.target.closest(".document-item");
          const docId = docItem.getAttribute("data-id");

          showConfirmModal("Bạn có chắc chắn muốn xóa tài liệu này không?", async () => {
            try {
              const deleteRes = await fetch(`https://backend-yl09.onrender.com/api/review-documents/${docId}`, {
                method: 'DELETE',
                credentials: 'include'
              });
              if (!deleteRes.ok) {
                const errData = await deleteRes.json();
                showToast('Xóa thất bại: ' + (errData.msg || deleteRes.statusText), 'error');
                return;
              }

              showToast('Xóa tài liệu thành công!', 'success');
              loadMyDocuments(); // reload lại danh sách
            } catch (err) {
              showToast('Lỗi khi xóa tài liệu: ' + err.message, 'error');
            }
          });
        });
      });

    } catch (err) {
      console.error("❌ Lỗi khi tải tài liệu:", err);
      container.innerHTML = `<p>Không thể tải tài liệu. Vui lòng thử lại sau.</p>`;
    }
  }

});

function showToast(message, type = 'success') {
    const toastE1 = document.getElementById("liveToast");
    const toastBody = toastE1.querySelector(".toast-body");

    // Xóa hết class bg- cũ, giữ lại border-0
    toastE1.classList.remove("bg-success", "bg-danger", "text-white");

    if (type === 'error') {
        toastE1.classList.add("bg-danger", "text-white");
    } else {
        toastE1.classList.add("bg-success", "text-white");
    }

    toastBody.innerHTML = message;

    const toast = new bootstrap.Toast(toastE1, {
        delay: 2000,
        autohide: true
    });

    toast.show();
}
function showConfirmModal(message, onConfirm) {
  const modalEl = document.getElementById("confirmModal");
  const messageEl = document.getElementById("confirmModalMessage");
  const confirmBtn = document.getElementById("confirmModalOk");

  messageEl.textContent = message;

  const bsModal = new bootstrap.Modal(modalEl);
  bsModal.show();

  // Gỡ sự kiện cũ và gán mới
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

  newConfirmBtn.addEventListener("click", () => {
    bsModal.hide();
    onConfirm();
  });
}
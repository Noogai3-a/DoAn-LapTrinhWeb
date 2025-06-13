document.addEventListener("DOMContentLoaded", async () => {
  const blogListContainers = document.querySelectorAll(".blog-list");

  // Lấy link Google Drive ảnh gốc
  function getDriveDirectLink(url) {
    const regex = /\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? `https://drive.google.com/uc?export=view&id=${match[1]}` : url;
  }

  // Gắn proxy để tránh CORS
  function proxyImageURL(url) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }

  // Loại bỏ thẻ <img> trong content HTML
  function stripHTML(html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    div.querySelectorAll("img").forEach(img => img.remove());
    return div.textContent || div.innerText || "";
  }

  // Tạo từng blog-item
  function createBlogItem(blog) {
    const contentText = stripHTML(blog.content || "");
    const placeholder = "/assets/login_pic.jpg";
    let realImage = placeholder;

    if (blog.thumbnailImage) {
      realImage = proxyImageURL(getDriveDirectLink(blog.thumbnailImage));
    }

    const date = blog.createdAt
      ? new Date(blog.createdAt).toLocaleDateString("vi-VN")
      : "";

    return `
      <a href="/blog-read?post=${blog._id}" class="blog-item">
        <img 
          src="${placeholder}" 
          data-src="${realImage}" 
          alt="Ảnh blog" 
          class="blog-image lazy-img"
        >
        <h3>${blog.title}</h3>
        <div class="blog-meta">
          <h6>${date}</h6>
          <div class="blog-stats">
            <span class="author"><i class="fas fa-user"></i> ${blog.author}</span>
            <span class="views"><i class="fas fa-eye"></i> ${blog.views || 0}</span>
          </div>
        </div>
        <p>${contentText.substring(0, 50)}...</p>
      </a>
    `;
  }

  // Tải tất cả ảnh trước khi hiển thị thật
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

  try {
    const res = await fetch('https://backend-yl09.onrender.com/api/blogs', {
      credentials: 'include',
    });

    if (!res.ok) throw new Error("Không lấy được danh sách blog");

    const blogs = await res.json();
    if (!Array.isArray(blogs)) throw new Error("Dữ liệu blogs không hợp lệ");

    blogListContainers.forEach(container => container.innerHTML = "");

    if (blogs.length > 0) {
      const latestBlogs = [...blogs]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4);

      const mostViewedBlogs = [...blogs]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 4);

      blogListContainers[0].innerHTML = latestBlogs.map(createBlogItem).join('');
      blogListContainers[1].innerHTML = mostViewedBlogs.map(createBlogItem).join('');
      // Khi tất cả ảnh load xong, gán src thực và thêm class hiệu ứng
      lazyLoadImages(() => {
        document.querySelectorAll("img.lazy-img").forEach(img => {
          if (img._preloadedSrc) {
            img.src = img._preloadedSrc;
            img.classList.add("fade-in");
          }
        });
      });
    }
  } catch (err) {
    console.error("Lỗi khi load blog:", err);
    blogListContainers.forEach(container => {
      container.innerHTML = `<p>Không thể tải bài viết. Vui lòng thử lại sau.</p>`;
    });
  }

});

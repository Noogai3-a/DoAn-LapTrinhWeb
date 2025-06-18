let userInfo = null;
try {
  const res = await fetch('https://backend-yl09.onrender.com/api/user-info', { credentials: 'include' });
  if (res.ok) {
    userInfo = await res.json();
  }
} catch (err) {
  console.error('Lỗi lấy user info:', err);
}

async function checkAuth() {
  try {
    if (!userInfo || !userInfo.username || !userInfo.email) {
      window.location.href = '/login'; 
    } else {
        window.location.href = '/login';
    }
  } catch (error) {
      window.location.href = '/login';
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const blogListContainers = document.querySelectorAll(".blog-list");
  const categoryBlogsContainer = document.querySelector(".category-blogs");
  

  function getDriveDirectLink(url) {
    const regex = /\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    if (match) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return url;
  }

  function proxyImageURL(url) {
  return `https://backend-yl09.onrender.com/api/proxy-image?url=${encodeURIComponent(url)}`;
  }


  function stripHTML(html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    div.querySelectorAll("img").forEach(img => img.remove());
    return div.textContent || div.innerText || "";
  }

  function createBlogItem(blog) {
    const contentText = stripHTML(blog.content || "");

    let placeholder = "/assets/login_pic.jpg";
    let realImage = placeholder;

    if (blog.thumbnailImage) {
      const direct = getDriveDirectLink(blog.thumbnailImage);
      realImage = proxyImageURL(direct);
    }

    let date = "";
    if (blog.createdAt) {
      const parsedDate = new Date(blog.createdAt);
      if (!isNaN(parsedDate)) {
        date = parsedDate.toLocaleDateString("vi-VN");
      }
    }

    return `
      <a href="/blog-read?post=${blog._id}" class="blog-item">
        <img 
          src="${placeholder}" 
          data-src="${realImage}" 
          alt="thumbnail" 
          class="blog-image lazy-img">
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

  function lazyLoadImages(callback) {
    const lazyImages = document.querySelectorAll("img.lazy-img");
    let loadedCount = 0;
    const total = lazyImages.length;

    lazyImages.forEach(img => {
      const realSrc = img.getAttribute("data-src");
      if (!realSrc) {
        loadedCount++;
        if (loadedCount === total) callback();
        return;
      }

      const temp = new Image();
      temp.onload = () => {
        loadedCount++;
        if (loadedCount === total) {
          callback();
        }
      };
      temp.onerror = () => {
        loadedCount++;
        if (loadedCount === total) {
          callback();
        }
      };
      temp.src = realSrc;
      img._preloadedSrc = temp.src; // lưu để sau gán lại
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
    }

    const categoryBlogs = {};
    blogs.forEach(blog => {
      const category = blog.category;
      if (!categoryBlogs[category]) {
        categoryBlogs[category] = [];
      }
      categoryBlogs[category].push(blog);
    });

    categoryBlogsContainer.innerHTML = '';
    Object.entries(categoryBlogs).forEach(([category, categoryBlogs]) => {
      if (categoryBlogs.length > 0) {
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        categorySection.innerHTML = `
          <h2><i class="fas fa-folder"></i> ${category}</h2>
          <div class="blog-list">
            ${categoryBlogs.map(createBlogItem).join('')}
          </div>
        `;
        categoryBlogsContainer.appendChild(categorySection);
      }
    });

    // Load ảnh lazy
    lazyLoadImages(() => {
      document.querySelectorAll("img.lazy-img").forEach(img => {
        if (img._preloadedSrc) {
          img.src = img._preloadedSrc;
          img.classList.add("fade-in");
        }
      });
    });
  } catch (err) {
    console.error("Lỗi khi load blog:", err);
    blogListContainers.forEach(container => {
      container.innerHTML = `<p>Không thể tải bài viết. Vui lòng thử lại sau.</p>`;
    });
  }
});

const BACKEND_URL = 'https://backend-yl09.onrender.com/api';

document.addEventListener("DOMContentLoaded", async () => {
  const latestContainer = document.getElementById("latest-documents");
  const popularContainer = document.getElementById("popular-documents");

  // Tạo từng document-item
  function createDocumentItem(doc) {
    const fileUrl = `https://backend-yl09.onrender.com/${doc.fileUrl.replace(/\\/g, '/')}`;
    const subtitle = `${doc.subjectNameLabel || ''} • ${doc.subjectTypeLabel || ''}`;
    const detailUrl = `/document.html?slug=${doc.slug}`;
    let thumbnailSrc = '/assets/doc-default.png';
    if (doc.previewUrl) {
      if (doc.previewUrl.startsWith('http')) {
        thumbnailSrc = doc.previewUrl; // là URL đầy đủ rồi
      } else {
        // chỉ là phần đuôi như "thumbnail?id=abcxyz"
        thumbnailSrc = 'https://drive.google.com/' + doc.previewUrl;
      }
    }
    return `
    <div class="document-item">
      <a href="${detailUrl}" style="text-decoration: none;">
        <img 
          src="${thumbnailSrc || '/assets/doc-default.png'}" 
          alt="${doc.title}" 
          class="doc-image lazy-img"
        />
        <div class="doc-info">
          <h3>${doc.title}</h3>
          <p class="doc-meta">${subtitle}</p>
          </div>
      </a>
    </div>
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
    // Lấy tài liệu mới nhất
    const latestRes = await fetch(`${BACKEND_URL}/documents/latest`, {
      credentials: 'include'
    });
    if (!latestRes.ok) throw new Error("Không lấy được danh sách tài liệu mới nhất");
    const latestDocs = await latestRes.json();

    // Lấy tài liệu xem nhiều nhất
    const popularRes = await fetch(`${BACKEND_URL}/documents/popular`, {
      credentials: 'include'
    });
    if (!popularRes.ok) throw new Error("Không lấy được danh sách tài liệu phổ biến");
    const popularDocs = await popularRes.json();

    // Hiển thị tài liệu mới nhất
    if (Array.isArray(latestDocs) && latestDocs.length > 0) {
      latestContainer.innerHTML = latestDocs.map(createDocumentItem).join('');
    } else {
      latestContainer.innerHTML = '<p>Không có tài liệu mới nào</p>';
    }

    // Hiển thị tài liệu phổ biến
    if (Array.isArray(popularDocs) && popularDocs.length > 0) {
      popularContainer.innerHTML = popularDocs.map(createDocumentItem).join('');
    } else {
      popularContainer.innerHTML = '<p>Không có tài liệu phổ biến</p>';
    }

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
    console.error("Lỗi khi load tài liệu:", err);
    latestContainer.innerHTML = '<p>Không thể tải tài liệu. Vui lòng thử lại sau.</p>';
    popularContainer.innerHTML = '<p>Không thể tải tài liệu. Vui lòng thử lại sau.</p>';
  }
});
document.addEventListener("DOMContentLoaded", async () => {
  const latestContainer = document.getElementById("latest-documents");
  const popularContainer = document.getElementById("popular-documents");

  // Lấy thumbnail từ Google Drive (nếu cần)
  function getDriveDirectLink(url) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? `https://drive.google.com/uc?export=view&id=${match[1]}` : url;
  }

  // Proxy để tránh CORS
  function proxyImageURL(url) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }

  // Hiển thị 1 document dưới dạng "blog-item"
  function createDocumentCard(doc) {
    const fileUrl = `https://backend-yl09.onrender.com/${doc.fileUrl.replace(/\\/g, '/')}`;
    const thumbnail = doc.previewImage
      ? proxyImageURL(getDriveDirectLink(doc.previewImage))
      : '/assets/doc-default.png';

    const title = doc.title || "Tài liệu";
    const subtitle = `${doc.subjectNameLabel || ''} • ${doc.subjectTypeLabel || ''}`;
    const description = doc.description || "";

    return `
      <a href="${fileUrl}" class="doc-item" target="_blank">
        <img src="${thumbnail}" alt="${title}" class="doc-image">
        <h3>${title}</h3>
        <h6>${subtitle}</h6>
        <p>${description.slice(0, 80)}...</p>
      </a>
    `;
  }

  try {
    // Load latest documents
    const latestRes = await fetch("https://backend-yl09.onrender.com/api/documents/latest", {
      credentials: "include",
    });
    const latestData = await latestRes.json();
    latestContainer.innerHTML = latestData.map(createDocumentCard).join("");

    // Load popular documents
    const popularRes = await fetch("https://backend-yl09.onrender.com/api/documents/popular", {
      credentials: "include",
    });
    const popularData = await popularRes.json();
    popularContainer.innerHTML = popularData.map(createDocumentCard).join("");

  } catch (error) {
    console.error("❌ Lỗi khi tải tài liệu:", error);
    latestContainer.innerHTML = `<p>Không thể tải tài liệu mới nhất.</p>`;
    popularContainer.innerHTML = `<p>Không thể tải tài liệu phổ biến.</p>`;
  }
});

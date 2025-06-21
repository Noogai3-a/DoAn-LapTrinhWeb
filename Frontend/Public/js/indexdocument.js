const BACKEND_URL = 'https://backend-yl09.onrender.com/api';

document.addEventListener("DOMContentLoaded", () => {
  const latestContainer = document.getElementById("latest-documents");
  const popularContainer = document.getElementById("popular-documents");

  function createDocumentHTML(doc) {
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
          style="width: 150px; height: 200px; object-fit: cover; border-radius: 4px;" 
        />
        <p class="doc-title">${doc.title}</p>
        <p class="doc-subtitle">${subtitle}</p>
      </a>
    </div>
    `;
  }

  fetch(`${BACKEND_URL}/documents/latest`, {
    credentials: 'include'
  })
    .then(res => res.json())
    .then(data => {
      latestContainer.innerHTML = data.map(createDocumentHTML).join('');
    })
    .catch(err => console.error("❌ Lỗi tải tài liệu mới nhất:", err));

  fetch(`${BACKEND_URL}/documents/popular`, {
    credentials: 'include'
  })
    .then(res => res.json())
    .then(data => {
      popularContainer.innerHTML = data.map(createDocumentHTML).join('');
    })
    .catch(err => console.error("❌ Lỗi tải tài liệu phổ biến:", err));
});

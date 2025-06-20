const BACKEND_URL = 'https://backend-yl09.onrender.com/api';

document.addEventListener("DOMContentLoaded", () => {
  const latestContainer = document.getElementById("latest-documents");
  const popularContainer = document.getElementById("popular-documents");

  function createDocumentHTML(doc) {
    const fileUrl = `https://backend-yl09.onrender.com/${doc.fileUrl.replace(/\\/g, '/')}`;
    const subtitle = `${doc.subjectNameLabel || ''} • ${doc.subjectTypeLabel || ''}`;
    const title = doc.title || 'Tài liệu';
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
      <a href="${fileUrl}" class="doc-item" target="_blank">
        <img src="${thumbnailSrc}" alt="${title}" class="doc-image">
        <h3>${title}</h3>
        <h6>${subtitle}</h6>
        <p>${doc.description || ''}</p>
      </a>
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

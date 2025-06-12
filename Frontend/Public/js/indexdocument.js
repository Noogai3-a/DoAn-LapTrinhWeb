const BACKEND_URL = 'https://backend-yl09.onrender.com/api';

document.addEventListener("DOMContentLoaded", () => {
  const latestContainer = document.getElementById("latest-documents");
  const popularContainer = document.getElementById("popular-documents");

  function createDocumentHTML(doc) {
    const fileUrl = `https://backend-yl09.onrender.com/${doc.fileUrl.replace(/\\/g, '/')}`;
    const subtitle = `${doc.subjectNameLabel || ''} • ${doc.subjectTypeLabel || ''}`;
    const title = doc.title || 'Tài liệu';
    const thumbnail = doc.previewImage || '/assets/doc-default.png';

    return `
      <a href="${fileUrl}" class="doc-item" target="_blank">
        <img src="${thumbnail}" alt="${title}" class="doc-image">
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

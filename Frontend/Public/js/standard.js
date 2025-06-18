const BACKEND_URL = 'https://backend-yl09.onrender.com/api';

document.addEventListener("DOMContentLoaded", () => {
  const latestContainer = document.getElementById("latest-documents");
  const popularContainer = document.getElementById("popular-documents");
  const contributeBtn = document.getElementById("contribute-btn");

  function createDocumentHTML(doc) {
  const fileUrl = `https://backend-yl09.onrender.com/${doc.fileUrl.replace(/\\/g, '/')}`;
  const subtitle = `${doc.subjectNameLabel || ''} • ${doc.subjectTypeLabel || ''}`;
  const detailUrl = `/document.html?slug=${doc.slug}`;

  return `
    <div class="document-item">
      <a href="${detailUrl}">
        <img src="${doc.previewUrl || '/assets/doc-default.png'}" alt="${doc.title}" />
        <p class="doc-title">${doc.title}</p>
        <p class="doc-subtitle">${subtitle}</p>
      </a>
    </div>
  `;
}

  // Add session checking for contribute button
  if (contributeBtn) {
    contributeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Check if user is authenticated
      fetch(`${BACKEND_URL}/user-info`, {
        credentials: 'include'
      })
      .then(res => {
        if (res.status === 401) {
          // User not authenticated, redirect to login
          window.location.href = '/login';
        } else {
          // User is authenticated, redirect to upload page
          window.location.href = '/upload';
        }
      })
      .catch(err => {
        console.error('Lỗi kiểm tra session:', err);
        // On error, redirect to login for safety
        window.location.href = '/login';
      });
    });
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

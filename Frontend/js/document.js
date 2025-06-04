document.addEventListener('DOMContentLoaded', () => {
  // Lấy documentId từ URL query param ?id=...
  const urlParams = new URLSearchParams(window.location.search);
  const documentId = urlParams.get('id');

  if (!documentId) {
    document.getElementById('document-detail').innerHTML = '<p class="error">Không tìm thấy ID tài liệu.</p>';
    return;
  }

  fetch(`/api/documents/${documentId}`)
    .then(res => {
      if (!res.ok) throw new Error('Không tải được tài liệu');
      return res.json();
    })
    .then(doc => {
      const container = document.getElementById('document-detail');
      const safeUrl = doc.fileUrl.replace(/\\/g, '/');

      container.innerHTML = `
        <h2>${doc.title}</h2>

        <div class="file-preview" style="height: 800px; margin: 16px 0;">
          <iframe src="/${safeUrl}#zoom=100" width="100%" height="100%" frameborder="0" allowfullscreen>
            Trình duyệt của bạn không hỗ trợ xem PDF.
          </iframe>
        </div>
      `;
    })
    .catch(err => {
      document.getElementById('document-detail').innerHTML = `<p class="error">Lỗi tải tài liệu: ${err.message}</p>`;
    });

  // Xử lý sự kiện click đánh giá sao
  const stars = document.querySelectorAll("#rating-stars .star");

  stars.forEach(star => {
    star.addEventListener("click", () => {
      const val = parseInt(star.dataset.value, 10);

      stars.forEach(s => {
        const sVal = parseInt(s.dataset.value, 10);
        if (sVal <= val) {
          s.classList.add("active");
        } else {
          s.classList.remove("active");
        }
      });
    });
  });
});

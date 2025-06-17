// admin-documents.js

document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.querySelector('.documents-table table tbody');
  const loading = document.getElementById('loading');
  const mainContent = document.getElementById('main');
  const statusFilter = document.getElementById('filter-status');
  const subjectFilter = document.getElementById('filter-subject'); // this dropdown has values "all", "blog", "doc"
  const searchInput = document.querySelector('.search-box input');

  // Nếu không tìm thấy tbody, dừng
  if (!tableBody) {
    console.error('Không tìm thấy tbody của Tài liệu!');
    return;
  }

  if (!loading || !mainContent) {
    console.warn('Thiếu phần tử #loading hoặc #main trong HTML cho Tài liệu!');
  }

  let allDocs = [];

  // Hàm định dạng ngày giống Blog
  function formatDate(isoDate) {
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Tạo một row <tr> cho document
  function createRow(doc, index) {
    const isApproved = doc.status === 'approved';
    const contentPreview = typeof doc.description === 'string'
      ? doc.description.substring(0, 100) + '...'
      : '';

    return `
      <tr class="doc-row" data-id="${doc._id}">
        <td>${index + 1}</td>
        <td>
          <div class="document-info">
            <div class="document-title">${escapeHtml(doc.title)}</div>
            <div class="document-description">${escapeHtml(contentPreview)}</div>
          </div>
        </td>
        <td>${escapeHtml(doc.uploader)}</td>
        <td>${formatDate(doc.uploadDate)}</td>
        <td>${escapeHtml(doc.subjectName)}</td>
        <td>
          <span class="status-badge ${isApproved ? 'approved' : 'pending'}">
            ${isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
          </span>
        </td>
        <td>
          <button class="action-btn preview-doc" data-id="${doc._id}">
            <i class="fas fa-eye"></i> Xem
          </button>
          ${
            isApproved
              ? ''
              : `
                <div class="approval-buttons">
                  <button class="approve-doc-btn" data-id="${doc._id}" title="Duyệt">
                    <i class="fas fa-check"></i>
                  </button>
                  <button class="reject-doc-btn" data-id="${doc._id}" title="Từ chối">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              `
          }
        </td>
      </tr>
    `;
  }

  
  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");
  }

  // Load danh sách documents từ API
  async function loadDocs() {
    try {
      const res = await fetch('/api/documents',{credentials: 'include'});
      if (!res.ok) throw new Error('Lỗi khi tải danh sách tài liệu');
      const data = await res.json();

      const { approvedDocuments = [], pendingDocuments = [] } = data;
      allDocs = [...pendingDocuments, ...approvedDocuments];

      filterAndRender();

      if (approvedDocuments.length === 0 && pendingDocuments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Không có tài liệu</td></tr>';
      } else {
        tableBody.innerHTML = allDocs.map((doc, i) => createRow(doc, i)).join('');
      }

      if (loading) loading.style.display = 'none';
      if (mainContent) mainContent.style.display = 'block';

      addEventListeners();
    } catch (err) {
      console.error('Lỗi khi load tài liệu:', err);
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">Lỗi khi tải dữ liệu</td></tr>';
      if (loading) loading.style.display = 'none';
      if (mainContent) mainContent.style.display = 'block';
    }
  }

  // Duyệt document
  async function approveDoc(id) {
    try {
      const res = await fetch(`https://backend-yl09.onrender.com/api/admin/approve-document/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Duyệt tài liệu thất bại');
      showToast('Duyệt tài liệu thành công!', 'success');
      const row = document.querySelector(`button.approve-doc-btn[data-id="${id}"]`).closest('tr');
      const badge = row.querySelector('.status-badge');
      badge.textContent = 'Đã duyệt';
      badge.classList.remove('pending');
      badge.classList.add('approved');
      const buttons = row.querySelector('.approval-buttons');
      if (buttons) buttons.remove();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Từ chối document (xoá)
  async function rejectDoc(id) {
    try {
      const response = await fetch(`/api/admin/document/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Lỗi khi từ chối tài liệu');
      }

      showToast('Xóa tài liệu thành công!', 'success');
      const docRow = document.querySelector(`.doc-row[data-id="${id}"]`);
      if (docRow) docRow.remove();
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  }

  // Thêm event listeners cho các nút Duyệt / Từ chối / Xem
  function addEventListeners() {
    document.querySelectorAll('.approve-doc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        showConfirmModal('Bạn có chắc muốn duyệt tài liệu này không?', () => {
          approveDoc(id);
        });
      });
    });

    document.querySelectorAll('.reject-doc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        showConfirmModal('Bạn có chắc muốn từ chối tài liệu này không?', () => {
          rejectDoc(id);
        });
      });
    });

    document.querySelectorAll('.action-btn.preview-doc').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        window.location.href = `/document-read?id=${id}&preview=true`;
      });
    });
  }

  // Lọc và render dựa trên trạng thái, loại, từ khóa
  function filterAndRender() {
    const status = statusFilter.value;       // "all", "approved", "pending"
    const type   = subjectFilter.value;      // "all", "blog", "doc"
    const keyword = searchInput.value.toLowerCase();

    let filtered = [...allDocs];

    // Lọc theo trạng thái
    if (status !== 'all') {
      const approved = status === 'approved';
      filtered = filtered.filter(doc => doc.status === (approved ? 'approved' : 'pending'));
    }

    // Lọc theo loại (nếu loại = "blog", không show doc nào)
    if (type === 'blog') {
      filtered = [];
    }

    // Tìm kiếm theo title hoặc description
    if (keyword.trim()) {
      filtered = filtered.filter(doc =>
        (doc.title || '').toLowerCase().includes(keyword) ||
        (doc.description || '').toLowerCase().includes(keyword)
      );
    }

    if (filtered.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Không có tài liệu phù hợp</td></tr>';
    } else {
      tableBody.innerHTML = filtered.map((doc, i) => createRow(doc, i)).join('');
      addEventListeners();
    }
  }

  statusFilter.addEventListener('change', filterAndRender);
  subjectFilter.addEventListener('change', filterAndRender);
  searchInput.addEventListener('input', filterAndRender);

  loadDocs();
});

// Các hàm showToast và showConfirmModal giống hệt Blog:

function showToast(message, type = 'success') {
  const toastE1 = document.getElementById("liveToast");
  const toastBody = toastE1.querySelector(".toast-body");

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

  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

  newConfirmBtn.addEventListener("click", () => {
    bsModal.hide();
    onConfirm();
  });
}

const BACKEND = 'https://backend-yl09.onrender.com';
document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.querySelector('.documents-table table tbody');
  const loading = document.getElementById('loading');
  const mainContent = document.getElementById('main');
  const statusFilter = document.getElementById('filter-status');
  const subjectFilter = document.getElementById('filter-subject');
  const searchInput = document.querySelector('.search-box input');

  if (!tableBody) {
    console.error('Không tìm thấy tbody!');
    return;
  }

  if (!loading || !mainContent) {
    console.warn('Thiếu phần tử #loading hoặc #main trong HTML!');
  }

  let allItems = [];  // đổi tên để chung cho blog + document

  let currentPage = 1;
  const itemsPerPage = 10;
  let filteredItems = [];

  function formatDate(isoDate) {
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Render từng dòng theo loại item (blog/document)
  function createRow(item, index) {
    const isApproved = item.approved === true; 
    const contentPreview = typeof item.content === 'string'
      ? item.content.substring(0, 100) + '...'
      : '';

    // Đặt tên trường thể hiện theo type để thống nhất
    let subjectName = '';
    if(item.type === 'blog') {
      subjectName = 'Blog'; // hoặc item.subject nếu có
    } else if(item.type === 'document') {
      subjectName = item.subject || 'Tài liệu';
    }

    return `
      <tr class="item-row" data-id="${item._id}" data-type="${item.type}">
        <td>${index + 1}</td>
        <td>
          <div class="document-info">
            <div class="document-title">${escapeHtml(item.title)}</div>
            <div class="document-description">${escapeHtml(contentPreview)}</div>
          </div>
        </td>
        <td>${escapeHtml(item.author || item.uploader || '')}</td>
        <td>${formatDate(item.createdAt || item.uploadDate)}</td>
        <td>${escapeHtml(subjectName)}</td>
        <td>
          <span class="status-badge ${isApproved ? 'approved' : 'pending'}">
            ${isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
          </span>
        </td>
        <td>
          <button class="action-btn preview" data-id="${item._id}" data-type="${item.type}">
            <i class="fas fa-eye"></i> Xem
          </button>
          ${
            isApproved
              ? ''
              : `
                <div class="approval-buttons">
                  <button class="approve-btn" data-id="${item._id}" data-type="${item.type}" title="Duyệt">
                    <i class="fas fa-check"></i>
                  </button>
                  <button class="reject-btn" data-id="${item._id}" data-type="${item.type}" title="Từ chối">
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

  async function loadItems() {
    try {
      // Gọi API mới gộp chung blog + document
      const res = await fetch(`${BACKEND}/api/admin/blogs`, {credentials: 'include'});
      if (!res.ok) throw new Error('Lỗi khi tải dữ liệu');
      const data = await res.json();

      console.log('Data nhận được:', data);

      const { approvedItems = [], pendingItems = [] } = data;
      allItems = [...pendingItems, ...approvedItems];

      currentPage = 1;
      filterAndRender();
      if (loading) loading.style.display = 'none';
      if (mainContent) mainContent.style.display = 'block';

      addEventListeners();
    } catch (err) {
      console.error('Lỗi khi load items:', err);
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">Lỗi khi tải dữ liệu</td></tr>';
      if (loading) loading.style.display = 'none';
      if (mainContent) mainContent.style.display = 'block';
    }
  }

  async function approveItem(id, type) {
    try {
      let url;
      if(type === 'blog') url = `https://backend-yl09.onrender.com/api/admin/approve-blog/${id}`;
      else if(type === 'document') url = `https://backend-yl09.onrender.com/api/admin/approve-document/${id}`;
      else throw new Error('Loại tài liệu không hợp lệ');

      const res = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Duyệt tài liệu thất bại');
      showToast('Duyệt tài liệu thành công!', 'success');

      // Update trạng thái ở bảng
      const row = document.querySelector(`button.approve-btn[data-id="${id}"][data-type="${type}"]`).closest('tr');
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

  async function rejectItem(id, type) {
    try {
      let url;
      if(type === 'blog') url = `https://backend-yl09.onrender.com/api/admin/reject-blog/${id}`;
      else if(type === 'document') url = `https://backend-yl09.onrender.com/api/admin/documents/${id}`;
      else throw new Error('Loại tài liệu không hợp lệ');

      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.msg || 'Lỗi khi từ chối tài liệu');
      }

      showToast('Xóa tài liệu thành công!', 'success');
      const itemRow = document.querySelector(`.item-row[data-id="${id}"][data-type="${type}"]`);
      if (itemRow) itemRow.remove();
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  }

  function addEventListeners() {
    document.querySelectorAll('.approve-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const type = btn.getAttribute('data-type');
        showConfirmModal('Bạn có chắc muốn duyệt tài liệu này không?', () => {
          approveItem(id, type);
        });
      });
    });

    document.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const type = btn.getAttribute('data-type');
        showConfirmModal('Bạn có chắc muốn từ chối tài liệu này không?', () => {
          rejectItem(id, type);
        });
      });
    });

    document.querySelectorAll('.action-btn.preview').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const type = btn.getAttribute('data-type');
        // Có thể redirect khác cho blog/document nếu muốn
        if(type === 'blog') {
          window.location.href = `/blog-read?post=${id}&preview=true`;
        } else if(type === 'document') {
          window.location.href = `/document-view?id=${id}&preview=true`; // giả định url xem document
        }
      });
    });
  }

  function filterAndRender() {
    const status = statusFilter.value;
    const subject = subjectFilter.value.toLowerCase();
    const keyword = searchInput.value.toLowerCase();

    let filtered = [...allItems];

    if (status !== 'all') {
      const approved = status === 'approved';
      filtered = filtered.filter(item => item.approved === approved);
    }

    if (subject !== 'all') {
      if (subject === 'blog' || subject === 'document') {
        filtered = filtered.filter(item => item.type === subject);
      } else {
        filtered = filtered.filter(item => (item.subject || '').toLowerCase() === subject);
      }
    }

    if (keyword.trim()) {
      filtered = filtered.filter(item =>
        (item.title?.toLowerCase().includes(keyword)) ||
        (item.content?.toLowerCase().includes(keyword))
      );
    }

    filteredItems = filtered;

    if (filtered.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Không có tài liệu phù hợp</td></tr>';
      document.querySelector('.pagination')?.classList.add('hidden');
    } else {
      renderCurrentPage();
      renderPagination();
    }
  }
  function renderCurrentPage() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);
    tableBody.innerHTML = pageItems.map((item, i) => createRow(item, startIndex + i)).join('');
    addEventListeners();
  }

  function renderPagination() {
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;

    let html = '';
    html += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" data-page="${currentPage - 1}"><i class="fas fa-chevron-left"></i></button>`;

    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-btn ${currentPage === i ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}"><i class="fas fa-chevron-right"></i></button>`;

    paginationContainer.innerHTML = html;

    paginationContainer.querySelectorAll('.page-btn').forEach(btn => {
      const page = parseInt(btn.getAttribute('data-page'));
      if (!btn.classList.contains('disabled') && !isNaN(page)) {
        btn.addEventListener('click', () => {
          currentPage = page;
          renderCurrentPage();
          renderPagination();
        });
      }
    });
  }
  statusFilter.addEventListener('change', filterAndRender);
  subjectFilter.addEventListener('change', filterAndRender);
  searchInput.addEventListener('input', filterAndRender);

  loadItems();
});
// Các hàm showToast và showConfirmModal giữ nguyên 

function showToast(message, type = 'success') {
    const toastE1 = document.getElementById("liveToast");
    const toastBody = toastE1.querySelector(".toast-body");

    // Xóa hết class bg- cũ, giữ lại border-0
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

  // Gỡ sự kiện cũ và gán mới
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

  newConfirmBtn.addEventListener("click", () => {
  bsModal.hide();
  onConfirm();

  // ✅ Xoá lớp backdrop của Bootstrap nếu còn tồn tại
  const backdrop = document.querySelector('.modal-backdrop');
  if (backdrop) backdrop.remove();

  // ✅ Cho phép body scroll trở lại
  document.body.classList.remove('modal-open');
  document.body.style.overflow = ''; // reset overflow
});

}

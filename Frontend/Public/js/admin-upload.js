document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('admin-upload-form');

  if (!form) {
    console.warn('Không tìm thấy form upload');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const files = formData.getAll('files');

    if (files.length === 0 || !files[0].name) {
      return showToast('Vui lòng chọn ít nhất 1 tệp.', true);
    }

    try {
      const res = await fetch('https://backend-yl09.onrender.com/api/admin/upload-multiple', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await res.json();

      if (res.ok && result.success) {
        showToast(`Đã gửi ${result.insertedCount} tài liệu thành công!`);
        form.reset();
      } else {
        showToast(result.message || 'Tải lên thất bại.', true);
      }
    } catch (err) {
      console.error('[Upload Error]', err);
      showToast('Lỗi máy chủ. Vui lòng thử lại.', true);
    }
  });

  // Toast đơn giản
  function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `simple-toast ${isError ? 'error' : 'success'}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('visible');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
});

const BACKEND = 'https://backend-yl09.onrender.com';
const id = new URLSearchParams(window.location.search).get('id');

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('editForm'); // ✅ CHÍNH XÁC THEO ID FORM TRONG HTML
  if (!form) {
    console.error("❌ Không tìm thấy form với ID 'editForm'");
    return;
  }

  // Load dữ liệu ban đầu
  try {
    const res = await fetch(`${BACKEND}/api/documents/${id}`, {
      credentials: 'include'
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error('❌ Server trả về lỗi: ' + text);
    }

    const data = await res.json();

    document.getElementById('title').value = data.title || '';
    document.getElementById('description').value = data.description || '';
    document.getElementById('subjectName').value = data.subjectName || '';
  } catch (err) {
    console.error('Lỗi khi load dữ liệu:', err);
    alert('Không thể tải dữ liệu tài liệu');
  }

  // Xử lý submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('subjectName', document.getElementById('subjectName').value);

    const file = document.getElementById('pdfFile').files[0];
    if (file) {
      formData.append('file', file);
    }

    try {
      const res = await fetch(`${BACKEND}/api/documents/${id}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok) {
        alert('✅ Cập nhật thành công!');
        window.location.href = '/admin-tq'; // chuyển về trang quản lý
      } else {
        alert('❌ Lỗi: ' + data.msg);
      }
    } catch (err) {
      alert('❌ Lỗi kết nối máy chủ');
      console.error(err);
    }
  });
});

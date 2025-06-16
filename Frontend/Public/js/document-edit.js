const BACKEND = 'https://backend-yl09.onrender.com';
const id = new URLSearchParams(window.location.search).get('id');

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("editForm");

  if (!form) {
    console.error("❌ Không tìm thấy form với ID 'editForm'");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const documentId = new URLSearchParams(window.location.search).get("id");

    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        alert("✅ Cập nhật tài liệu thành công!");
        window.location.href = "/document";
      } else {
        alert("❌ Lỗi khi cập nhật tài liệu: " + result.message);
      }
    } catch (error) {
      alert("❌ Đã xảy ra lỗi khi gửi yêu cầu.");
      console.error(error);
    }
  });
});

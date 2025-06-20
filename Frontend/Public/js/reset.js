document.addEventListener("DOMContentLoaded", function () {
    const resetForm = document.getElementById("resetForm");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const backendURL = 'https://backend-yl09.onrender.com'; // Đổi thành backend của bạn

    const toastElement = document.getElementById('toastForgot'); // Lấy element toast
    const toast = new bootstrap.Toast(toastElement); // Khởi tạo toast

    // Hàm hiển thị toast có thể tái sử dụng
    function showToast(message, type = 'success') {
        const toastBody = toastElement.querySelector('.toast-body');
        toastElement.classList.remove('bg-success', 'bg-danger'); // Xóa màu cũ
        if (type === 'error') {
            toastElement.classList.add('bg-danger');
        } else {
            toastElement.classList.add('bg-success');
        }
        toastBody.textContent = message; // Đặt nội dung
        toast.show(); // Hiển thị toast
    }

    resetForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (!newPassword || !confirmPassword) {
            showToast("Vui lòng nhập đầy đủ thông tin!", 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast("Mật khẩu mới phải có ít nhất 6 ký tự!", 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast("Mật khẩu xác nhận không khớp.", 'error');
            return;
        }

        // Lấy email từ localStorage
        const email = localStorage.getItem('resetPasswordEmail');
        if (!email) {
            showToast("Lỗi: Không tìm thấy thông tin. Vui lòng thử lại.", 'error');
            setTimeout(() => { window.location.href = "/forgot"; }, 2000);
            return;
        }

        // Hiển thị loading cho nút
        const submitBtn = resetForm.querySelector('.btn-signup');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

        try {
            const res = await fetch(`${backendURL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, newPassword })
            });

            const data = await res.json();

            if (res.ok) {
                showToast("Đặt lại mật khẩu thành công!", 'success');
                // Xóa email khỏi localStorage để bảo mật
                localStorage.removeItem('resetPasswordEmail');
                setTimeout(() => { window.location.href = "/login"; }, 2000);
            } else {
                showToast(data.msg || "Đặt lại mật khẩu thất bại!", 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        } catch (error) {
            showToast("Có lỗi xảy ra khi đặt lại mật khẩu.", 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
});
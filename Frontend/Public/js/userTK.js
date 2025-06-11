document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Lấy thông tin người dùng
        const response = await fetch('https://backend-yl09.onrender.com/api/user-info', {
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Không lấy được dữ liệu người dùng');

        const data = await response.json();
        console.log("User info:", data);

        // Điền dữ liệu vào input
        document.getElementById('username_').value = data.username;
        document.getElementById('email').value = data.email;

        // Thêm sự kiện submit form đổi mật khẩu
        const passwordForm = document.querySelector('.account-form');
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            // Validate input
            if (!currentPassword || !newPassword || !confirmPassword) {
                alert("Vui lòng điền đầy đủ các trường mật khẩu!");
                return;
            }

            if (newPassword !== confirmPassword) {
                alert("Mật khẩu mới và xác nhận mật khẩu không khớp!");
                return;
            }

            if (newPassword.length < 6) {
                alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
                return;
            }

            if (newPassword === currentPassword) {
                alert("Mật khẩu mới phải khác mật khẩu hiện tại!");
                return;
            }

            // Hiển thị loading
            const submitBtn = document.querySelector('.btn-save');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

            try {
                const changePassResponse = await fetch('https://backend-yl09.onrender.com/api/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        currentPassword,
                        newPassword
                    })
                });

                const result = await changePassResponse.json();

                if (changePassResponse.ok) {
                    alert("Đổi mật khẩu thành công!");
                    // Reset form
                    document.getElementById('current-password').value = '';
                    document.getElementById('new-password').value = '';
                    document.getElementById('confirm-password').value = '';
                } else {
                    // Xử lý các lỗi cụ thể từ server
                    if (result.error === 'INCORRECT_CURRENT_PASSWORD') {
                        alert("Mật khẩu hiện tại không đúng!");
                    } else {
                        alert(result.message || "Đổi mật khẩu thất bại!");
                    }
                }
            } catch (error) {
                console.error('Lỗi khi đổi mật khẩu:', error);
                alert("Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại sau.");
            } finally {
                // Khôi phục trạng thái nút
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });

    } catch (err) {
        console.error(err);
        alert("Lỗi tải thông tin người dùng. Vui lòng đăng nhập lại.");
    }
});
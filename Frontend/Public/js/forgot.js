document.addEventListener('DOMContentLoaded', function () {
    const forgotForm = document.getElementById('forgotForm');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const otpSection = document.getElementById('otpSection');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const toastElement = document.getElementById('toastForgot');
    const toast = new bootstrap.Toast(toastElement);
    const backendURL = 'https://backend-yl09.onrender.com'; // Đổi thành backend của bạn

    // Gửi OTP về email
    sendOtpBtn.addEventListener('click', async function () {
        const email = document.getElementById('forgotEmail').value.trim();
        if (!email) return;

        sendOtpBtn.disabled = true;
        sendOtpBtn.textContent = 'Đang gửi OTP...';

        try {
            const res = await fetch(`${backendURL}/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok) {
                otpSection.style.display = 'block';
                showToast('Mã OTP đã được gửi đến email của bạn.', 'success');
            } else {
                showToast(data.msg || 'Gửi OTP thất bại', 'error');
            }
        } catch (error) {
            showToast('Lỗi gửi OTP', 'error');
        } finally {
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = 'Gửi yêu cầu';
        }
    });

    // Xác nhận OTP
    verifyOtpBtn.addEventListener('click', async function () {
        const email = document.getElementById('forgotEmail').value.trim();
        const otp = document.getElementById('forgotOtp').value.trim();
        if (!otp) {
            showToast('Vui lòng nhập mã OTP', 'error');
            return;
        }
        try {
            const res = await fetch(`${backendURL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify({ email, otp })
            });
            if (!res.ok) {
                showToast("OTP không hợp lệ!", 'error');
                return;
            }
            // Nếu xác nhận thành công, chuyển sang bước đặt lại mật khẩu hoặc hiển thị form đổi mật khẩu
            showToast('Xác nhận OTP thành công! Bạn có thể đặt lại mật khẩu.', 'success');
            localStorage.setItem('resetPasswordEmail', email);

            // 3. Chuyển hướng đến trang reset sau một khoảng trễ ngắn
            setTimeout(() => {
                window.location.href = '/reset';
            }, 1500);

        } catch (error) {
            showToast('Lỗi xác nhận OTP', 'error');
        }
    });

    function showToast(message, type = 'success') {
        toastElement.classList.remove("bg-success", "bg-danger", "text-white");
        if (type === 'error') {
            toastElement.classList.add("bg-danger", "text-white");
        } else {
            toastElement.classList.add("bg-success", "text-white");
        }
        toastElement.querySelector(".toast-body").innerHTML = message;
        toast.show();
    }
});
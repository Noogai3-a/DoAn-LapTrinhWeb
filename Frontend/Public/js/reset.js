document.getElementById("resetForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
        alert("Mật khẩu xác nhận không khớp.");
        return;
    }
    
    alert("Mật khẩu đã được đặt lại thành công!");
    window.location.href = "login.html";
});
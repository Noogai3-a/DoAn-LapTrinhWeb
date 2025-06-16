function toggleMenu() {
    const menu = document.getElementById("side-nav");
    const mainContent = document.querySelector('.main-content');

    // Toggle active class cho sidebar
    menu.classList.toggle("active");

    // Toggle lớp sidebar-open cho body
    document.body.classList.toggle("sidebar-open");

    // Tạo hoặc toggle overlay
    let overlay = document.querySelector('.sidebar-overlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.onclick = toggleMenu; // Click overlay để đóng sidebar
        mainContent.appendChild(overlay);
    }

    // Toggle hiển thị overlay
    overlay.style.display = menu.classList.contains('active') ? 'block' : 'none';

    // Ngăn scroll khi sidebar mở dưới 780px
    if (window.innerWidth <= 780) {
        document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
    } else {
        document.body.style.overflow = '';
    }

}

function toggleSubmenu(element) {
    const subMenu = element.nextElementSibling;
    if (subMenu && subMenu.classList.contains('sub-menu')) {
        subMenu.style.display = (subMenu.style.display === 'flex') ? 'none' : 'flex';

        const icon = element.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
        }
    }
}
// Kiểm tra kích thước màn hình và áp dụng overlay nếu cần
const checkScreenSize = () => {
    const menu = document.getElementById("side-nav");
    if (!menu) return;

    const overlay = document.querySelector('.sidebar-overlay');

    if (window.innerWidth <= 780) {
        menu.classList.add('mobile-overlay');
    } else {
        menu.classList.remove('mobile-overlay');
        menu.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        if (overlay) overlay.classList.remove('visible');
        document.body.style.overflow = '';
    }
};
document.addEventListener('DOMContentLoaded', () => {

    const authButtons = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');
    const usernameEl = document.getElementById('username');
    const loading = document.getElementById('loading');
    const mainContent = document.getElementById('main');
    const notificationBell = document.querySelector('.notification-bell');
    const notificationCount = document.querySelector('.notification-count');
    const dropdown = document.querySelector('.notification-dropdown');
    checkScreenSize();
    // 🔒 Nếu đang ở userql/usertk mà không có session → redirect về index
    if (window.location.pathname.includes('userql') || window.location.pathname.includes('usertk')) {
        fetch('https://backend-yl09.onrender.com/api/user-info', {
            credentials: 'include'
        })
            .then(res => {
                if (res.status === 401) {
                    window.location.href = '/';
                }
            });
    }

    const setupLogoutListener = () => {
        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('user');

                fetch('https://backend-yl09.onrender.com/api/auth/logout', {
                    method: 'GET',
                    credentials: 'include'
                })
                .then(res => {
                    if (res.ok) {
                        // 👉 Nếu đang ở userQL/userTK thì chuyển sang index
                        if (window.location.pathname.includes('userql') || window.location.pathname.includes('usertk')) {
                            window.location.href = '/';
                        } else {
                            window.location.reload(); // reload để cập nhật UI
                        }
                    } else {
                        console.error('Logout failed');
                    }
                })
                .catch(err => console.error('Lỗi khi đăng xuất:', err));
            });
        }
    };



const showContentAfterDelay = (callback) => {
    setTimeout(() => {
        if (loading) loading.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        if (callback) callback();
    }, 1000);
};

// Kiểm tra khi thay đổi kích thước cửa sổ
window.addEventListener('resize', checkScreenSize);

fetch('https://backend-yl09.onrender.com/api/user-info', { credentials: 'include' })
    .then(res => res.status === 401 ? null : res.json())
    .then(data => {
        showContentAfterDelay(() => {
            if (data && data.username) {
                usernameEl.textContent = data.username;
                authButtons.style.display = 'none';
                userInfo.style.display = 'block';
                notificationBell.style.display = 'block';

                if (data._id) {
                    localStorage.setItem('userId', data._id);
                }

                const dropdownMenu = document.querySelector('.dropdown-menu');
                if (dropdownMenu && data.role === "admin") {
                    dropdownMenu.innerHTML = `
                            <a href="/adminTQ">Quản lý tổng quan</a>
                            <a href="/adminTL">Quản lý tài liệu/blog</a>
                            <a href="#" id="logout-btn">Đăng xuất</a>
                        `;
                }

                // Gán lại sự kiện sau khi innerHTML đã được cập nhật (dù là user hay admin)
                setupLogoutListener();
            }
        });
    })
    .catch(err => {
        console.error('Lỗi khi lấy thông tin người dùng:', err);
        showContentAfterDelay(); // Vẫn hiển thị nội dung sau 1s dù có lỗi
    });
     // Nếu ở userql/usertk mà không đăng nhập → redirect
    if (window.location.pathname.includes('userql') || window.location.pathname.includes('usertk') || window.location.pathname.includes('admintl') || window.location.pathname.includes('admintq')) {
        fetch('https://backend-yl09.onrender.com/api/user-info', {
            credentials: 'include'
        })
        .then(res => {
            if (res.status === 401) {
                window.location.href = '/';
            }
        })
        .catch(err => {
            console.error('Lỗi xác thực người dùng:', err);
            window.location.href = '/';
        });
    }

    const input = document.getElementById('search-input');
    const suggestions = document.getElementById('search-suggestions');
    const typeSelect = document.getElementById('search-type');
    let timeoutId;

    if (!input || !suggestions || !typeSelect) {
        console.warn('Search elements not found in DOM.');
        return; // Không chạy tiếp nếu thiếu element
    }

    notificationBell.addEventListener('click', () => {
        fetch('https://backend-yl09.onrender.com/api/notifications', {
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            // Hiển thị số lượng thông báo
            if (data.length > 0) {
                notificationCount.style.display = 'block';
                notificationCount.textContent = data.length;
            }
    
            // Hiển thị danh sách thông báo
            const notificationList = document.querySelector('.notification-list');
            notificationList.innerHTML = ''; // Xóa nội dung cũ
    
            if (data.length === 0) {
                notificationList.innerHTML = '<div class="no-notifications">Không có thông báo mới</div>';
                return;
            }
    
            // Tạo HTML cho từng thông báo
            data.forEach(notification => {
                const notificationItem = document.createElement('div');
                notificationItem.className = 'notification-item';
                
                // Tạo nội dung thông báo dựa vào type
                let message = '';
                switch(notification.type) {
                    case 'COMMENT':
                        message = `Có bình luận mới trong bài "${notification.postTitle}"`;
                        break;
                    case 'REPLY':
                        message = `Có phản hồi mới cho bình luận của bạn trong "${notification.postTitle}"`;
                        break;
                    case 'APPROVE':
                        message = `Bài viết "${notification.postTitle}" đã được duyệt`;
                        break;
                    case 'REJECT':
                        message = `Bài viết "${notification.postTitle}" đã bị từ chối`;
                        break;
                }
    
                notificationItem.innerHTML = `
                    <div class="notification-content">
                        <p>${message}</p>
                        <small>${new Date(notification.createdAt).toLocaleDateString()}</small>
                    </div>
                `;
    
                // Thêm sự kiện click để chuyển đến bài viết
                notificationItem.addEventListener('click', () => {
                    if (notification.content.postId) {
                        window.location.href = `/blog-read?post=${notification.content.postId}`;
                    }
                });
    
                notificationList.appendChild(notificationItem);
            });
    
            // Hiển thị dropdown
            const dropdown = document.querySelector('.notification-dropdown');
            dropdown.style.display = 'block';
        })
        .catch(err => {
            console.error('Lỗi khi lấy thông báo:', err);
            const notificationList = document.querySelector('.notification-list');
            notificationList.innerHTML = '<div class="error-notification">Không thể tải thông báo</div>';
        });
    });

    const fetchSuggestions = (query = '') => {
        const type = typeSelect.value;
        if (type !== 'blog') {
            suggestions.style.display = 'none';
            return;
        }

        // Gọi API tùy query hoặc default
        const url = query
            ? `https://backend-yl09.onrender.com/api/blogs/search?q=${encodeURIComponent(query)}`
            : `https://backend-yl09.onrender.com/api/blogs/search?default=true`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                suggestions.innerHTML = '';
                if (!data.length) {
                    suggestions.style.display = 'none';
                    return;
                }

                data.forEach(blog => {
                    const li = document.createElement('li');
                    li.textContent = blog.title;
                    li.addEventListener('click', () => {
                        window.location.href = `/blog-read?post=${blog._id}`;
                    });
                    suggestions.appendChild(li);
                });

                suggestions.style.display = 'block';
            })
            .catch(err => {
                console.error('Lỗi lấy blog:', err);
                suggestions.style.display = 'none';
            });
    };

    input.addEventListener('focus', () => {
        if (typeSelect.value === 'blog') {
            fetchSuggestions();
        }
    });

    input.addEventListener('input', () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            fetchSuggestions(input.value.trim());
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-bar')) {
            suggestions.style.display = 'none';
        }
        if (!notificationBell.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    // Ẩn suggestion khi chọn loại khác
    typeSelect.addEventListener('change', () => {
        suggestions.style.display = 'none';
    });
});


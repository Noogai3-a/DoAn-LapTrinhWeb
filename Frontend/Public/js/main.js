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


//side bar
document.addEventListener('DOMContentLoaded', async () => {
  const sideNav = document.getElementById('side-nav');

  try {
    const res = await fetch('https://backend-yl09.onrender.com/api/subject-types');
    if (!res.ok) throw new Error('Không lấy được danh sách loại môn');
    const subjectTypes = await res.json();

    if (subjectTypes.length === 0) {
      sideNav.innerHTML = `<div class="menu-item-title">Không có môn học nào.</div>`;
      return;
    }

    for (const { typeSlug, typeLabel, subjects } of subjectTypes) {
      const menuItem = document.createElement('div');
      menuItem.className = 'menu-item';

      const menuItemTitle = document.createElement('div');
      menuItemTitle.className = 'menu-item-title';
      menuItemTitle.innerHTML = `${typeLabel} <i class="fa-solid fa-chevron-down"></i>`;
      menuItemTitle.style.cursor = 'pointer';

      const subMenu = document.createElement('div');
      subMenu.className = 'sub-menu';

      menuItemTitle.addEventListener('click', () => {
        subMenu.classList.toggle('show');
      });

      for (const { subjectSlug, subjectLabel } of subjects) {
        const subjectLink = document.createElement('a');
        subjectLink.href = 'javascript:void(0)';
        subjectLink.textContent = subjectLabel;
        subjectLink.style.display = 'block';

        const fileList = document.createElement('div');
        fileList.className = 'file-list';
        fileList.style.marginLeft = '15px';
        fileList.style.display = 'none';

        subjectLink.addEventListener('click', () => {
          // Toggle hiển thị
          const isVisible = fileList.style.display === 'block';
          fileList.style.display = isVisible ? 'none' : 'block';

          // Nếu đã tải thì không fetch lại
          if (fileList.dataset.loaded === 'true') return;

          fileList.innerHTML = '<div>Đang tải...</div>';

          fetch(`https://backend-yl09.onrender.com/api/documents/by-subject/${encodeURIComponent(typeSlug)}/${encodeURIComponent(subjectSlug)}`)
            .then(res => {
              if (!res.ok) throw new Error('Lỗi tải tài liệu');
              return res.json();
            })
            .then(data => {
              console.log('[Tài liệu nhận được]', data);
              fileList.dataset.loaded = 'true';
              fileList.innerHTML = '';

              if (!data.documents || data.documents.length === 0) {
                const noFile = document.createElement('div');
                noFile.textContent = 'Chưa có file tài liệu.';
                fileList.appendChild(noFile);
                return;
              }

              data.documents.forEach(doc => {
                const fileDiv = document.createElement('div');
                const link = document.createElement('a');
                link.href = `/document.html?slug=${doc.slug}`;
                link.textContent = doc.title;
                fileDiv.appendChild(link);
                fileList.appendChild(fileDiv);
              });
            })
            .catch(err => {
              fileList.innerHTML = `<div style="color:red;">Lỗi: ${err.message}</div>`;
            });
        });

        subMenu.appendChild(subjectLink);
        subMenu.appendChild(fileList);
      }

      menuItem.appendChild(menuItemTitle);
      menuItem.appendChild(subMenu);
      sideNav.appendChild(menuItem);
    }
  } catch (err) {
    console.error('[Lỗi sidebar]', err);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger';
    errorDiv.textContent = `Lỗi tải dữ liệu: ${err.message}`;
    sideNav.appendChild(errorDiv);
  }
});

function toggleSubmenu(element) {
  const subMenu = element.nextElementSibling;
  if (!subMenu || !subMenu.classList.contains('sub-menu')) return;

  const isShown = subMenu.classList.toggle('show');

  // Thay đổi icon chevron
  const icon = element.querySelector('i');
  if (icon) {
    icon.classList.toggle('fa-chevron-down', !isShown);
    icon.classList.toggle('fa-chevron-up', isShown);
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
    const notificationList = document.querySelector('.notification-list');
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

    const checkUnreadNotifications = () => {
        fetch('https://backend-yl09.onrender.com/api/notifications', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(data => {
            const unreadCount = data.filter(n => !n.isRead).length;
            if (unreadCount > 0) {
                notificationCount.style.display = 'block';
                notificationCount.textContent = unreadCount;
            } else {
                notificationCount.style.display = 'none';
            }
        })
        .catch(err => console.error('Lỗi khi kiểm tra thông báo:', err));
    };

    checkUnreadNotifications();
    setInterval(checkUnreadNotifications, 5000);

    notificationBell.addEventListener('click', () => {
        if (dropdown.style.display === 'block') {
            dropdown.style.display = 'none';
            return;
        }

        // Hiển thị loading state
        notificationList.innerHTML = '<div class="loading-notification">Đang tải thông báo...</div>';
        dropdown.style.display = 'block';

        fetch('https://backend-yl09.onrender.com/api/notifications', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(data => {
            notificationList.innerHTML = '';
    
            if (data.length === 0) {
                notificationList.innerHTML = '<div class="no-notifications">Không có thông báo mới</div>';
                return;
            }
    
            // Tạo HTML cho từng thông báo
            data.forEach(notification => {
                const notificationItem = document.createElement('div');
                notificationItem.className = 'notification-item';
                notificationItem.setAttribute('data-type', notification.type);
                
                // Tạo nội dung thông báo dựa vào type
                let message = '';
                let icon = '';
                switch(notification.type) {
                    case 'COMMENT':
                        message = `Có bình luận mới trong bài "${notification.postTitle}"`;
                        icon = '<i class="fas fa-comment"></i>';
                        break;
                    case 'REPLY':
                        message = `Có phản hồi mới cho bình luận của bạn trong "${notification.postTitle}"`;
                        icon = '<i class="fas fa-reply"></i>';
                        break;
                    case 'APPROVE':
                        message = `Bài viết "${notification.postTitle}" đã được duyệt`;
                        icon = '<i class="fas fa-check-circle"></i>';
                        break;
                    case 'REJECT':
                        message = `Bài viết "${notification.postTitle}" đã bị từ chối`;
                        icon = '<i class="fas fa-times-circle"></i>';
                        break;
                }
    
                notificationItem.innerHTML = `
                    <div class="notification-content">
                        <div class="notification-icon">${icon}</div>
                        <div class="notification-text">
                            <p>${message}</p>
                            <small>${new Date(notification.createdAt).toLocaleDateString()}</small>
                        </div>
                    </div>
                `;
    
                if (!notification.isRead) {
                    notificationItem.addEventListener('mouseenter', () => {
                        // Gọi API để đánh dấu đã đọc
                        fetch(`https://backend-yl09.onrender.com/api/notifications/${notification._id}/read`, {
                            method: 'PUT',
                            credentials: 'include'
                        })
                        .then(() => {
                            notificationItem.classList.remove('unread');
                            // Cập nhật lại số thông báo chưa đọc
                            const currentCount = parseInt(notificationCount.textContent);
                            if (currentCount > 1) {
                                notificationCount.textContent = currentCount - 1;
                            } else {
                                notificationCount.style.display = 'none';
                            }
                        })
                        .catch(err => console.error('Lỗi khi đánh dấu đã đọc:', err));
                    });
                }
        
                // Chỉ cho phép click nếu không phải thông báo REJECT
                if (notification.type !== 'REJECT') {
                    notificationItem.style.cursor = 'pointer';
                    notificationItem.addEventListener('click', () => {
                        if (notification.content.postId) {
                            window.location.href = `/blog-read?post=${notification.content.postId}`;
                        }
                    });
                } else {
                    notificationItem.style.cursor = 'default';
                }
                notificationList.appendChild(notificationItem);
            });
        })
        .catch(err => {
            console.error('Lỗi khi lấy thông báo:', err);
            const notificationList = document.querySelector('.notification-list');
            notificationList.innerHTML = '<div class="error-notification">Không thể tải thông báo</div>';
        });
    });

    const input = document.getElementById('search-input');
    const suggestions = document.getElementById('search-suggestions');
    const typeSelect = document.getElementById('search-type');
    let timeoutId;

    if (!input || !suggestions || !typeSelect) {
        console.warn('Search elements not found in DOM.');
        return; // Không chạy tiếp nếu thiếu element
    }

    const fetchSuggestions = (query = '') => {
        const type = typeSelect.value;

         if (type !== 'blog' && type !== 'document') {
            suggestions.style.display = 'none';
            return;
        }

        // Gọi API tùy query hoặc default
        let url = '';
        if (type === 'blog') {
            url = query
                ? `https://backend-yl09.onrender.com/api/blogs/search?q=${encodeURIComponent(query)}`
                : `https://backend-yl09.onrender.com/api/blogs/search?default=true`;
        } else if (type === 'document') {
            url = query
                ? `https://backend-yl09.onrender.com/api/review-documents/search?q=${encodeURIComponent(query)}`
                : `https://backend-yl09.onrender.com/api/review-documents/search?default=true`;
        }
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
                        if (type === 'blog') {
                            window.location.href = `/blog-read?post=${item._id}`;
                        } else if (type === 'document') {
                            window.location.href = `/document.html?slug=${item.slug}`;
                        }
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
         if (type === 'blog' || type === 'document') {
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
        
        if (!notificationBell.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    // Ẩn suggestion khi chọn loại khác
    typeSelect.addEventListener('change', () => {
        suggestions.style.display = 'none';
    });
});


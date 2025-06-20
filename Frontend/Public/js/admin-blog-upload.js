let savedRange = null;

function getLocalStorage(key) {
    const data = localStorage.getItem(key);

    if (!data) {
        // Nếu không có dữ liệu thì trả về null hoặc giá trị mặc định
        return null;
    }

    try {
        return JSON.parse(data);
    } catch (error) {
        return data;
    }
}

// Chỉ gán click vào label thôi:
document.getElementById('thumbnailLabel').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('thumbnailUpload').click();
});

function previewThumbnail(event) {
  const fileInput = event.target;
  const file = fileInput.files[0];
  const previewDiv = document.getElementById('thumbnailPreview');
  const label = document.getElementById('thumbnailLabel');
  const picker = document.querySelector('.thumbnail-picker');
  previewDiv.innerHTML = '';

  if (file) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const naturalHeight = img.naturalHeight;
      const naturalWidth = img.naturalWidth;
      const maxHeight = 500;
      const pickerWidth = picker.clientWidth;
      let newHeight = (naturalHeight / naturalWidth) * pickerWidth;

      if (newHeight > maxHeight) newHeight = maxHeight;

      picker.style.height = newHeight + 'px';

      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.objectFit = 'contain';
      img.style.display = 'block';

      previewDiv.appendChild(img);
      if (label) {
        label.style.opacity = '0';
        label.style.pointerEvents = 'auto';
      }
    };
  } else {
    picker.style.height = '120px';
    if (label) label.style.display = 'flex';
  }
}

document.addEventListener("DOMContentLoaded", function () {
    const postContent = document.getElementById("postContent");
    const emojiBtn = document.querySelector('.fa-smile');
    const emojiPicker = document.getElementById('emojiPicker');

    // Ghi nhớ vị trí con trỏ
    postContent.addEventListener("mouseup", saveCursorPosition);
    postContent.addEventListener("keyup", saveCursorPosition);

    function saveCursorPosition() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && postContent.contains(selection.anchorNode)) {
            savedRange = selection.getRangeAt(0);
        }
    }

    // Toggle Emoji Picker
    emojiBtn.addEventListener('click', function () {
        emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
    });

    // Chèn emoji
    emojiPicker.addEventListener('emoji-click', event => {
        const emoji = event.detail.unicode;

        const span = document.createElement("span");
        span.textContent = emoji;
        span.style.display = "inline-block";

        const selection = window.getSelection();

        if (selection.rangeCount > 0 && postContent.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(span);
            range.setStartAfter(span);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            savedRange = range; // ✅ Cập nhật lại savedRange sau khi chèn emoji
        } else if (savedRange) {
            const range = savedRange;
            range.deleteContents();
            range.insertNode(span);
            range.setStartAfter(span);
            range.collapse(true);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            savedRange = range;
        } else {
            postContent.insertAdjacentElement("beforeend", span);
        }

        emojiPicker.style.display = 'none';
    });

    const categorySelect = document.getElementById('category');
    const subCategoryBox = document.getElementById('subCategoryBox');
    const subCategoryInput = document.getElementById('subCategory');

    // Xử lý khi chọn category
    categorySelect.addEventListener('change', function() {
        if (this.value === 'Chủ đề khác') {
            subCategoryBox.style.display = 'block';
            subCategoryInput.required = true;
        } else {
            subCategoryBox.style.display = 'none';
            subCategoryInput.required = false;
            subCategoryInput.value = '';
        }
    });
});

// Hàm chèn ảnh
function insertImage() {
    const fileInput = document.getElementById("imageUpload");
    const file = fileInput.files[0];
    const postContent = document.getElementById("postContent");

    if (file && postContent) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const imgElement = document.createElement("img");
            imgElement.src = e.target.result;
            imgElement.style.maxWidth = "80%";
            imgElement.style.maxHeight = "300px";
            imgElement.style.height = "auto";
            imgElement.style.display = "block";
            imgElement.style.margin = "10px 0";

            if (savedRange) {
                const range = savedRange;
                range.deleteContents();
                range.insertNode(imgElement);
                range.setStartAfter(imgElement);
                range.collapse(true);

                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);

                savedRange = range; // ✅ Cập nhật lại savedRange sau khi chèn ảnh
            } else {
                postContent.appendChild(imgElement);
            }
        };
        reader.readAsDataURL(file);
    }
}

async function submitPost() {
    const submitBtn = document.querySelector(".post-button");
    submitBtn.disabled = true;
    submitBtn.innerText = "Đang đăng...";

    const postTitle = document.getElementById("postTitle").value.trim();
    const postContent = document.getElementById("postContent");
    const rawContent = postContent.innerHTML.trim();

    const category = document.getElementById("category").value;
    const subCategory = document.getElementById("subCategory").value;

    const thumbnailInput = document.getElementById('thumbnailUpload');
    const thumbnailFile = thumbnailInput.files[0];

     if (!thumbnailFile || !thumbnailFile.type.startsWith('image/')) {
        showToast('Vui lòng chọn một ảnh minh họa!', 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = "Đăng bài";
        return;
    }

    if (!postTitle) {
        showToast('Vui lòng nhập tiêu đề bài viết!', 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = "Đăng bài";
        return;
    }

    if (!rawContent) {
        showToast('Nội dung bài viết không được để trống!', 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = "Đăng bài";
        return;
    }

    if (!category) {
        showToast('Vui lòng chọn chủ đề!', 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = "Đăng bài";
        return;
    }

    if (category === 'Chủ đề khác' && !subCategory) {
        showToast('Vui lòng nhập mô tả chủ đề!', 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = "Đăng bài";
        return;
    }

    const formData = new FormData();
    formData.append('title', postTitle);
    formData.append('content', postContent.innerHTML);
    formData.append('category', category);

    if (category === 'Chủ đề khác') {
        formData.append('subCategory', subCategory);
    }

    if (thumbnailFile) {
        formData.append('thumbnailImage', thumbnailFile);
    }

    try {
        const response = await fetch('https://backend-yl09.onrender.com/api/blogs', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.msg || 'Lỗi khi đăng bài');
        }

        showToast('Đăng bài thành công!', 'success');
        // Reset form
        document.getElementById("postTitle").value = '';
        postContent.innerHTML = '';
        document.getElementById("imageUpload").value = '';
        document.getElementById("thumbnailUpload").value = '';
        document.getElementById("thumbnailPreview").innerHTML = '';

        setTimeout(() => {
            window.location.href = '/blog';
        }, 500);

    } catch (err) {
        showToast('Đã xảy ra lỗi: ' + err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = "Đăng bài";
    }
}

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
// JavaScript (chèn vào cuối <body> hoặc file .js riêng)
let subjectNamesByType = {};

document.addEventListener("DOMContentLoaded", function () {
  // === PHẦN UPLOAD ===
  const fileInput = document.getElementById("fileUpload");
  const afterUpload = document.getElementById("after-upload");
  const fileListDisplay = document.getElementById("file-list");
  const uploadNextBtn = document.getElementById("next-btn");
  const uploadBox = document.getElementById("upload-box");

  afterUpload.style.display = "none";
  const allowedTypes = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
  ];

  const MAX_FILES = 10;
  let selectedFiles = [];

  // Render lại danh sách file
  function renderFileList() {
    fileListDisplay.innerHTML = "";

    selectedFiles.forEach((file, index) => {
      const fileItem = document.createElement("div");
      fileItem.classList.add("file-info");
      // Tạo nội dung file
      const fileNameDiv = document.createElement("div");
      fileNameDiv.innerHTML = `<i class="fas fa-file-alt"></i> ${file.name}`;

      // Tạo nút xóa
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Xóa";
      deleteBtn.addEventListener("click", function() {
        removeFile(index);
      });

      // Thêm vào item
      fileItem.appendChild(fileNameDiv);
      fileItem.appendChild(deleteBtn);

      fileListDisplay.appendChild(fileItem);
    });

    afterUpload.style.display = selectedFiles.length > 0 ? "block" : "none";
  }

  // Thêm file vào danh sách
  function addFiles(files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} không hợp lệ.`);
        continue;
      }

       if (selectedFiles.length >= MAX_FILES) {
        alert("Chỉ cho phép tối đa 10 file.");
        break;
      }

      if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
        alert(`File ${file.name} đã tồn tại trong danh sách.`);
        continue;
      }

      selectedFiles.push(file);
    }
    renderFileList();
  }

  // Xóa file theo index
  function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
  }

  // Khi chọn file từ input
  fileInput.addEventListener("change", function () {
    addFiles(fileInput.files);
    fileInput.value = "";
  });

  uploadNextBtn.addEventListener("click", function () {
    // 1. Ẩn phần "upload", hiển thị phần "detail"
    document.getElementById("upload").classList.remove("active");
    document.getElementById("detail").classList.add("active");

    // 2. Cập nhật class "active" cho các step
    document.getElementById("Upload").classList.remove("active");
    document.getElementById("Detail").classList.add("active");
  });

  // === PHẦN DETAIL ===
  const formDetail = document.querySelector(".form-container");
  const nextButton = formDetail.querySelector(".next-button");

  nextButton.style.display = "none";

  const subjectTypeInput = formDetail.querySelector('input[name="subjectTypeLabel"]');
  const subjectNameInput = formDetail.querySelector('input[name="subjectNameLabel"]');
  const documentTypeInput = formDetail.querySelector('input[name="documentType"]');
  const titleInput = formDetail.querySelector('input[name="title"]');
  const descriptionInput = formDetail.querySelector('textarea[name="description"]');

  // Hidden input để lưu label (giữ lại)
  let subjectTypeLabelInput = formDetail.querySelector('input[name="subjectTypeLabel"]');
  let subjectNameLabelInput = formDetail.querySelector('input[name="subjectNameLabel"]');

  if (!subjectTypeLabelInput) {
    subjectTypeLabelInput = document.createElement('input');
    subjectTypeLabelInput.type = 'hidden';
    subjectTypeLabelInput.name = 'subjectTypeLabel';
    formDetail.appendChild(subjectTypeLabelInput);
  }
  if (!subjectNameLabelInput) {
    subjectNameLabelInput = document.createElement('input');
    subjectNameLabelInput.type = 'hidden';
    subjectNameLabelInput.name = 'subjectNameLabel';
    formDetail.appendChild(subjectNameLabelInput);
  }
  // Tải dữ liệu từ data.json
  let subjectNamesByType = {};

  fetch('/json/data.json')
    .then(response => {
      if (!response.ok) throw new Error("Không tải được dữ liệu môn học");
      return response.json();
    })
    .then(data => {
      subjectNamesByType = data;
    })
    .catch(error => {
      console.error("Lỗi khi tải dữ liệu môn học:", error);
    });
  // Hàm chuyển label về slug
  function toSlug(str) {
    return str.normalize('NFD') // chuẩn hóa unicode
      .replace(/[\u0300-\u036f]/g, '') // loại bỏ dấu
      .replace(/đ/g, 'd').replace(/Đ/g, 'D') // xử lý riêng tiếng Việt
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
  // Xác định label & slug dựa trên dữ liệu nhập
  function updateLabels() {
    const typeLabel = subjectTypeInput.value.trim();
    const nameLabel = subjectNameInput.value.trim();
    
    const typeSlug = toSlug(typeLabel);
    const nameSlug = toSlug(nameLabel);
    
    subjectTypeLabelInput.value = typeLabel;
    subjectNameLabelInput.value = nameLabel;

    subjectTypeInput.dataset.slug = typeSlug;
    subjectNameInput.dataset.slug = nameSlug;
  }

  function validateDetailForm() {
    return (
      subjectTypeInput.value.trim() !== "" &&
      subjectNameInput.value.trim() !== "" &&
      documentTypeInput.value.trim() !== "" &&
      titleInput.value.trim() !== ""
      // descriptionInput.value.trim() !== ""
    );
  }

  function toggleDetailNextButton() {
    updateLabels();
    nextButton.style.display = validateDetailForm() ? "inline-block" : "none";
  }

  // Gắn event listener
  [subjectTypeInput, subjectNameInput, documentTypeInput, titleInput, descriptionInput].forEach(el => {
    el.addEventListener("input", toggleDetailNextButton);
    el.addEventListener("change", toggleDetailNextButton);
  });

  // Lấy nút Quay lại
  const backButton = formDetail.querySelector(".back-button");

  // Khi bấm Quay lại:
  backButton.addEventListener("click", function () {
    // 1. Ẩn section Detail, hiển thị section Upload
    document.getElementById("detail").classList.remove("active");
    document.getElementById("upload").classList.add("active");

    // 2. Cập nhật highlight cho các step: bỏ class active của Detail, thêm active cho Upload
    document.getElementById("Detail").classList.remove("active");
    document.getElementById("Upload").classList.add("active");
  });

  nextButton.addEventListener("click", async function (e) {
    e.preventDefault();

    if (!validateDetailForm()) return;

    const file = fileInput.files[0];
    if (!file) {
      alert("Chưa có file được chọn.");
      return;
    }

    const formData = new FormData(formDetail);
    formData.append("file", file);

    try {
      const response = await fetch(`https://backend-yl09.onrender.com/api/upload-documents/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error("Upload thất bại");
      }

      // 1. Sau khi upload thành công, ẩn phần detail, hiển thị phần done
      document.getElementById("detail").classList.remove("active");
      document.getElementById("done").classList.add("active");

      // 2. Cập nhật class "active" cho các step: bỏ Detail, thêm Done
      document.getElementById("Detail").classList.remove("active");
      document.getElementById("Done").classList.add("active");
    } catch (error) {
      alert("Lỗi khi upload: " + error.message);
    }
  });

  // === PHẦN DONE ===
  const doneBtn = document.querySelector(".done-button");
  // Bạn có thể thêm sự kiện cho doneBtn nếu muốn
});

// Nếu bạn vẫn muốn cho phép click trực tiếp vào step để chuyển page,
// bạn có thể thêm hàm showPage như sau:
function showPage(pageId, stepElement) {
  // Bỏ active khỏi tất cả step
  document.querySelectorAll('.steps .step').forEach(step => {
    step.classList.remove('active');
  });
  // Thêm active cho step đang click
  stepElement.classList.add('active');

  // Ẩn hết các page, chỉ hiển thị pageId
  ['upload', 'detail', 'done'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = (id === pageId) ? 'block' : 'none';
      el.classList.toggle('active', id === pageId);
    }
  });
}

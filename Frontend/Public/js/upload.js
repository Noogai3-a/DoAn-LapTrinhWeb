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

  // Thêm sự kiện drag & drop vào uploadBox
  uploadBox.addEventListener("dragover", function (e) {
    e.preventDefault();
    uploadBox.style.backgroundColor = "#bbb"; // hiệu ứng khi kéo vào
  });

  uploadBox.addEventListener("dragleave", function (e) {
    e.preventDefault();
    uploadBox.style.backgroundColor = "#ddd"; // trở lại bình thường khi rời ra
  });

  uploadBox.addEventListener("drop", function (e) {
    e.preventDefault();
    uploadBox.style.backgroundColor = "#ddd"; // reset lại màu
    const files = e.dataTransfer.files;
    addFiles(files);
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

  const subjectTypeSelect = formDetail.querySelector('select[name="subjectTypeSlug"]');  // select loại môn
  const subjectNameSelect = formDetail.querySelector('select[name="subjectNameSlug"]');  // select tên môn
  const documentTypeSelect = formDetail.querySelector('select[name="documentType"]');  // select thể loại tài liệu
  const descriptionInput = formDetail.querySelector('textarea[name="description"]');  // mô tả
  
  const subjectTypeLabel = formDetail.querySelector('#subjectTypeLabel');
  const subjectNameLabel = formDetail.querySelector('#subjectNameLabel');
  
  fileInput.addEventListener("change", function () {
    addFiles(fileInput.files);
    fileInput.value = "";
  });
  // Tải dữ liệu từ data.json
  let subjectNamesByType = {};

  // Fetch data.json
  fetch('/json/data.json')
    .then(response => response.json())
    .then(data => {
      subjectNamesByType = data;
      populateSubjectTypeSelect();
    });

  // Populate loại môn học
  function populateSubjectTypeSelect() {
    subjectTypeSelect.innerHTML = '<option value="">-- Chọn loại môn --</option>';
    for (const typeSlug in subjectNamesByType) {
      const option = document.createElement("option");
      option.value = typeSlug;
      option.textContent = subjectNamesByType[typeSlug].label;
      subjectTypeSelect.appendChild(option);
    }
  }

  // Khi chọn loại môn học thì đổ tên môn học tương ứng
  function updateSubjectNames() {
    const selectedType = subjectTypeSelect.value;
    subjectNameSelect.innerHTML = '<option value="">-- Chọn tên môn học --</option>';

    if (selectedType && subjectNamesByType[selectedType]?.subjects) {
      subjectNamesByType[selectedType].subjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject.slug;
        option.textContent = subject.label;
        subjectNameSelect.appendChild(option);
      });
    }
    toggleDetailNextButton();
    // Thêm option khác
    const otherOption = document.createElement("option");
    otherOption.value = "other";
    otherOption.textContent = "Khác...";
    subjectNameSelect.appendChild(otherOption);
    
  }

  // Cập nhật label cho loại môn
  function updateSubjectTypeLabel() {
    const typeSlug = subjectTypeSelect.value;
    if (typeSlug && subjectNamesByType[typeSlug]) {
      subjectTypeLabel.value = subjectNamesByType[typeSlug].label;
    } else {
      subjectTypeLabel.value = '';
    }
  }

  // Cập nhật label cho tên môn
  function updateSubjectNameLabel() {
    const typeSlug = subjectTypeSelect.value;
    const nameSlug = subjectNameSelect.value;

    if (nameSlug === "other") {
      subjectNameLabel.value = document.getElementById("subjectNameCustomInput").value;
    } else if (typeSlug && nameSlug && subjectNamesByType[typeSlug]?.subjects) {
      const subject = subjectNamesByType[typeSlug].subjects.find(s => s.slug === nameSlug);
      if (subject) {
        subjectNameLabel.value = subject.label;
      } else {
        subjectNameLabel.value = '';
      }
    } else {
      subjectNameLabel.value = '';
    }
  }

  // Sự kiện

  subjectTypeSelect.addEventListener("change", () => {
    updateSubjectTypeLabel();
    updateSubjectNames();
    updateSubjectNameLabel();
  });

  subjectNameSelect.addEventListener("change", () => {
    updateSubjectNameLabel();
    const customDiv = document.getElementById("subjectNameCustomDiv");
    if (subjectNameSelect.value === "other") {
      customDiv.classList.add("active");
    } else {
      customDiv.classList.remove("active");
    }
    toggleDetailNextButton();
  });

  documentTypeSelect.addEventListener("change", toggleDetailNextButton);

  function validateDetailForm() {
    const nameValid = subjectNameSelect.value === "other" 
      ? document.getElementById("subjectNameCustomInput").value.trim() !== ""
      : subjectNameSelect.value !== "";

      return (
        subjectTypeSelect.value !== "" &&
        nameValid &&
        documentTypeSelect.value !== ""
      );
  }


  function toggleDetailNextButton() {
    nextButton.style.display = validateDetailForm() ? "inline-block" : "none";
  }


  document.getElementById("subjectNameCustomInput").addEventListener("input", () => {
    updateSubjectNameLabel();
    toggleDetailNextButton();
  });

  [subjectTypeSelect, subjectNameSelect, documentTypeSelect, descriptionInput].forEach(el => {
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

    if (selectedFiles.length === 0) {
      alert("Chưa có file được chọn.");
      return;
    }

    const formData = new FormData(formDetail);
    for (const file of selectedFiles) {
      formData.append("files", file);
    }

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
});


// JavaScript (chèn vào cuối <body> hoặc file .js riêng)
let subjectNamesByType = {};

document.addEventListener("DOMContentLoaded", function () {
  // === PHẦN UPLOAD ===
  const fileInput = document.getElementById("fileUpload");
  const afterUpload = document.getElementById("after-upload");
  const fileNameDisplay = afterUpload.querySelector(".file-info a");
  const uploadNextBtn = document.getElementById("next-btn");

  afterUpload.style.display = "none";

  fileInput.addEventListener("change", function () {
  const allowedTypes = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
  ];

  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    if (!allowedTypes.includes(file.type)) {
      alert("Chỉ cho phép upload file PDF, DOC hoặc DOCX.");
      fileInput.value = "";
      afterUpload.style.display = "none";
      return;
    }
    fileNameDisplay.textContent = file.name;
    afterUpload.style.display = "flex";
  } else {
    afterUpload.style.display = "none";
  }
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

  const subjectTypeSelect = formDetail.querySelector('select[name="subjectTypeSlug"]');
  const subjectNameSelect = formDetail.querySelector('select[name="subjectNameSlug"]');
  const documentTypeSelect = formDetail.querySelector('select[name="documentType"]');
  const titleInput = formDetail.querySelector('input[name="title"]');
  const descriptionInput = formDetail.querySelector('textarea[name="description"]');

  // Thêm 2 input hidden để lưu label tương ứng
  let subjectTypeLabelInput = formDetail.querySelector('input[name="subjectTypeLabel"]');
  let subjectNameLabelInput = formDetail.querySelector('input[name="subjectNameLabel"]');

  // Nếu chưa có, tạo và thêm vào form
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

  function updateSubjectNames() {
    const selectedType = subjectTypeSelect.value;
    subjectNameSelect.innerHTML = '<option value="">-- Chọn tên môn học --</option>';

    if (selectedType && subjectNamesByType[selectedType] && subjectNamesByType[selectedType].subjects) {
      subjectNamesByType[selectedType].subjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject.slug;      // dùng slug làm value
        option.textContent = subject.label;
        subjectNameSelect.appendChild(option);
      });
    }
    toggleDetailNextButton();
  }

  function updateSubjectTypeLabel() {
    const typeSlug = subjectTypeSelect.value;
    if (typeSlug && subjectNamesByType[typeSlug]) {
      subjectTypeLabelInput.value = subjectNamesByType[typeSlug].label;
    } else {
      subjectTypeLabelInput.value = '';
    }
  }

  function updateSubjectNameLabel() {
    const typeSlug = subjectTypeSelect.value;
    const nameSlug = subjectNameSelect.value;
    if (typeSlug && nameSlug && subjectNamesByType[typeSlug] && subjectNamesByType[typeSlug].subjects) {
      const subject = subjectNamesByType[typeSlug].subjects.find(s => s.slug === nameSlug);
      if (subject) {
        subjectNameLabelInput.value = subject.label;
        return;
      }
    }
    subjectNameLabelInput.value = '';
  }

  function validateDetailForm() {
    return (
      subjectTypeSelect.value !== "" &&
      subjectNameSelect.value !== "" &&
      documentTypeSelect.value !== "" &&
      titleInput.value.trim() !== ""
      // descriptionInput.value.trim() !== ""
    );
  }

  function toggleDetailNextButton() {
    nextButton.style.display = validateDetailForm() ? "inline-block" : "none";
  }

  subjectTypeSelect.addEventListener("change", () => {
    updateSubjectTypeLabel();
    updateSubjectNameLabel();
    updateSubjectNames();
  });

  subjectNameSelect.addEventListener("change", updateSubjectNameLabel);

  [subjectTypeSelect, subjectNameSelect, documentTypeSelect, titleInput, descriptionInput].forEach(el => {
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

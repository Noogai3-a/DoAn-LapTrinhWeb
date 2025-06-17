document.addEventListener('DOMContentLoaded', () => {
  const courseListUl = document.getElementById('course-list');

  fetch('/json/data.json')
    .then(res => {
      if (!res.ok) throw new Error('Không tải được data.json');
      return res.json();
    })
    .then(data => {
      const categories = Object.keys(data);
      if (categories.length === 0) {
        courseListUl.innerHTML = `<li class="alert alert-warning">Không có môn học nào.</li>`;
        return;
      }

      categories.forEach(categoryKey => {
        const category = data[categoryKey];
        const label = category.label || categoryKey;

        const li = document.createElement('li');
        li.className = 'course-group';

        // Header môn lớn
        const header = document.createElement('div');
        header.className = 'course-item-header';
        header.innerHTML = `<span class="icon">📁</span> <span class="label">${label}</span>`;

        // Danh sách môn con ẩn ban đầu
        const subList = document.createElement('ul');
        subList.className = 'sub-course-list collapse';

        (category.subjects || []).forEach(subject => {
          const subLi = document.createElement('li');
          subLi.className = 'sub-course-item';

          const subjectLabel = document.createElement('span');
          subjectLabel.className = 'subject-label';
          subjectLabel.textContent = subject.label;
          subjectLabel.style.cursor = 'pointer';

          const fileList = document.createElement('ul');
          fileList.className = 'file-list collapse';
          fileList.style.marginLeft = '20px';

          subjectLabel.addEventListener('click', () => {
            // Nếu đã load rồi thì chỉ toggle hiển thị
            if (fileList.dataset.loaded === 'true') {
              fileList.classList.toggle('collapse');
              return;
            }

            // Lần đầu thì fetch và hiển thị
            fileList.innerHTML = '<li>Đang tải...</li>';
            fileList.classList.remove('collapse');

            const subjectTypeSlug = categoryKey;
            const subjectNameSlug = subject.slug;

            fetch(`https://backend-yl09.onrender.com/api/documents/by-subject/${encodeURIComponent(subjectTypeSlug)}/${encodeURIComponent(subjectNameSlug)}`,{credentials: 'include'})
              .then(res => {
                if (!res.ok) throw new Error('Lỗi tải tài liệu');
                return res.json();
              })
              .then(data => {
                fileList.innerHTML = '';
                fileList.dataset.loaded = 'true';
                console.log("Danh sách tài liệu trả về:", data.documents);
                if (!data.documents || data.documents.length === 0) {
                  const noFile = document.createElement('li');
                  noFile.textContent = 'Chưa có file tài liệu.';
                  fileList.appendChild(noFile);
                  return;
                }

                data.documents.forEach(doc => {
                  const fileLi = document.createElement('li');
                  const link = document.createElement('a');
                  link.href = `/document.html?slug=${doc.slug}`;
                  link.textContent = doc.title;

                  fileLi.appendChild(link);
                  fileList.appendChild(fileLi);
                });
              })
              .catch(err => {
                fileList.innerHTML = `<li>Lỗi tải tài liệu: ${err.message}</li>`;
              });
          });
          // Append các phần tử con đúng chỗ
          subLi.appendChild(subjectLabel);
          subLi.appendChild(fileList);
          subList.appendChild(subLi);
        });

        header.addEventListener('click', () => {
          subList.classList.toggle('collapse');
          header.classList.toggle('open');
        });

        li.appendChild(header);
        li.appendChild(subList);
        courseListUl.appendChild(li);
      });
    })
    .catch(err => {
      console.error(err);
      courseListUl.innerHTML = `<li><div class="alert alert-danger">Lỗi tải danh sách môn học: ${err.message}</div></li>`;
    });
});

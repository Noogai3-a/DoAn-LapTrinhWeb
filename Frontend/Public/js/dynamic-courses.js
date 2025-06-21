document.addEventListener('DOMContentLoaded', async () => {
  const courseListUl = document.getElementById('course-list');

  try {
    const typesRes = await fetch('https://backend-yl09.onrender.com/api/subject-types');
    if (!typesRes.ok) throw new Error('Không lấy được danh sách loại môn');
    const subjectTypes = await typesRes.json();

    if (subjectTypes.length === 0) {
      courseListUl.innerHTML = `<li class="alert alert-warning">Không có loại môn nào.</li>`;
      return;
    }

    for (const type of subjectTypes) {
      const { typeSlug, typeLabel, subjects } = type;

      const li = document.createElement('li');
      li.className = 'course-group';

      // Header loại môn
      const header = document.createElement('div');
      header.className = 'course-item-header';
      header.innerHTML = `<span class="icon">📁</span> <span class="label">${typeLabel}</span>`;

      // Danh sách môn học (ẩn ban đầu)
      const subList = document.createElement('ul');
      subList.className = 'sub-course-list collapse';

      (subjects || []).forEach(subject => {
        const subLi = document.createElement('li');
        subLi.className = 'sub-course-item';

        const subjectLabel = document.createElement('span');
        subjectLabel.className = 'subject-label';
        subjectLabel.textContent = subject.subjectLabel;
        subjectLabel.style.cursor = 'pointer';

        const fileList = document.createElement('ul');
        fileList.className = 'file-list collapse';
        fileList.style.marginLeft = '20px';

        subjectLabel.addEventListener('click', () => {
          if (fileList.dataset.loaded === 'true') {
            fileList.classList.toggle('collapse');
            return;
          }

          fileList.innerHTML = '<li>Đang tải...</li>';
          fileList.classList.remove('collapse');

          fetch(`https://backend-yl09.onrender.com/api/documents/by-subject/${encodeURIComponent(typeSlug)}/${encodeURIComponent(subject.subjectSlug)}`, {
            credentials: 'include'
          })
            .then(res => {
              if (!res.ok) throw new Error('Lỗi tải tài liệu');
              return res.json();
            })
            .then(data => {
              fileList.innerHTML = '';
              fileList.dataset.loaded = 'true';

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
    }
  } catch (err) {
    console.error(err);
    courseListUl.innerHTML = `<li><div class="alert alert-danger">Lỗi tải dữ liệu: ${err.message}</div></li>`;
  }
});

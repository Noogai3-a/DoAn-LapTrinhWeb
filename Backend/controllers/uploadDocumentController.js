const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const puppeteer = require('puppeteer');
const Document = require('../models/Document');
const data = require('../data.json');

async function generateThumbnailFromPdf(pdfPath, outputImagePath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Mở file PDF
  await page.goto(`file://${path.resolve(pdfPath)}`, { waitUntil: 'networkidle0' });

  // Tùy chỉnh viewport để chụp trang đầu
  await page.setViewport({ width: 800, height: 1000 });

  // Chụp ảnh
  await page.screenshot({ path: outputImagePath, fullPage: false });
  await browser.close();
}

async function convertDocxToPdf(inputPath, outputPath) {
  const { value: html } = await mammoth.convertToHtml({ path: inputPath });

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
  });
  await browser.close();
}

function slugifyTitle(filename) {
  // 1. Bỏ phần đuôi mở rộng file (.pdf, .docx, ...)
  let title = filename.replace(/\.[^/.]+$/, "");

  // 2. Bỏ dấu tiếng Việt
  title = removeVietnameseTones(title);

  // 3. Chuyển về chữ thường
  title = title.toLowerCase();

  // 4. Thay ký tự đặc biệt, khoảng trắng thành dấu gạch ngang
  title = title.replace(/[^a-z0-9]+/g, '-');

  // 5. Bỏ dấu gạch ở đầu/cuối
  title = title.replace(/^-+|-+$/g, '');

  return title;
}


function removeVietnameseTones(str) {
  return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d").replace(/Đ/g, "D");
}


function getLabelsFromSlug(subjectTypeSlug, subjectNameSlug) {
  const subjectType = data[subjectTypeSlug];
  if (!subjectType || !subjectType.subjects) return null;

  const subject = subjectType.subjects.find(s => s.slug === subjectNameSlug);
  if (!subject) return null;

  return {
    subjectTypeLabel: subjectType.label,
    subjectNameLabel: subject.label
  };
}

exports.uploadDocument = async (req, res) => {
  try {
    const uploader = req.session.user?.username ?? req.session.admin?.username;
    const { subjectTypeSlug, subjectNameSlug, documentType } = req.body;

    console.log('[Upload] Received:', { subjectTypeSlug, subjectNameSlug, documentType });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Chưa upload file nào.' });
    }

    if (!subjectTypeSlug || !subjectNameSlug || !documentType) {
      // Xoá toàn bộ file đã upload nếu thiếu thông tin
      req.files.forEach(file => fs.existsSync(file.path) && fs.unlinkSync(file.path));
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc.' });
    }

    const labels = getLabelsFromSlug(subjectTypeSlug, subjectNameSlug);
    if (!labels) {
      req.files.forEach(file => fs.existsSync(file.path) && fs.unlinkSync(file.path));
      return res.status(400).json({ error: 'Slug không hợp lệ hoặc không tồn tại trong data.json.' });
    }

    const savedDocuments = [];

    for (const file of req.files) {
      let filePathToSave = file.path;
      const ext = path.extname(file.originalname).toLowerCase();
      const title = normalizeTitle(file.originalname);

      try {
        // Nếu là doc/docx → chuyển sang PDF
        if (ext === '.doc' || ext === '.docx') {
          const pdfFilePath = file.path.replace(ext, '.pdf');
          await convertDocxToPdf(file.path, pdfFilePath);
          fs.unlinkSync(file.path); // xoá file gốc
          filePathToSave = pdfFilePath;

          // Tạo thumbnail
          const previewFilename = path.basename(pdfFilePath, '.pdf') + '.png';
          const previewPath = path.join('uploads/previews', previewFilename);
          fs.mkdirSync('uploads/previews', { recursive: true });
          await generateThumbnailFromPdf(pdfFilePath, previewPath);
        }

        const newDoc = new Document({
          title,
          fileUrl: filePathToSave,
          subjectTypeSlug,
          subjectTypeLabel: labels.subjectTypeLabel,
          subjectNameSlug,
          subjectNameLabel: labels.subjectNameLabel,
          documentType,
          uploader,
          status: 'pending'
        });

        await newDoc.save();
        savedDocuments.push(newDoc);

      } catch (err) {
        console.error(`Lỗi xử lý file ${file.originalname}:`, err);
        fs.existsSync(file.path) && fs.unlinkSync(file.path);
        return res.status(500).json({ error: `Lỗi xử lý file ${file.originalname}.` });
      }
    }

    return res.status(201).json({
      message: `Upload ${savedDocuments.length} tài liệu thành công.`,
      documents: savedDocuments
    });

  } catch (error) {
    console.error('Lỗi uploadDocument:', error);

    // Dọn rác nếu có file chưa xoá
    req.files?.forEach(file => fs.existsSync(file.path) && fs.unlinkSync(file.path));

    return res.status(500).json({ error: 'Lỗi server.' });
  }
};


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
    const { title, subjectTypeSlug, subjectNameSlug, documentType } = req.body;

    console.log('[Upload] Received:', { title, subjectTypeSlug, subjectNameSlug, documentType });

    if (!req.file) {
      return res.status(400).json({ error: 'Chưa upload file.' });
    }

    if (!title || !subjectTypeSlug || !subjectNameSlug || !documentType) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc.' });
    }

    const labels = getLabelsFromSlug(subjectTypeSlug, subjectNameSlug);
    if (!labels) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Slug không hợp lệ hoặc không tồn tại trong data.json.' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    let filePathToSave = req.file.path; // file đường dẫn để lưu vào DB

    // Nếu là doc hoặc docx thì convert sang pdf
    if (ext === '.doc' || ext === '.docx') {
      const pdfFilePath = req.file.path.replace(ext, '.pdf');

      try {
        await convertDocxToPdf(req.file.path, pdfFilePath);

        // Xóa file doc/docx gốc đi nếu không cần giữ
        fs.unlinkSync(req.file.path);

        filePathToSave = pdfFilePath;
        // Tạo ảnh thumbnail từ file PDF
        const previewFilename = path.basename(pdfFilePath, '.pdf') + '.png';
        const previewPath = path.join('uploads/previews', previewFilename);

        // Đảm bảo thư mục tồn tại
        fs.mkdirSync('uploads/previews', { recursive: true });

        await generateThumbnailFromPdf(pdfFilePath, previewPath);

      } catch (convertError) {
        console.error('Lỗi chuyển đổi DOCX sang PDF:', convertError);
        // Nếu convert lỗi, xóa file đã upload, trả về lỗi
        fs.unlinkSync(req.file.path);
        return res.status(500).json({ error: 'Lỗi chuyển đổi file DOCX sang PDF.' });
      }
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

    return res.status(201).json({
      message: 'Upload tài liệu thành công.',
      document: newDoc
    });
  } catch (error) {
    console.error('Lỗi uploadDocument:', error);

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({ error: 'Lỗi server.' });
  }
};

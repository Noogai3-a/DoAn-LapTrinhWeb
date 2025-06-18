const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const data = require("../data.json"); // file data.json chứa thông tin subject
const { fromPath } = require("pdf2pic");

function normalizeTitle(filename) {
  return path.basename(filename, path.extname(filename)).replace(/[_-]/g, ' ').trim();
}

async function convertDocxToPdf(docPath, outputPdfPath) {
  try {
    const { value: html } = await mammoth.convertToHtml({ path: docPath });

    if (!html || html.trim() === '') {
      throw new Error(`Không thể chuyển .docx sang HTML: file rỗng hoặc lỗi.`);
    }

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    await page.pdf({ path: outputPdfPath, format: 'A4' });
    await browser.close();

    if (!fs.existsSync(outputPdfPath)) {
      throw new Error(`Không tạo được file PDF: ${outputPdfPath}`);
    }
  } catch (err) {
    console.error('❌ Lỗi trong convertDocxToPdf:', err);
    throw err;
  }
}

async function generateThumbnail(pdfPath, outputImagePath) {
  const convert = fromPath(pdfPath, {
    density: 150,
    saveFilename: outputImagePath.replace(/\.png$/, ''),
    savePath: require('path').dirname(outputImagePath),
    format: "png",
    width: 600,
    height: 800
  });

  try {
    const res = await convert(1); // chỉ trang đầu
    console.log("✅ Thumbnail tạo thành công:", res.path);
  } catch (err) {
    console.error("❌ Lỗi khi tạo thumbnail:", err);
    throw err;
  }
}

function getLabelsFromSlug(typeSlug, nameSlug) {
  const type = data[typeSlug];
  if (!type) return null;

  const name = type.subjects.find(s => s.slug === nameSlug);
  if (!name) return null;

  return {
    subjectTypeLabel: type.label,
    subjectNameLabel: name.label
  };
}

module.exports = {
  normalizeTitle,
  convertDocxToPdf,
  generateThumbnail,
  getLabelsFromSlug
};

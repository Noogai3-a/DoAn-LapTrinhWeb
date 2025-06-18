const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const data = require("../data.json"); // file data.json chứa thông tin subject

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

async function generateThumbnailFromPdf(pdfPath, outputImagePath) {
  let browser;
  try {
    console.log('🔄 Khởi tạo Puppeteer browser...');
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    console.log('🔄 Tạo page mới...');
    const page = await browser.newPage();
    
    console.log('🔄 Điều hướng đến PDF:', pdfPath);
    await page.goto(`file://${path.resolve(pdfPath)}#page=1`, { 
      waitUntil: "networkidle0",
      timeout: 30000 
    });
    
    console.log('🔄 Thiết lập viewport...');
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('🔄 Chụp screenshot...');
    await page.screenshot({ 
      path: outputImagePath,
      type: 'png',
      quality: 90
    });
    
    console.log('✅ Screenshot đã được lưu:', outputImagePath);
    
    // Verify the file was created
    if (fs.existsSync(outputImagePath)) {
      const stats = fs.statSync(outputImagePath);
      console.log('✅ Thumbnail file size:', stats.size, 'bytes');
      if (stats.size === 0) {
        throw new Error('Thumbnail file is empty');
      }
    } else {
      throw new Error('Thumbnail file was not created');
    }
    
  } catch (error) {
    console.error('❌ Lỗi trong generateThumbnailFromPdf:', error);
    throw error;
  } finally {
    if (browser) {
      console.log('🔄 Đóng browser...');
      await browser.close();
    }
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
  generateThumbnailFromPdf,
  getLabelsFromSlug
};

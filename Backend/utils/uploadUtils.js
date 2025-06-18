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
  let browser;
  try {
    console.log('🔄 Bắt đầu chuyển đổi DOCX sang PDF:', docPath);
    
    // Validate input file
    if (!fs.existsSync(docPath)) {
      throw new Error(`File DOCX không tồn tại: ${docPath}`);
    }
    
    const fileStats = fs.statSync(docPath);
    if (fileStats.size === 0) {
      throw new Error('File DOCX rỗng');
    }
    
    console.log('📄 File size:', fileStats.size, 'bytes');
    
    // Convert DOCX to HTML
    console.log('🔄 Chuyển DOCX sang HTML...');
    const { value: html, messages } = await mammoth.convertToHtml({ path: docPath });

    if (!html || html.trim() === '') {
      throw new Error(`Không thể chuyển .docx sang HTML: file rỗng hoặc lỗi.`);
    }
    
    console.log('✅ Chuyển sang HTML thành công, length:', html.length);
    
    // Log any conversion warnings
    if (messages && messages.length > 0) {
      console.log('⚠️ Conversion warnings:', messages);
    }

    // Launch browser with proper configuration
    console.log('🔄 Khởi tạo browser...');
    browser = await puppeteer.launch({
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ],
      headless: true
    });

    console.log('🔄 Tạo page mới...');
    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 1600 });
    
    console.log('🔄 Đặt nội dung HTML...');
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    console.log('🔄 Tạo PDF...');
    await page.pdf({ 
      path: outputPdfPath, 
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    console.log('✅ PDF đã được tạo:', outputPdfPath);

    // Validate the generated PDF
    if (!fs.existsSync(outputPdfPath)) {
      throw new Error(`Không tạo được file PDF: ${outputPdfPath}`);
    }
    
    const pdfStats = fs.statSync(outputPdfPath);
    console.log('📄 PDF file size:', pdfStats.size, 'bytes');
    
    if (pdfStats.size === 0) {
      throw new Error('File PDF được tạo nhưng rỗng');
    }
    
    console.log('✅ Chuyển đổi DOCX sang PDF thành công!');
    
  } catch (err) {
    console.error('❌ Lỗi trong convertDocxToPdf:', err);
    
    // Clean up partial PDF if it exists
    if (outputPdfPath && fs.existsSync(outputPdfPath)) {
      try {
        fs.unlinkSync(outputPdfPath);
        console.log('🧹 Đã xóa file PDF lỗi:', outputPdfPath);
      } catch (cleanupErr) {
        console.error('❌ Lỗi khi xóa file PDF lỗi:', cleanupErr);
      }
    }
    
    throw err;
  } finally {
    // Always close browser
    if (browser) {
      try {
        console.log('🔄 Đóng browser...');
        await browser.close();
      } catch (closeErr) {
        console.error('❌ Lỗi khi đóng browser:', closeErr);
      }
    }
  }
}

async function generateThumbnail(pdfPath, outputImagePath) {
  try {
    console.log('🔄 Bắt đầu tạo thumbnail từ PDF:', pdfPath);
    
    // Validate input PDF
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`File PDF không tồn tại: ${pdfPath}`);
    }
    
    const pdfStats = fs.statSync(pdfPath);
    if (pdfStats.size === 0) {
      throw new Error('File PDF rỗng');
    }
    
    console.log('📄 PDF file size:', pdfStats.size, 'bytes');
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputImagePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log('📁 Tạo thư mục output:', outputDir);
    }
    
    console.log('🔄 Khởi tạo pdf2pic converter...');
    const convert = fromPath(pdfPath, {
      density: 150,
      saveFilename: path.basename(outputImagePath, ".png"),
      savePath: outputDir,
      format: "png",
      width: 600,
      height: 800
    });

    console.log('🔄 Chuyển đổi trang đầu tiên...');
    const res = await convert(1); // chỉ trang đầu
    
    if (!res || !res.path) {
      throw new Error('Không nhận được kết quả từ pdf2pic');
    }
    
    console.log("✅ Thumbnail tạo thành công:", res.path);
    
    // Validate the generated thumbnail
    if (!fs.existsSync(res.path)) {
      throw new Error('File thumbnail không được tạo');
    }
    
    const thumbnailStats = fs.statSync(res.path);
    console.log('🖼️ Thumbnail file size:', thumbnailStats.size, 'bytes');
    
    if (thumbnailStats.size === 0) {
      throw new Error('File thumbnail rỗng');
    }
    
    console.log('✅ Tạo thumbnail thành công!');
    
  } catch (err) {
    console.error("❌ Lỗi khi tạo thumbnail:", err);
    
    // Clean up partial thumbnail if it exists
    if (outputImagePath && fs.existsSync(outputImagePath)) {
      try {
        fs.unlinkSync(outputImagePath);
        console.log('🧹 Đã xóa file thumbnail lỗi:', outputImagePath);
      } catch (cleanupErr) {
        console.error('❌ Lỗi khi xóa file thumbnail lỗi:', cleanupErr);
      }
    }
    
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

const fs = require("fs");
const path = require("path");
const CloudConvert = require("cloudconvert");
const data = require("../data.json");

const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

function normalizeTitle(filename) {
  return path.basename(filename, path.extname(filename)).replace(/[_-]/g, ' ').trim();
}

async function convertDocxToPdf(docPath, outputPdfPath) {
  try {
    console.log("🔄 Bắt đầu chuyển đổi DOCX sang PDF bằng CloudConvert:", docPath);

    if (!fs.existsSync(docPath)) {
      throw new Error(`❌ File DOCX không tồn tại: ${docPath}`);
    }

    const fileStats = fs.statSync(docPath);
    if (fileStats.size === 0) {
      throw new Error("❌ File DOCX rỗng");
    }

    console.log("📄 Kích thước file DOCX:", fileStats.size, "bytes");

    // Tạo job chuyển đổi DOCX -> PDF
    const job = await cloudConvert.jobs.create({
      tasks: {
        'upload': {
          operation: 'import/upload'
        },
        'convert': {
          operation: 'convert',
          input: 'upload',
          input_format: 'docx',
          output_format: 'pdf'
        },
        'export': {
          operation: 'export/url',
          input: 'convert'
        }
      }
    });

    const uploadTask = job.tasks.find(task => task.name === 'upload');

    const uploadUrl = uploadTask.result.form.url;
    const uploadParameters = uploadTask.result.form.parameters;

    const FormData = require("form-data");
    const axios = require("axios");

    const form = new FormData();
    Object.entries(uploadParameters).forEach(([key, value]) => {
      form.append(key, value);
    });
    form.append("file", fs.createReadStream(docPath));

    console.log("⬆️ Đang upload file DOCX lên CloudConvert...");
    await axios.post(uploadUrl, form, { headers: form.getHeaders() });

    console.log("✅ Upload hoàn tất. Đang chờ job xử lý...");

    // Chờ job hoàn tất
    const completedJob = await cloudConvert.jobs.wait(job.id);
    const exportTask = completedJob.tasks.find(task => task.name === 'export');
    const fileUrl = exportTask.result.files[0].url;

    console.log("⬇️ Tải file PDF đã xử lý...");
    const response = await axios.get(fileUrl, { responseType: "stream" });

    const writer = fs.createWriteStream(outputPdfPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    const pdfStats = fs.statSync(outputPdfPath);
    if (pdfStats.size === 0) throw new Error("❌ PDF được tạo nhưng rỗng");

    console.log("✅ Tạo PDF thành công:", outputPdfPath);
  } catch (err) {
    console.error("❌ Lỗi trong convertDocxToPdf:", err.message);
    throw err;
  }
}

async function generateThumbnail(pdfPath, outputImagePath) {
  try {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPage(0); // lấy trang đầu

    const width = 600;
    const height = 800;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Chỉ hiển thị placeholder vì không render được vector
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#333";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("📄 PDF Preview", 50, 100);
    ctx.font = "16px sans-serif";
    ctx.fillText(`Trang đầu của "${pdfPath.split("/").pop()}"`, 50, 140);

    // Lưu thumbnail
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputImagePath, buffer);
    console.log("✅ Thumbnail đã lưu:", outputImagePath);

  } catch (err) {
    console.error("❌ Lỗi tạo thumbnail:", err);
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

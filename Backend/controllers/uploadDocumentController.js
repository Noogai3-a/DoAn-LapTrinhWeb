const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const { uploadFileToDrive } = require('../uploads/googleDrive');
const data = require('../data.json');
const {
  normalizeTitle,
  convertDocxToPdf,
  generateThumbnail,
} = require("../utils/uploadUtils");



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
    console.log("FILES:", req.files);
    console.log("BODY:", req.body);
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
    const folderId = '185Efbd-izYwsA4r41TXgVMu_rGoWDXf9';
    const previewFolderId = '185Efbd-izYwsA4r41TXgVMu_rGoWDXf9'; // Consider using a different folder for previews

    for (const file of req.files) {
      let filePathToSave = file.path;
      let fileNameToSave = file.originalname;
      let fileToUpload = file.path;

      const ext = path.extname(file.originalname).toLowerCase();
      const index = req.files.indexOf(file);
      const rawName = req.body[`filename_${index}`] || file.originalname;
      const title = normalizeTitle(rawName);
      const baseSlug = slugifyTitle(title);
      const slug = `${subjectNameSlug}-${baseSlug}`;

      let previewPath = null;
      let previewFilename = null;
      let previewDriveLink = null;

      try {
        if (ext === '.doc' || ext === '.docx') {
          const pdfFilePath = file.path.replace(ext, '.pdf');
          await convertDocxToPdf(file.path, pdfFilePath);
          if (!fs.existsSync(pdfFilePath)) {
            throw new Error(`Chuyển đổi sang PDF thất bại: không tìm thấy file ${pdfFilePath}`);
          }
          
          fs.unlinkSync(file.path);
          fileToUpload = pdfFilePath;
          fileNameToSave = path.basename(pdfFilePath);

          previewFilename = path.basename(pdfFilePath, '.pdf') + '.png';
          previewPath = path.join('uploads/previews', previewFilename);
          fs.mkdirSync('uploads/previews', { recursive: true });

          try {
            console.log('Tạo thumbnail từ PDF:', pdfFilePath);
            await generateThumbnail(pdfFilePath, previewPath);
            
            if (fs.existsSync(previewPath)) {
              console.log('Thumbnail tạo thành công:', previewPath);
              console.log('Upload thumbnail lên Google Drive...');
              previewDriveLink = await uploadFileToDrive(previewPath, previewFilename, previewFolderId);
              previewDriveLink = previewDriveLink.replace(/uc(?:\?export=view)?\?id=/, 'thumbnail?id=');
              console.log('Thumbnail upload thành công:', previewDriveLink);
            } else {
              console.error('Thumbnail không được tạo:', previewPath);
            }
          } catch (err) {
            console.error(" Lỗi tạo/upload thumbnail:", err);
          } finally {
            if (previewPath && fs.existsSync(previewPath)) {
              fs.unlinkSync(previewPath);
              console.log('Đã xóa thumbnail tạm:', previewPath);
            }
          }
        }
        else if (ext === '.pdf') {
          previewFilename = path.basename(file.path, '.pdf') + '.png';
          previewPath = path.join('uploads/previews', previewFilename);
          fs.mkdirSync('uploads/previews', { recursive: true });

          try {
            console.log('Tạo thumbnail từ PDF:', file.path);
            await generateThumbnail(file.path, previewPath);
            
            if (fs.existsSync(previewPath)) {
              console.log('Thumbnail tạo thành công:', previewPath);
              console.log('Upload thumbnail lên Google Drive...');
              previewDriveLink = await uploadFileToDrive(previewPath, previewFilename, previewFolderId);
              previewDriveLink = previewDriveLink.replace(/uc(?:\?export=view)?\?id=/, 'thumbnail?id=');
              console.log('Thumbnail upload thành công:', previewDriveLink);
            } else {
              console.error('Thumbnail không được tạo:', previewPath);
            }
          } catch (err) {
            console.error("Lỗi tạo/upload thumbnail từ PDF:", err);
          } finally {
            if (previewPath && fs.existsSync(previewPath)) {
              fs.unlinkSync(previewPath);
              console.log('🧹 Đã xóa thumbnail tạm:', previewPath);
            }
          }
        }

        console.log('previewDriveLink cuối cùng:', previewDriveLink);
        console.log('Upload file chính lên Google Drive...');
        const driveLink = await uploadFileToDrive(fileToUpload, fileNameToSave, folderId);
        console.log('File chính upload thành công:', driveLink);
        
        // Clean up the uploaded file
        if (fs.existsSync(fileToUpload)) {
          fs.unlinkSync(fileToUpload);
        }

        filePathToSave = driveLink;

        const newDoc = new Document({
          title,
          slug,
          fileUrl: filePathToSave,
          subjectTypeSlug,
          subjectTypeLabel: labels.subjectTypeLabel,
          subjectNameSlug,
          subjectNameLabel: labels.subjectNameLabel,
          documentType,
          uploader,
          previewUrl: previewDriveLink || null,
          status: 'pending'
        });

        console.log('Lưu document vào MongoDB với previewUrl:', previewDriveLink);
        await newDoc.save();
        savedDocuments.push(newDoc);
        console.log('Document đã được lưu thành công');
        
      } catch (err) {
        console.error(`Lỗi xử lý file ${file.originalname}:`, err);
        
        // Clean up any temporary files
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        if (previewPath && fs.existsSync(previewPath)) {
          fs.unlinkSync(previewPath);
        }
        
        return res.status(500).json({ error: `Lỗi xử lý file ${file.originalname}: ${err.message}` });
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


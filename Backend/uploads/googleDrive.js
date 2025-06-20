const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');
const mime = require('mime-types');

const KEYFILEPATH = path.join(__dirname, '../credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

async function uploadFileToDrive(filePath, fileName, folderId) {
  try {
    console.log('🔄 Bắt đầu upload file lên Google Drive:', fileName);
    console.log('📁 File path:', filePath);
    console.log('📂 Folder ID:', folderId);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File không tồn tại: ${filePath}`);
    }
    
    const fileStats = fs.statSync(filePath);
    console.log('📊 File size:', fileStats.size, 'bytes');
    
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType: mime.lookup(fileName) || 'application/octet-stream',
      body: fs.createReadStream(filePath),
    };

    console.log('🔄 Tạo file trên Google Drive...');
    const res = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    const fileId = res.data.id;
    console.log('✅ File đã được tạo trên Drive với ID:', fileId);

    // Set file permission public
    console.log('🔄 Thiết lập quyền truy cập công khai...');
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const driveUrl = `https://drive.google.com/uc?id=${fileId}`;
    console.log('✅ Upload thành công, URL:', driveUrl);
    return driveUrl;
  } catch (error) {
    console.error('❌ Upload to Drive error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      status: error.status
    });
    throw error;
  }
}


module.exports = { uploadFileToDrive };

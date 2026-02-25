// [[ARABIC_HEADER]] هذا الملف (utils/uploadStorage.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const util = require('util');

const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);

/**
 * Save a multer file buffer to the local uploads directory.
 * @param {Object} file - The file object from multer (must contain buffer, originalname, mimetype)
 * @param {string} folder - Subfolder name inside uploads/ (e.g., 'cars', 'brands')
 * @returns {Promise<string>} The public URL path to the saved file
 */
async function saveMulterFileToUploads(file, folder = 'misc') {
  if (!file || !file.buffer) return null;

  try {
    // Generate unique filename
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    
    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), 'uploads', folder);
    await mkdir(uploadDir, { recursive: true });
    
    // Save file
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, file.buffer);
    
    // Return relative URL path
    return `/uploads/${folder}/${filename}`;
  } catch (error) {
    console.error('Error saving file to uploads:', error);
    throw new Error('Failed to save file');
  }
}

module.exports = {
  saveMulterFileToUploads
};
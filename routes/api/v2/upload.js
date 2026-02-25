const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuthAPI } = require('../../../middleware/auth');
const config = require('../../../modules/core/config');
const cloudinaryLib = require('cloudinary').v2;

const os = require('os');

// Configure storage for Vercel compatibility
// We use the OS temp directory because Vercel's filesystem is read-only except for /tmp
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const tempDir = os.tmpdir();
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Upload endpoint
router.post('/', requireAuthAPI, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No File',
                message: 'Please select an image to upload'
            });
        }

        const hasCloud =
            config.cloudinary &&
            config.cloudinary.cloud_name &&
            config.cloudinary.api_key &&
            config.cloudinary.api_secret;

        if (hasCloud) {
            cloudinaryLib.config({
                cloud_name: config.cloudinary.cloud_name,
                api_key: config.cloudinary.api_key,
                api_secret: config.cloudinary.api_secret
            });
            const folder = config.cloudinary.upload?.folder || 'hm-car';
            const result = await cloudinaryLib.uploader.upload(req.file.path, {
                folder,
                resource_type: 'image',
                overwrite: true,
                use_filename: true,
                unique_filename: true
            });
            // cleanup local file
            try { fs.unlinkSync(req.file.path); } catch { }
            return res.json({
                success: true,
                url: result.secure_url,
                public_id: result.public_id,
                message: 'Image uploaded to Cloudinary'
            });
        }

        // Production check: Local upload is not allowed on Vercel
        if (process.env.NODE_ENV === 'production') {
            return res.status(500).json({
                error: 'Configuration Error',
                message: 'Cloudinary is not configured on production server. Local uploads are disabled.'
            });
        }

        // Fallback: local uploads (only for dev)
        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({
            success: true,
            url: imageUrl,
            message: 'Image uploaded successfully (local)'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            error: 'Upload Failed',
            message: error.message || 'An error occurred during upload'
        });
    }
});

module.exports = router;

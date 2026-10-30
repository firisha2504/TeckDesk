import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { uploadDir, avatarDir } from '../config/storage.js';
import { ApiError } from '../utils/ApiError.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const randomHex = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    const sanitizedBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    cb(null, `${Date.now()}-${randomHex}-${sanitizedBase}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];

  const allowedExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
    '.pdf',
    '.txt',
    '.csv',
    '.json',
    '.zip',
    '.docx',
    '.doc',
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return cb(
      new ApiError(
        400,
        `File extension '${ext}' is not permitted. Allowed extensions: ${allowedExtensions.join(', ')}`
      )
    );
  }

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Unsupported MIME format (${file.mimetype}). Allowed formats: Images, PDF, TXT, CSV, DOC, ZIP`
      )
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum file size
  },
  fileFilter,
});

/**
 * Avatar-specific Multer storage and validation:
 * - Restricted to JPG, JPEG, PNG, and WebP
 * - 5 MB maximum file size limit
 * - Cryptographically random unique filename prefixed with userId
 */
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(avatarDir)) {
      fs.mkdirSync(avatarDir, { recursive: true });
    }
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const randomHex = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const userId = req.user?._id ? req.user._id.toString() : 'user';
    cb(null, `avatar-${userId}-${Date.now()}-${randomHex}${ext}`);
  },
});

const avatarFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return cb(
      new ApiError(
        400,
        `File extension '${ext}' is not permitted for profile photos. Allowed formats: JPG, JPEG, PNG, WebP.`
      )
    );
  }

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Unsupported image format (${file.mimetype}). Please upload a JPG, JPEG, PNG, or WebP photo.`
      )
    );
  }
};

export const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB maximum file size
  },
  fileFilter: avatarFilter,
});

/**
 * Express middleware wrapper to catch Multer errors (including 5MB size limit) cleanly
 */
export const handleAvatarUpload = (req, res, next) => {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'Image file size must not exceed 5 MB.'));
      }
      return next(err);
    }
    next();
  });
};


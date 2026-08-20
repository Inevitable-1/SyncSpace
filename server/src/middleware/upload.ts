/**
 * File upload middleware using Multer.
 *
 * Handles multipart/form-data uploads with the following security measures:
 * - Random filenames (prevents path traversal and overwrites)
 * - File size limit (50MB)
 * - Blocked MIME types (executables)
 *
 * Files are stored in the `uploads/` directory with random hex names.
 *
 * @example
 *   router.post('/upload', upload.single('file'), handler);
 */
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/** Uploads directory — created if it doesn't exist */
const uploadsDir = path.resolve('uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

/**
 * Disk storage configuration for Multer.
 * Uses random 8-byte hex strings as filenames to prevent:
 * - Path traversal attacks (e.g., ../../etc/passwd)
 * - Filename collisions from concurrent uploads
 * - Original filename exposure in the filesystem
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

/**
 * Multer upload middleware with security restrictions.
 *
 * - Max file size: 50MB
 * - Blocked types: Executables (.exe, .msi, etc.)
 * - All other MIME types are allowed
 */
export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const blocked = ['application/x-executable', 'application/x-msdownload'];
    if (blocked.includes(file.mimetype)) {
      cb(new Error('File type not allowed'));
      return;
    }
    cb(null, true);
  },
});

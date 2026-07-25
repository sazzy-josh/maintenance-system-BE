import multer from 'multer'
import { AppError } from '../utils/AppError'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 3 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(
        new AppError(400, 'Only JPEG, PNG, and WebP images are allowed', 'INVALID_FILE_TYPE') as unknown as null,
        false
      )
    }
  },
})

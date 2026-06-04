const express = require('express');
const multer = require('multer');
const path = require('path');
const translationController = require('../controllers/translationController');
const { validateTranslationRequest, validateFile } = require('../middleware/validation');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'), false);
    }
  }
});

/**
 * @swagger
 * /api/translate:
 *   post:
 *     summary: Translate JSON file to specified language
 *     description: Upload a JSON file and get translated content in JSON or CSV format
 *     tags: [Translation]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - code
 *               - languageCode
 *               - filetype
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: JSON file to translate
 *               code:
 *                 type: string
 *                 example: shared
 *                 description: Translation code identifier
 *               languageCode:
 *                 type: string
 *                 example: ar
 *                 description: Target language code (ISO 639-1)
 *               filetype:
 *                 type: string
 *                 enum: [json, csv]
 *                 example: json
 *                 description: Output format
 *     responses:
 *       200:
 *         description: Successful translation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TranslationResponse'
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing API key
 *       403:
 *         description: Invalid API key
 *       413:
 *         description: File too large
 *       500:
 *         description: Server error
 */
router.post('/translate', 
  authMiddleware,
  upload.single('file'),
  validateFile,
  validateTranslationRequest,
  translationController.translate
);

/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     tags: [Cache]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Cache statistics
 */
router.get('/cache/stats', authMiddleware, translationController.getCacheStats);

/**
 * @swagger
 * /api/cache/clear:
 *   post:
 *     summary: Clear translation cache
 *     tags: [Cache]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 */
router.post('/cache/clear', authMiddleware, translationController.clearCache);

/**
 * @swagger
 * /api/languages:
 *   get:
 *     summary: Get supported languages
 *     tags: [Info]
 *     responses:
 *       200:
 *         description: List of supported languages
 */
router.get('/languages', translationController.getSupportedLanguages);

module.exports = router;
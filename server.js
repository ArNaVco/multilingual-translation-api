const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const multer = require('multer');
const { Parser } = require('json2csv');
const NodeCache = require('node-cache');
const translate = require('@vitalets/google-translate-api');
require('dotenv').config();

const app = express();
const cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL) || 3600 });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IT4T Multilingual Translation API',
      version: '1.0.0',
      description: 'API for translating JSON files to multiple languages'
    },
    servers: [{ url: 'http://localhost:3000' }]
  },
  apis: ['./server.js']
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json') cb(null, true);
    else cb(new Error('Only JSON files are allowed'), false);
  }
});

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ success: false, error: 'Invalid or missing API key' });
  }
  next();
};

// Translation function
async function translateText(text, targetLang) {
  if (!text || typeof text !== 'string') return text;
  
  const cacheKey = `${targetLang}:${text}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  
  try {
    const result = await translate(text, { to: targetLang });
    cache.set(cacheKey, result.text);
    return result.text;
  } catch (error) {
    console.error(`Translation error: ${error.message}`);
    return `[${targetLang}] ${text}`;
  }
}

/**
 * @swagger
 * /api/translate:
 *   post:
 *     summary: Translate JSON file
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
 *               code:
 *                 type: string
 *               languageCode:
 *                 type: string
 *               filetype:
 *                 type: string
 *                 enum: [json, csv]
 *     responses:
 *       200:
 *         description: Success
 */
app.post('/api/translate', authMiddleware, upload.single('file'), async (req, res) => {
  let filePath = null;
  
  try {
    const { code, languageCode, filetype } = req.body;
    
    // Validation
    if (!code) return res.status(400).json({ error: 'Code is required' });
    if (!languageCode) return res.status(400).json({ error: 'LanguageCode is required' });
    if (!filetype) return res.status(400).json({ error: 'Filetype is required' });
    if (!['json', 'csv'].includes(filetype)) {
      return res.status(400).json({ error: 'Filetype must be json or csv' });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    filePath = req.file.path;
    
    // Parse JSON file
    const fileContent = require('fs').readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    
    // Translate each key
    const results = [];
    for (const [key, value] of Object.entries(jsonData)) {
      const translatedText = await translateText(value, languageCode);
      results.push({
        Code: code,
        LanguageCode: languageCode,
        ContentKey: key,
        ContentDesc: translatedText
      });
    }
    
    // Cleanup file
    require('fs').unlinkSync(filePath);
    
    // Return response
    if (filetype === 'csv') {
      const parser = new Parser({ fields: ['Code', 'LanguageCode', 'ContentKey', 'ContentDesc'] });
      const csv = parser.parse(results);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=translated_${languageCode}.csv`);
      return res.send(csv);
    } else {
      return res.json(results);
    }
    
  } catch (error) {
    if (filePath && require('fs').existsSync(filePath)) {
      require('fs').unlinkSync(filePath);
    }
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get supported languages
app.get('/languages', (req, res) => {
  res.json({ languages: ['ar', 'fr', 'de', 'es', 'zh', 'ja', 'ru', 'hi', 'it', 'pt'] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
});
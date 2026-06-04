const { body, validationResult } = require('express-validator');

const validateTranslationRequest = [
  body('code').notEmpty().withMessage('Code is required')
    .isString().withMessage('Code must be a string')
    .trim()
    .escape(),
  
  body('languageCode').notEmpty().withMessage('LanguageCode is required')
    .isLength({ min: 2, max: 5 }).withMessage('LanguageCode must be 2-5 characters')
    .matches(/^[a-z]{2}(-[A-Z]{2})?$/).withMessage('Invalid language code format'),
  
  body('filetype').notEmpty().withMessage('Filetype is required')
    .isIn(['json', 'csv']).withMessage('Filetype must be either "json" or "csv"'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

const validateFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded',
      details: 'Please upload a JSON file'
    });
  }

  if (req.file.mimetype !== 'application/json') {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      details: 'Only JSON files are allowed'
    });
  }

  next();
};

module.exports = { validateTranslationRequest, validateFile };
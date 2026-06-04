const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY;

  if (!process.env.API_KEY || process.env.NODE_ENV === 'test') {
    // Skip auth in test or if no API key configured
    return next();
  }

  if (!apiKey) {
    logger.warn('Missing API key in request');
    return res.status(401).json({
      success: false,
      error: 'API key is required. Please provide x-api-key header.'
    });
  }

  if (apiKey !== validApiKey) {
    logger.warn(`Invalid API key attempt: ${apiKey.substring(0, 8)}...`);
    return res.status(403).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  next();
};

module.exports = authMiddleware;
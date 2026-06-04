const translationService = require('../services/translationService');
const fileProcessor = require('../utils/fileProcessor');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

class TranslationController {
  async translate(req, res, next) {
    let filePath = null;
    
    try {
      const { code, languageCode, filetype } = req.body;
      filePath = req.file.path;

      logger.info(`Translation request: ${code} -> ${languageCode} (${filetype})`);

      // Validate language support
      if (!translationService.isLanguageSupported(languageCode)) {
        return res.status(400).json({
          success: false,
          error: `Language ${languageCode} is not supported`,
          supportedLanguages: translationService.getSupportedLanguages()
        });
      }

      // Parse JSON file
      const jsonData = await fileProcessor.validateAndParseJSON(filePath);
      
      // Translate content
      const translationResults = await translationService.translateObject(
        jsonData,
        code,
        languageCode
      );

      // Handle response based on filetype
      if (filetype === 'csv') {
        const csvData = fileProcessor.convertToCSV(translationResults);
        const filename = fileProcessor.generateFilename(req.file.originalname, languageCode, 'csv');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        
        logger.info(`CSV response generated: ${filename}`);
        return res.status(200).send(csvData);
      } else {
        logger.info(`JSON response generated with ${translationResults.length} entries`);
        return res.status(200).json(translationResults);
      }
      
    } catch (error) {
      logger.error(`Translation failed: ${error.message}`);
      next(error);
    } finally {
      // Cleanup uploaded file
      if (filePath) {
        await fileProcessor.cleanupFile(filePath);
      }
    }
  }

  async getCacheStats(req, res) {
    try {
      const stats = cacheService.getStats();
      res.status(200).json({
        success: true,
        stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async clearCache(req, res) {
    try {
      cacheService.clear();
      logger.info('Cache cleared by user');
      res.status(200).json({
        success: true,
        message: 'Cache cleared successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getSupportedLanguages(req, res) {
    res.status(200).json({
      success: true,
      languages: translationService.getSupportedLanguages(),
      total: translationService.getSupportedLanguages().length
    });
  }
}

module.exports = new TranslationController();
const fs = require('fs').promises;
const { Parser } = require('json2csv');
const path = require('path');

class FileProcessor {
  async validateAndParseJSON(filePath) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const jsonData = JSON.parse(fileContent);
      
      if (typeof jsonData !== 'object' || jsonData === null) {
        throw new Error('JSON must be an object');
      }
      
      return jsonData;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format');
      }
      throw error;
    }
  }

  convertToCSV(translationResults) {
    if (!translationResults || translationResults.length === 0) {
      throw new Error('No data to convert to CSV');
    }

    const fields = ['Code', 'LanguageCode', 'ContentKey', 'ContentDesc'];
    const parser = new Parser({ fields });
    return parser.parse(translationResults);
  }

  async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to cleanup file ${filePath}:`, error);
    }
  }

  generateFilename(originalName, languageCode, filetype) {
    const timestamp = Date.now();
    const baseName = path.basename(originalName, '.json');
    return `${baseName}_${languageCode}_${timestamp}.${filetype}`;
  }
}

module.exports = new FileProcessor();
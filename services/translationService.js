const translate = require('@vitalets/google-translate-api');
const cacheService = require('./cacheService');
const logger = require('../utils/logger');

class TranslationService {
  constructor() {
    this.supportedLanguages = process.env.ALLOWED_LANGUAGES ? 
      process.env.ALLOWED_LANGUAGES.split(',') : 
      ['ar', 'fr', 'de', 'es', 'zh', 'ja', 'ru', 'hi', 'it', 'pt'];
  }

  async translateText(text, targetLang, sourceLang = 'en') {
    if (!text || typeof text !== 'string') {
      return text;
    }

    // Check cache first
    const cacheKey = `trans:${sourceLang}:${targetLang}:${text}`;
    const cached = cacheService.cache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache hit for: ${text.substring(0, 50)}`);
      return cached;
    }

    try {
      const result = await translate(text, {
        from: sourceLang,
        to: targetLang
      });

      // Cache the result
      cacheService.cache.set(cacheKey, result.text, parseInt(process.env.CACHE_TTL) || 3600);
      
      logger.info(`Translated "${text.substring(0, 50)}" to ${targetLang}`);
      return result.text;
    } catch (error) {
      logger.error(`Translation error: ${error.message}`, { text, targetLang });
      // Fallback: return original text with a marker
      return `[TRANSLATION_FAILED:${targetLang}] ${text}`;
    }
  }

  async translateObject(obj, code, targetLang) {
    const results = [];
    const entries = Object.entries(obj);

    // Process translations in parallel with rate limiting
    const batchSize = 5;
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const batchPromises = batch.map(async ([key, value]) => {
        // Check cache
        const cached = cacheService.get(code, targetLang, key);
        let translatedText;

        if (cached) {
          translatedText = cached;
          logger.debug(`Cache hit for ${key}`);
        } else {
          translatedText = await this.translateText(value, targetLang);
          cacheService.set(code, targetLang, key, translatedText);
        }

        return {
          Code: code,
          LanguageCode: targetLang,
          ContentKey: key,
          ContentDesc: translatedText
        };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay to avoid rate limiting
      if (i + batchSize < entries.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  isLanguageSupported(langCode) {
    return this.supportedLanguages.includes(langCode);
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }
}

module.exports = new TranslationService();
const NodeCache = require('node-cache');

class CacheService {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: parseInt(process.env.CACHE_TTL) || 3600,
      checkperiod: 120,
      useClones: false
    });
  }

  getKey(code, languageCode, contentKey) {
    return `${code}:${languageCode}:${contentKey}`;
  }

  get(code, languageCode, contentKey) {
    const key = this.getKey(code, languageCode, contentKey);
    return this.cache.get(key);
  }

  set(code, languageCode, contentKey, value) {
    const key = this.getKey(code, languageCode, contentKey);
    this.cache.set(key, value);
  }

  has(code, languageCode, contentKey) {
    const key = this.getKey(code, languageCode, contentKey);
    return this.cache.has(key);
  }

  clear() {
    this.cache.flushAll();
  }

  getStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      hitRate: this.cache.getStats().hits / (this.cache.getStats().hits + this.cache.getStats().misses) * 100
    };
  }
}

module.exports = new CacheService();
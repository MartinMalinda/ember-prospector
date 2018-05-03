import deepSet from 'ember-deep-set';
import { isArray } from '@ember/array';
import { queryWithoutInclude, isEmptyQuery } from './query-helpers';
import { get } from '@ember/object';

export default class {

  /*
  
  _cache: {
    user: {
      'all': {
        cachedData: [...],
        alreadyIncluded: ['comments']
      },
      '{"admin":true}': {
        cachedData: [...],
        alreadyIncluded: []
      },
      '1': {
        cachedData: Model,
        alreadyIncluded: ['comments']
      },
      '2-{"admin":true}': {
        cachedData: Model,
        alreadyIncluded: []
      }
    }
  }

  */

  constructor(configHelpers = {}) {
    this._cache = {};
    this._config = configHelpers;
  }

  emptyCache(modelName, id, query, model) {
    if (!modelName && !id && !query) {
      // empty the whole cache
      return this._cache = {};
    }

    if (modelName && !id && !query) {
      // remove all cache for certain model
      delete this._cache[modelName];
      return;
    }

    const cacheKey = this._getCacheKeyForQuery(modelName, id, query);
    // TODO: use delete instead of deepSet here somehow
    deepSet(this, cacheKey, undefined);

    if (id && model) {
      this._removeModelFromAllQueryCaches(modelName, model);
    }
  }

  /*
  Universal method for finding cache for .query and .findRecord
  */
  findInCache() {
    return get(this, this._getCacheKeyForQuery(...arguments));
  }

  saveToCache(modelName, id, query, data) {
    const existingCache = this.findInCache(modelName, id, query);

    if (existingCache) {
      this._updateCache(existingCache, modelName, id, query, data);
    } else {
      // the cache does not exist yet, create it
      this._createCache(...arguments);
    }

    if (!id && this._config.shouldCreateFindRecordCacheFromQuery(modelName, query, data)) {
      let findRecordCacheQuery = {
        ...query
      };
      if (this._config.shouldStripQueryFromFindRecordCaching(modelName, query, data)) {
        findRecordCacheQuery = { include: findRecordCacheQuery.include };
      }

      data.forEach(model => {
        this.saveToCache(modelName, model.id, findRecordCacheQuery, model);
      });
    }
  }

  _getCacheKeyForQuery(modelName, id, query) {
    const strippedQuery = queryWithoutInclude(query);
    const queryIsEmpty = isEmptyQuery(strippedQuery);

    if (!id && queryIsEmpty) {
      return `_cache.${modelName}.all`;
    }

    if (id && queryIsEmpty) {
      return `_cache.${modelName}.${id}`;
    }

    const queryKey = JSON.stringify(strippedQuery);
    let resourceKey = queryKey;

    if (id) {
      resourceKey = `${id}-${queryKey}`;
    }

    return `_cache.${modelName}.${resourceKey}`;
  }

  /*
    Cache is valid if the query is the same and all include data are available
  */
  isCacheValid(cache, query) {
    if (!cache) {
      return false;
    }

    if (!query.include || !query.include.length) {
      // no include specified, that means the cache can be used
      return true;
    }

    // if some relationship can't be found in the alreadIncluded ones, the cache can't be used
    const { alreadyIncluded } = cache;
    const include = this._config.deserializeInclude(query.include);
    return !include.find(relationshipName => {
      return !alreadyIncluded.includes(relationshipName);
    });
  }

  _createCache(modelName, id, query, data) {
    const cacheKey = this._getCacheKeyForQuery(modelName, id, query);
    deepSet(this, cacheKey, {
      cachedData: data,
      alreadyIncluded: this._config.deserializeInclude(query.include) || []
    });
  }

  _updateCache(cache, modelName, id, query, data) {
    if (query.include && query.include.length) {
      // update the `alreadyIncluded`
      const { alreadyIncluded } = cache;
      this._config.deserializeInclude(query.include).forEach(relationshipName => {
        if (!alreadyIncluded.includes(relationshipName)) {
          alreadyIncluded.push(relationshipName);
        }
      });
    }

    // update the cachedData just in case, or for potential usecases of `reload: true`
    cache.cachedData = data;
  }

  _removeModelFromAllQueryCaches(modelName, model) {
    const cacheKeys = Object.keys(this._cache[modelName]);
    cacheKeys.forEach(cacheKey => {
      const cache = this._cache[modelName][cacheKey];
      if (!cache) {
        return;
      }

      const { cachedData } = cache;

      if (cachedData === model) {
        delete this._cache[cacheKey];
      } else if (isArray(cachedData)) {
        cachedData.removeObject(model);
      }
    });
  }
}

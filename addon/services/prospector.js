import Service, { inject as service } from '@ember/service';
import deepSet from 'ember-deep-set';
import { isArray } from '@ember/array';
import RSVP from 'rsvp';

export default Service.extend({
  store: service(),

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

  init() {
    this._super(...arguments);
    this._cache = {};
  },

  async query(modelName, query) {
    const cache = this._findInCache(modelName, null, query);

    if (this._isCacheValid(cache, query)) {
      return RSVP.resolve(cache.cachedData);
    }

    let newQuery = { ...query };
    if (newQuery.include) {
      if (cache) {
        newQuery.include = this._trimInclude(cache, newQuery.include);
      }

      newQuery.include = this.serializeInclude(newQuery.include);
    }
    
    return this.get('store').query(modelName, newQuery).then(data => {
      this._saveToCache(modelName, null, newQuery, data);
      return data;
    });
  },

  /*
    Cache is valid if the query is the same and all include data are available
  */
  _isCacheValid(cache, query) {
    if (!cache) {
      return false;
    }

    if (!query.include || !query.include.length) {
      // no include specified, that means the cache can be used
      return true;
    }

    // if some relationship can't be found in the alreadIncluded ones, the cache can't be used
    const { alreadyIncluded } = cache;
    return !query.include.find(relationshipName => {
      return !alreadyIncluded.includes(relationshipName);
    });
  },

  /*
    Returns include array without relationships that were already included in previous requests
  */
  _trimInclude(cache, include) {
    const { alreadyIncluded } = cache;
    return include.filter(relationshipName => {
      return !alreadyIncluded.includes(relationshipName);
    });
  },

  /*
    Universal method for finding cache for .query and .findRecord
  */
  _findInCache() {
    return this.get(this._getCacheKeyForQuery(...arguments));
  },

  _getCacheKeyForQuery(modelName, id, query) {
    const queryWithoutInclude = this._queryWithoutInclude(query);
    const queryIsEmpty = this._isEmptyQuery(queryWithoutInclude);

    if (!id && queryIsEmpty) {
      return `_cache.${modelName}.all`;
    }

    if (id && queryIsEmpty) {
      return `_cache.${modelName}.${id}`;
    }

    const queryKey = JSON.stringify(queryWithoutInclude);
    let resourceKey = queryKey;

    if (id) {
      resourceKey = `${id}-${queryKey}`;
    }

    return `_cache.${modelName}.${resourceKey}`;
  },

  _saveToCache(modelName, id, query, data) {
    const existingCache = this._findInCache(modelName, id, query);

    if (existingCache) {
      this._updateCache(existingCache, modelName, id, query, data);
    } else {
      // the cache does not exist yet, create it
      this._createCache(...arguments);
    }
  },

  _createCache(modelName, id, query, data) {
    const cacheKey = this._getCacheKeyForQuery(modelName, id, query);
    deepSet(this, cacheKey, {
      cachedData: data,
      alreadyIncluded: this.deserializeInclude(query.include) || []
    });
  },

  _updateCache(cache, modelName, id, query, data) {
    if (query.include && query.include.length) {
      // update the `alreadyIncluded`
      const { alreadyIncluded } = cache;
      this.deserializeInclude(query.include).forEach(relationshipName => {
        if (!alreadyIncluded.includes(relationshipName)) {
          alreadyIncluded.push(relationshipName);
        }
      });
    }

    // update the cachedData just in case, or for potential usecases of `reload: true`
    cache.cachedData = data;
  },

  deserializeInclude(include) {
    if (isArray(include)) {
      return include;
    }

    return include && include.split(',') || [];
  },

  serializeInclude(include) {
    if (typeof include === 'string') {
      return include;
    }

    return include.join(',');
  },

  _queryWithoutInclude(query) {
    const _newQuery = {
      ...query
    };

    delete _newQuery.include;
    return _newQuery;
  },

  _isEmptyQuery(query) {
    return Object.keys(query).length === 0;
  }
});

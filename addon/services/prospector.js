import Service, { inject as service } from '@ember/service';

export default Ember.Service.extend({
  store: service(),

  /*
  
  _cache: {
    user: {
      'all': {
        cacheData: [...],
        alreadyIncluded: ['comments']
      },
      '{"admin":true}': {
        cacheData: [...],
        alreadyIncluded: []
      },
      '1': {
        cacheData: Model,
        alreadyIncluded: ['comments']
      },
      '2-{"admin":true}': {
        cacheData: Model,
        alreadyIncluded: []
      }
    }
  }

  */

  _cache: {},

  query(modelName, query) {
    const cache = this._findInCache(modelName, null, query);

    if (this._isCacheValid(cache, query)) {
      return cache.cacheData;
    }

    let newQuery = { ...query };
    if (cache && newQuery.include) {
      newQuery.inclue = this._trimInclude(cache, newQuery.include);
    }

    return this.get('store').query(modelName, newQuery);
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
    return include.reject(relationshipName => {
      return alreadyIncluded.includes(relationshipName);
    });
  },

  /*
    Universal method for finding cache for .query and .findRecord
  */
  _findInCache(modelName, id, query) {
    const queryWithoutInclude = this._queryWithoutInclude(query);
    const queryIsEmpty = this._isEmptyQuery(queryWithoutInclude);
    const hasQuery = !queryIsEmpty;

    if (!id && queryIsEmpty) {
      return this.get(`_cache.${modelName}.all`);
    }


    if (id && queryIsEmpty) {
      return this.get('_cache.${modelName}.${id}');
    }

    const queryKey = JSON.stringify(queryWithoutInclude);
    let resourceKey = queryKey;

    if (id) {
      resourceKey = `${id}-${queryKey}`;
    }

    return this.get('_cache.${modelName}.${resourceKey}');
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

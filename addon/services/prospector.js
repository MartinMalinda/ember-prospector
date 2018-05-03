import Service, { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import CacheLayer from '../utils/cache-layer';
import { deserializeInclude, serializeInclude } from '../utils/serializer';

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

  deserializeInclude,
  serializeInclude,

  init() {
    this._super(...arguments);

    // create cacheLayer and pass down config helpers
    this._cacheLayer = new CacheLayer({
      shouldCreateFindRecordCacheFromQuery: this.shouldCreateFindRecordCacheFromQuery,
      shouldStripQueryFromFindRecordCaching: this.shouldStripQueryFromFindRecordCaching,
      deserializeInclude: this.deserializeInclude,
      serializeInclude: this.deserializeInclude,
    });
  },

  query(modelName, query) {
    const cache = this._cacheLayer.findInCache(modelName, null, query);

    if (this._cacheLayer.isCacheValid(cache, query)) {
      return RSVP.resolve(cache.cachedData);
    }

    const newQuery = this._getQueryWithTrimmedInclude(cache, query);
    
    return this.get('store').query(modelName, newQuery).then(data => {
      this._cacheLayer.saveToCache(modelName, null, newQuery, data);
      return data;
    });
  },

  findRecord(modelName, id, options = {}) {
    let { include, adapterOptions } = options;
    let query = adapterOptions && adapterOptions.query;
    const cache = this._cacheLayer.findInCache(modelName, id, query);
    // include can be directly in options or inside adapterOptions.query
    include = include || (query && query.include);
    // make sure include is inside query so it's consistent with .query method
    query = {
      ...query,
      include
    };

    if (this._cacheLayer.isCacheValid(cache, query)) {
      return RSVP.resolve(cache.cachedData);
    }

    const newQuery = this._getQueryWithTrimmedInclude(cache, query);
    const newOptions = {
      ...options,
      adapterOptions: options.adapterOptions || {}
    };
    newOptions.adapterOptions.query = newQuery;
    delete newOptions.include;
    return this.get('store').findRecord(modelName, id, newOptions).then(data => {
      this._cacheLayer.saveToCache(modelName, id, newQuery, data);
      return data;
    });
  },

  destroyRecord(model) {
    return model.destroyRecord().then(() => {
      const { modelName, id } = model._internalModel;
      this.emptyCache(modelName, id, null, model);
    });
  },

  unloadRecord(model) {
    model.unloadRecord();
    const { modelName, id } = model._internalModel;
    this.emptyCache(modelName, id, null, model);
  },

  shouldCreateFindRecordCacheFromQuery(/* modelName, query, data */) {
    return false;
  },

  shouldStripQueryFromFindRecordCaching(/* modelName, query, data */) {
    return false;
  },

  emptyCache() {
    return this._cacheLayer.emptyCache(...arguments);
  },

  /*
    Returns a query without previously loaded relationships
  */
  _getQueryWithTrimmedInclude(cache, query) {
    let newQuery = { ...query };
    if (newQuery.include) {
      if (cache) {
        newQuery.include = this._trimInclude(cache, newQuery.include);
      }

      newQuery.include = this.serializeInclude(newQuery.include);
    }

    return newQuery;
  },

  /*
    Returns include array without relationships that were already included in previous requests
  */
  _trimInclude(cache, include) {
    const { alreadyIncluded } = cache;
    return include.filter(relationshipName => {
      return !alreadyIncluded.includes(relationshipName);
    });
  }

});

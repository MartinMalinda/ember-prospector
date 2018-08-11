import Service, { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import CacheLayer from '../utils/cache-layer';
import { deserializeInclude, serializeInclude } from '../utils/serializer';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import ObjectProxy from '@ember/object/proxy';
import { removeLoadedRelationships } from '../utils/relationship-checker';

const ObjectPromiseProxy = ObjectProxy.extend(PromiseProxyMixin);

export default Service.extend({
  store: service(),

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
    const query = this._createQueryFromFindRecordOptions(options);
    const cache = this._cacheLayer.findInCache(modelName, id, query);

    if (this._cacheLayer.isCacheValid(cache, query)) {
      return RSVP.resolve(cache.cachedData);
    }

    const newQuery = this._getTrimmedQueryByModel(cache, query, modelName, id);
    const newOptions = {
      ...options,
      reload: true
    };

    if (newOptions.adapterOptions) {
      newOptions.adapterOptions.query = newQuery;
    }

    if (newOptions.include) {
      newOptions.include = newQuery.include;
    }
    return this.get('store').findRecord(modelName, id, newOptions).then(data => {
      this._cacheLayer.saveToCache(modelName, id, newQuery, data);
      return data;
    });
  },

  lazyFindRecord(modelName, id, options = {}) {
    // TODO: this is called for a second time, unnecessary, refactor
    const query = this._createQueryFromFindRecordOptions(options);
    const cache = this._cacheLayer.findInCache(modelName, id, query);
    
    const remainingRelationships = this._trimInclude(cache, query.include);

    const mainPromise = this.findRecord(...arguments);
    const hash = {};
    hash._main = mainPromise;
    if (cache) {
      const model = cache.cachedData;
      hash[modelName] = model;
      cache.alreadyIncluded.forEach(relationshipName => {
        hash[relationshipName] = model.get(relationshipName);
      });
    } else {
      hash[modelName] = mainPromise;
    }

    remainingRelationships.forEach(relationshipName => {
      hash[relationshipName] = mainPromise.then(model => {
        return model.get(relationshipName);
      });
    });

    return this._createHashProxy(hash);
  },

  _createHashProxy(hash) {
    const hashProxy = {};
    Object.keys(hash).forEach(key => {
      const value = hash[key];
      hashProxy[key] = this.createProxy(value);
    });

    return hashProxy;
  },

  createProxy(data) {
    const isPromise = data && data.then;
    return ObjectPromiseProxy.create({
      promise: isPromise ? data : RSVP.resolve(data)
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

  _createQueryFromFindRecordOptions(options) {
    let { include, adapterOptions } = options;
    let query = adapterOptions && adapterOptions.query;
    // include can be directly in options or inside adapterOptions.query
    include = include || (query && query.include);
    // make sure include is inside query so it's consistent with .query method
    return {
      ...query,
      include
    };
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

  _getTrimmedQueryByModel(cache, query, modelName, id) {
    const newQuery = this._getQueryWithTrimmedInclude(cache, query);
    const localModel = this.get('store').peekRecord(modelName, id);
    if (localModel) {
      newQuery.include = this.serializeInclude(removeLoadedRelationships(localModel, this.deserializeInclude(newQuery.include)));
    }

    return newQuery;
  },

  /*
    Returns include array without relationships that were already included in previous requests
  */
  _trimInclude(cache, include) {
    if (!cache) {
      return include;
    }

    const { alreadyIncluded } = cache;
    return include.filter(relationshipName => {
      return !alreadyIncluded.includes(relationshipName);
    });
  }

});

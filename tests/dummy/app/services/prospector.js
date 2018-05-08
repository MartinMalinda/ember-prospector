import ProspectorService from 'ember-prospector/services/prospector';
import config from 'dummy/config/environment';

export default ProspectorService.extend({
  shouldCreateFindRecordCacheFromQuery(/* modelName, query, data */) {
    /*
    This returns false by default

    if (modelName === 'admin') {
      return false;
    }
    
    if (query.someParam) {
      return false;
    }
    */


    if (config.environment === 'development') {
      return true;
    }

    return this._super(...arguments);
  },

  shouldStripQueryFromFindRecordCaching(/* modelName, query, data */) {
    /*
      This returns false by default

      If this returns true, the cache layer will ignore the query key during save so that
      prospector.query('user', { admin: true, include: ['comments'] });
      prospector.findRecord('user', 1, { include: ['comments'] }); // this might be returned from cache, if the value would be false, the `admin: true` would prevent that cache to be used
    */
    if (config.environment === 'development') {
      return true;
    }

    return this._super(...arguments);
  }
});

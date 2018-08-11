import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { computed, observer } from '@ember/object';
import { run } from '@ember/runloop';

export default Controller.extend({
  prospector: service(),
  router: service(),

  init() {
    this._super(...arguments);
    this.setProspectorCache();
  },

  setProspectorCache(delay = 500) {
    this.set('prospectorCache', null);
    run.later(() => {
      this.set('prospectorCache', this.get('prospector._cacheLayer._cache'));
    }, delay);
  },

  routeObserver: observer('router.currentURL', 'router.currentRouteName', function() {
    this.setProspectorCache();
  }),

  actions: {
    emptyCache() {
      this.get('prospector').emptyCache();
      this.setProspectorCache(0);
    }
  }
});

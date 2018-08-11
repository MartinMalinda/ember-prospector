import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  prospector: service(),
  store: service(),

  model() {
    return this.get('store').findAll('user');
  }
});

import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  prospector: service(),

  model({ id }) {
    return this.get('prospector').lazyFindRecord('user', id, {
      include: ['roles', 'threads', 'comments']
    });
  }
});

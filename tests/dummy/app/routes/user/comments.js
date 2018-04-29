import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  prospector: service(),

  model() {
    return this.get('prospector').query('user', {
      include: ['roles', 'comments']
    });
  }
});

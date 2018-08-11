import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  prospector: service(),
  store: service(),

  async model({ id }) {
    await this.get('store').findRecord('user', id, { include: 'threads' });

    const model = this.get('prospector').lazyFindRecord('user', id, {
      include: ['roles', 'threads', 'comments']
    });
    
    return model;
  }
});

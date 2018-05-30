import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  prospector: service(),

  async model({ id }) {
    const model = this.get('prospector').lazyFindRecord('user', id, {
      include: ['roles', 'threads', 'comments']
    });
    await model.user;
    debugger;
    return model;
  }
});

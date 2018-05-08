import { moduleFor, test } from 'ember-qunit';
import EmberObject from '@ember/object';
import { createFakeModel } from './prospector-clear-cache-test';

moduleFor('service:prospector', 'Unit | Service | prospector - lazyQuery', {
});

test('lazyQuery - nothing in cache, it hash of main promise and bunch of properties describing the loading status', async function(assert) {
  const data = [createFakeModel('user', 1)];
  const prospector = this.subject({
    store: EmberObject.create({
      async query(modelName, id, options) {
        return data;
      }
    })
  });

  const hash = prospector.lazyQuery('user', {
    include: ['roles', 'comments']
  });

  assert.ok(hash.users.then, 'hash.users is a promise');
  assert.ok(hash.loadingComments, 'loadingComments is true because the promise was not resolved yet');
  assert.ok(hash.loadingRoles, 'loadingRoles is true because the promise was not resolved yet');
});

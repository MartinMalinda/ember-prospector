import { moduleFor, test } from 'ember-qunit';
import EmberObject from '@ember/object';
import { createFakeModel } from './prospector-clear-cache-test';

moduleFor('service:prospector', 'Unit | Service | prospector - lazyQuery', {
});

test('lazyQuery - nothing in cache, it returns hash of main promise and bunch of properties describing the loading status', async function(assert) {
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

  const users = await hash.users;
  assert.deepEqual(users, data, 'data has been resolved correctly');
  assert.notOk(hash.loadingComments, 'comments are not loading anymore');
  assert.notOk(hash.loadingRoles, 'roles are not loading anymore');
});

test('lazyQuery - calling lazyQuery without include and then with include', async function(assert) {
  const data = [createFakeModel('user', 1)];

  const prospector = this.subject({
    store: EmberObject.create({
      async query(modelName, id, options) {
        return data;
      }
    })
  });

  await prospector.lazyQuery('user').users;
  const users = await prospector.lazyQuery('user', { include: ['roles', 'comments'] }).users;
  assert.deepEqual(users, data, 'data has been resolved correctly');
});

test('lazyQuery - calling lazyQuery twice with one shared include', async function(assert) {
  const data = [createFakeModel('user', 1)];

  const prospector = this.subject({
    store: EmberObject.create({
      async query(modelName, id, options) {
        return data;
      }
    })
  });

  await prospector.lazyQuery('user', { include: ['roles'] }).users;
  const secondHash = prospector.lazyQuery('user', { include: ['roles', 'comments'] });
  assert.ok(secondHash.loadingComments, 'comments are loading');
  assert.notOk(secondHash.loadingRoles, 'roles are not loading');
  await secondHash.users;
  assert.notOk(secondHash.loadingRoles, 'roles are not loading');
});

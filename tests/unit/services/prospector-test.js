import { moduleFor, test } from 'ember-qunit';
import EmberObject from '@ember/object';
import RSVP from 'rsvp';
import settled from '@ember/test-helpers/settled';

moduleFor('service:prospector', 'Unit | Service | prospector', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']
});

const storeMock = EmberObject.extend({
  async query() {
    return [];
  }
});

window.Promise = RSVP.Promise;

// Replace this with your real tests.
test('query - underlying store.query is called when theres no cache', async function(assert) {
  assert.expect(2);
  const queryArgs = ['user', { admin: true }]

  const prospector = this.subject({
    store: storeMock.create({
      async query(modelName, query) {
        assert.equal(modelName, queryArgs[0], 'modelName has been passed to query');
        assert.deepEqual(query, queryArgs[1], 'query has been passed to query');
      }
    })
  });

  await prospector.query(...queryArgs);
  await settled();
});

test('query - if the cache is VALID, cached data are returned', async function(assert) {
  const queryArgs = ['user', { admin: true }];
  const prospector = this.subject({
    store: storeMock.create({})
  });

  const cachedData = [1, 2];
  prospector._saveToCache('user', null, { admin: true }, cachedData);

  const data = await prospector.query(...queryArgs);
  await settled();
  assert.deepEqual(data, cachedData, 'cached data are returned');
});

test('query - if the cache is INVALID, cached data are NOT returned', async function(assert) {
  assert.expect(1);

  // admin: true
  const queryArgs = ['user', { admin: true }];
  const prospector = this.subject({
    store: storeMock.create({
      async query() {
        assert.ok(true, 'store.query has been called');
      }
    })
  });

  const cachedData = [1, 2];
  // admin: false
  prospector._saveToCache('user', null, { admin: false }, cachedData);

  await prospector.query(...queryArgs);
  await settled();
});

test('query - if the cache is INVALID, cached data are NOT returned (2)', async function(assert) {
  assert.expect(1);

  // admin: true
  const queryArgs = ['user', { admin: true }];
  const prospector = this.subject({
    store: storeMock.create({
      async query() {
        assert.ok(true, 'store.query has been called');
      }
    })
  });

  const cachedData = [1, 2];
  // admin: false
  prospector._saveToCache('user', null, { admin: false }, cachedData);

  await prospector.query(...queryArgs);
  await settled();
});

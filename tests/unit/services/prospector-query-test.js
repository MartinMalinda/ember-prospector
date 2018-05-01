import { moduleFor, test } from 'ember-qunit';
import EmberObject from '@ember/object';

moduleFor('service:prospector', 'Unit | Service | prospector - query', {
});

const storeMock = EmberObject.extend({
  async query() {
    return [];
  }
});

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
});

test('query - if the cache is VALID, cached data are returned', async function(assert) {
  const queryArgs = ['user', { admin: true }];
  const prospector = this.subject({
    store: storeMock.create({})
  });

  const cachedData = [1, 2];
  prospector._saveToCache('user', null, { admin: true }, cachedData);

  const data = await prospector.query(...queryArgs);
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
});

test('query - if the cache has not enough includedData, store.query is called with ONLY NECESSARY relationships', async function(assert) {
  assert.expect(1);

  const queryArgs = ['user', { admin: true, include: ['roles', 'comments'] }];
  const prospector = this.subject({
    store: storeMock.create({
      async query(modelName, query) {
        assert.deepEqual(query, { admin: true, include: 'roles' }, 'Only roles are being included, comments were loaded previously');
      }
    })
  });

  const cachedData = [1, 2];
  prospector._saveToCache('user', null, { admin: true, include: ['comments'] }, cachedData);

  await prospector.query(...queryArgs);
});

test('query - if the cache IS INVALID, store.query is called with ALL relationships', async function(assert) {
  assert.expect(1);

  // admin: true
  const queryArgs = ['user', { admin: true, include: ['roles', 'comments'] }];
  const prospector = this.subject({
    store: storeMock.create({
      async query(modelName, query) {
        assert.deepEqual(query, { admin: true, include: 'roles,comments' }, 'Only roles are being included, comments were loaded previously');
      }
    })
  });

  const cachedData = [1, 2];
  // admin: false
  prospector._saveToCache('user', null, { admin: false, include: ['comments'] }, cachedData);

  await prospector.query(...queryArgs);
});

test('query - query only with include returns cached data', async function(assert) {
  assert.expect(1);

  const queryArgs = ['user', { include: ['roles', 'comments'] }];
  const prospector = this.subject({
    store: storeMock.create({})
  });

  const cachedData = [1, 2];
  prospector._saveToCache('user', null, { include: ['comments', 'roles'] }, cachedData);
  const data = await prospector.query(...queryArgs);

  assert.deepEqual(data, cachedData, 'cachedData are returned, all included data are available in cache');
});

test('query - query only with include, store.query is called with ONLY NECESSARY relationships', async function(assert) {
  assert.expect(1);

  const queryArgs = ['user', { include: ['roles', 'comments'] }];
  const prospector = this.subject({
    store: storeMock.create({
      async query(modelName, query) {
        assert.deepEqual(query, { include: 'roles' }, 'only roles are being included, comments were included before');
      }
    })
  });

  const cachedData = [1, 2];
  prospector._saveToCache('user', null, { include: ['comments'] }, cachedData);
  await prospector.query(...queryArgs);
});

test('query - data are saved to cache', async function(assert) {
  let n = 0;
  const prospector = this.subject({
    store: storeMock.create({
      async query() {
        return [n++];
      }
    })
  });

  let data = await prospector.query('user', { admin: true });
  assert.deepEqual(data, [0]);
  data = await prospector.query('user', { admin: true });
  assert.deepEqual(data, [0], 'Second call to prospector.query returns cached data');
});

test('query - data are saved to cache - empty query', async function(assert) {
  let n = 0;
  const prospector = this.subject({
    store: storeMock.create({
      async query() {
        return [n++];
      }
    })
  });

  let data = await prospector.query('user', {});
  assert.deepEqual(data, [0]);
  data = await prospector.query('user', {});
  assert.deepEqual(data, [0], 'Second call to prospector.query returns cached data');
});

test('query - data are saved to cache - query only with include 1) [roles] 2) []', async function(assert) {
  let n = 0;
  const prospector = this.subject({
    store: storeMock.create({
      async query() {
        return [n++];
      }
    })
  });

  let data = await prospector.query('user', { include: ['roles'] });
  assert.deepEqual(data, [0]);
  data = await prospector.query('user', { include: [] });
  assert.deepEqual(data, [0], 'Second call to prospector.query returns cached data');
});

test('query - data are saved to cache - query only with include 1) [roles] 2) [roles]', async function(assert) {
  let n = 0;
  const prospector = this.subject({
    store: storeMock.create({
      async query() {
        return [n++];
      }
    })
  });

  let data = await prospector.query('user', { include: ['roles'] });
  assert.deepEqual(data, [0]);
  data = await prospector.query('user', { include: ['roles'] });
  assert.deepEqual(data, [0], 'Second call to prospector.query returns cached data');
});

test('query - data are saved to cache BUT NOT USED - query only with include 1) [roles] 2) [roles, comments]', async function(assert) {
  let n = 0;
  const prospector = this.subject({
    store: storeMock.create({
      async query() {
        return [n++];
      }
    })
  });

  let data = await prospector.query('user', { include: ['roles'] });
  assert.deepEqual(data, [0]);
  data = await prospector.query('user', { include: ['roles', 'comments'] });
  assert.deepEqual(data, [1], 'Second call to prospector.query DOES NOT return cached data (not available included data)');
  data = await prospector.query('user', { include: ['comments'] });
  assert.deepEqual(data, [1], 'Third call to prospector.query (with sufficient include) returns cached data');
});

test('isCacheValid - false', async function(assert) {
  const prospector = this.subject({});

  assert.equal(prospector._isCacheValid(null, {}), false);
  assert.equal(prospector._isCacheValid({ alreadyIncluded: [] }, { include: ['roles'] }), false);
  assert.equal(prospector._isCacheValid({ alreadyIncluded: ['roles'] }, { include: ['roles', 'comments'] }), false);
  assert.equal(prospector._isCacheValid({ alreadyIncluded: ['threads'] }, { include: ['roles'] }), false);
});

test('isCacheValid - true', async function(assert) {
  const prospector = this.subject({});

  assert.equal(prospector._isCacheValid({ alreadyIncluded: [] }, { include: [] }), true);
  assert.equal(prospector._isCacheValid({ alreadyIncluded: ['roles'] }, { include: [] }), true);
  assert.equal(prospector._isCacheValid({ alreadyIncluded: ['roles', 'comments'] }, { include: ['roles'] }), true);
});

test('trimInclude', async function(assert) {
  const prospector = this.subject({});

  assert.deepEqual(prospector._trimInclude({ alreadyIncluded: [] }, []), []);
  assert.deepEqual(prospector._trimInclude({ alreadyIncluded: ['roles', 'comments'] }, ['comments', 'roles']), []);
  assert.deepEqual(prospector._trimInclude({ alreadyIncluded: ['roles', 'comments', 'threads'] }, ['comments', 'roles']), []);
  assert.deepEqual(prospector._trimInclude({ alreadyIncluded: ['comments', 'threads'] }, ['comments', 'roles']), ['roles']);
  assert.deepEqual(prospector._trimInclude({ alreadyIncluded: [] }, ['comments', 'roles']), ['comments', 'roles']);
});

import { moduleFor, test } from 'ember-qunit';
import EmberObject from '@ember/object';

moduleFor('service:prospector', 'Unit | Service | prospector - findRecord', {
});

const storeMock = EmberObject.extend({
  async query() {
    return [];
  }
});

test('findRecord - underlying store.findRecord is called when theres no cache', async function(assert) {
  const queryArgs = ['user', 1];

  const prospector = this.subject({
    store: storeMock.create({
      async findRecord(modelName, id) {
        assert.equal(modelName, queryArgs[0], 'modelName has been passed to query');
        assert.deepEqual(id, queryArgs[1], 'id has been passed to query');
      }
    })
  });

  await prospector.findRecord(...queryArgs);
});

test('findRecord - include from adapterOptions can be used', async function(assert) { 
  const queryArgs = ['user', 1, { adapterOptions: {
    query: {
      include: [1]
    }
  }}];

  const prospector = this.subject({
    store: storeMock.create({
      async findRecord(modelName, id, options) {
        assert.deepEqual(options, {
          adapterOptions: {
            query: {
              include: '1'
            }
          }
        }, 'options has been passed to query');
      }
    })
  });

  await prospector.findRecord(...queryArgs);
});

test('findRecord - if the cache is VALID, cached data are returned', async function(assert) {
  const queryArgs = ['user', 1];
  const prospector = this.subject({
    store: storeMock.create({})
  });

  const cachedData = { id: 1 };
  prospector._cacheLayer.saveToCache('user', 1, {}, cachedData);

  const data = await prospector.findRecord(...queryArgs);
  assert.deepEqual(data, cachedData, 'cached data are returned');
});


test('findRecord - if the cache has not enough includedData, store.findRecord is called with ONLY NECESSARY relationships', async function(assert) {
  assert.expect(1);

  const queryArgs = ['user', 1, { include: ['roles', 'comments'] }];
  const prospector = this.subject({
    store: storeMock.create({
      async findRecord(modelName, id, options) {
        assert.deepEqual(options.include, 'roles', 'Only roles are being included, comments were loaded previously');
      }
    })
  });

  const cachedData = { id: 1 };
  prospector._cacheLayer.saveToCache('user', 1, { include: ['comments'] }, cachedData);

  await prospector.findRecord(...queryArgs);
});

test('findRecord - data are saved to cache', async function(assert) {
  let n = 0;
  const prospector = this.subject({
    store: storeMock.create({
      async findRecord() {
        return [n++];
      }
    })
  });

  let data = await prospector.findRecord('user', 1);
  assert.deepEqual(data, [0]);
  data = await prospector.findRecord('user', 1);
  assert.deepEqual(data, [0], 'Second call to prospector.findRecord returns cached data');
});

test('findRecord - data are saved to cache - with include', async function(assert) {
  let n = 0;
  const prospector = this.subject({
    store: storeMock.create({
      async findRecord() {
        return [n++];
      }
    })
  });

  let data = await prospector.findRecord('user', 1, { include: ['roles'] });
  assert.deepEqual(data, [0]);
  data = await prospector.findRecord('user', 1, { include: 'roles' });
  assert.deepEqual(data, [0], 'Second call to prospector.findRecord returns cached data');
});

test('findRecord - data are saved to cache - with include', async function(assert) {
  let n = 0;
  const prospector = this.subject({
    store: storeMock.create({
      async findRecord() {
        return [n++];
      }
    })
  });

  let data = await prospector.findRecord('user', 1, { include: ['roles'] });
  assert.deepEqual(data, [0]);
  data = await prospector.findRecord('user', 1, { include: 'roles' });
  assert.deepEqual(data, [0], 'Second call to prospector.findRecord returns cached data');
});


test('findRecord - data are saved to cache BUT NOT USED - query only with include 1) [roles] 2) [roles, comments]', async function(assert) {
  let n = 0;
  const prospector = this.subject({
    store: storeMock.create({
      async findRecord() {
        return [n++];
      }
    })
  });

  let data = await prospector.findRecord('user', 1, { include: ['roles'] });
  assert.deepEqual(data, [0]);
  data = await prospector.findRecord('user', 1, { include: ['roles', 'comments'] });
  assert.deepEqual(data, [1], 'Second call to prospector.findRecord DOES NOT return cached data (not available included data)');
  data = await prospector.findRecord('user', 1, { include: ['comments'] });
  assert.deepEqual(data, [1], 'Third call to prospector.findRecord (with sufficient include) returns cached data');
});

test('shouldCreateFindRecordCacheFromQuery: true => findRecord can return a cached model after prospect.query call', async function(assert) {
  const prospector = this.subject({
    shouldCreateFindRecordCacheFromQuery: () => true,
    store: storeMock.create({
      async query() {
        return [{ id: 1 }, { id: 2 }];
      }
    })
  });

  await prospector.query('user', { include: ['roles'] });
  const firstUser = await prospector.findRecord('user', 1, { include: ['roles'] });
  assert.deepEqual(firstUser, { id: 1 } , 'calling findRecord will return data from cache that was created by store.query');
});

test('shouldCreateFindRecordCacheFromQuery: false => findRecord WILL NOT return a cached model after prospect.query call', async function(assert) {
  const prospector = this.subject({
    shouldCreateFindRecordCacheFromQuery: () => false,
    store: storeMock.create({
      async query() {
        return [{ id: 1 }, { id: 2 }];
      },

      async findRecord() {
        return { id: 1, new: true };
      }
    })
  });

  await prospector.query('user', { include: ['roles'] });
  const firstUser = await prospector.findRecord('user', 1, { include: ['roles'] });
  assert.deepEqual(firstUser, { id: 1, new: true } , 'calling findRecord will not used cached model from query, it will request a new one');
});

test('shouldCreateFindRecordCacheFromQuery: true => findRecord will make a request if theres not enough included data', async function(assert) {
  const prospector = this.subject({
    shouldCreateFindRecordCacheFromQuery: () => true,
    store: storeMock.create({
      async query() {
        return [{ id: 1 }, { id: 2 }];
      },

      async findRecord(modelName, id, options) {
        assert.equal(options.include, 'comments', 'roles dont need to be included, only comments');
        return { id: 1, new: true };
      }
    })
  });

  await prospector.query('user', { include: ['roles'] });
  const firstUser = await prospector.findRecord('user', 1, { include: ['roles', 'comments'] });
  assert.deepEqual(firstUser, { id: 1, new: true } , 'calling findRecord will not used cached model from query, it will request a new one');
});

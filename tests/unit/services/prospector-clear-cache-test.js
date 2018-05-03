import { moduleFor, test } from 'ember-qunit';
import { A } from '@ember/array';

moduleFor('service:prospector', 'Unit | Service | prospector - findRecord', {
});

function createFakeModel(modelName, id) {
  return {
    id,
    _internalModel: { modelName, id },
    async destroyRecord() {
    },
    unloadRecord() {

    }
  };
}

test('destroyRecord - it removes the model from cache (simple)', async function(assert) {
  const prospector = this.subject({});

  const model = createFakeModel('user', 1);
  prospector._cacheLayer.saveToCache('user', 1, {}, model);

  await prospector.destroyRecord(model);
  assert.notOk(prospector._cacheLayer.findInCache('user', 1), 'The cache for user with id 1 does not exist anymore');
});

test('unloadRecord - it removes the model from cache (simple)', async function(assert) {
  const prospector = this.subject({});

  const model = createFakeModel('user', 1);
  prospector._cacheLayer.saveToCache('user', 1, {}, model);

  prospector.unloadRecord(model);
  assert.notOk(prospector._cacheLayer.findInCache('user', 1), 'The cache for user with id 1 does not exist anymore');
});

test('destroyRecord - it removes the model from cache (advanced - removing from queries)', async function(assert) {
  const model = createFakeModel('user', 1);
  const prospector = this.subject({
    store: {
      async query() {
        return A([model]);
      }
    }
  });

  const queryData = await prospector.query('user', { admin: true });
  assert.deepEqual(queryData, [model], 'the query method returns the fake model inside an array');
  await prospector.destroyRecord(model);
  assert.deepEqual(queryData, [], 'after destroyRecord, the model was removed from the query cache');
});

test('unloadRecord - it removes the model from cache (advanced - removing from queries)', async function(assert) {
  const model = createFakeModel('user', 1);
  const prospector = this.subject({
    store: {
      async query() {
        return A([model]);
      }
    }
  });

  const queryData = await prospector.query('user', { admin: true });
  assert.deepEqual(queryData, [model], 'the query method returns the fake model inside an array');
  prospector.unloadRecord(model);
  assert.deepEqual(queryData, [], 'after destroyRecord, the model was removed from the query cache');
});

import { moduleFor, test } from 'ember-qunit';
import EmberObject from '@ember/object';
import { createFakeModel } from './prospector-clear-cache-test';

moduleFor('service:prospector', 'Unit | Service | prospector - lazyFindRecord', {
});

test('lazyFindRecord - nothing in cache, it fires a request with all the includes', async function(assert) { 
  const prospector = this.subject({
    store: EmberObject.create({
      async findRecord(modelName, id, options) {
        assert.equal(modelName, 'user', 'modelName has been passed to store.findRecord');
        assert.equal(id, 1, 'id has been passed to store.findRecord');
        assert.deepEqual(options, { include: 'roles,comments' }, 'options have been passed to store.findRecord');
        return EmberObject.create({});
      }
    })
  });

  prospector.lazyFindRecord('user', 1, {
    include: ['roles', 'comments']
  });
});

test('lazyFindRecord - it returns a hash of promises', async function(assert) {
  let assertOptions = false;
  const prospector = this.subject({
    store: EmberObject.create({
      async findRecord(modelName, id, options) {
        if (assertOptions) {
          assert.deepEqual(options, { include: 'roles,comments' });
        }

        return createFakeModel('user', id, {
          comments: 'lazy loaded comments',
          roles: 'lazy loaded roles'
        });
      }
    })
  });

  const userFromFindRecordRequest = await prospector.findRecord('user', 1);
  assertOptions = true;
  const modelHash =  prospector.lazyFindRecord('user', 1, {
    include: ['roles', 'comments']
  });

  assert.ok(modelHash.user.then, 'user promise is present on model hash');
  assert.ok(modelHash.comments.then, 'comments promise is present on model hash');
  assert.ok(modelHash.roles.then, 'roles promise is present on model hash');

  const user = await modelHash.user;
  const comments = await modelHash.comments;
  const roles = await modelHash.roles;

  assert.equal(user, userFromFindRecordRequest);
  assert.equal(comments, 'lazy loaded comments');
  assert.equal(roles, 'lazy loaded roles');
});

test('lazyFindRecord - query + lazyFindRecord + shouldCreateFindRecordCacheFromQuery => true - comments loaded in previous request', async function(assert) {
  const prospector = this.subject({
    shouldCreateFindRecordCacheFromQuery: () => true,
    store: {
      async query() {
        return [createFakeModel('user', 1, {
          comments: 'comments from query',
          roles: 'roles from query'
        })];
      },

      async findRecord(modelName, id, options) {
        assert.deepEqual(options, { include: 'roles' }, 'only roles are being included in findRecord, comments were previously included in query request');

        return createFakeModel('user', id, {
          comments: 'lazy loaded comments',
          roles: 'lazy loaded roles'
        });
      }
    }
  });

  const [userFromQuery] = await prospector.query('user', { include: ['comments'] });
  const modelHash =  prospector.lazyFindRecord('user', 1, {
    include: ['roles', 'comments']
  });

  const user = await modelHash.user;
  const comments = await modelHash.comments;
  const roles = await modelHash.roles;

  assert.equal(user, userFromQuery);
  assert.equal(comments, 'comments from query');
  assert.equal(roles, 'lazy loaded roles');
});

test('lazyFindRecord - query + lazyFindRecord + shouldCreateFindRecordCacheFromQuery => true - all data available from previous request', async function(assert) {
  const prospector = this.subject({
    shouldCreateFindRecordCacheFromQuery: () => true,
    store: {
      async query() {
        return [createFakeModel('user', 1, {
          comments: 'comments from query',
          roles: 'roles from query'
        })];
      },

      async findRecord(modelName, id, options) {
        assert.deepEqual(options, { include: 'roles' }, 'only roles are being included in findRecord, comments were previously included in query request');

        return createFakeModel('user', id, {
          comments: 'lazy loaded comments',
          roles: 'lazy loaded roles'
        });
      }
    }
  });

  const [userFromQuery] = await prospector.query('user', { include: ['comments', 'roles'] });
  const modelHash =  prospector.lazyFindRecord('user', 1, {
    include: ['roles', 'comments']
  });

  const user = await modelHash.user;
  const comments = await modelHash.comments;
  const roles = await modelHash.roles;

  assert.equal(user, userFromQuery);
  assert.equal(comments, 'comments from query');
  assert.equal(roles, 'roles from query');
});

test('lazyFindRecord - query + lazyFindRecord + shouldCreateFindRecordCacheFromQuery => false', async function(assert) {
  const prospector = this.subject({
    shouldCreateFindRecordCacheFromQuery: () => false,
    store: {
      async query() {
        return [createFakeModel('user', 1, {
          comments: 'comments from query',
          roles: 'roles from query'
        })];
      },

      async findRecord(modelName, id, options) {
        assert.deepEqual(options, { include: 'roles,comments' }, 'all included data are being requested');

        return createFakeModel('user', id, {
          comments: 'lazy loaded comments',
          roles: 'lazy loaded roles'
        });
      }
    }
  });

  const [userFromQuery] = await prospector.query('user', { include: ['comments', 'roles'] });
  const modelHash =  prospector.lazyFindRecord('user', 1, {
    include: ['roles', 'comments']
  });

  const user = await modelHash.user;
  const comments = await modelHash.comments;
  const roles = await modelHash.roles;

  assert.notEqual(user, userFromQuery);
  assert.equal(user.get('id'), 1, 'the right user is returned');
  assert.equal(comments, 'lazy loaded comments');
  assert.equal(roles, 'lazy loaded roles');
});

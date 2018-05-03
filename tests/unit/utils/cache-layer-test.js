import CacheLayer from 'ember-prospector/utils/cache-layer';
import { module, test } from 'qunit';
import { deserializeInclude, serializeInclude } from 'ember-prospector/utils/serializer';

const configHelpers = { deserializeInclude, serializeInclude };

module('Unit | Utility | cache-layer', function() {
  test('isCacheValid - false', async function(assert) {
    const cacheLayer = new CacheLayer(configHelpers);

    assert.equal(cacheLayer.isCacheValid(null, {}), false);
    assert.equal(cacheLayer.isCacheValid({ alreadyIncluded: [] }, { include: ['roles'] }), false);
    assert.equal(cacheLayer.isCacheValid({ alreadyIncluded: ['roles'] }, { include: ['roles', 'comments'] }), false);
    assert.equal(cacheLayer.isCacheValid({ alreadyIncluded: ['threads'] }, { include: ['roles'] }), false);
  });

  test('isCacheValid - true', async function(assert) {
    const cacheLayer = new CacheLayer(configHelpers);

    assert.equal(cacheLayer.isCacheValid({ alreadyIncluded: [] }, { include: [] }), true);
    assert.equal(cacheLayer.isCacheValid({ alreadyIncluded: ['roles'] }, { include: [] }), true);
    assert.equal(cacheLayer.isCacheValid({ alreadyIncluded: ['roles', 'comments'] }, { include: ['roles'] }), true);
  });
});

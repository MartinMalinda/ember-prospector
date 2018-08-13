import EmberRouter from '@ember/routing/router';
import config from './config/environment';
import AddonDocsRouter, { docsRoute } from 'ember-cli-addon-docs/router';

const Router = AddonDocsRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('user', function() {
    this.route('edit');
    this.route('comments');
    this.route('comments-loading');
    this.route('edit-loading');
    this.route('detail', { path: '/:id' });
  });

  docsRoute(this, function() { /* Your docs routes go here */ });
  this.route('docs');
});

export default Router;

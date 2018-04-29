import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('user', function() {
    this.route('edit');
    this.route('comments');
    this.route('comments-loading');
    this.route('edit-loading');
  });
});

export default Router;

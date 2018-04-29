import { Model, hasMany } from 'ember-cli-mirage';

export default Model.extend({
  roles: hasMany(),
  comments: hasMany(),
  threads: hasMany()
});

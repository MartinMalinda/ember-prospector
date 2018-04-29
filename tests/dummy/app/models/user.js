import DS from 'ember-data';

export default DS.Model.extend({
  roles: DS.hasMany(),
  comments: DS.hasMany(),
  threads: DS.hasMany()
});

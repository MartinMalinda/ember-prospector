import { camelize } from '@ember/string';

export function removeLoadedRelationships(model, relationships = []) {
  return relationships.filter(relationship => {
    hasLoadedRelationship(model, relationship);
  });
}

export function hasLoadedRelationship(model, relationship) {
  let context = model;
  return relationship.split('.').every(relationship => {
    const relationshipName = camelize(relationship);
    const reference = context.belongsTo(relationshipName) || context.hasMany(relationshipName);
    if (reference) {
      const relationshipInfo = reference.belongsToRelationship || reference .hasManyRelationship;
      if (relationshipInfo.hasLoaded) {
        context = context.get(relationshipName);
        return true;
      }
    }
  });
}

import { camelize } from '@ember/string';

export function removeLoadedRelationships(model, relationships = []) {
  return relationships.filter(relationship => {
    return !hasLoadedRelationship(model, relationship);
  });
}

function hasLoadedRelationship(model, relationship) {
  let context = model;
  return relationship.split('.').every(relationship => {
    const relationshipName = camelize(relationship);
    const reference = getRelationshipReference(context, relationshipName);
    if (reference) {
      const relationshipInfo = reference.belongsToRelationship || reference .hasManyRelationship;
      if (relationshipInfo.hasLoaded) {
        context = context.get(relationshipName);
        return true;
      }
    }
  });
}

function getRelationshipReference(model, relationshipName) {
  let reference;
  try {
    reference = model.belongsTo(relationshipName);
  } catch (e) {
    // don't do anything if this belongsTo does not exist
  }

  if (!reference) {
    try {
      reference = model.hasMany(relationshipName);
    } catch (e) {
      // don't do anything if this hasMany does not exist
    }
  }

  return reference;
}

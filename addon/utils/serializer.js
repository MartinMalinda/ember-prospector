import { isArray } from '@ember/array';

export function deserializeInclude(include) {
  if (isArray(include)) {
    return include;
  }

  return include && include.split(',') || [];
}

export function serializeInclude(include) {
  if (typeof include === 'string') {
    return include;
  }

  return include.join(',');
}

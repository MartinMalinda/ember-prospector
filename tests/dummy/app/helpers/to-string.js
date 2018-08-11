import { helper } from '@ember/component/helper';
import { isArray } from '@ember/array';

export function toString([value]) {
  if (isArray(value)) {
    const inner = value.map(val => `"${val}"`).join(',');
    return `[${inner}]`;
  }
}

export default helper(toString);

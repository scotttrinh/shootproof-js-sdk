import reduce from 'lodash-es/reduce';
import isObject from 'lodash-es/isObject';
import isUndefined from 'lodash-es/isUndefined';

/* eslint-disable no-param-reassign */

export default function flatten(prefix, obj) {
  return reduce((acc, val, key) => {
    if (isObject(val)) {
      flatten(key, val);
    } else {
      acc[(isUndefined(prefix)) ? key : `${prefix}[${key}]`] = val;
    }
    return acc;
  }, {}, obj);
}

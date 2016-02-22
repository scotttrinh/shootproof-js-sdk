import forEach from '../../node_modules/lodash-es/forEach';
/**
 * Convert a plain JavaScript object into FormData
 *
 * @param obj Object Source object
 * @return FormData FormData
 */
export default function objectToFormData(obj) {
  const fd = new FormData();
  forEach((val, key) => {
    fd.append(key, val);
  }, obj);
  return fd;
}

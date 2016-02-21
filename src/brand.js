import isUndefined from 'lodash-es/isUndefined';
import { makeApiRequest } from './lib';

/**
 * Method to return all active brands for a studio.
 *
 * @return Promise Fetch response
 */
function getBrands() {
  return makeApiRequest({
    method: 'sp.brand.get_list',
  });
}

/**
 * Method to return data on a single brand.
 *
 * @param brandId Number Brand ID to retrieve for.
 * @return Promise Fetch response
 */
function getBrandInfo(brandId) {
  if (isUndefined(brandId)) {
    throw new Error('You must supply a brand ID to retrieve it\'s info.');
  }
  return makeApiRequest({
    method: 'sp.brand.info',
    brand_id: brandId,
  });
}

export {
  getBrands,
  getBrandInfo,
};

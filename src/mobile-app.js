import isUndefined from 'lodash-es/isUndefined';
import { makeApiRequest } from './lib';

/**
* Method to return all active mobile apps for a studio or brand.
*
* If no brand ID is provided, all mobile apps for the studio will be
* returned.  If a brand ID is provided, then only mobile apps within
* that brand will be returned.
*
* @param brandId Number (optional) Brand ID for lookup
* @param page Number Page number
* @return Promise Fetch response
*/
function getMobileApps(brandId, page = 1) {
  const params = {
    method: 'sp.mobile_app.get_list',
    page,
  };
  if (!isUndefined(brandId) && brandId !== '') {
    params.brand_id = brandId;
  }
  return makeApiRequest(params);
}

/**
 * Method to get the photos for a mobile app.
 *
 * @param mobileAppId Number Mobile app ID
 * @return Promise Fetch response
 */
function getMobileAppPhotos(mobileAppId) {
  return makeApiRequest({
    method: 'sp.mobile_app.get_photos',
    mobile_app_id: mobileAppId,
  });
}

export {
  getMobileApps,
  getMobileAppPhotos,
};

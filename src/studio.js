import { makeApiRequest } from './lib';

/**
 * Method to return studio information
 *
 * @return Promise Fetch response
 */
function getStudioInfo() {
  return makeApiRequest({
    method: 'sp.studio.info',
  });
}

/**
 * Method to set a studio setting
 *
 * @param key String Setting name
 * @param val String Setting value
 * @return Promise Fetch response
 */
function setStudioSetting(key, val) {
  return makeApiRequest({
    method: 'sp.studio.set_setting',
    setting_key: key,
    setting_value: val,
  });
}

/**
 * Method to get a studio setting
 *
 * @param key String Setting name
 * @return Promise Fetch response
 */
function getStudioSetting(key) {
  return makeApiRequest({
    method: 'sp.studio.get_setting',
    setting_key: key,
  });
}

export {
  getStudioInfo,
  setStudioSetting,
  getStudioSetting,
};

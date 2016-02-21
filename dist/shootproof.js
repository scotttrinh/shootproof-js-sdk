'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var isEmpty = _interopDefault(require('lodash-es/isEmpty'));
var isUndefined = _interopDefault(require('lodash-es/isUndefined'));
var queryString = _interopDefault(require('query-string'));
var fetch = _interopDefault(require('whatwg-fetch'));
var merge = _interopDefault(require('lodash-es/merge'));
var lodashEs_forEach = require('lodash-es/forEach');

/**
 * Convert a plain JavaScript object into FormData
 *
 * @param obj Object Source object
 * @return FormData FormData
 */
function objectToFormData(obj) {
  var fd = new FormData();
  lodashEs_forEach.forEach(function (val, key) {
    fd.append(key, val);
  }, obj);
  return fd;
}

/**
 * Throw an error for non 2xx status
 *
 * @param response Object Response from whatwg-fetch request
 */
function checkStatus(response) {
  var error = undefined;
  if (response.status >= 300) {
    error = new Error(response.statusText);
    error.response = response;
    throw error;
  } else {
    return response;
  }
}

var accessToken = '';
/**
 * Get access token
 *
 * @return String Access token string
 */
function getAccessToken() {
  return accessToken;
}

var baseEndPoint = 'https://api.shootproof.com/v2';

/**
 * Method to make the request to the API
 *
 * @param params Object Parameters including access token, etc.
 * @param photos Object Photos
 * @return Promise Promise containing JSON. Will throw an
 *   error if the status code is >= 300.
 */
function makeRequest(url) {
  var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  var photos = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  var _params = merge({}, params);
  /* eslint-disable quote-props */
  var headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-WRAPPER': 'js-1.0.0'
  };
  /* eslint-enable quote-props */
  if (!isEmpty(photos)) {
    _params = merge(_params, photos);
  }
  return fetch(url, {
    method: 'POST',
    headers: headers,
    body: objectToFormData(_params)
  }).then(checkStatus).then(function (response) {
    return response.json();
  });
}

/**
 * Wrapper that adds access token to parameters
 *
 * @param params Object Parameters including access token, etc.
 * @param photos Object Photos
 * @return Object JSON response
 */
function makeApiRequest() {
  var params = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
  var photos = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var _params = merge(params, {
    access_token: getAccessToken
  });
  return makeRequest(baseEndPoint, _params, photos);
}

/**
 * Method to return studio information
 *
 * @return Promise Fetch response
 */
function getStudioInfo() {
  return makeApiRequest({
    method: 'sp.studio.info'
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
    setting_value: val
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
    setting_key: key
  });
}



var studio = Object.freeze({
  getStudioInfo: getStudioInfo,
  setStudioSetting: setStudioSetting,
  getStudioSetting: getStudioSetting
});

/**
 * Method to return all open events for a studio
 *
 * @param brandId Number (optional) Brand ID to retrieve list for.
 * @return Promise Fetch response
 */
function getEvents(brandId) {
  var params = {
    method: 'sp.event.get_list'
  };
  if (!isUndefined(brandId)) {
    params.brandId = brandId;
  }
  return makeApiRequest(params);
}

/**
 * Method to create a new event
 *
 * @param name String Event name
 * @param brandId String (optional) Brand ID
 * @param date String (optional) Event date as ISO8601 date string
 * @return Promise Fetch response
 */
function createEvent(name, brandId, date) {
  if (isUndefined(name)) {
    throw new Error('You must set the name for a new event');
  }
  var params = {
    method: 'sp.event.create',
    event_name: name
  };
  if (!isUndefined(brandId)) {
    params.brand_id = brandId;
  }
  if (!isUndefined(date)) {
    params.event_date = date;
  }
  return makeApiRequest(params);
}

/**
 * Method to delete an event
 *
 * @param eventId Number Event ID to delete
 * @return Promise Fetch response
 */
function deleteEvent(eventId) {
  if (isUndefined(eventId)) {
    throw new Error('You must supply an event ID if you wish to delete an event');
  }

  return makeApiRequest({
    method: 'sp.event.delete',
    event_id: eventId
  });
}

/**
 * Method to check if a photo exists in an event
 *
 * @param eventId Number Event ID
 * @param photoFileName String Photo file name
 * @return Promise Fetch response
 */
function photoExistsInEvent(eventId, photoFileName) {
  if (isUndefined(eventId) || isUndefined(photoFileName)) {
    throw new Error('You must provide an event ID and photo filename');
  }
  return makeApiRequest({
    method: 'sp.event.photo_exists',
    event_id: eventId,
    photo_name: photoFileName
  });
}

/**
 * Method to set the event access level and password
 *
 * @param eventId Number Event ID
 * @param accessLevel String Access Level string
 * @param password String (optional) Event password
 * @return Promise Fetch response
 */
function setEventAccessLevel(eventId, accessLevel, password) {
  if (isUndefined(eventId) || isUndefined(accessLevel)) {
    throw new Error('You must define an event ID and an access level');
  }

  var params = {
    method: 'sp.event.set_access_level',
    event_id: eventId,
    access_level: accessLevel
  };

  if (!isEmpty(password)) {
    params.password = password;
  }

  return makeApiRequest(params);
}

/**
 * Method to get photos for an event
 *
 * @param eventId Number Event ID
 * @param page Number Page number
 * @return Promise Fetch response
 */
function getEventPhotos(eventId, page) {
  if (isUndefined(eventId)) {
    throw new Error('You must define an event ID');
  }

  return makeApiRequest({
    method: 'sp.event.get_photos',
    event_id: eventId,
    page: page
  });
}



var event = Object.freeze({
  getEvents: getEvents,
  createEvent: createEvent,
  deleteEvent: deleteEvent,
  photoExistsInEvent: photoExistsInEvent,
  setEventAccessLevel: setEventAccessLevel,
  getEventPhotos: getEventPhotos
});

exports.studio = studio;
exports.event = event;
//# sourceMappingURL=shootproof.js.map
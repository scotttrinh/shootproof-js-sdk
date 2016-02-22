import * as queryString from 'query-string';
import merge from 'lodash-es/merge';
import isEmpty from 'lodash-es/isEmpty';
import { checkStatus, objectToFormData } from './utils';
import { getAccessToken } from './token';

const baseEndPoint = 'https://api.shootproof.com/v2';

/**
 * Method to make the request to the API
 *
 * @param params Object Parameters including access token, etc.
 * @param photos Object Photos
 * @return Promise Promise containing JSON. Will throw an
 *   error if the status code is >= 300.
 */
function makeRequest(url, params = {}, photos = {}) {
  let _params = merge({}, params);
  /* eslint-disable quote-props */
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-WRAPPER': 'js-1.0.0',
  };
  /* eslint-enable quote-props */
  if (!isEmpty(photos)) {
    _params = merge(_params, photos);
  }
  return fetch(url, {
    method: 'POST',
    headers,
    body: objectToFormData(_params),
  })
    .then(checkStatus)
    .then(response => response.json());
}

/**
 * Wrapper that adds access token to parameters
 *
 * @param params Object Parameters including access token, etc.
 * @param photos Object Photos
 * @return Object JSON response
 */
function makeApiRequest(params = {}, photos = {}) {
  const _params = merge(params, {
    access_token: getAccessToken,
  });
  return makeRequest(baseEndPoint, _params, photos);
}

/**
 * Build the URL for the given path and parameters
 *
 * @param path String (optional) The path
 * @param params Object (optional) The query parameters
 * @return String The URL for the given parameters
 */
function getUri(path = '', params = {}) {
  return path + queryString.stringify(params);
}

export {
  makeApiRequest,
  makeRequest,
  getUri,
};

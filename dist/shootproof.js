'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var isEmpty = _interopDefault(require('lodash-es/isEmpty'));
var isUndefined = _interopDefault(require('lodash-es/isUndefined'));
var isArray = _interopDefault(require('lodash-es/isArray'));
var isObject = _interopDefault(require('lodash-es/isObject'));
var map = _interopDefault(require('lodash-es/map'));
var merge = _interopDefault(require('lodash-es/merge'));
var queryString = _interopDefault(require('query-string'));
var reduce = _interopDefault(require('lodash-es/reduce'));
var lodashEs_forEach = require('lodash-es/forEach');

(function (self) {
  'use strict';

  if (self.fetch) {
    return;
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name');
    }
    return name.toLowerCase();
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value;
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function (value, name) {
        this.append(name, value);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function (name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function (name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var list = this.map[name];
    if (!list) {
      list = [];
      this.map[name] = list;
    }
    list.push(value);
  };

  Headers.prototype['delete'] = function (name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function (name) {
    var values = this.map[normalizeName(name)];
    return values ? values[0] : null;
  };

  Headers.prototype.getAll = function (name) {
    return this.map[normalizeName(name)] || [];
  };

  Headers.prototype.has = function (name) {
    return this.map.hasOwnProperty(normalizeName(name));
  };

  Headers.prototype.set = function (name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)];
  };

  Headers.prototype.forEach = function (callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function (name) {
      this.map[name].forEach(function (value) {
        callback.call(thisArg, value, name, this);
      }, this);
    }, this);
  };

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'));
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new Promise(function (resolve, reject) {
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(reader.error);
      };
    });
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    reader.readAsArrayBuffer(blob);
    return fileReaderReady(reader);
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    reader.readAsText(blob);
    return fileReaderReady(reader);
  }

  var support = {
    blob: 'FileReader' in self && 'Blob' in self && function () {
      try {
        new Blob();
        return true;
      } catch (e) {
        return false;
      }
    }(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  };

  function Body() {
    this.bodyUsed = false;

    this._initBody = function (body) {
      this._bodyInit = body;
      if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (!body) {
        this._bodyText = '';
      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
        // Only support ArrayBuffers for POST method.
        // Receiving ArrayBuffers happens via Blobs, instead.
      } else {
          throw new Error('unsupported BodyInit type');
        }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        }
      }
    };

    if (support.blob) {
      this.blob = function () {
        var rejected = consumed(this);
        if (rejected) {
          return rejected;
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob);
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob');
        } else {
          return Promise.resolve(new Blob([this._bodyText]));
        }
      };

      this.arrayBuffer = function () {
        return this.blob().then(readBlobAsArrayBuffer);
      };

      this.text = function () {
        var rejected = consumed(this);
        if (rejected) {
          return rejected;
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob);
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text');
        } else {
          return Promise.resolve(this._bodyText);
        }
      };
    } else {
      this.text = function () {
        var rejected = consumed(this);
        return rejected ? rejected : Promise.resolve(this._bodyText);
      };
    }

    if (support.formData) {
      this.formData = function () {
        return this.text().then(decode);
      };
    }

    this.json = function () {
      return this.text().then(JSON.parse);
    };

    return this;
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method;
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read');
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      if (!body) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = input;
    }

    this.credentials = options.credentials || this.credentials || 'omit';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests');
    }
    this._initBody(body);
  }

  Request.prototype.clone = function () {
    return new Request(this);
  };

  function decode(body) {
    var form = new FormData();
    body.trim().split('&').forEach(function (bytes) {
      if (bytes) {
        var split = bytes.split('=');
        var name = split.shift().replace(/\+/g, ' ');
        var value = split.join('=').replace(/\+/g, ' ');
        form.append(decodeURIComponent(name), decodeURIComponent(value));
      }
    });
    return form;
  }

  function headers(xhr) {
    var head = new Headers();
    var pairs = xhr.getAllResponseHeaders().trim().split('\n');
    pairs.forEach(function (header) {
      var split = header.trim().split(':');
      var key = split.shift().trim();
      var value = split.join(':').trim();
      head.append(key, value);
    });
    return head;
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = options.status;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = options.statusText;
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function () {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    });
  };

  Response.error = function () {
    var response = new Response(null, { status: 0, statusText: '' });
    response.type = 'error';
    return response;
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function (url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code');
    }

    return new Response(null, { status: status, headers: { location: url } });
  };

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function (input, init) {
    return new Promise(function (resolve, reject) {
      var request;
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input;
      } else {
        request = new Request(input, init);
      }

      var xhr = new XMLHttpRequest();

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL;
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL');
        }

        return;
      }

      xhr.onload = function () {
        var status = xhr.status === 1223 ? 204 : xhr.status;
        if (status < 100 || status > 599) {
          reject(new TypeError('Network request failed'));
          return;
        }
        var options = {
          status: status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        };
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options));
      };

      xhr.onerror = function () {
        reject(new TypeError('Network request failed'));
      };

      xhr.open(request.method, request.url, true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob';
      }

      request.headers.forEach(function (value, name) {
        xhr.setRequestHeader(name, value);
      });

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    });
  };
  self.fetch.polyfill = true;
})(typeof self !== 'undefined' ? self : this);

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

/**
 * Method to return the albums for an event
 *
 * @param eventId Number Event ID
 * @return Promise Fetch response
 */
function getEventAlbums(eventId) {
  if (isUndefined(eventId)) {
    throw new Error('The eventId is required to check if a photo exists.');
  }
  return makeApiRequest({
    method: 'sp.album.get_list',
    event_id: eventId
  });
}

/**
 * Method to get the photos for an album
 *
 * @param albumId Number Album ID
 * @param page Number Page number
 * @return Promise Fetch response
 */
function getAlbumPhotos(albumId) {
  var page = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];

  if (isUndefined(albumId)) {
    throw new Error('The eventId is required to check if a photo exists.');
  }
  return makeApiRequest({
    method: 'sp.album.get_photos',
    album_id: albumId,
    page: page
  });
}

/**
 * Method to create a new album in an event
 *
 * @param eventId Number Event ID
 * @param albumName String Album name
 * @param password String (optional) Password
 * @param parentAlbumId Number (optional) Parent album ID
 * @return Promise Fetch response
 */
function createEventAlbum(eventId, albumName, password, parentAlbumId) {
  if (isUndefined(eventId)) {
    throw new Error('The eventId is required to create an album.');
  }
  if (isUndefined(albumName)) {
    throw new Error('The albumName is required to create a new album.');
  }
  return makeApiRequest({
    method: 'sp.album.create',
    event_id: eventId,
    album_name: albumName,
    password: password,
    parent_id: parentAlbumId
  });
}

/**
 * Method to create a move album within an event
 *
 * @param albumId Number Album ID
 * @param parentAlbumId Number (optional) Parent album ID
 * @return Promise Fetch response
 */
function moveEventAlbum(albumId, parentAlbumId) {
  if (isUndefined(albumId)) {
    throw new Error('The albumId is required to move an album.');
  }
  return makeApiRequest({
    method: 'sp.album.move',
    album_id: albumId,
    parent_id: parentAlbumId
  });
}

/**
 * Method to rename an album
 *
 * @param albumId Number Album ID
 * @param albumName String Album name
 * @return Promise Fetch response
 */
function renameEventAlbum(albumId, albumName) {
  if (isUndefined(albumId)) {
    throw new Error('The albumId is required to rename an album.');
  }
  if (isUndefined(albumName)) {
    throw new Error('The albumName is required to create a new album.');
  }
  return makeApiRequest({
    method: 'sp.album.rename',
    album_id: albumId,
    album_name: albumName
  });
}

/**
 * Method to delete an album
 *
 * @param albumId Number Album ID
 * @return Promise Fetch response
 */
function deleteEventAlbum(albumId) {
  if (isUndefined(albumId)) {
    throw new Error('The albumId is required to delete an album.');
  }
  return makeApiRequest({
    method: 'sp.album.delete',
    album_id: albumId
  });
}



var album = Object.freeze({
  getEventAlbums: getEventAlbums,
  getAlbumPhotos: getAlbumPhotos,
  createEventAlbum: createEventAlbum,
  moveEventAlbum: moveEventAlbum,
  renameEventAlbum: renameEventAlbum,
  deleteEventAlbum: deleteEventAlbum
});

/**
 * Method to delete a photo from an event
 *
 * @param photoId Number Photo ID
 * @return Promise Fetch response
 */
function deletePhoto(photoId) {
  if (isUndefined(photoId)) {
    throw new Error('The photoId is required to delete a photo.');
  }
  return makeApiRequest({
    method: 'sp.photo.delete',
    photo_id: photoId
  });
}



var photo = Object.freeze({
  deletePhoto: deletePhoto
});

/**
* Method to get the list of orders for a studio
*
* @param page Number Page number
* @return Promise Fetch response
*/
function getOrderList() {
  var page = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

  return makeApiRequest({
    method: 'sp.order.get_list',
    page: page
  });
}

/**
 * Method to get the details for an order
 *
 * @param orderId Number Order ID
 * @return Promise Fetch response
 */
function getOrderDetails(orderId) {
  if (isUndefined(orderId)) {
    throw new Error('The orderId is required to get the details or an order.');
  }
  return makeApiRequest({
    method: 'sp.order.get_details',
    order_id: orderId
  });
}



var order = Object.freeze({
  getOrderList: getOrderList,
  getOrderDetails: getOrderDetails
});

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
function getMobileApps(brandId) {
  var page = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];

  var params = {
    method: 'sp.mobile_app.get_list',
    page: page
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
    mobile_app_id: mobileAppId
  });
}



var mobileApp = Object.freeze({
  getMobileApps: getMobileApps,
  getMobileAppPhotos: getMobileAppPhotos
});

/**
 * Method to return all active brands for a studio.
 *
 * @return Promise Fetch response
 */
function getBrands() {
  return makeApiRequest({
    method: 'sp.brand.get_list'
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
    brand_id: brandId
  });
}



var brand = Object.freeze({
  getBrands: getBrands,
  getBrandInfo: getBrandInfo
});

/* eslint-disable no-param-reassign */

function flatten(prefix, obj) {
  return reduce(function (acc, val, key) {
    if (isObject(val)) {
      flatten(key, val);
    } else {
      acc[isUndefined(prefix) ? key : prefix + '[' + key + ']'] = val;
    }
    return acc;
  }, {}, obj);
}

/**
 * Method to return data on a single contact.
 *
 * @param contactId Number Contact ID to retrieve for.
 * @return Promise Fetch response
 */
function getContactInfo(contactId) {
  if (isUndefined(contactId)) {
    throw new Error('You must supply the ID for the contact.');
  }
  return makeApiRequest({
    method: 'sp.contact.info',
    contact_id: contactId
  });
}

/**
 * Method to create a new contact.
 *
 * Supported key-value pairs:
 *
 *     brand_id
 *     first_name (required)
 *     last_name
 *     email (required)
 *     phone
 *     business_name
 *     notes
 *     tags (string of tags, separated by commas)
 *     address (object)
 *         address_1
 *         address_2
 *         city
 *         state
 *         state_other
 *         country (required if address is provided)
 *         zip_postal
 *
 * @param contactData Object Object containing contact info
 * @return Promise Fetch response
 */
function createContact(contactData) {
  var params = merge({ method: 'sp.contact.create' }, flatten(contactData));
  return makeApiRequest(params);
}

/**
 * Method to update an existing contact.
 *
 * Supported key-value pairs:
 *
 *     brand_id
 *     first_name (required)
 *     last_name
 *     email (required)
 *     phone
 *     business_name
 *     notes
 *     tags (string of tags, separated by commas)
 *     address (object. set null to remove)
 *         address_1
 *         address_2
 *         city
 *         state
 *         state_other
 *         country (required if address is provided)
 *         zip_postal
 *
 * @param contactId Number Contact ID
 * @param contactData Object Object of contact data.
 * @return Promise Fetch response
 */
function updateContact(contactId, contactData) {
  var params = merge({
    method: 'sp.contact.create',
    contact_id: contactId
  }, flatten(contactData));
  return makeApiRequest(params);
}

/**
 * Method to create a multiple contacts in bulk.
 *
 * Must be an Array of Objects.  The same key-value pairs
 * in `createContact` are supported in the inner objects.
 *
 * @param contacts Array Array of contact objects
 * @return Promise Fetch response
 */
function bulkCreateContacts(contacts) {
  if (isUndefined(contacts) || !isArray(contacts) || contacts.length === 0 || !isObject(contacts[1])) {
    throw new Error('Must supply an array of contact objects');
  }
  return makeApiRequest({
    method: 'sp.contact.bulk_create',
    contacts: map(contacts, flatten)
  });
}

/**
 * Method to delete a contact.
 *
 * @param contactId Number Contact ID
 * @return Promise Fetch response
 */
function deleteContact(contactId) {
  if (isUndefined(contactId)) {
    throw new Error('The contactId is required to delete a contact.');
  }
  return makeApiRequest({
    method: 'sp.contact.delete',
    contact_id: contactId
  });
}



var contact = Object.freeze({
  getContactInfo: getContactInfo,
  createContact: createContact,
  updateContact: updateContact,
  bulkCreateContacts: bulkCreateContacts,
  deleteContact: deleteContact
});

exports.studio = studio;
exports.event = event;
exports.album = album;
exports.photo = photo;
exports.order = order;
exports.mobileApp = mobileApp;
exports.brand = brand;
exports.contact = contact;
//# sourceMappingURL=shootproof.js.map
import isEmpty from 'lodash-es/isEmpty';
import isUndefined from 'lodash-es/isUndefined';
import queryString from 'query-string';
import merge from 'lodash-es/merge';
import { forEach } from 'lodash-es/forEach';

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
  forEach(function (val, key) {
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

export { studio, event };
//# sourceMappingURL=shootproof.es.js.map
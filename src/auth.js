import {
  getUri,
  makeRequest,
} from './lib';
import {
  setAccessToken,
  setRefreshToken,
  getRefreshToken,
} from './token';

let _clientId = '';
let _redirectUri = '';
let _scope = '';
const AUTH_ENDPOINT = 'https://auth.shootproof.com/oauth2/authorization/new';
const TOKEN_ENDPOINT = 'https://auth.shootproof.com/oauth2/authorization/token';

function init(clientId, redirectUri, scope) {
  _clientId = clientId;
  _redirectUri = redirectUri;
  _scope = scope;
}

function getLoginUri() {
  return getUri(AUTH_ENDPOINT, {
    response_type: 'code',
    client_id: _clientId,
    redirect_uri: _redirectUri,
    scope: _scope,
  });
}

function requestAccessToken(code) {
  return makeRequest(TOKEN_ENDPOINT, {
    code,
    grant_type: 'authorization_code',
    client_id: _clientId,
    redirect_uri: _redirectUri,
    scope: _scope,
  })
    .then(res => {
      setAccessToken(res.access_token);
      setRefreshToken(res.refresh_token);
    })
    .catch(err => {
      throw new Error(`There was a problem fetching authorization tokens: ${err}`);
    });
}

function requestAccessTokenRefresh() {
  return makeRequest(TOKEN_ENDPOINT, {
    refresh_token: getRefreshToken(),
    grant_type: 'refresh_token',
    scope: _scope,
  })
    .then(res => {
      setAccessToken(res.access_token);
      setRefreshToken(res.refresh_token);
    })
    .catch(err => {
      throw new Error(`There was a problem refreshing authorization tokens: ${err}`);
    });
}

export {
  init,
  getLoginUri,
  requestAccessToken,
  requestAccessTokenRefresh,
};

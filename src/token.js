let accessToken = '';
let refreshToken = '';

/**
 * Set access token
 *
 * @param token String Token string
 */
function setAccessToken(token) {
  accessToken = token;
}

/**
 * Get access token
 *
 * @return String Access token string
 */
function getAccessToken() {
  return accessToken;
}

/**
 * Set refresh token
 *
 * @param token String Token string
 */
function setRefreshToken(token) {
  refreshToken = token;
}

/**
 * Get refresh token
 *
 * @return String Refresh token string
 */
function getRefreshToken() {
  return refreshToken;
}

export {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
};

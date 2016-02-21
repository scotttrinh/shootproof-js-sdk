/**
 * Throw an error for non 2xx status
 *
 * @param response Object Response from whatwg-fetch request
 */
export default function checkStatus(response) {
  let error;
  if (response.status >= 300) {
    error = new Error(response.statusText);
    error.response = response;
    throw error;
  } else {
    return response;
  }
}

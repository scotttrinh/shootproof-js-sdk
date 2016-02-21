# ShootProof JavaScript SDK
## A work in progress
A JavaScript SDK to interact with the [ShootProof](http://developer.shootproof.com) API.

### Usage
We are using [`whatwg-fetch`](https://www.npmjs.com/package/whatwg-fetch) to support
server-side and client-side Promise-based fetching, which follows the WIP standard work on
native [`fetch`](https://fetch.spec.whatwg.org/). When you call the API, you will get a
Promise which will succeed on a status code less than 300, and throw otherwise. Since the
server only serves JSON, the response object you get from calling any of the API methods
is a parsed JSON response.

### Formats

#### CommonJS
A CommonJS module can be found at `dist/shootproof.js` for use with Node, Webpack or Browserify.

#### ES2015 Modules
If you are using a tool that supports ES2015 modules, such as RollupJS or Babel, you can
use the source at `dist/shootproof.es.js` which exports `studio`, `event`, `album`, `photo`,
`order`, `mobileApp`, `brand`, and `contact` namespaces for interacting with those resources.

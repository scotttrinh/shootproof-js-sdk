import config from './rollup.config';

config.format = 'iife';
config.dest = 'dist/shootproof.js';
config.moduleName = 'shootproof';

export default config;

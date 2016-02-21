import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/shootproof.js',
  sourceMap: true,
  plugins: [
    babel(),
  ],
  format: 'cjs',
  moduleName: 'shootproof',
  dest: 'dist/shootproof.js',
};

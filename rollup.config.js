import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'src/shootproof.js',
  sourceMap: true,
  plugins: [
    nodeResolve({
      jsnext: true,
      main: true,
    }),
    commonjs({
      include: ['node_modules/**'],
      exclude: ['node_modules/lodash-es/**'],
    }),
    babel(),
  ],
  format: 'cjs',
  moduleName: 'shootproof',
  dest: 'dist/shootproof.cjs.js',
};

import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import url from '@rollup/plugin-url';
import html from '@rollup/plugin-html';
import replace from '@rollup/plugin-replace';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import alias from '@rollup/plugin-alias';
import strip from '@rollup/plugin-strip';
import { terser } from 'rollup-plugin-terser';

const isProd = process.env.NODE_ENV === 'production';

export default {
  input: 'pages/index.js',
  output: {
    dir: 'build',
    format: isProd ? 'iife' : 'esm'
  },
  manualChunks(id) {
    if (!isProd && id.includes('node_modules')) {
      return 'vendor';
    }
  },
  watch: {
    chokidar: false,
    exclude: 'node_modules/**'
  },
  plugins: [
    alias({
      entries: [
        { find: "react-dom", replacement: "preact/compat" },
        { find: "react", replacement: "preact/compat" }
      ]
    }),
    isProd ? null : serve({
      contentBase: 'build',
      port: 1234,

      historyApiFallback: true
    }),
    isProd ? null : livereload({
      watch: 'build'
    }),
    html({
      title: 'Autonomous Cars'
    }),
    replace({
      'process.env.NODE_ENV': process.env.NODE_ENV || '"development"'
    }),
    isProd ? replace({
      delimiters: ['', ''],

      [`import "preact/debug";`]: ''
    }) : null,
    isProd ? strip({
      functions: ['assert']
    }) : null,
    replace({
      delimiters: ['' , ''],

      [`var style$1 = style;`]: 'var style$1 = unwrapExports(style);'
    }),
    url({
      limit: 0,
      fileName: '[dirname][name].[hash][extname]',
      include: [
        '**/*.svg',
        '**/*.png',
        '**/*.jpg',
        '**/*.gif',
        '**/*.gltf',
        '**/ffmpeg-worker-mp4.js'
      ]
    }),
    nodeResolve(),
    babel({
      exclude: 'node_modules/**', // only transpile our source code
      babelHelpers: 'bundled'
    }),
    commonjs(),
    json(),
    isProd ? terser() : null
  ].filter(Boolean)
};
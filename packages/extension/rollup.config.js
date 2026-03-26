import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

const isProduction = process.env.NODE_ENV === 'production';

const commonPlugins = [
  replace({
    preventAssignment: true,
    values: {
      'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      'process.env.FEEDBACKER_TEST_MODE': JSON.stringify(process.env.FEEDBACKER_TEST_MODE || ''),
      __VERSION__: JSON.stringify(pkg.version)
    }
  }),
  resolve({ browser: true }),
  commonjs(),
  isProduction && terser()
].filter(Boolean);

export default [
  // Background service worker (ES module — MV3 supports it)
  {
    input: 'src/background/service-worker.ts',
    output: {
      file: 'dist/background/service-worker.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: './tsconfig.json',
        rootDir: './src'
      })
    ]
  },

  // Content script (IIFE — content scripts cannot use ES modules)
  {
    input: 'src/content/content-script.ts',
    output: {
      file: 'dist/content/content-script.js',
      format: 'iife',
      name: 'FeedbackerExtension',
      sourcemap: true
    },
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: './tsconfig.json',
        rootDir: './src'
      })
    ]
  },

  // Detection bridge (IIFE — runs in page context)
  {
    input: 'src/content/detection-bridge.ts',
    output: {
      file: 'dist/content/detection-bridge.js',
      format: 'iife',
      name: 'FeedbackerDetectionBridge',
      sourcemap: true
    },
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: './tsconfig.json',
        rootDir: './src'
      })
    ]
  },

  // Popup script (IIFE)
  {
    input: 'src/popup/popup.ts',
    output: {
      file: 'dist/popup/popup.js',
      format: 'iife',
      name: 'FeedbackerPopup',
      sourcemap: true
    },
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: './tsconfig.json',
        rootDir: './src'
      })
    ]
  }
];

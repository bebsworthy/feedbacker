import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

const isProduction = process.env.NODE_ENV === 'production';

const external = ['react', 'react-dom', 'react/jsx-runtime', 'html2canvas', '@zumer/snapdom'];

const globals = {
  react: 'React',
  'react-dom': 'ReactDOM',
  'react/jsx-runtime': 'React',
  html2canvas: 'html2canvas',
  '@zumer/snapdom': 'SnapDOM'
};

export default [
  // ESM build
  {
    input: 'src/index.ts',
    external,
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      replace({
        preventAssignment: true,
        values: {
          'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
          __VERSION__: JSON.stringify(pkg.version)
        }
      }),
      resolve({
        browser: true
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist',
        rootDir: './src'
      }),
      postcss({
        modules: false, // Disable CSS modules since we're using plain CSS
        extract: false, // Don't extract to separate file
        inject: true, // Inject styles into <head>
        minimize: isProduction,
        sourceMap: true,
        use: ['sass']
      }),
      isProduction &&
        terser({
          compress: {
            drop_console: false, // Keep console for our custom logger
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.debug'], // Only drop direct console calls
            global_defs: {
              'process.env.NODE_ENV': JSON.stringify('production')
            }
          }
        })
    ].filter(Boolean)
  },

  // CommonJS build
  {
    input: 'src/index.ts',
    external,
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      replace({
        preventAssignment: true,
        values: {
          'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
          __VERSION__: JSON.stringify(pkg.version)
        }
      }),
      resolve({
        browser: true
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false, // Already created in ESM build
        declarationMap: false,
        rootDir: './src'
      }),
      postcss({
        modules: false, // Disable CSS modules since we're using plain CSS
        extract: false, // Don't extract to separate file
        inject: true, // Inject styles into <head>
        minimize: isProduction
      }),
      isProduction &&
        terser({
          compress: {
            drop_console: false, // Keep console for our custom logger
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.debug'], // Only drop direct console calls
            global_defs: {
              'process.env.NODE_ENV': JSON.stringify('production')
            }
          }
        })
    ].filter(Boolean)
  },

  // UMD build for browser usage
  {
    input: 'src/index.ts',
    external: ['react', 'react-dom', 'html2canvas', '@zumer/snapdom'],
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'Feedbacker',
      globals,
      sourcemap: true
    },
    plugins: [
      replace({
        preventAssignment: true,
        values: {
          'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
          __VERSION__: JSON.stringify(pkg.version)
        }
      }),
      resolve({
        browser: true
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        rootDir: './src'
      }),
      postcss({
        modules: {
          scopeBehaviour: 'local',
          generateScopedName: 'feedbacker-[local]-[hash:base64:5]'
        },
        extract: false,
        minimize: isProduction,
        inject: true
      }),
      isProduction &&
        terser({
          compress: {
            drop_console: false, // Keep console for our custom logger
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.debug'], // Only drop direct console calls
            global_defs: {
              'process.env.NODE_ENV': JSON.stringify('production')
            }
          }
        })
    ].filter(Boolean)
  }
];

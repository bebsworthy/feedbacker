import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import terser from '@rollup/plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

const external = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'html2canvas'
];

const globals = {
  'react': 'React',
  'react-dom': 'ReactDOM',
  'react/jsx-runtime': 'React',
  'html2canvas': 'html2canvas'
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
        modules: {
          scopeBehaviour: 'local',
          generateScopedName: 'feedbacker-[local]-[hash:base64:5]'
        },
        extract: 'feedbacker.css',
        minimize: isProduction,
        sourceMap: true,
        use: ['sass']
      }),
      isProduction && terser({
        compress: {
          drop_console: true,
          drop_debugger: true
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
      resolve({
        browser: true
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false, // Already created in ESM build
        rootDir: './src'
      }),
      postcss({
        modules: {
          scopeBehaviour: 'local',
          generateScopedName: 'feedbacker-[local]-[hash:base64:5]'
        },
        extract: false, // Don't extract in CJS build
        minimize: isProduction,
        inject: true // Inject CSS into JS
      }),
      isProduction && terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    ].filter(Boolean)
  },
  
  // UMD build for browser usage
  {
    input: 'src/index.ts',
    external: ['react', 'react-dom', 'html2canvas'],
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'Feedbacker',
      globals,
      sourcemap: true
    },
    plugins: [
      resolve({
        browser: true
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
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
      isProduction && terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    ].filter(Boolean)
  }
];
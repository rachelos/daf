import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { ArcoResolver } from 'unplugin-vue-components/resolvers';
import path from 'path';
import compression from 'vite-plugin-compression';

export default defineConfig({
  root: './',
  plugins: [
    vue(),
    Components({
      resolvers: [ArcoResolver()],
    }),
    compression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
    compression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
    },
  },
  build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'esbuild',
      cssMinify: true,
      esbuildOptions: {
        drop: ['console', 'debugger']
      },
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/js/js-[hash].js',
          entryFileNames: 'assets/js/js-[hash].js',
          assetFileNames: 'assets/[ext]/c-[hash].[ext]',
          manualChunks: {
            'vendor': ['vue', 'vue-router', 'pinia'],
          }
        }
      }
    }
});

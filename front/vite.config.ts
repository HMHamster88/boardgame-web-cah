import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import federation from "@originjs/vite-plugin-federation";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'cah-front',
      filename: 'remoteEntry.js',
      exposes: {
        './front': './src/index.ts',
      },
      remoteType: 'commonjs-module',
      shared: {
        'vue': {
          generate: false,
          requiredVersion: "^3.5.34"
        },
        'boardgame-web-common': {
          generate: false
        },
        'cah-back': {

        },
        lodash: {
          generate: false
        },
        '@oruga-ui/oruga-next': {
          generate: false
        }
      }
    })
  ],
  experimental: {
    renderBuiltUrl(filename, { type }) {
      if (type === 'asset' && filename.endsWith('.webp')) {
        console.log('filename', filename)

        return { runtime: `new URL('${filename.replace(/^assets\//, "")}', import.meta.url).href` };
      }
      return { relative: true };
    }
  },
  build: {
    target: 'esnext',
    minify: false,
    outDir: './dist',
    emptyOutDir: true,
  }
})

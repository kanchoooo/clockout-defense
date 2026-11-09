import { resolve } from 'path'
import { defineConfig } from 'electron-vite'

const shared = { '@shared': resolve('src/shared') }

export default defineConfig({
  main: {
    resolve: { alias: shared }
  },
  preload: {
    resolve: { alias: shared },
    build: { rollupOptions: { input: { game: resolve('src/preload/game.ts') } } }
  },
  renderer: {
    resolve: { alias: { ...shared, '@': resolve('src/renderer/src') } },
    build: { rollupOptions: { input: { index: resolve('src/renderer/index.html') } } }
  }
})

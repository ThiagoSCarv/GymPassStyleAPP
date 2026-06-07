import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  esbuildOptions(options) {
    options.alias = {
      '@': './src',
    }
  },
})

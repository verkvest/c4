import { defineConfig } from 'vite'

// Relative build paths so the Capacitor web view can load the shell.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  resolve: {
    conditions: ['__source', 'import', 'module', 'browser', 'default'],
  },
}))

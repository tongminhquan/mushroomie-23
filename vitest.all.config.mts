import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary', 'html'],
      reportsDirectory: './coverage/all',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/__tests__/**', 'src/test/**', 'src/types/**', 'src/middleware.ts.bak'],
      thresholds: {
        statements: 15,
        branches: 14,
        functions: 13,
        lines: 16,
      },
    },
  },
})

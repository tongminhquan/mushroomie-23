import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    alias: {
      'server-only': fileURLToPath(new URL(
        './node_modules/next/dist/compiled/server-only/empty.js',
        import.meta.url,
      )),
    },
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage/core',
      include: [
        'src/lib/utils.ts',
        'src/lib/avatar.ts',
        'src/lib/url.ts',
        'src/lib/image-url.ts',
        'src/lib/sanitize.ts',
        'src/lib/security.ts',
        'src/lib/game-config.ts',
        'src/lib/game-server.ts',
        'src/lib/order-access.ts',
        'src/lib/post-normalization.ts',
        'src/lib/image-processing.ts',
        'src/lib/email.ts',
        'src/lib/payment/**/*.ts',
        'src/store/**/*.ts',
      ],
      exclude: ['src/lib/payment/types.ts', '**/__tests__/**'],
      thresholds: {
        statements: 75,
        branches: 70,
        functions: 80,
        lines: 75,
      },
    },
  },
})

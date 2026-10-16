import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: [
      'test/**/*.http.test.ts',
      'test/http-bind.test.ts',
      'test/journey-http.test.ts',
      'test/journey-rate.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@mk/matrix-engine': resolve(__dirname, '../../packages/matrix-engine/src/index.ts'),
      '@mk/experience-engine': resolve(__dirname, '../../packages/experience-engine/src/index.ts'),
      '@mk/ikigai-engine': resolve(__dirname, '../../packages/ikigai-engine/src/index.ts'),
    },
  },
});

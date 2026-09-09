import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@mk/matrix-engine': resolve(__dirname, '../matrix-engine/src/index.ts'),
    },
  },
});

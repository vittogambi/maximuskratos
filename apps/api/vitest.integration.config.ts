import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/http-bind.test.ts', 'test/home-board.http.test.ts', 'test/journey-http.test.ts', 'test/journey-rate.test.ts', 'test/realistic-cases.http.test.ts', 'test/accompaniment-contract.http.test.ts', 'test/admin-journey.http.test.ts', 'test/plan-activation.http.test.ts', 'test/plan-achievement.http.test.ts', 'test/intervention-mentalidad.http.test.ts', 'test/intervention-acceptance.http.test.ts', 'test/direction-cycle.http.test.ts', 'test/outcome-cycle.http.test.ts', 'test/product-acceptance-audit.http.test.ts', 'test/plan-design.http.test.ts', 'test/action-review.http.test.ts', 'test/purpose-direction.http.test.ts'],
    fileParallelism: false,
    isolate: true,
    testTimeout: 180_000,
    hookTimeout: 120_000,
  },
  resolve: {
    alias: {
      '@mk/matrix-engine': resolve(__dirname, '../../packages/matrix-engine/src/index.ts'),
      '@mk/experience-engine': resolve(__dirname, '../../packages/experience-engine/src/index.ts'),
      '@mk/ikigai-engine': resolve(__dirname, '../../packages/ikigai-engine/src/index.ts'),
    },
  },
});

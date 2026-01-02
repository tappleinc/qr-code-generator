import { defineConfig } from 'vitest/config';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      'svg-to-raster-converter': join(__dirname, 'src/internal/rendering/svg-to-raster-node.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      'dist/**', // Built output
      '**/browser-e2e.test.ts', // Playwright tests run separately
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'scripts/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'test/',
      ],
    },
  },
});

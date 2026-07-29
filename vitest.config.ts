import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Report on every source file, not just the ones a test happened to
      // import, so an entirely untested module shows up as 0% rather than
      // vanishing from the table.
      all: true,
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      // Floors, not goals. Set just under the current numbers so a drop is
      // caught while ordinary changes are not blocked. The gap to 100% is
      // almost entirely the demo functions each module runs under
      // `require.main === module`.
      thresholds: {
        lines: 68,
        statements: 69,
        branches: 76,
        functions: 69,
      },
    },
  },
});

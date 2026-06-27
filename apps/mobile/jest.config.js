module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '@dwatcher/(.+)': '<rootDir>/../../packages/$1/src',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
};

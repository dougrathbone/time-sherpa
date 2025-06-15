/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'client',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/client/**/__tests__/**/*.{ts,tsx}', '<rootDir>/src/client/**/*.{test,spec}.{ts,tsx}'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/src/test/setup-client.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: {
            jsx: 'react',
          },
        }],
      },
    },
    {
      displayName: 'server',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/server/**/__tests__/**/*.{ts,tsx}', '<rootDir>/src/server/**/*.{test,spec}.{ts,tsx}'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/src/test/setup-server.ts'],
      transform: {
        '^.+\\.tsx?$': 'ts-jest',
      },
    },
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/test/**',
  ],
}; 
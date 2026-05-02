import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/lib/animations$': '<rootDir>/__mocks__/animations.js',
    '^@/(.*)$': '<rootDir>/$1',
    'animejs/lib/anime\\.es\\.js': '<rootDir>/__mocks__/animejs.js',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react-jsx', esModuleInterop: true } }],
  },
  testRegex: '/__tests__/.*\\.(ts|tsx)$',
}

export default config

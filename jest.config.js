const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  testMatch: ['**/*.spec.ts'],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  verbose: true,
};
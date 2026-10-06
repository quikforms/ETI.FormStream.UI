/*
 * Unit tests for the element's logic that does not render — models, builders, controllers, reducers and
 * effects. Components are verified against a running host instead, so no Angular test environment
 * (TestBed) is set up here.
 *
 * Angular and NgRx ship as ES modules only, so they are compiled for Jest like the sources, and the
 * Angular compiler is loaded first because NgRx's injectables are compiled on load.
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  transform: {
    '^.+\\.(ts|mjs|js)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  transformIgnorePatterns: ['node_modules/(?!(@angular|@ngrx)/)'],
  setupFiles: ['@angular/compiler']
};

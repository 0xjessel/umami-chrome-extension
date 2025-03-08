/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    'popup/**/*.js',
    'options/**/*.js',
    'background.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  transform: {
    '^.+\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@babel)/)'
  ],
  moduleFileExtensions: ['js', 'json'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  }
};

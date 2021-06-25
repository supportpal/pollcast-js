module.exports = {
  testEnvironment: "jsdom",
  testMatch: [
    '<rootDir>/test/**/?(*.)(test).{js,jsx,ts,tsx}'
  ],
  transformIgnorePatterns: [
    "node_modules/(?!(laravel-echo)/)",
  ],
  "collectCoverage": true,
  "coverageReporters": ["html", "lcov"],
  "coverageThreshold": {
    "global": {
      "branches": 100,
      "functions": 100,
      "lines": 100,
      "statements": 100
    }
  }
}

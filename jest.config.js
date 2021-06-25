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
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    }
  }
}

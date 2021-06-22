module.exports = {
  testEnvironment: "jsdom",
  testMatch: [
    '<rootDir>/test/**/?(*.)(test).{js,jsx,ts,tsx}'
  ],
  transformIgnorePatterns: [
    "node_modules/(?!(laravel-echo)/)",
  ],
}

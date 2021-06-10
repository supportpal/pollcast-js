module.exports = {
  "plugins": ["jest"],
  env: {
    browser: true,
    es2021: true,
    "jest/globals": true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
  }
}

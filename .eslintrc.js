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
  "parser": "@babel/eslint-parser",
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
  }
}

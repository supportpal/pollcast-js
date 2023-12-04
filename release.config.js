module.exports = {
  debug: true,
  branch: 'master',
  verifyConditions: [
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/github'
  ],
  prepare: [
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/git'
  ],
  publish: [
    '@semantic-release/npm',
    ['@semantic-release/github', {
      assets: [
        { path: 'dist/pollcast.js' },
        { path: 'dist/pollcast.min.js' }
      ]
    }]
  ],
  success: ['@semantic-release/github']
}

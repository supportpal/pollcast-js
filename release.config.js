module.exports = {
  debug: true,
  branch: 'master',
  plugins: [
    ['@semantic-release/commit-analyzer', {
      preset: 'conventionalcommits'
    }],
    ['@semantic-release/release-notes-generator', {
      preset: 'conventionalcommits'
    }],
    '@semantic-release/changelog',
    '@semantic-release/npm',
    {
      path: '@semantic-release/git',
      assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
      message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
    },
    ['@semantic-release/github', {
      assets: [
        { path: 'dist/pollcast.js' },
        { path: 'dist/pollcast.min.js' }
      ]
    }]
  ]
}

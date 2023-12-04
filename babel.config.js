module.exports = {
  plugins: ['@babel/plugin-transform-object-assign'],
  presets: [
    ['@babel/preset-env', { modules: 'auto' }],
    '@babel/preset-typescript'
  ]
}

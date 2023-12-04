const gulp = require('gulp')
const rollup = require('rollup')
const { babel } = require('@rollup/plugin-babel')
const typescript = require('@rollup/plugin-typescript')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const uglify = require('gulp-uglify')
const rename = require('gulp-rename')
const gulpif = require('gulp-if')

const packageJson = require('./package.json')
const version = process.env.VERSION || packageJson.version

const banner = `/*!
* ${packageJson.name} v${version}
* Released under the ${packageJson.license} License.
*/`

const skipMinification = process.argv.includes('--skip-minification')

gulp.task('build', gulp.series(
  () => {
    return rollup.rollup({
      input: 'src/pollcast.ts',
      plugins: [
        nodeResolve(),
        // convert typescript to ecmascript
        typescript(),
        // transpile es6 to es5
        babel({
          babelHelpers: 'bundled',
          extensions: ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts', '.tsx']
        })
      ]
    }).then(bundle => {
      return bundle.write({
        file: './dist/pollcast.js',
        format: 'umd',
        name: 'Pollcast',
        banner
      })
    })
  },
  () => {
    return gulp.src('dist/pollcast.js')
      .pipe(gulpif(!skipMinification, uglify()))
      .pipe(gulpif(!skipMinification, rename('pollcast.min.js')))
      .pipe(gulpif(!skipMinification, gulp.dest('dist')))
  }
))

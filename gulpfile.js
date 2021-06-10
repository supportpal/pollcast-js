const gulp = require('gulp')
const rollup = require('gulp-rollup')
const babel = require('rollup-plugin-babel')
const json = require('@rollup/plugin-json')
const uglify = require('gulp-uglify')
const rename = require('gulp-rename')
const gulpif = require('gulp-if')
const log = require('fancy-log')

const packageJson = require('./package.json')
const version = process.env.VERSION || packageJson.version

const banner = `/*!
* ${packageJson.name} v${version}
* Released under the ${packageJson.license} License.
*/`

const srcScriptFiles = ['src/**/*.js']

const continueOnError = process.argv.includes('--continue-on-error')
const skipMinification = process.argv.includes('--skip-minification')

gulp.task('build', () => {
  return gulp.src(['package.json', ...srcScriptFiles])
    .pipe(rollup({
      plugins: [
        json(),
        babel({
          exclude: 'node_modules/**'
        })
      ],
      input: 'src/pollcast.js',
      output: {
        format: 'umd',
        name: 'Pollcast',
        banner: banner
      },
      // https://github.com/rollup/rollup/issues/2271
      onwarn (warning, rollupWarn) {
        if (warning.code !== 'CIRCULAR_DEPENDENCY') {
          rollupWarn(warning)
        }
      }
    }))
    .on('error', (error) => {
      if (continueOnError) {
        log(error)
      } else {
        throw error
      }
    })
    .pipe(gulp.dest('dist'))
    .pipe(gulpif(!skipMinification, uglify()))
    .pipe(gulpif(!skipMinification, rename('pollcast.min.js')))
    .pipe(gulpif(!skipMinification, gulp.dest('dist')))
})

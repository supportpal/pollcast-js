const gulp = require('gulp'),
    rollup = require('gulp-rollup'),
    babel = require('rollup-plugin-babel'),
    json = require('@rollup/plugin-json'),
    uglify = require('gulp-uglify'),
    rename = require("gulp-rename"),
    gulpif = require('gulp-if');

const packageJson = require('./package.json');
const version = process.env.VERSION || packageJson.version;

const banner = `/*!
* ${packageJson.name} v${version}
* Released under the ${packageJson.license} License.
*/`;

const srcScriptFiles = ['src/**/*.js'];

const continueOnError = process.argv.includes('--continue-on-error');
const skipMinification = process.argv.includes('--skip-minification');

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
            onwarn(warning, rollupWarn) {
                if (warning.code !== 'CIRCULAR_DEPENDENCY') {
                    rollupWarn(warning)
                }
            },
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
        .pipe(gulpif(!skipMinification, gulp.dest('dist')));
});

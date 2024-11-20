import {nodeResolve} from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import {babel} from "@rollup/plugin-babel";
import packageJson from './package.json' assert { type: "json" };

const version = process.env.VERSION || packageJson.version

const banner = `/*!
* ${packageJson.name} v${version}
* Released under the ${packageJson.license} License.
*/`

export default {
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
    ],
    output: [
        {
            file: "dist/pollcast.js",
            format: "umd",
            name: 'Pollcast',
            banner
        },
        {
            file: "dist/pollcast.min.js",
            format: "umd",
            name: 'Pollcast',
            banner,
            sourcemap: true,
            plugins: [(await import('@rollup/plugin-terser')).default()],
        }
    ],
};

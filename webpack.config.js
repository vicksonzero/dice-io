import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pathToPhaser = path.join(__dirname, '/node_modules/phaser/');
const phaser = path.join(pathToPhaser, 'dist/phaser.js');
import TerserPlugin from 'terser-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';


export default {
    entry: {
        bundle: './client-src/client.ts',
        // version: './src/version.js',
    },
    output: {
        path: path.resolve(__dirname, 'client-dist'),
        filename: '[name].js',
    },
    module: {
        rules: [
            {
                test: /\.yml$/i,
                loader: 'raw-loader',
            },
            { test: /\.ts$/, loader: 'ts-loader', exclude: '/node_modules/' },
            {
                test: /phaser\.js$/,
                use: [
                    {
                        loader: 'expose-loader',
                        options: {
                            exposes: {
                                globalName: 'Phaser',
                                override: true
                            },
                        }
                    }
                ],
            },
            {
                test: /\.json$/,
                loader: 'json-loader',
                // exclude: '/node_modules/',
                include: path.resolve('.')
            },
            // {
            //     test: /\.ya?ml$/,
            //     include: path.resolve('.'),
            //     loader: 'yaml-loader',
            // }
        ],
    },
    devServer: {
        static: [{
            directory: path.resolve(__dirname, '.'), // serves files not built from webpack
            // // Can be:
            // // serveIndex: {} (options for the `serveIndex` option you can find https://github.com/expressjs/serve-index)
            // serveIndex: true,
            // // Can be:
            // // watch: {} (options for the `watch` option you can find https://github.com/paulmillr/chokidar)
            // watch: true,
        },
        {
            directory: path.resolve(__dirname, '.'), // serves files not built from webpack
            publicPath: '/client-dist', // webpack builds files into RAM, and serves in this path (overrides actual folders)
            // // Can be:
            // // serveIndex: {} (options for the `serveIndex` option you can find https://github.com/expressjs/serve-index)
            // serveIndex: true,
            // // Can be:
            // // watch: {} (options for the `watch` option you can find https://github.com/paulmillr/chokidar)
            // watch: true,
        },
        ],
        host: '127.0.0.1',
        port: 8080,
        open: true,
    },
    resolve: {
        extensions: ['.ts', '.js', '.yml'],
        alias: {
            phaser: phaser
        }
    },
    optimization: {
        minimize: false,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    // ecma: undefined,
                    // warnings: false,
                    // parse: {},
                    // compress: {},
                    mangle: true, // Note `mangle.properties` is `false` by default.
                    // module: false,
                    sourceMap: true,
                    output: { comments: false },
                    // toplevel: false,
                    // nameCache: null,
                    // ie8: false,
                    // keep_classnames: undefined,
                    // keep_fnames: false,
                    // safari10: false,
                },
            }),
        ],
        usedExports: true,
    },
    plugins: [
        // new CopyPlugin([
        //     { from: '*.html', context: 'client-src/' },
        //     { from: '**/*.css', context: 'client-src/' },
        // ])
    ],
};

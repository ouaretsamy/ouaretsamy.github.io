const path = require("path")
// both have same results 
// webpack built-in optimization is close to both results
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
    return {
        mode: "development",
        entry: path.join(__dirname, "/src/js/index.js"),
        optimization: {
            // minimizer: [new UglifyJsPlugin()],
            minimizer: [new TerserPlugin()],
        },
        output: {
            filename: "bundle.js",
            path: path.join(__dirname, "/public/build/js/"),
            publicPath: '/'
        },
        module: {
            rules: [
                {
                    test: /.js|jsx$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            "presets": [
                                "@babel/env",
                                "@babel/react"
                            ]
                        }
                    },
                },
                {
                    test: /\.css$/i,
                    use: [
                        'style-loader',
                        'css-loader'
                    ],
                }
            ]
        },
    }
}
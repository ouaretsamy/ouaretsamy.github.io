module.exports = (options) => {
    let isDevMode = options.env.includes('dev');

    if (!isDevMode && !options.env.includes('prod') > -1) {
        throw Error('invalid mode provided');
    }
    let plugins = [
        require('tailwindcss'),
        require('autoprefixer')
    ];
    if (!isDevMode) {
        plugins.push(
            require('@fullhuman/postcss-purgecss')({
                content: [
                    './src/js/**/*.js',
                    './src/js/*.js',
                    './eleventy/*.njk',
                    './eleventy/*.liquid',
                    './eleventy/*.md',
                    './eleventy/**/*.njk',
                    './eleventy/**/*.liquid',
                    './eleventy/**/*.md',
                ],
                defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
            }),
            require('cssnano')({
                preset: ['default', {
                    discardComments: {
                        removeAll: true,
                    },
                }]
            })
        );
    }
    return {
        plugins: plugins
    }
}
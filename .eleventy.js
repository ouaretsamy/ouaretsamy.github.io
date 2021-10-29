const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const { DateTime } = require("luxon");
// use my markdown library to parse markdown an not depend on liquid
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const CleanCSS = require("clean-css");
const path = require('path');
const fs = require('fs');

module.exports = function (eleventyConfig) {

    eleventyConfig.setLiquidOptions({
        dynamicPartials: true
    });
    // variables will be parsed inside permalink string
    eleventyConfig.setDynamicPermalinks(true);
    // merge local data and global data ,default local ovverdie global data
    eleventyConfig.setDataDeepMerge(true);
    // add syntax parser and highlighter form markdown 
    eleventyConfig.addPlugin(pluginSyntaxHighlight);
    // add plugin to build rss feed
    eleventyConfig.addPlugin(pluginRss);
    // eleventyConfig.addPlugin(pluginNavigation);
    // when changing input must specify input directory when copying files ** eleventy
    eleventyConfig.addPassthroughCopy({ "eleventy/static/images": "static/images" });
    eleventyConfig.addPassthroughCopy({ "eleventy/config/*": "/" });

    // copy projects static files like images and css
    eleventyConfig.addPassthroughCopy({ "eleventy/projects/**/*.jpg": "projects/static" });
    eleventyConfig.addPassthroughCopy({ "eleventy/projects/**/*.png": "projects/static" });
    eleventyConfig.addPassthroughCopy({ "eleventy/projects/**/*.gif": "projects/static" });
    eleventyConfig.addPassthroughCopy({ "eleventy/projects/**/*.css": "projects/static" });
    // copy blog static files like images and css
    eleventyConfig.addPassthroughCopy({ "eleventy/blog/**/*.jpg": "blog/static" });
    eleventyConfig.addPassthroughCopy({ "eleventy/blog/**/*.png": "blog/static" });
    eleventyConfig.addPassthroughCopy({ "eleventy/blog/**/*.gif": "blog/static" });
    eleventyConfig.addPassthroughCopy({ "eleventy/blog/**/*.css": "blog/static" });
    // add markdown parsers
    let options = {
        html: true,
        breaks: false,
        linkify: true
    };
    // combine the two markdown parsers
    let markdownLib = markdownIt(options).use(markdownItAnchor);
    // set the markdown parser
    eleventyConfig.setLibrary("md", markdownLib);

    // Minify CSS
    eleventyConfig.addFilter("cssmin", function (code) {
        return new CleanCSS({}).minify(code).styles;
    });

    eleventyConfig.addFilter("cssminFiles", function (files) {
        let paths = files.map(pathname => {
            return path.join(__dirname, pathname);
        });
        let result = new CleanCSS({}).minify(paths).styles;
        return `<style>${result}</style>`;
    });

    // make feriendly url
    eleventyConfig.addFilter("slugify", function (value) {
        return value.toLowerCase()
            .replace(/_+/g, ' ')
            .replace(/[^\w ]+/g, '')
            .trim("")
            .replace(/ +/g, '-');
    });

    eleventyConfig.addFilter("dump", function (value) {
        console.log(value);
    });

    eleventyConfig.addFilter("is_blog", function (value) {
        return value.includes('/blog');
    });

    eleventyConfig.addNunjucksFilter("top", function (list) {
        return list.reverse().slice(0, 4);
    });

    eleventyConfig.addNunjucksFilter("upper", function (value) {
        return value.toUpperCase();
    });

    eleventyConfig.addFilter("trimSlashes", function (value) {
        return value.replace(/^\/|\/$/g, '');;
    });

    // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
    eleventyConfig.addFilter('htmlDateString', (dateObj) => {
        return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd');
    });

    eleventyConfig.addFilter("readableDate", dateObj => {
        return DateTime.fromJSDate(dateObj, { zone: 'utc+1' }).toFormat("LLL, dd yyyy");
    });
    
    eleventyConfig.addFilter("currentYear", dateObj => {
        return new Date().getUTCFullYear();
    });

    eleventyConfig.addFilter("utcDate", timestamp => {
        return (new Date(timestamp)).toUTCString()
    });

    // add a collection will be accessible form collections.TagList
    eleventyConfig.addCollection("tagList", require("./eleventy/_11ty/getTagList"));
    eleventyConfig.addCollection("topProjects", require("./eleventy/_11ty/getTopProjects"));

    return {
        templateFormats: [
            "md",
            "njk",
            "html",
            "liquid"
        ],
        markdownTemplateEngine: "liquid",
        htmlTemplateEngine: "njk",
        dataTemplateEngine: "njk",

        dir: {
            input: "eleventy",
            includes: "_includes",
            data: "_data",
            output: "public"
        }

    };
};
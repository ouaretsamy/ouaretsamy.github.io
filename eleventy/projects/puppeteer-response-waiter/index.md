---
title : Solving wait for responses problem in puppeteer
date: 2021-09-26
image:
  file: /projects/static/aron-visuals-waiting.jpg
  credit:
    name: Aron Visuals
    link: https://unsplash.com/@aronvisuals

description: Waiting correctly for requests in puppeteer could be tricky, this package ensures waiting for all outgoing requests.
---

## Introduction

This [Package](https://github.com/samyouaret/puppeteer-response-waiter) is useful when you need to wait for all responses to be received to do something like manipulating the DOM. Usually, when you need to **track many requests at once** or some requests are **lately received**, many people find it useful ([almosts 1000 download per week](https://www.npmjs.com/package/puppeteer-response-waiter)).

Some use cases could be **scraping an infinite scroll** page and mostly you do not know which requests to track or to wait for.

It is a simple but powerful package, it may be used even to wait for thousands of requests at once and it guarantees to wait for all responses.

## Quick Tutorial

Using the package is fairly simple, you can install it with `npm` or `yarn` easily:

    npm i puppeteer-response-waiter

To install it with `yarn`

    yarn add puppeteer-response-waiter

## Usage

These examples from the documentation demonstrate the basic usage of the package.

```js
const puppeteer = require('puppeteer');
const {ResponseWaiter} = require('puppeteer-response-waiter');

let browser = await puppeteer.launch({ headless: false });
let page = await browser.newPage();
let responseWaiter = new ResponseWaiter(page);
await page.goto('http://somesampleurl.com');
// start listening
responseWaiter.listen();
// do something here to trigger requests
await responseWaiter.wait();
// all requests are finished and responses are all returned back

// remove listeners
responseWaiter.stopListening();
await browser.close();

```

You can even filter the requests to wait for and can control the flow of requests and responses as you want to check correct responses, download responses, files, images...etc.

```js
const puppeteer = require('puppeteer');
const {ResponseWaiter} = require('puppeteer-response-waiter');

let browser = await puppeteer.launch({ headless: false });
let page = await browser.newPage();
let responseWaiter = new ResponseWaiter(page, {
    waitFor: (req) => req.resourceType() == 'fetch',
    // get you response here and do something with it
    onResponse: async (response)=> console.log(await response.json())// do something with response
});
await page.goto('http://somesampleurl.com');
// start listening
responseWaiter.listen();
// do something here to trigger requests
await responseWaiter.wait();
// all requests are finished and responses are all returned back

// remove listeners
responseWaiter.stopListening();
await browser.close();

```

## Conclusion

We showed an overview of the uses cases and some usage examples, the package has some other configurations to work with, for more information check the documentation and repository on [GitHub](https://github.com/samyouaret/puppeteer-response-waiter/) or on [Npm](https://www.npmjs.com/package/puppeteer-response-waiter).
---
title : Facebook image Web Scrapper
date: 2021-09-27
image:
  file: /projects/static/web-scraping.jpg
  credit:
    name: julian Schultz
    link: https://unsplash.com/@jordanharrison
description: Building Facebook image Web Scrapper to get images for plant disease from facebook groups to us in Deep learning.
---

## Introduction

Many data scientists and data-driven businesses struggle hard to gather data efficiently to enable their businesses and researches. No wonder social media are one of the major sources of data, while many people find a great value in gathering human-related data(like comments, reactions), Our case is a little different, we need images to enable Deep learning.

Many farmers and people use Facebook groups to share their images about crops disease, these groups are a great resource of data to find crop-related images and data.

**Farmy.ai** is a startup that seeks to develop AI and smart farming solutions to provide farmers with high-quality and rapid diagnoses. The goal is to provide farmers with the right information at the right time so they can make the right decisions. The business essentially relies on the integration of Data and Deep Learning to run its business.

## What is Web Scraping?

Web scraping is a process by which we can collect and store data from websites in order to process it and extract valuable information from it. Typically, we scrap data that is not provided through an API, is only publicly available, and is for which we have access permission, otherwise illegal and ethical issues may arise.
 
Data Scraping can improve data collection. It is a systematic approach to collect large amounts of data. A good investment in data scraping can save a lot of money and resources.

## How does it work?

**Facebook-Web-scraper** That We have built allows for automating of user login, collecting groups posts, processing each post data, and gathering all images(High-resolution images) which is by far the hardest task that took much of the time.

![Facebook web scraper](/projects/static/web-scrapers.svg)

**Facebook-Web-scraper**  uses [Puppeteer](https://pptr.dev/), An open-source Chrome automation tool by google. The process of scraping posts and getting images consists of many steps, picture blow shows the major step to extract posts data and their images.

![Facebook web scraper process](/projects/static/facebook-web-scraper-process.svg)

We are going to explain those steps briefly
1. The first step is to launch the Chrome instance using a command line, this step can work in an authentication mode or without authentication.
2. Start the web scraper, needs to prepare some config, and start navigating posts.
3. Getting posts includes many steps, like loading posts, checking criteria when to stop the scraper(mainly by date).
4. Extract posts data: at this step, we extract dates, links, descriptions, check for images, etc.
5. Resolving images: this is the most complicated step since it involves navigating each post and resolving all images in a high-resolution format.
6. After resolving all images we shutdown the Chrome instance
7. Downloading all images to the web, each image will be saved either to AWS S3 or to a local disk.
8. We also save the extracted data either in disks or AWS S3.

Unfortunately, the Facebook Web scraper is private, We love open source but it is something out of my control. Here is a real demo of the web scraper.

## Challenges

Apparently, Web Scraping is a challenging Task especially from A Big company like **Facebook** that make a tremendous effort to block and track automated scrapers and bots ([See link](https://about.fb.com/news/2021/04/how-we-combat-scraping/)), in most cases the process is the same, but tools may be different Since different Website deploy many defensive tools and mechanisms to discover and block web scrapers.

Some of the main challenges in web scraping is preventing getting blocked by websites, Getting the **complete** and asserting **right** data and not some garbage data, knowing when to stop the scraper and some other considerations like:

1. Keeping the Memory usage as low as possible.
2. byPassing rate limiting, and implementing IP rotating.
3. Getting a high resolution(images have many versions).
4. Implementing a Retry logic, fail the scraper, and start again.

## Conclusion

Implementing web scrapers could be much complex since there are many cases to fail due to the extensive network calls, the website counter-measures, Getting the right data, All these factors are real considerations when implementing a web scraper.


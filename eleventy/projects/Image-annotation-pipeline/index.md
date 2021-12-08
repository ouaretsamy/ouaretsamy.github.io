---
title : Image annotation pipeline
date: 2021-09-26
image:
  file: /projects/static/pipeline.jpg
  credit:
    name: Sigmund
    link: https://unsplash.com/@sigmund
description: Building an image data annotation pipeline for Farmy.ai startup
---

## what is a data pipeline

A data pipeline which is an architecture to organize data-life cycle including data ingestion, data processing, and data storage in series of steps.

## What is data annotation

Data annotation is adding labels and semantics to data so we can use to train machine learning models. It can vary depending on the type of data. For instance, it could image annotation, text annotation, audio annotation, video annotation, etc.

The main power of a high-quality data annotation is accurate human intervention, choosing highly skilled experts in the target domain is critical, for instance, labeling data for sentiment analysis needs skilled psychology specialist.

## Image annotation data pipeline

manages the stages of the annotation process. It helps us reduce the overhead of manual tasks, such as moving images between phases, assigning tasks to annotators, checking completed phases, and finding conflicts in image annotations when exporting them.

![Image annotation pipeline](/projects/static/pipeline_farmy_slide.png)

The data pipeline ingests images with associated metadata into the Data Lake and then loads them for cleanup, starting a new round of image annotation.

The building block of the data pipeline is the Data Lake. The pipeline is well integrated with the data lake, but it is unaware of the Data-Lake architecture and infrastructure.
 
Since we perform data cleansing and annotation in an independent application, the data pipeline connects between the data lake and the annotation application by acting as a producer or consumer of the data lake through its ingestion and query layers.

![Image annotation pipeline](/projects/static/data-pipeline-intergarion-DL.svg)

### Deploying the pipeline to AWS

full architecture of the Farmy Data Lake and data pipeline deployed in the AWS infrastructure. The ingesting layer ingests data from the mobile application, and web scrapers and stores it in AWS S3. A Lambda function listens for events triggered by AWS S3 to update the data catalog, which uses AWS DynamoDB to store the metadata.
 
The query layer provides preconfigured libraries and AWS Athena for searching AWS DynamoDB and AWS S3. The data pipeline is driven by Apache Airflow deployed on an AWS EC2 instance. It uses Data Lake and Label Studio, also deployed on an EC2 instance, to achieve the desired behavior.

![Image annotation pipeline deployment](/projects/static/aws-complete-architercture_final.png)

### tools used

Beside AWS services like S3, Lambda, DynamoDB, EC2, Athena, We use many open source serivces and languages, like Python, NodeJs, Apache Airflow, Label Studio, Docker. 
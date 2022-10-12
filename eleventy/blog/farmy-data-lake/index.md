---
title : Farmy data lake
date: 2021-09-28
image:
  file: /projects/static/data-lake.jpg
  credit:
    name: Dirk Von Loen Wagner
    link: https://unsplash.com/@jordanharrison
description: Building a data lake for farmy.ai Startup
tags : &topics
  - Data engineering
topics : *topics
---

## What is a Data Lake?

A Data Lake is a central repository that stores raw data of different types. It leverages the disk's lower cost advantage, and distributed storage to offload capacities from data warehouses and databases. It can store all types of data without a pre-defined model, so we can use it later.

While the data lake is an abstract concept that Usually uses Object-level storage like S3 or Hadoop as its main storage, but it is more than just a distributed storage.

## Data Lake Architecture

The motivation for choosing a data lake is not only that it is resilient and persistent storage, but also it provides flexibility in terms of the data stored and the type of data. When we ingest data from the **Farmy** data source, we can easily store everything in its original format.
 
Data Lake allows us to essentially not think about the processing required until we need to interact with the data. It allows us to use the on-read schema when dealing with the data. This allows us to run our data processing and pipelines operations multiple times on the same data, which reduces the overhead and effort required to process the data.
 
Since **Farmy** startup depends heavily on Data, The Data Lake is at the heart of its deep learning training. Developing such a system was not a clear path from the start, given the requirements and concerns of developing a robust, scalable, efficient, and extensible system.

![Farmy.ai data lake](/projects/static/complete-Farmy-data-lake-architecture.svg)

### Farmy's Data lake zones

One of the key principles during the architecture process was to divide the data lake into zones. There are three primary zones: the raw data zone, the staging data zone, and the curated data zone. Each zone corresponds to specific use and has a different level of access. 

The **Farmy.ai** Data Lake uses AWS Cloud Simple Storage Service (S3) as its main storage, S3 offers powerful features such as consistency, high scalability, simplicity, lower cost, and robustness without managing servers.

#### Raw data zone

This zone stores only the incoming raw data from the data sources in their native format. Since few know how to handle this raw data, access to this zone is only accessible by engineers and developers, and with limited access (temporary) for cleansing and data annotation applications.

#### Staging data zone

The staging zone stores data ready for processing, intermediate processing results, and some other data under review. Raw data is usually moved to this area or is associated with data stored in this area.

The data pipeline stores temporary data in this zone. Therefore, the staging zone primarily acts as a transition station from the raw data zone to the curated zone. Processing jobs (data cleansing and labeling application) have access to this zone.
  
#### Curated data zone

This area stores the curated data that is ready to consume in experiments, Machine Learning (Deep Learning) training. Hence, this area is accessible for data science, data analysis.

## Data ingestion Layer

The ingestion layer manages data extraction and uploads from **Farmy** data sources and provides a flexible and convenient way to interact with Data Lake. It also validates the ingested data and data sources.

Connectors perform the communication between Data Lake and the data sources. Connectors are mainly reusable libraries that provide an interface for common data ingesting functions.

## Farmy data lake catalog

Over time, as we add more data to the data lake, our data size keeps growing. Since most of the **Farmy** data is unstructured, like images, and the data lake lacks a defined way for searching and retrieval, it becomes really difficult to keep track of all the data stored, we call this problem Data Swamp.

We need a mechanism to overcome this dilemma. **Farmy** data lake maintains a data catalog. The data lake's data catalog is the source of truth that allows us to track all of our data lake's assets and compensate for the lack of structure in the Farmy.ai data.
 
The **Farmy** data catalog is a database that tracks and stores information about all ingested data. It has answers to the actual data stored by storing important metadata about all assets such as data source, data type, and the owner of the data.

The data catalog makes the data lake storage queryable and accessible, it gives **Farmy** a broad overview of the stored data. Usually we call a data catalog within a Data Lake a comprehensive or index data catalog.

### Building the Data Catalog

Most object-storage propagate events during the life cycle of its resident objects (uploaded files). Setting up a handler that listens for triggered events when a file is uploaded or updated allows us to get the metadata of the uploaded objects and add them to the comprehensive catalog, keeping it up to date. Picture blow shows the process of maintaining the **Farmy** comprehensive data lake catalog.

![Farmy.ai data lake](/projects/static/catalog-building.svg)

## Farmy Data lake Query layer

As the data is available, stored securely in our data lake, and the data catalog is up to date, we naturally want to query or process our data sets. The query layer serves these purposes and allows users of varying technical levels to query and explore the data.

The query layer depends on query engines to decouple direct programmatic query and processing access to our data lake.  we can add query and search capabilities to our Data Lake by connecting compatible search services to the Data Lake storage.

The query layer also allows us to enforce and guarantee read-only queries to users or, masking some parts of the data. We can also integrate search and processing tools as needed.

## Conclusion

We have shown how we build a data lake architecture to offload capacity from databases and achieve a low-cost architecture. We showed the importance of a data catalog to track data lake assets, how to maintain and build the data catalog, and what to choose as storage for the data lake.

We have shown how we can create low-coupled and reusable ingestion components that ease the burden of dealing with multiple data sources.

We showed how query engines enable reusability and add search capabilities to our data lake. We then showed how to integrate the data pipeline with the data lake using connectors and query engines.
 
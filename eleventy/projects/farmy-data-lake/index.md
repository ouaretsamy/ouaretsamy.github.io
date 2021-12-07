---
title : Farmy data lake
date: 2021-09-28
image:
  file: /projects/static/data-lake.jpg
  credit:
    name: Dirk Von Loen Wagner
    link: https://unsplash.com/@jordanharrison
description: Building a data lake for farmy.ai
---

## What is a Data Lake?

A Data Lake is a central repository that stores raw data of different types. It leverages the disk's lower cost advantage, and distributed storage to offload capacities from data warehouses and databases. It can store all types of data without a pre-defined model, so we can access it later.

While the data lake is an abstract concept, Usually it uses using an Object level storage like S3, or Hadoop as its main storage, but the data lake is more than just a distributed storage.

## Data Lake Architecture

The motivation for choosing a data lake is not only that it is a resilient and persistent storage, but also that it provides flexibility in terms of the data stored and the type of data. When we ingest data from the **Farmy** data source, we can easily store everything in its original format.
 
Data Lake allows us to essentially not think about the processing required until we need to interact with the data. It allows us to use the on read schema when dealing with the data. This allows us to run our data pipeline multiple times on the same data, reducing the overhead and effort required to process the data.
 
since **Farmy** startup dpends heavily on Data, The Data Lake is at the heart of its deep learning training. Developing such a system was not a clear path from the start, given the requirements and concerns of developing a robust, scalable, efficient, and extensible system.

![Farmy.ai data lake](/projects/static/complete-Farmy-data-lake-architecture.svg)

### Farmy's Data lake zones

Some of the key principles during the architecture process were to divide the data lake into zones. There are three primary zones: the raw data zone, the staging data zone, and the curated data zone. Each zone corresponds to a specific use and has a different level of access. 

The **Farmy.ai** Data Lake uses AWS Cloud Simple Storage Service (S3) as its main storage, a Object-Level storage that offers powerful features such as consistency, high scalability, simplicity, lower cost, and robustness without managing servers.

#### Raw data zone

 This zone stores only the incoming raw data from the data sources in their native format. Since few know how to handle this raw data, access to this zone is only accessible by engineers and developers, and with limited access (temporary) for cleansing and data annotation application.

#### Staging data zone

 The staging zone stores data ready for processing, intermediate processing results, and some other data under review. Raw data is usually moved to this area or is associated with data stored in this area.

 The data pipeline stores temporary data in this zone. Therefore, the staging zone primarily acts as a transition station from the raw data zone to the curated zone. Processing jobs (data cleansing and labeling application) have access to this zone.
  
#### Curated data zone

 This area stores the curated data that is ready to consume in experiments, Machine Learning (Deep Learning) training. Hence, this area is accessible for data science, data analysis.

## Data ingestion Layer

The ingestion layer manages data extraction and uploads from **Farmy** data sources and provides a flexible and convenient way to interact with Data Lake. It also validates the ingested data and data sources.

Connectors perform the communication between Data Lake and the data sources. Connectors are mainly reusable libraries that provide an interface for common data ingesting functions.

## Farmy data lake catalog

Over time, as we add more data to the data lake, and since most **Farmy** data is unstructured, like images, the data lake lacks a defined way for searching and retrieval, and especially after the growth of the stored data, it becomes really difficult to keep track of all the data stored, we call this problem Data Swamp.

We need a mechanism to overcome this dilemma. **Farmy** data lake maintains a data catalog. The data lake's data catalog is the source of truth that allows us to track all of our data lake's assets and compensate for the lack of structure in the Farmy.ai data.
 
The **Farmy** data catalog is a database that tracks and stores information about all ingested data. It has answers to the actual data stored by storing important metadata about all assets such as data source, data type, and owner of the data.

The data catalog makes the data lake storage queryable and accessible, it gives **Farmy** a broad overview of the stored data. Usually we call a data catalog within a Data Lake a comprehensive or index data catalog\cite{Data-Catalogs}.

### Building the Data Catalog

The object storage propagates some events during the life cycle of its resident objects (uploaded files). Setting up a handler that listens for triggered events when a file is uploaded or updated allows us to get the metadata of the uploaded objects and add them to the comprehensive catalog, keeping it up to date. Picture blow shows the process of maintaining the **Farmy** comprehensive data lake catalog.
![Farmy.ai data lake](/projects/static/catalog-building.svg)

## Farmy Data lake Query layer

As the data is available, stored securely in our data lake, and the data catalog is up to date, we naturally want to query or process our data sets. The query layer serves these purposes and allows users of varying technical levels of **Farmy** data lake  to query and explore the data.

The query layer depends on query engines, which function in some ways like connectors but serve a different purpose. They decouple direct programmatic query and processing access to our data lake. Similarly, we can add query and search capabilities to our Data Lake by connecting compatible search services to the Data Lake storage.

The query layer also allows us to enforce and guarantee read-only queries to users or, masking some parts of the data. We can also integrate search and processing tools as needed.

Since we insist that there is no direct interaction with our data lake, we add pre-configured libraries to the data lake storage and data catalog that act as query engines for common queries and help us build and run the data pipeline.
 
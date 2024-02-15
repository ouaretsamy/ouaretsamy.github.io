---
title: Working with Cassandra on AWS keyspace using Terraform and Node.js
date: 2024-01-01
image:
  file: /blog/static/aws-keyspace-terraform.jpg
  credit:
    name: samy ouaret
    link: https://samyouaret.com
  hideOnPost: false
description: In this guide, we will walk you through setting up Apache Cassandra on AWS Keyspaces using Terraform to create tables and keyspaces. We'll also explore how to interact with the tables using the Nodejs driver.
tags : &topics
  - AWS
  - AWS keyspaces
  - Apache Cassandra
  - Terraform
topics : *topics
---

Apache Cassandra is a highly scalable and distributed NoSQL database, and AWS Keyspaces is a managed Cassandra service provided by Amazon Web Services. In this guide, we will walk you through setting up Apache Cassandra on AWS Keyspaces using Terraform to create tables and keyspaces. Additionally, we'll explore how to interact with the tables using the Nodejs driver.

## What is a AWS Keyspaces

Amazon Keyspaces is a fully managed, serverless database service tailored for Apache Cassandra applications on AWS. It offers seamless compatibility with existing Cassandra application code and developer tools, eliminating the need for server management, software installation, and maintenance tasks. This serverless model allows users to pay only for the resources they consume, and the service can dynamically scale tables in response to changing application traffic.

## Setting up the project

We will use Terraform to manage the AWS resources, Terraform must be installed on your machine.

Let's start our project with the AWS provider in the `main.tf` file.

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

data "aws_availability_zones" "available" {}

provider "aws" {
  region = "us-east-1"
}
```

Let's init the terraform project:
```bash
terraform init
```

## Creating a new KeySpace

The first resource we are going to create is a new AWS keySpace with name ```ecommerce_keyspace```.

let's create a new file named `keyspace.tf`.

```hcl
resource "aws_keyspaces_keyspace" "ecommerce_keyspace" {
  name = "ecommerce_keyspace"
}
```

This Terraform configuration includes the creation of the keyspace named ```ecommerce_keyspace``` using ```aws_keyspaces_keyspace``` resource.

### Create our first table

let's create a new `keyspace_table.tf` file with the following terraform code:

```hcl
resource "aws_keyspaces_table" "products_table" {
  table_name    = "products"
  keyspace_name = aws_keyspaces_keyspace.ecommerce_keyspace.name

  schema_definition {
    column {
      name = "product_name"
      type = "ascii"
    }

    column {
      name = "product_sku"
      type = "ascii"
    }

    partition_key {
      name = "product_sku"
    }
  }
}
```

#### Explanation

1. **`table_name`:** Specifies the name of the table. In this example, it's set to ```products```.

2. **`keyspace_name`:** References the name of the keyspace where the table should be created. It is connected to the `aws_keyspaces_keyspace` resource using `aws_keyspaces_keyspace.ecommerce_keyspace.name`.
3. **`schema_definition`:** Allows us to define table columns and their types. we also specify the partition key of the table (`product_sku`).

At this stage, we are ready to plan and apply our Terraform file. 

We run the plan command

```bash
terraform plan
```

Let'a apply the changes
    
```bash
terraform apply
```

### Connecting to AWS Keyspaces with Nodejs

Now we are ready to connect to our new AWS keyspace using the ```cassandra-driver``` and ```aws-sigv4-auth-cassandra-plugin``` packages.

Please install the ```cassandra-driver``` and ```aws-sigv4-auth-cassandra-plugin``` packages first.

```bash
yarn add cassandra-driver aws-sigv4-auth-cassandra-plugin
```

Let's create a Node.js script ```app.js``` to set up the Cassandra connection.

Create a ```.env``` file for AWS keys.

```shell
aws_access_key_id=AWS_ACCESS_KEY
aws_secret_access_key=AWS_SERCRET_ACCESS_KEY
```

and install the ```dotenv``` package.

```bash
yarn add dotenv
```

AWS keyspaces requires us to connect only with TLS. We need to download the Amazon digital certificate.

```bash
curl https://certs.secureserver.net/repository/sf-class2-root.crt > keyspaces-ca.pem
```

```js
const cassandra = require("cassandra-driver");
const sigV4 = require("aws-sigv4-auth-cassandra-plugin");
const fs = require("fs");
const { randomBytes } = require("crypto");
require("dotenv").config();

const REGION = "us-east-1";
const KEYSPACE_NAME = "ecommerce_keyspace";
const HOST = `cassandra.${REGION}.amazonaws.com`;
const CERT_FILE = "keyspaces-ca.pem";

const auth = new sigV4.SigV4AuthProvider({
  region: REGION,
  accessKeyId: process.env.aws_access_key_id,
  secretAccessKey: process.env.aws_secret_access_key,
});

const sslOptions = {
  cert: fs.readFileSync(CERT_FILE),
  host: HOST,
  rejectUnauthorized: true,
};

const client = new cassandra.Client({
  contactPoints: [HOST],
  localDataCenter: REGION,
  authProvider: auth,
  sslOptions,
  keyspace: KEYSPACE_NAME,
  protocolOptions: { port: 9142 },
});

async function main() {
  client.connect(async function (err) {
    if (err) {
      console.log("Error connecting to Keyspace", err);
      process.exit(1);
    }

    console.log("Connected to AWS Keyspaces");
    // Execute Cassandra queries
    const write_query = `INSERT INTO ecommerce_keyspace.products (product_sku, product_name)
VALUES (?, ?)`;
    const params = [`sku-${randomBytes(10).toString("hex")}`, "New Product"];
    await client.execute(write_query, params, {
      consistency: cassandra.types.consistencies.localQuorum,
    });
    const query = "SELECT * FROM products";
    const result = await client.execute(query);
    console.log("Result:", result.rows);
    // Close the connection
    client.shutdown();
  });
}

main();
```
Note that write queries require consistency to be ```localQuorum``` see [Docs](https://docs.aws.amazon.com/keyspaces/latest/devguide/consistency.html).

Run the ```app.js```.

```bash
node app.js
```
you should see something like this

```bash
Result: [
  Row {
    product_sku: 'sku-36bf3f66b02d77eb6ba0',
    product_name: 'Sample Product'
  }
]
```

We have successfully deployed Amazon keyspace using Terraform and created a simple Node.js app to write to and read from our table. Here is the link to the Github repository [Repository](https://github.com/samyouaret/keyspaces-terraform).

At the end, please do not forget to destroy AWS resources.

```bash
terraform destroy 
```

## Conclusion

In this article, we did a walkthrough to work with Apache Cassandra on AWS Keyspaces and built a Node.js application that interacts with Apache Cassandra. This article could serve as a foundation for working with the Cassandra database in AWS Keyspaces with Terraform and Node.js.
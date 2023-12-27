---
title: Deploying RabbitMQ with Amazon MQ using Terraform
date: 2023-12-23
image:
  file: /blog/static/rabbitmq-mq-logo.jpg
  credit:
    name: samy ouaret
    link: https://samyouaret.com
  hideOnPost: false
description: In this guide, we will walk through the process of deploying RabbitMQ, a popular open-source message broker, with Amazon MQ, a managed message broker service on AWS. We'll use Terraform to automate the deployment process and provide examples using Node.js.
tags : &topics
  - AWS
  - RabbitMQ
  - Amazon MQ
  - Terraform
topics : *topics
---

RabbitMQ is a popular open-source message broker or message-queueing. A message broker acts as a middleware to decouple services and applications independently of their l. It also provides offers persistent message storage, guaranteed delivery and the ability to handle large volumes of messages on high workloads.

In this guide, we will walk through the process of deploying RabbitMQ, a popular open-source message broker, with Amazon MQ, a managed message broker service on AWS. We'll use Terraform to automate the deployment process and provide examples using Node.js.

## What is a Amazon MQ

Amazon MQ is a managed message broker service that  Currently, Amazon MQ supports Apache ActiveMQ and RabbitMQ engine types.

Amazon MQ makes it easy to migrate to a message broker in the cloud. AWS recommends Amazon MQ for migrating applications from existing message brokers that rely on compatibility with protocols like AMQP 0-9-1, AMQP 1.0, MQTT, OpenWire, and STOMP.

In this guide, we will focus on deploying RabbitMQ in Amazon MQ, a popular open-source message broker that supports several protocols like AMQP 0-9-1, AMQP 1.0, and MQTT. Note that Amazon MQ is part of the AWS free-tier for the first 12 months using `micro` size.

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

## PROVIDERS
provider "aws" {
  region = "us-east-1"
}
```

Let's init the terraform project:
```bash
terraform init
```

## Creating Amazon MQ broker

The first resource we are going to create is a single instance Amazon MQ broker.

let's create the file `mq_broker.tf`.

```hcl
resource "aws_mq_broker" "rabbitmq_broker" {
  broker_name         = "rabbitmq-broker"
  engine_type         = "RabbitMQ"
  engine_version      = "3.11.20"
  host_instance_type  = "mq.t3.micro"
  deployment_mode     = "SINGLE_INSTANCE"
  subnet_ids          = [module.vpc.public_subnets[0]]
  publicly_accessible = false
  configuration {
    id       = aws_mq_configuration.rabbitmq_broker_config.id
    revision = aws_mq_configuration.rabbitmq_broker_config.latest_revision
  }
  user {
    username = var.rabbit_mq_username
    password = var.rabbit_mq_password
  }

  auto_minor_version_upgrade = true
  maintenance_window_start_time {
    day_of_week = "MONDAY"
    time_of_day = "18:00"
    time_zone   = "UTC"
  }

  apply_immediately = true
}


resource "aws_mq_configuration" "rabbitmq_broker_config" {
  description    = "RabbitMQ config"
  name           = "rabbitmq-broker"
  engine_type    = "RabbitMQ"
  engine_version = "3.11.20"
  data           = <<DATA
# Default RabbitMQ delivery acknowledgement timeout is 30 minutes in milliseconds
consumer_timeout = 1800000
DATA
}

```

1. `broker_name`: Specifies the broker name as "rabbitmq-broker".
2. `engine_type` and `engine_version`: Sets RabbitMQ as the engine with version 3.11.20.
3. `broker_instance_type`: Sets the instance type to "mq.t3.micro".
4. `deployment_mode`: Configures as a single-instance broker.
5. `publicly_accessible`: Restricts broker access to within the VPC.
6. `users block`: Defines an admin user with console access.

The configuration will create a **t3.micro** Single amazon MQ instance with RabbitMQ as the engine.

We need to create two variables for the username and password that we will use to connect to the RabbitMQ broker. let's Create the `variables.tf` file:

```hcl

variable "rabbit_mq_username" {
  type        = string
  description = "Username for RabbitMQ"
  sensitive   = true
}

variable "rabbit_mq_password" {
  type        = string
  description = "password for RabbitMQ"
  sensitive   = true
}
```

### Setting up the Instance network

We will use the [vpc module](https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest) to create a VPC with two public subnets. For this tutorial, we will use public subnets, but it is important to note that in a production environment, private subnets are the recommended option.

let's create `network.tf` file with the following code:

```hcl
module "vpc" {
  source               = "terraform-aws-modules/vpc/aws"
  version              = "2.77.0"
  name                 = "rabbit_mq_vpc"
  cidr                 = "10.0.0.0/16"
  azs                  = data.aws_availability_zones.available.names
  public_subnets       = ["10.0.1.0/24", "10.0.2.0/24"]
  enable_dns_hostnames = true
  enable_dns_support   = true
}
```

At this stage, we are ready to plan and apply our Terraform file. However, since we have added the vpc module, we need to run the init command to download it first.

```bash
terraform init
```

Then we can run the plan command

```bash
terraform plan
```

### Connecting to RabbitMQ with Nodejs

Now we are ready to connect to our RabbitMQ broker using the ```amqplib``` package.

Please install the ```amqplib``` package first.

```bash
yarn add amqplib
```

Let's create a Node.js script ```producer.js``` to publish messages to the RabbitMQ queue.

```js
const amqp = require("amqplib");
require("dotenv").config();

const CONNECTION_URL = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${RABBITMQ_URL}:${RABBITMQ_PORT}`;

async function produceMessage() {
  const connection = await amqp.connect(CONNECTION_URL);
  const channel = await connection.createChannel();
  const queue = "example_queue";

  await channel.assertQueue(queue, { durable: false });
  const message = "Hello, RabbitMQ!";

  channel.sendToQueue(queue, Buffer.from(message));
  console.log(`Message sent: ${message}`);

  setTimeout(() => {
    connection.close();
  }, 500);
}

produceMessage();
```

Create a ```.env``` file and setup the RabbitMQ configuration:

```shell
RABBITMQ_USER=USER
RABBITMQ_PASSWORD=PASSOWRD
RABBITMQ_HOST=HOST_URL
RABBITMQ_PORT=5672
```

and install the ```dotenv``` package.

```bash
yarn add dotenv
```
Create another Node.js script (consumer.js) to consume messages from RabbitMQ queue.

```js
const amqp = require("amqplib");
require("dotenv").config();

const CONNECTION_URL = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${RABBITMQ_URL}:${RABBITMQ_PORT}`;

async function consumeMessage() {
  const connection = await amqp.connect(CONNECTION_URL);
  const channel = await connection.createChannel();
  const queue = "example_queue";

  await channel.assertQueue(queue, { durable: false });

  console.log(`Waiting for messages from ${queue}`);

  channel.consume(queue, (message) => {
    if (message !== null) {
      console.log(`Received message: ${message.content.toString()}`);
      channel.ack(message);
    }
  });
}

consumeMessage();

```

Run both scripts (producer.js and consumer.js) to see the messages being produced and consumed.

```bash
node consumer.js
```

```bash
node producer.js
```

We have successfully deployed RabbitMQ with Amazon MQ using Terraform and created a simple Node.js producer and consumer.

## Conclusion

In this article, we did a walkthrough of deploying RabbitMQ with Amazon MQ using Terraform, streamlining the setup RabbitMQ in AWS and show example of connecting to RabbtitMQ broker with Node.js-based producer and consumer.
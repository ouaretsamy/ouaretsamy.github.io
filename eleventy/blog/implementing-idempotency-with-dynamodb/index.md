---
title: implementing idempotency with dynamodb
date: 2022-11-27
image:
  file: /blog/static/rock-idempotency.jpg
  credit:
    name: Zoltan Tasi
    link: https://unsplash.com/@zoltantasi
description: In this Article we will identify the importance of idempotency to build resilient and fault tolerant apis and processing.
tags : &topics
  - AWS
  - dynamodb
  - Lambda
topics: *topics
---

When Building API's, backend services we usually handle many critical operations, some of these operations could not be executed more than once, letting that occurs could destruct the service integrity and its behavior, well many time you see web developers talks about http verbs, and it is mentioned that using POST is not idempotent, unlike PATCH which is semantically idempotent, notably these verbs have to actual restriction, they are just semantics.

## What is Idempotency

Idempotency simply means the ability of a service, a program to execute an operation/request exactly once for the same input or request. This important to have consistent state of our services for example we can not tolerate a payment operation executed more than once, while the definition is simple, implementing idempotency could be tricky.

**todo**:
1. Add sample picture of idempotency.
2. add how can implement it.
3. a picture of implementation(stateful).

## the role of client( retry).
 **Comming soon**
## don't DDOS your self.
 **Comming soon**
## Conclusion
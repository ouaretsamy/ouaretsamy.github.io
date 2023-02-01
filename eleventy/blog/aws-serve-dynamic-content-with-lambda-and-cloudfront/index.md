---
title :  Serve binary content with AWS Lambda and AWS CloudFront, managed by Terraform.
date: 2022-10-30
image:
  file: /blog/static/dynamic-lambda-cloudfront-terraform.jpg
  credit:
    name: CHUTTERSNAP
    link: https://unsplash.com/@chuttersnap
description: In this Article we will pass through setting AWS lambda and AWS and CloudFront to serve Dynamic binary content using terraform as IaC.
tags : &topics
  - AWS
  - Cloudfront
  - Lambda
  - Terraform
topics : *topics
---

AWS Lambda provides excellent computing power, making it ideal for small and on-demand jobs. Typically, we use Lambda to handle various events raised by AWS services in an event-driven manner, and the response body is mostly JSON, However, lambda can be used to return binary data.

In this post, we will examine how to read images from AWS S3, then process and serve those images as dynamic binary data using lambda and leverage the AWS CloudFront to cache the result. In order to return binary data using lambda, we will use Functions URL and return the data as Base64 format. 

## Walking through the project

Throughout this article, we will use Terraform to create a Lambda function that runs on top of the Nodejs runtime. The lambda function will read a s3 image specified in the url path and including two parameters (width and height), then we will use the [sharp]([https://](https://www.npmjs.com/package/sharp)) package to resize the image and return the newly resized image.

## Setting up lambda

Before proceeding, we must first create a trust policy that allows Lambda to assume the role. We then grant our function permission to read images stored on the S3 bucket, as well as basic permissions to work with CloudWatch logs.

Here is the Terraform code that declares the basic execution role for lambda, including the S3 read permission.

```hcl

resource "aws_iam_role" "lambda_role" {
  name = "th_gen_lambda_function_Role"
  assume_role_policy = <<POLICY
{
 "Version": "2012-10-17",
 "Statement": [
   {
     "Action": "sts:AssumeRole",
     "Principal": {
       "Service": "lambda.amazonaws.com"
     },
     "Effect": "Allow",
     "Sid": "AllowLambdaToAssumeRole"
   }
 ]
}
POLICY
}

resource "aws_iam_policy" "iam_policy_for_lambda" {
  name        = "aws_iam_policy_for_terraform_aws_lambda_role"
  path        = "/"
  description = "AWS IAM Policy for managing aws lambda role"
  policy      = <<POLICY
{
 "Version": "2012-10-17",
 "Statement": [
   {
      "Sid": "BasicLambdaLogsPolicy",
     "Action": [
       "logs:CreateLogGroup",
       "logs:CreateLogStream",
       "logs:PutLogEvents"
     ],
     "Resource": "arn:aws:logs:*:*:*",
     "Effect": "Allow"
   },
    {
      "Sid": "AllowS3Read",
      "Action": [
        "s3:GetObject"
      ],
      "Effect": "Allow",
      "Resource": [
        "arn:aws:s3:::samyouaret-thumbnail-pictures/*"
      ]
    }
 ]
}
POLICY
}

resource "aws_iam_role_policy_attachment" "attach_iam_policy_to_iam_role" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.iam_policy_for_lambda.arn
}
```

## Creating Lambda function

After defining the lambda role, we will write our Lambda function.


```js
resource "aws_lambda_function" "lambda_generator" {
  function_name    = "test_th_gen"
  filename         = "lambda_function.zip"
  handler          = "index.handler"
  source_code_hash = filebase64sha256("lambda_function.zip")
  role             = aws_iam_role.lambda_role.arn
  runtime          = "nodejs16.x"
  environment {
     variables = {
      BUCKET = "samyouaret-thumbnail-pictures"
    }
  }
}
```

Let's go over the configuration that was used to create the function:

1. **function_name**: The name of the function.
2. **filename**: The zipped file that is used to deploy lambda.
3. **index.handler**: The entry file(index.js) and the target function that handles the request(handler).
4. **source_code_hash**: This is important to calculate the hash of our zipped file so terraform can decide whether to redeploy the function if the code change( so we get a new hash).
5. **runtime**: It specifies `Nodejs.16x` as the target runtime.
6. **role**: Assign the previously created role to the function.

### Enabling Lambda function url

Enabling function URL is a simple task that we accomplish by defining the 'aws lambda function url' resource in Terraform.

```hcl
resource "aws_lambda_function_url" "lambda_url" {
  function_name      = aws_lambda_function.lambda_generator.function_name
  authorization_type = "NONE"
}
```

## Creating s3 bucket

For this setup, we will create a public S3 bucket.

```hcl
resource "aws_s3_bucket" "s3_bucket" {
  bucket = "samyouaret-thumbnail-pictures"
  tags = {
    "project" = "thumbnail-gen"
  }
}

resource "aws_s3_bucket_public_access_block" "bucket_public_access" {
  bucket = aws_s3_bucket.s3_bucket.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}
```
## Our Lambda code

After we've successfully created our resources, we'll write the lambda function that will contains our code, and init the project with `yarn` (you can use npm it is just a preference).

    yarn init -y

To resize the image we will use the [sharp]([https://](https://www.npmjs.com/package/sharp)) package.

    yarn add sharp

To read images from s3 we need to install S3 AWS client sdk

    yarn add @aws-sdk/client-s3

Then we need to import our packages to get started

```js
const sharp = require('sharp');
const { GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');

```

Using the latest AWS s3 client, that implements Nodejs streams we are going create a simple function that reads images and then returns the image mime type and its content as a Nodejs buffer.

```js
async function getImage(bucket,imageKey) {
       const s3Client = new S3Client();
       return new Promise(async (resolve,reject)=>{
        try {
            let getCommand = new GetObjectCommand({
                Bucket: bucket,
                Key: imageKey
            });
            let response = await s3Client.send(getCommand);
            let chunks  = [];
            response.Body.on('data',(chunk)=> chunks.push(chunk));
            response.Body.once('end',async ()=>resolve({
                body: Buffer.concat(chunks),
                contentType: response.ContentType
            }));
        } catch (error) {
            reject(error);
        }
    });
}
```

Now let's create a function to resize the image with sharp package.

```js
async function resizeImage(imageBuffer,options) {
    return sharp(imageBuffer).resize(options).toBuffer();
}
```

### Creating the lambda handler function 

Our function will read the pathname and `width` and `height` params specified in the function URL when it is invoked, use the pathname as the key to reading the s3 image, and pass the params and image content to [sharp]([https://](https://www.npmjs.com/package/sharp)) to resize it.

```js
async function handler(event, context) {
    let imageKey = event.rawPath.replace('/','');
    let image = await getImage(process.env.BUCKET,imageKey);
    let body  = await resizeImage(image.body, {
        width: parseInt(event.queryStringParameters.w),
        height: parseInt(event.queryStringParameters.h),
    });

    return {
        statusCode: 200,
        headers: { "Content-Type": image.contentType },
        body: body.toString('base64'),
        isBase64Encoded: true
    }
}
```

The important part now is to specify the content type to image content type, such as `image/png,` and to set the property `isBase64Encoded` to true so Lambda knows the body is base64 encoded.

Using nodejs ```buffer.toString('base64')```, will encode the sharp output as base64.
Then We simply call the function as follows to invoke it.

    https://{function-url}/image-key?w=300&h=3000

To package the function in a zip file

    zip lambda_function.zip index.js node_modules yarn.lock package.json  -r

We need to export AWS credentials before we can use Terraform

    export AWS_SECRET_ACCESS_KEY= AWS_ACCESS_KEY_ID=

Plan the Terraform setup, and if it satisfied you, apply the configuration.

    terraform plan

Ultimately, apply the changes
    
    terraform apply


## Adding CloudFront Cache layer

Let's use CloudFront to cache Lambda responses in order to save computing resources and reduce costs. We will create a CloudFront distribution with the function URL as the origin, and we will also create

1. A cache policy in which the cache key is determined by the width and height parameters.
2. An Origin request policy so that the width and height parameters can be passed to the Lambda function.

We use a TTL of 60s for testing purposes.

```hcl

resource "aws_cloudfront_cache_policy" "thumnail_generator_cache_policy" {
  name                     = "thumnail_generator_cache_policy"
  min_ttl                  = 60
  default_ttl              = 60
  max_ttl                  = 60
  parameters_in_cache_key_and_forwarded_to_origin {
   cookies_config {
      cookie_behavior = "none"
      cookies {
        items = []
      }
    }
    headers_config {
      header_behavior = "none"
      headers {
        items = []
      }
    }
    query_strings_config {
      query_string_behavior = "whitelist"
      query_strings {
        items = ["w", "h"]
      }
    }
  }

}

resource "aws_cloudfront_origin_request_policy" "forward_resize_params" {
  name    = "forward_resize_params"
  comment = "forward resize params to origin"
  query_strings_config {
    query_string_behavior = "whitelist"
    query_strings {
      items = ["w", "h"]
    }
  }

  headers_config {
    header_behavior = "none"
  }

  cookies_config {
    cookie_behavior = "none"
  }
}

resource "aws_cloudfront_distribution" "lambda_distribution" {
  origin {
    domain_name = "${aws_lambda_function_url.lambda_url.url_id}.lambda-url.us-east-1.on.aws"
    origin_id   = "${aws_lambda_function_url.lambda_url.url_id}.lambda-url.us-east-1.on.aws"

    custom_origin_config {
      http_port              = "80"
      https_port             = "443"
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

  }

  depends_on = [
    aws_cloudfront_cache_policy.thumnail_generator_cache_policy,
    aws_cloudfront_origin_request_policy.forward_resize_params,
  ]

  enabled         = true
  default_cache_behavior {
    allowed_methods          = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods           = ["GET", "HEAD"]
    target_origin_id         = "${aws_lambda_function_url.lambda_url.url_id}.lambda-url.us-east-1.on.aws"
    viewer_protocol_policy   = "allow-all"
    cache_policy_id = aws_cloudfront_cache_policy.thumnail_generator_cache_policy.id
    origin_request_policy_id = aws_cloudfront_origin_request_policy.forward_resize_params.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
      locations        = []
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
```

Plan the Terraform setup once more, and if that satisfies you, apply the config.

    terraform plan

Then apply the changes
    
    terraform apply

## Cleaning up Our infrastructure

Finally, let's clean the infrastructure we've built with the terraform destroy command.

    terraform destroy

## Conclusion

In this article, we looked at how we can use AWS Lambda to serve binary content, as well as how we can use CloudFront to optimize our solution.

Although we were able to serve binary content with lambda, I found it inefficient when the image size was medium/large (it took nearly 1.3s on average), most likely due to the process of converting the content from and to base64.

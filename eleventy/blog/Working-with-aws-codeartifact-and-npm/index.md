---
title : Complete guide to Publishing NPM Packages in AWS CodeArtifact
date: 2024-12-19
image:
  file: /blog/static/a-group-of-vases-sitting-on-top-of-a-wooden-table.jpg
  credit:
    name: Dmitriy Tyukov
    link: https://unsplash.com/photos/a-group-of-vases-sitting-on-top-of-a-wooden-table-ajnOPtRQnJQ?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash
description: In this guide we going to explore what is AWS CodeArtifact, and walk through the process of setting up automated NPM package publishing to AWS CodeArtifact using GitHub Actions.

tags : &topics
  - AWS
  - AWS CodeArtifact
topics : *topics
---

Looking to set up a private package registry for your team? AWS CodeArtifact might be just what you need. Think of it as your own private npm, PyPI, or Maven repository, but fully managed by AWS. After spending the past year working extensively with CodeArtifact for our private package needs, I want to share what I've learned about setting it up and getting the most out of it.

AWS CodeArtifact serves as a secure, scalable framework for managing dependencies across projects. While CodeArtifact works with several package types - from Python's PyPI to Java's Maven - we'll focus on using it with npm packages today. I'll show you how to set up your private npm registry and automate package publishing through GitHub Actions. By the end of this guide, you'll have a streamlined workflow for managing your private JavaScript packages, all running smoothly on AWS infrastructure.

We'll look at the fundamentals of AWS CodeArtifact and walk through the process of configuring it and automating NPM package publishing to AWS CodeArtifact with GitHub Actions.

## Basic concepts

1. **Domains**: A domain to the top organizer to group multiple repositories, enabling cross-repository collaboration and dependency sharing.
2. **Repositories**: A repository in CodeArtifact is used to store packages.
3. **Upstream Repositories**: Link to external public repositories to automatically proxy requests for missing dependencies or cache packages.
4. **Authentication**: We can use AWS CLI to retrieve temporary authentication tokens for interacting with repositories. Tokens are valid for 12 hours by default.

### what about Pricing?

AWS CodeArtifact pricing is based on the amount of storage used and the number of requests made to the service. There are no upfront costs, and you pay only for what you use.

1. The first 2 GB-month stored across all regions is free, then you pay $0.05 per GB-month.
2. The first 100,000 requests across all regions are free, then you pay $0.05 per 10,000 requests.

## Prerequisites

Before we begin, ensure you have:

1. An AWS account.
2. A GitHub repository containing your NPM package, or you can just start with this repository [Github repository](https://github.com/samyouaret/aws-code-artifact-npm).

## 2. Creating IAM User

First, we need the AWS CLI installed. If not installed, follow the [AWS CLI installation guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html). For CodeArtifact we need to create a user with required permissions to publish the package to CodeArtifact from the Github actions workflow.First, let's create an IAM user:

```bash
aws iam create-user --user-name codeartifact-publisher
```

To add permissions we have to create an IAM policy for AWS CodeArtifact access:

```bash
aws iam create-policy \
    --policy-name CodeArtifactPublisherPolicy \
    --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "codeartifact:GetAuthorizationToken",
                "codeartifact:GetRepositoryEndpoint",
                "codeartifact:PublishPackageVersion",
                "codeartifact:ReadFromRepository",
                "codeartifact:PutPackageMetadata"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": "sts:GetServiceBearerToken",
            "Resource": "*"
        }
    ]
}'
```

Then we need to attach the policy to the user. We can get the policy's ARN from the AWS IAM service console, Or simply run this command, then copy the policy ARN part from the terminal JSON output.

```bash
aws iam list-policies --scope Local | grep CodeArtifactPublisherPolicy
```

Let's attach the policy to the user as follows:

```bash
aws iam attach-user-policy \
    --user-name codeartifact-publisher \
    --policy-arn {POLICY_ARN_HERE}
```

Then we create access keys for GitHub actions.

```bash
aws iam create-access-key --user-name codeartifact-publisher
```

Then we create access keys for saving the output containing `AccessKeyId` and `SecretAccessKey⁣`. We'll need these later to publish the package. GitHub actions.

## 3. Setting up CodeArtifact

Create a CodeArtifact domain:

```bash
aws codeartifact create-domain \
    --domain your-domain-name
```

Create a CodeArtifact repository:
```bash
aws codeartifact create-repository \
    --domain your-domain-name \
    --domain-owner ACCOUNT-ID \
    --repository your-repository-name \
    --description "NPM package repository"
```

#### Proxy repository and Why We Might need it?

Create a CodeArtifact repository: We can optionally connect our repository to `npmjs.com` proxy public packages.

When we connect the CodeArtifact repository to `npmjs.com`, we're essentially creating a proxy cache of the public npm registry. This is very useful for several reasons:

1. **Faster Package Downloads**: Once a package is cached in CodeArtifact, subsequent downloads are much faster.
2. **Reliability**: If `npmjs.com` is down, you can still access cached packages.
3. **Package Version Control**: You can control which versions of public packages your team can access.
4. **Security**: You can scan and audit packages before they reach your developers.
5. **Reduced External Traffic**: Saves bandwidth as packages are downloaded only once

```bash
aws codeartifact create-repository \
    --domain your-domain-name \
    --domain-owner ACCOUNT-ID \
    --repository npm-store \
    --description "Public npm proxy"

aws codeartifact associate-external-connection \
    --domain your-domain-name \
    --domain-owner ACCOUNT-ID \
    --repository npm-store \
    --external-connection public:npmjs
```

Then we create an upstream repository association (if we created the npm proxy):
```bash
aws codeartifact update-repository \
    --domain your-domain-name \
    --domain-owner ACCOUNT-ID \
    --repository your-repository-name \
    --upstreams repositoryName=npm-store
```

Please replace these placeholder values in all commands:
- `ACCOUNT-ID`: Your AWS account ID
- `your-domain-name`: Your desired CodeArtifact domain name.
- `your-repository-name`: Your desired repository name.

## Configuring GitHub Repository Secrets

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

We first need to create the following secrets:

- `AWS_ACCESS_KEY_ID`: IAM user access key ID that we saved previously.
- `AWS_SECRET_ACCESS_KEY`: Your IAM user secret access key that we saved previously.

We also need to create the following variables:
- `AWS_REGION`: Your AWS region (e.g., `us-east-1`)
- `CODEARTIFACT_DOMAIN`: The CodeArtifact domain name.
- `CODEARTIFACT_OWNER`: The AWS account ID.
- `CODEARTIFACT_REPOSITORY`: The CodeArtifact repository name.

## Package Configuration

Update `package.json` to include the correct registry URL:

```json
{
  "name": "your-package-name",
  "version": "1.0.0",
  "publishConfig": {
    "registry": "https://<domain-owner>.d.codeartifact.region.amazonaws.com/npm/<repository>/"
  }
}
```

Please replace these `<domain-owner>` and `<repository>` with actual values for the domain owner and repository name.

## GitHub Actions Workflow

Create a new file `.github/workflows/publish.yml` in your repository:

```yaml
name: Publish Package to AWS CodeArtifact

on:
  push:
    tags:
      - 'v*'  # Trigger on version tags

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.x'
          
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ vars.AWS_REGION }}
          
      - name: Get CodeArtifact Token
        run: |
          TOKEN=$(aws codeartifact get-authorization-token \
            --domain ${{ vars.CODEARTIFACT_DOMAIN }} \
            --domain-owner ${{ vars.CODEARTIFACT_OWNER }} \
            --query authorizationToken \
            --output text)
          echo "//${{ vars.CODEARTIFACT_DOMAIN }}-${{ vars.CODEARTIFACT_OWNER }}.d.codeartifact.${{ vars.AWS_REGION }}.amazonaws.com/npm/${{ vars.CODEARTIFACT_REPOSITORY }}/:always-auth=true" >> .npmrc
          echo "//${{ vars.CODEARTIFACT_DOMAIN }}-${{ vars.CODEARTIFACT_OWNER }}.d.codeartifact.${{ vars.AWS_REGION }}.amazonaws.com/npm/${{ vars.CODEARTIFACT_REPOSITORY }}/:_authToken=${TOKEN}" >> .npmrc
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build package
        run: npm run build
        
      - name: Publish package
        run: npm publish
```

## Publishing Process

To publish a new version of the package:

1. Update the version in package.json manually or using `npm version` command.
```bash
# example of patching version using npm
npm version patch
```
2. Commit your changes
3. Create and push a new version tag:
   ```bash
   git tag v1.0.0  # Use semantic versioning
   git push origin v1.0.0
   ```

The GitHub Action will automatically:
1. Set up Node.js and AWS credentials
2. Get an authentication token from CodeArtifact
3. Configure npm to use CodeArtifact by creating `.npmrc` file with registry url and auth token.
4. Install dependencies and build the package.
5. Publish the package to your CodeArtifact repository.

you can find the npm package repository on github [Github repository](https://github.com/samyouaret/aws-code-artifact-npm)

## Troubleshooting

Common issues and solutions:

1. Authentication Failures
   - Ensure your CodeArtifact domain and repository names are correct.
   - Ensure that the `publishConfig` in `package.json` is using the correct registry URL.
   - Double-check your AWS credentials in GitHub secrets.
   - Verify IAM permissions are correct.

2. Publishing Errors
   - Check that the version number is unique.
   - Ensure all required files are included in your package.

## Best Practices

1. Use semantic versioning for your packages.
2. Maintain detailed changelog documentation.
3. Use branch protection rules to prevent direct pushes to main.
4. Regularly rotate AWS access keys.

## Additional Resources

- [AWS CodeArtifact Documentation](https://docs.aws.amazon.com/codeartifact/latest/ug/welcome.html)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [NPM Package Publishing](https://docs.npmjs.com/cli/v8/commands/npm-publish)

## Conclusion

This guide has walked you through the complete process of setting up automated NPM package publishing to AWS CodeArtifact using GitHub Actions. We covered the essential steps from initial AWS setup through to automated publishing: creating the necessary IAM user with appropriate permissions, configuring the CodeArtifact repository, setting up GitHub repository secrets, and implementing a GitHub Actions workflow.By following this guide, you've automated the pipeline for publishing and managing NPM packages within your organization. 

The implementation ensures proper version control, maintains security through AWS IAM roles, and automates the publishing process through GitHub Actions. Whether you're working with private packages or utilizing the optional npm proxy setup for public packages, this infrastructure provides a reliable foundation for your organization's package management needs.

Remember to keep your access keys secure, regularly update your workflows as needed, and ensure your team is familiar with the publishing process. For any updates or changes, you can always refer back to the specific sections of this guide.
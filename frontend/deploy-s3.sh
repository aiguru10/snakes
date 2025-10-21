#!/bin/bash

# Configuration
BUCKET_NAME="snake-identifier-pwa-$(date +%s)"
REGION="us-east-1"

# Build the app
npm run build

# Create S3 bucket
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Configure bucket for static website hosting
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

# Upload files
aws s3 sync out/ s3://$BUCKET_NAME --delete

# Remove public access block and make bucket public
aws s3api delete-public-access-block --bucket $BUCKET_NAME
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
    }
  ]
}'

# Create CloudFront distribution
DISTRIBUTION_CONFIG='{
  "CallerReference": "'$(date +%s)'",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3Origin",
        "DomainName": "'$BUCKET_NAME'.s3-website-'$REGION'.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3Origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    },
    "MinTTL": 0
  },
  "Comment": "Snake Identifier PWA Distribution",
  "Enabled": true,
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200"
      }
    ]
  }
}'

DISTRIBUTION_ID=$(aws cloudfront create-distribution --distribution-config "$DISTRIBUTION_CONFIG" --query 'Distribution.Id' --output text)
CLOUDFRONT_URL=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.DomainName' --output text)

echo "S3 Website URL: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo "CloudFront URL: https://$CLOUDFRONT_URL"
echo "Distribution ID: $DISTRIBUTION_ID"
echo "Note: CloudFront deployment takes 10-15 minutes to complete"

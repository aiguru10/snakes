#!/bin/bash

# Quick deployment to existing S3 bucket
BUCKET_NAME="snake-identifier-pwa-1761012570"
DISTRIBUTION_ID="ENM5YUS3HN3KM"

# Build the app
npm run build

# Upload files to existing bucket
aws s3 sync out/ s3://$BUCKET_NAME --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

echo "Deployed to existing bucket: $BUCKET_NAME"
echo "CloudFront URL: https://d1maiuvpso2xsv.cloudfront.net"
echo "Cache invalidation initiated"

#!/bin/bash

# Set OpenAI API Key (replace with your actual key)
export OPENAI_API_KEY="your-openai-api-key-here"

# Create deployment package
cd lambda
python3 -m pip install -r requirements.txt -t .
zip -r ../snake-identifier-lambda.zip .
cd ..

# Update Lambda function
aws lambda update-function-code \
  --function-name snake-identifier \
  --zip-file fileb://snake-identifier-lambda.zip

# Update environment variables
aws lambda update-function-configuration \
  --function-name snake-identifier \
  --environment Variables="{OPENAI_API_KEY=$OPENAI_API_KEY}"

echo "Lambda updated successfully!"

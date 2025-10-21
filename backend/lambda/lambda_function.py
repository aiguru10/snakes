import json
import base64
import os
from openai import OpenAI

def lambda_handler(event, context):
    try:
        # Initialize OpenAI client
        client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])
        
        # Parse the request body
        body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        image_data = body['image']
        
        # Create the prompt for snake identification
        prompt = """Analyze this image of a snake and provide:
1. Species identification (if possible)
2. Safety classification: "Venomous", "Mildly Venomous", or "Not Venomous"
3. Brief description with key identifying features
4. Safety advice

Format your response as JSON with 'status' and 'description' fields."""

        # Call OpenAI Vision API
        response = client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_data}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500
        )
        
        # Parse the response
        ai_response = response.choices[0].message.content
        
        # Try to extract JSON from response
        try:
            # Look for JSON in the response
            start = ai_response.find('{')
            end = ai_response.rfind('}') + 1
            if start != -1 and end != 0:
                result = json.loads(ai_response[start:end])
            else:
                # Fallback: parse manually
                lines = ai_response.split('\n')
                status = "Unknown"
                description = ai_response
                
                for line in lines:
                    if any(word in line.lower() for word in ['venomous', 'dangerous', 'poisonous']):
                        if 'not' in line.lower() or 'non' in line.lower():
                            status = "Not Venomous"
                        elif 'mildly' in line.lower() or 'slightly' in line.lower():
                            status = "Mildly Venomous"
                        else:
                            status = "Venomous"
                        break
                
                result = {
                    "status": status,
                    "description": description
                }
        except:
            result = {
                "status": "Unknown",
                "description": ai_response
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps(result)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'status': 'Error',
                'description': f'Error processing image: {str(e)}'
            })
        }

#!/usr/bin/env python3

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import anthropic
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Simple usage tracking
usage_stats = {
    'total_requests': 0,
    'total_input_tokens': 0,
    'total_output_tokens': 0,
    'estimated_cost': 0.0
}

# Initialize Claude client
try:
    client = anthropic.Anthropic(
        api_key=os.getenv('ANTHROPIC_API_KEY')
    )
except Exception as e:
    print(f"Error initializing Anthropic client: {e}")
    client = None

@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory('.', 'index.html')

@app.route('/script.js')
def script():
    """Serve the JavaScript file"""
    return send_from_directory('.', 'script.js')

@app.route('/video_examples.json')
def video_data():
    """Serve the video examples data"""
    return send_from_directory('.', 'video_examples.json')

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve static assets (favicons, manifest, etc.)"""
    return send_from_directory('assets', filename)

@app.route('/usage_stats')
def get_usage_stats():
    """Get current usage statistics"""
    return jsonify(usage_stats)

@app.route('/score_translation', methods=['POST'])
def score_translation():
    """Score user interpretation against original using Claude"""
    try:
        if client is None:
            return jsonify({'error': 'Claude client not initialized. Check API key.'}), 500
            
        data = request.get_json()
        original_translation = data.get('original_translation')
        user_translation = data.get('user_translation')
        sign_sequence = data.get('sign_sequence', [])
        
        if not original_translation or not user_translation:
            return jsonify({'error': 'Missing interpretation data'}), 400
        
        # Create sign sequence string for context
        signs_text = " → ".join([sign['word'] for sign in sign_sequence])
        
        # Create prompt for Claude
        prompt = f"""You are scoring NZSL (New Zealand Sign Language) interpretation accuracy. Be encouraging and supportive.

Original signed sentence signs: {signs_text}
Official English translation: "{original_translation}"
User's interpretation: "{user_translation}"

IMPORTANT: Read the user's interpretation VERY carefully before scoring. The user is interpreting what they saw signed in the video. When the signer uses "I" in the original, the user should also use "I" in their interpretation - this shows they correctly understood the signer was talking about their own experience. The user is translating/interpreting, not describing what they observed.

Before scoring, carefully check if the user's interpretation contains the same key information as the official translation, even if worded differently.

Please score this interpretation on a scale of 0-10 where:
- 10 = Perfect or near-perfect meaning match (minor differences like "I" vs "i", "nine" vs "9" don't matter)
- 9 = Excellent - captures all meaning with very minor wording differences
- 8 = Very good - captures main meaning with small differences  
- 6-7 = Good - captures core idea but misses some details
- 4-5 = Partially correct but significant gaps
- 2-3 = Some elements correct but major misunderstanding
- 0-1 = Completely incorrect or unrelated

BE ACCURATE with scoring. If the user's interpretation is about completely different topics or concepts than the original, score it very low (0-2). Only give high scores when the interpretations are actually about the same topic and events.

Focus on semantic meaning rather than exact word-for-word matching. Minor differences in capitalization, numbers vs words (9 vs nine), or slight rephrasing should not reduce the score if the meaning is the same. Examples of equivalent meanings: "burglar/intruder/scary person", "phone/call/ring", "neighbour/neighbor", "arrived home/got home/came home".

Use encouraging, friendly language. Address the learner directly as "you". Focus on what they got right first, then gently explain what could be improved. Use phrases like "Excellent work!", "Perfect interpretation!", "You nailed it!", "Good catch on...", "You understood...".

CRITICAL: Before giving feedback about what the user "missed", double-check that they actually missed it. Do not claim they missed something that is clearly present in their interpretation.

REALITY CHECK: Ask yourself - are the user's interpretation and the official translation actually about the same topic/situation? If not, do not try to find connections that don't exist. Be honest about significant misunderstandings.

Respond with ONLY a JSON object in this format:
{{"score": X, "feedback": "Encouraging explanation addressing the learner directly about what they captured well and what to focus on next time"}}"""

        # Call Claude API
        message = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=300,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Log token usage and update stats
        input_tokens = message.usage.input_tokens
        output_tokens = message.usage.output_tokens
        
        # Claude 3.5 Haiku pricing (approximate)
        input_cost = input_tokens * 0.000001  # $1.00 per 1M tokens
        output_cost = output_tokens * 0.000005  # $5.00 per 1M tokens
        request_cost = input_cost + output_cost
        
        # Update global stats
        usage_stats['total_requests'] += 1
        usage_stats['total_input_tokens'] += input_tokens
        usage_stats['total_output_tokens'] += output_tokens
        usage_stats['estimated_cost'] += request_cost
        
        print(f"[Usage] Input: {input_tokens}, Output: {output_tokens}, Cost: ${request_cost:.6f}, Total Cost: ${usage_stats['estimated_cost']:.4f}")
        
        # Parse Claude's response
        response_text = message.content[0].text.strip()
        
        # Log the raw response for debugging
        print(f"[Debug] Raw Claude response: {repr(response_text)}")
        
        # Try to extract JSON from response
        try:
            # Remove any markdown formatting
            cleaned_text = response_text
            if response_text.startswith('```json'):
                cleaned_text = response_text.replace('```json', '').replace('```', '').strip()
            elif response_text.startswith('```'):
                cleaned_text = response_text.replace('```', '').strip()
            
            print(f"[Debug] Cleaned text for JSON parsing: {repr(cleaned_text)}")
            
            result = json.loads(cleaned_text)
            
            # Validate response format
            if 'score' not in result or 'feedback' not in result:
                print(f"[Error] Missing required fields in response: {result}")
                raise ValueError("Invalid response format - missing score or feedback")
                
            # Ensure score is within range
            score = float(result['score'])
            if score < 0 or score > 10:
                print(f"[Warning] Score {score} out of range, clamping to 0-10")
                score = max(0, min(10, score))  # Clamp to 0-10 range
                
            result['score'] = score
            
            return jsonify(result)
            
        except json.JSONDecodeError as e:
            # Detailed fallback if JSON parsing fails
            print(f"[Error] JSON parsing failed: {e}")
            print(f"[Error] Failed to parse: {repr(response_text)}")
            return jsonify({
                'score': 5.0,
                'feedback': f'Unable to parse scoring response. JSON error: {str(e)}. Please try again.'
            })
        except ValueError as e:
            print(f"[Error] Validation error: {e}")
            print(f"[Error] Response content: {repr(response_text)}")
            return jsonify({
                'score': 5.0,
                'feedback': f'Response validation failed: {str(e)}. Please try again.'
            })
            
    except Exception as e:
        print(f"Error in score_translation: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Check if API key is set
    if not os.getenv('ANTHROPIC_API_KEY'):
        print("Warning: ANTHROPIC_API_KEY not found in environment variables")
        print("Please create a .env file with your Claude API key:")
        print("ANTHROPIC_API_KEY=your_key_here")
    
    # Use 0.0.0.0 for Docker compatibility
    app.run(host='0.0.0.0', debug=False, port=5000)
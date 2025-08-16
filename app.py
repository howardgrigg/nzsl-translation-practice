#!/usr/bin/env python3

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import anthropic
import json
import os
import sqlite3
import random
import re
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
    response = send_from_directory('.', 'script.js')
    response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
    return response

@app.route('/NZSLGrammar/<filename>')
def nzsl_grammar_files(filename):
    """Serve NZSLGrammar files"""
    if filename.endswith('.js'):
        response = send_from_directory('NZSLGrammar', filename)
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        return response
    elif filename.endswith('.css'):
        response = send_from_directory('NZSLGrammar', filename)
        response.headers['Content-Type'] = 'text/css; charset=utf-8'
        return response
    elif filename.endswith('.html'):
        response = send_from_directory('NZSLGrammar', filename)
        response.headers['Content-Type'] = 'text/html; charset=utf-8'
        return response
    else:
        return send_from_directory('NZSLGrammar', filename)

# Removed - video data now served via /random_video endpoint

@app.route('/assets/icons/<filename>')
def serve_icons(filename):
    """Serve favicon and icon files"""
    return send_from_directory('assets/icons', filename)

# Also serve favicon.ico from root for default browser requests
@app.route('/favicon.ico')
def favicon():
    """Serve favicon from root path"""
    return send_from_directory('assets/icons', 'favicon.ico')

@app.route('/usage_stats')
def get_usage_stats():
    """Get current usage statistics"""
    return jsonify(usage_stats)

def parse_sign_sequence(sentence):
    """Extract sign IDs from sentence notation"""
    if not sentence:
        return []
    pattern = r'([a-zA-Z\-\^:]+)\[(\d+)\]'
    matches = re.findall(pattern, sentence)
    return [{'word': word, 'id': int(sign_id)} for word, sign_id in matches]

@app.route('/random_video')
def get_random_video():
    """Get a random video with enhanced sign sequence data"""
    try:
        # Load matched signs data
        with open('matched_signs.json', 'r') as f:
            matched_signs = json.load(f)
        
        # Connect to database
        conn = sqlite3.connect('nzsl.db')
        cursor = conn.cursor()
        
        # Get a random sign from top 350
        random_sign = random.choice(matched_signs[:350])
        sign_id = random_sign['sign_id']
        
        # Get actual word definition
        cursor.execute("""
            SELECT w.gloss, w.minor, v.url 
            FROM words w
            LEFT JOIN videos v ON w.id = v.word_id AND v.video_type = 'main' AND v.url LIKE '%.mp4'
            WHERE w.id = ?
            LIMIT 1
        """, (sign_id,))
        
        word_data = cursor.fetchone()
        if word_data:
            actual_gloss, minor_meanings, definition_video_url = word_data
        else:
            actual_gloss = random_sign['common_word']
            minor_meanings = ""
            definition_video_url = None
        
        # Get all example videos for this sign
        cursor.execute("""
            SELECT word_id, video_type, url, display_order
            FROM videos 
            WHERE word_id = ? AND video_type LIKE 'finalexample%'
            ORDER BY video_type, display_order
        """, (sign_id,))
        
        videos = cursor.fetchall()
        
        if not videos:
            # Try another random sign if no videos found
            conn.close()
            return get_random_video()  # Recursive call
        
        # Pick a random video from available examples
        word_id, video_type, video_url, display_order = random.choice(videos)
        
        # Get example sentence data
        cursor.execute("""
            SELECT sentence, translation 
            FROM examples 
            WHERE word_id = ? AND display_order = ?
        """, (word_id, int(video_type.replace('finalexample', ''))))
        
        example_data = cursor.fetchone()
        
        if example_data:
            sentence, translation = example_data
            sign_sequence = parse_sign_sequence(sentence)
        else:
            sentence = ""
            translation = f"Example for {random_sign['common_word']}"
            sign_sequence = []
        
        # Enhance sign sequence with definition data
        enhanced_sign_sequence = []
        for sign in sign_sequence:
            cursor.execute("""
                SELECT w.gloss, w.minor, v.url 
                FROM words w
                INNER JOIN videos v ON w.id = v.word_id AND v.video_type = 'main' AND v.url LIKE '%.mp4'
                WHERE w.id = ?
                LIMIT 1
            """, (str(sign['id']),))
            
            sign_data = cursor.fetchone()
            if sign_data:
                enhanced_sign = {
                    'word': sign['word'],
                    'id': sign['id'],
                    'gloss': sign_data[0],
                    'minor_meanings': sign_data[1] or '',
                    'definition_video_url': sign_data[2]
                }
            else:
                enhanced_sign = {
                    'word': sign['word'],
                    'id': sign['id'],
                    'gloss': sign['word'],
                    'minor_meanings': '',
                    'definition_video_url': None
                }
            enhanced_sign_sequence.append(enhanced_sign)
        
        # Build response
        video_data = {
            'word_id': word_id,
            'example_number': int(video_type.replace('finalexample', '')),
            'video_type': video_type,
            'common_word': random_sign['common_word'],
            'actual_gloss': actual_gloss,
            'minor_meanings': minor_meanings,
            'definition_video_url': definition_video_url,
            'rank': random_sign['rank'],
            'confidence': random_sign['confidence'],
            'video_url': video_url,
            'english_translation': translation,
            'sign_sequence': enhanced_sign_sequence,
            'raw_sentence': sentence
        }
        
        conn.close()
        return jsonify(video_data)
        
    except Exception as e:
        import traceback
        print(f"Error getting random video: {e}")
        print("Full traceback:")
        traceback.print_exc()
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


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

@app.route('/get_sign_definition', methods=['POST'])
def get_sign_definition():
    """Get sign definition data for the grammar game glosses"""
    try:
        data = request.get_json()
        sign_id = data.get('sign_id')
        
        if not sign_id:
            return jsonify({'error': 'Missing sign_id'}), 400
        
        # Connect to database
        conn = sqlite3.connect('nzsl.db')
        cursor = conn.cursor()
        
        # Get sign definition
        cursor.execute("""
            SELECT w.gloss, w.minor, v.url 
            FROM words w
            LEFT JOIN videos v ON w.id = v.word_id AND v.video_type = 'main' AND v.url LIKE '%.mp4'
            WHERE w.id = ?
            LIMIT 1
        """, (sign_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            gloss, minor_meanings, definition_video_url = result
            return jsonify({
                'gloss': gloss,
                'minor_meanings': minor_meanings or '',
                'definition_video_url': definition_video_url
            })
        else:
            return jsonify({'error': 'Sign not found'}), 404
            
    except Exception as e:
        print(f"Error in get_sign_definition: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Check if API key is set
    if not os.getenv('ANTHROPIC_API_KEY'):
        print("Warning: ANTHROPIC_API_KEY not found in environment variables")
        print("Please create a .env file with your Claude API key:")
        print("ANTHROPIC_API_KEY=your_key_here")
    
    # Use 0.0.0.0 for Docker compatibility
    app.run(host='0.0.0.0', debug=False, port=5000)
#!/usr/bin/env python3

import json
import sqlite3
import re

def parse_sign_sequence(sentence):
    """Extract sign IDs from sentence notation like 'clothes[1523] plenty[3721]'"""
    # Find all patterns like word[id]
    pattern = r'([a-zA-Z\-\^:]+)\[(\d+)\]'
    matches = re.findall(pattern, sentence)
    return [{'word': word, 'id': int(sign_id)} for word, sign_id in matches]

def main():
    # Load matched signs data
    with open('matched_signs.json', 'r') as f:
        matched_signs = json.load(f)
    
    # Create lookup for sign IDs to common words
    sign_id_to_common = {item['sign_id']: item for item in matched_signs}
    
    # Connect to database
    conn = sqlite3.connect('nzsl.db')
    cursor = conn.cursor()
    
    video_data = []
    
    # Get examples for signs in our matched list (top 300)
    for item in matched_signs[:300]:  # Top 300 most common
        sign_id = item['sign_id']
        
        # Get examples for this sign
        cursor.execute("""
            SELECT word_id, display_order, sentence, translation, video 
            FROM examples 
            WHERE word_id = ? 
            ORDER BY display_order
        """, (sign_id,))
        
        examples = cursor.fetchall()
        
        for word_id, display_order, sentence, translation, video_url in examples:
            # Parse the sign sequence from the sentence
            sign_sequence = parse_sign_sequence(sentence)
            
            video_entry = {
                'word_id': word_id,
                'example_number': display_order,
                'common_word': item['common_word'],
                'rank': item['rank'],
                'confidence': item['confidence'],
                'video_url': video_url,
                'english_translation': translation,
                'sign_sequence': sign_sequence,
                'raw_sentence': sentence
            }
            
            video_data.append(video_entry)
            print(f"Added: {item['common_word']} (rank {item['rank']}) - {translation}")
    
    # Save to JSON
    with open('video_examples.json', 'w') as f:
        json.dump(video_data, f, indent=2)
    
    print(f"\nExtracted {len(video_data)} video examples for the top 300 signs")
    
    # Print some stats
    unique_signs = len(set(item['word_id'] for item in video_data))
    print(f"Covering {unique_signs} unique signs")
    
    # Show a sample
    if video_data:
        print(f"\nSample entry:")
        sample = video_data[0]
        print(json.dumps(sample, indent=2))
    
    conn.close()

if __name__ == "__main__":
    main()
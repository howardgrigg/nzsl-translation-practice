#!/usr/bin/env python3

import json
import sqlite3
import re

def parse_sign_sequence(sentence):
    """Extract sign IDs from sentence notation like 'clothes[1523] plenty[3721]'"""
    if not sentence:
        return []
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
    
    # Get all example videos for signs in our matched list (top 350)
    for item in matched_signs[:350]:  # Top 350 most common
        sign_id = item['sign_id']
        
        # Get the actual word definition from the words table
        cursor.execute("""
            SELECT gloss, minor FROM words WHERE id = ?
        """, (sign_id,))
        
        word_data = cursor.fetchone()
        if word_data:
            actual_gloss, minor_meanings = word_data
        else:
            actual_gloss = item['common_word']  # fallback
            minor_meanings = ""
        
        # Get all example videos for this sign from the videos table
        cursor.execute("""
            SELECT word_id, video_type, url, display_order
            FROM videos 
            WHERE word_id = ? AND video_type LIKE 'finalexample%'
            ORDER BY video_type, display_order
        """, (sign_id,))
        
        videos = cursor.fetchall()
        
        for word_id, video_type, video_url, display_order in videos:
            # Try to get corresponding example data from examples table for context
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
                # If no example data found, use placeholder
                sentence = ""
                translation = f"Example for {item['common_word']}"
                sign_sequence = []
            
            video_entry = {
                'word_id': word_id,
                'example_number': int(video_type.replace('finalexample', '')),
                'video_type': video_type,
                'common_word': item['common_word'],  # keep for reference
                'actual_gloss': actual_gloss,
                'minor_meanings': minor_meanings,
                'rank': item['rank'],
                'confidence': item['confidence'],
                'video_url': video_url,
                'english_translation': translation,
                'sign_sequence': sign_sequence,
                'raw_sentence': sentence
            }
            
            video_data.append(video_entry)
            print(f"Added: {actual_gloss} [{item['common_word']}] (rank {item['rank']}) - {video_type} - {translation}")
    
    # Save to JSON
    with open('video_examples.json', 'w') as f:
        json.dump(video_data, f, indent=2)
    
    print(f"\nExtracted {len(video_data)} video examples for the top 350 signs")
    
    # Print some stats
    unique_signs = len(set(item['word_id'] for item in video_data))
    print(f"Covering {unique_signs} unique signs")
    
    # Show breakdown by example type
    type_counts = {}
    for item in video_data:
        video_type = item['video_type']
        type_counts[video_type] = type_counts.get(video_type, 0) + 1
    
    print(f"\nBreakdown by example type:")
    for video_type in sorted(type_counts.keys()):
        print(f"  {video_type}: {type_counts[video_type]} videos")
    
    # Show a sample
    if video_data:
        print(f"\nSample entry:")
        sample = video_data[0]
        print(json.dumps(sample, indent=2))
    
    conn.close()

if __name__ == "__main__":
    main()
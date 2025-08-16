#!/usr/bin/env python3

import json
import sqlite3
import re

def main():
    # Load matched signs data
    with open('matched_signs.json', 'r') as f:
        matched_signs = json.load(f)
    
    # Connect to database
    conn = sqlite3.connect('nzsl.db')
    cursor = conn.cursor()
    
    # Stats tracking
    total_signs_checked = 0
    signs_with_examples = 0
    signs_without_examples = 0
    total_examples_found = 0
    signs_without_examples_list = []
    
    print("Analyzing top 300 signs for video examples...\n")
    
    # Check each of the top 300 signs
    for item in matched_signs[:300]:
        sign_id = item['sign_id']
        common_word = item['common_word']
        rank = item['rank']
        total_signs_checked += 1
        
        # Get examples for this sign
        cursor.execute("""
            SELECT word_id, display_order, sentence, translation, video 
            FROM examples 
            WHERE word_id = ? 
            ORDER BY display_order
        """, (sign_id,))
        
        examples = cursor.fetchall()
        example_count = len(examples)
        
        if example_count > 0:
            signs_with_examples += 1
            total_examples_found += example_count
            print(f"✅ {common_word:15} (rank {rank:3}) - {example_count} examples")
        else:
            signs_without_examples += 1
            signs_without_examples_list.append({
                'word': common_word,
                'rank': rank,
                'sign_id': sign_id
            })
            print(f"❌ {common_word:15} (rank {rank:3}) - NO examples")
    
    print(f"\n" + "="*60)
    print(f"ANALYSIS RESULTS:")
    print(f"="*60)
    print(f"Total signs checked: {total_signs_checked}")
    print(f"Signs WITH examples: {signs_with_examples}")
    print(f"Signs WITHOUT examples: {signs_without_examples}")
    print(f"Total video examples found: {total_examples_found}")
    print(f"Missing examples: {300 - signs_with_examples} signs have no video examples")
    
    # Show which signs are missing examples
    print(f"\n" + "="*60)
    print(f"SIGNS WITHOUT VIDEO EXAMPLES:")
    print(f"="*60)
    for item in signs_without_examples_list:
        print(f"Rank {item['rank']:3}: {item['word']} (ID: {item['sign_id']})")
    
    # Additional analysis: check if any examples have empty/null video URLs
    cursor.execute("""
        SELECT COUNT(*) 
        FROM examples e
        JOIN (SELECT DISTINCT word_id FROM examples WHERE word_id IN ({})) matched 
        ON e.word_id = matched.word_id
        WHERE e.video IS NULL OR e.video = ''
    """.format(','.join(str(item['sign_id']) for item in matched_signs[:300])))
    
    null_videos = cursor.fetchone()[0]
    print(f"\nAdditional info:")
    print(f"Examples with NULL/empty video URLs: {null_videos}")
    
    conn.close()

if __name__ == "__main__":
    main()
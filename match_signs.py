#!/usr/bin/env python3

import json
import sqlite3
import re
from difflib import SequenceMatcher

def similarity(a, b):
    """Calculate similarity between two strings"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def normalize_word(word):
    """Normalize word for better matching"""
    # Remove special characters and convert to lowercase
    normalized = re.sub(r'[^a-zA-Z\s-]', '', word.lower())
    # Handle common NZSL notation patterns
    normalized = re.sub(r'-neg$', '', normalized)  # Remove negation suffix
    normalized = re.sub(r'^nms-', '', normalized)  # Remove non-manual signals
    normalized = re.sub(r'^ix-', '', normalized)   # Remove indexing
    normalized = re.sub(r'^pcl-', '', normalized)  # Remove classifiers
    normalized = re.sub(r'^mime-', '', normalized) # Remove mime markers
    return normalized.strip()

def find_best_match(target_word, db_words):
    """Find the best matching word in database"""
    normalized_target = normalize_word(target_word)
    best_match = None
    best_score = 0
    
    for word_id, gloss, minor in db_words:
        # Check main gloss
        gloss_words = [w.strip() for w in gloss.split(',')]
        for gloss_word in gloss_words:
            score = similarity(normalized_target, normalize_word(gloss_word))
            if score > best_score:
                best_score = score
                best_match = (word_id, gloss_word, score, 'gloss')
        
        # Check minor meanings if they exist
        if minor:
            minor_words = [w.strip() for w in minor.split(',')]
            for minor_word in minor_words:
                score = similarity(normalized_target, normalize_word(minor_word))
                if score > best_score:
                    best_score = score
                    best_match = (word_id, minor_word, score, 'minor')
    
    return best_match

def main():
    # Load common words
    with open('words.json', 'r') as f:
        common_words = json.load(f)
    
    # Connect to database
    conn = sqlite3.connect('nzsl.db')
    cursor = conn.cursor()
    
    # Get all words from database
    cursor.execute("SELECT id, gloss, minor FROM words")
    db_words = cursor.fetchall()
    
    # Match each common word
    results = []
    for index, word in enumerate(common_words):
        match = find_best_match(word, db_words)
        if match:
            word_id, matched_word, score, source = match
            results.append({
                'rank': index + 1,
                'common_word': word,
                'sign_id': word_id,
                'matched_word': matched_word,
                'confidence': round(score, 3),
                'source': source
            })
            print(f"{index+1:3}. {word:20} -> ID: {word_id:4} ({matched_word}) [{score:.3f}]")
        else:
            results.append({
                'rank': index + 1,
                'common_word': word,
                'sign_id': None,
                'matched_word': None,
                'confidence': 0.0,
                'source': None
            })
            print(f"{index+1:3}. {word:20} -> NO MATCH FOUND")
    
    # Save results
    with open('matched_signs.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    # Print summary
    matched = len([r for r in results if r['sign_id'] is not None])
    print(f"\nMatched {matched} out of {len(common_words)} words ({matched/len(common_words)*100:.1f}%)")
    
    # Print low confidence matches for review
    low_confidence = [r for r in results if r['sign_id'] and r['confidence'] < 0.7]
    if low_confidence:
        print(f"\nLow confidence matches ({len(low_confidence)} words):")
        for r in low_confidence:
            print(f"  {r['common_word']} -> {r['matched_word']} ({r['confidence']:.3f})")
    
    conn.close()

if __name__ == "__main__":
    main()
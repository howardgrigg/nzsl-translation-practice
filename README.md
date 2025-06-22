# NZSL Translation Practice

A web application for practicing New Zealand Sign Language (NZSL) translation skills. Watch signed sentences and test your interpretation against official translations, scored by AI.

## Features

- 554+ video examples from the top 300 most common NZSL signs
- Random video selection with looping playback
- AI-powered scoring (0-10) with feedback using Claude
- Semantic similarity scoring (meaning over exact words)
- Clean, responsive interface
- No user accounts or data persistence needed

## Setup

### Option 1: Docker (Recommended)

1. **Set up Claude API Key**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your API key:
   ```
   ANTHROPIC_API_KEY=your_actual_api_key_here
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

3. **Or run with Docker directly**
   ```bash
   docker build -t nzsl-practice .
   docker run -p 5000:5000 --env-file .env nzsl-practice
   ```

The app will start on `http://localhost:5000`

### Option 2: Local Development

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up Claude API Key**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your API key:
   ```
   ANTHROPIC_API_KEY=your_actual_api_key_here
   ```

3. **Run the Application**
   ```bash
   python app.py
   ```

## How to Use

1. **Watch the video** - NZSL sentences will loop automatically
2. **Type your interpretation** - What do you think the signed sentence means?
3. **Submit for scoring** - Claude AI will score your translation (0-10) and provide feedback
4. **Learn from feedback** - See how your interpretation compares to the official translation
5. **Next video** - Click "Next Video" to practice with a new sentence

## Technical Details

### Architecture
- **Backend**: Flask server proxies Claude API calls to keep API key secure
- **Frontend**: Vanilla HTML/CSS/JS for simplicity
- **Videos**: Streamed directly from AWS S3 (NZSL dictionary hosting)
- **Data**: 554 video examples extracted from SQLite database

### Video Data Structure
Each video example includes:
- Video URL (AWS S3)
- Official English translation
- Sign sequence (list of signs in order)
- Common word rank (frequency data)
- Example number for that sign

### Scoring Logic
Claude evaluates translations based on:
- Semantic meaning similarity
- Context understanding
- Allowance for different valid interpretations
- Focus on communication success over exact wording

## File Structure

```
├── app.py                 # Flask backend server
├── index.html            # Main webpage
├── script.js             # Frontend JavaScript
├── video_examples.json   # Video data (554 examples)
├── matched_signs.json    # Sign ID mappings
├── requirements.txt      # Python dependencies
├── .env.example         # Environment variables template
└── README.md           # This file
```

## Notes

- Videos are streamed from external S3 hosting - no local storage required
- Each browser reload starts fresh (no session persistence)
- Designed for personal study use
- Requires internet connection for video streaming and AI scoring
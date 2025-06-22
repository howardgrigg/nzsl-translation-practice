# NZSL Interpretation Practice

A web application for practicing New Zealand Sign Language (NZSL) interpretation skills. Watch signed sentences and test your interpretation against official translations, scored by AI.

## Features

- **554+ video examples** from the top 300 most common NZSL signs
- **AI-powered scoring** (0-10) with personalized feedback using Claude 3.5 Haiku
- **Interpretation history tracking** with localStorage - view past attempts and track improvement
- **Progress statistics** showing average scores and improvement trends
- **Video speed control** - watch at normal or half speed for better comprehension
- **Responsive design** optimized for desktop and mobile devices
- **Semantic scoring** - focuses on meaning rather than exact word matching
- **Replay functionality** - revisit any previous sentence from your history

## Setup

### Prerequisites

- **Claude API Key**: Sign up at [Anthropic](https://console.anthropic.com/) to get your API key
- **Docker** (for Option 1) or **Python 3.11+** (for Option 2)

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NZSLInterpreting
   ```

2. **Set up Claude API Key**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your API key:
   ```
   ANTHROPIC_API_KEY=your_actual_api_key_here
   ```

3. **Run with Docker Compose**
   ```bash
   docker-compose up --build
   ```
   The app will start on `http://localhost:20254`

4. **Alternative: Run with Docker directly**
   ```bash
   docker build -t nzsl-practice .
   docker run -p 5000:5000 --env-file .env nzsl-practice
   ```
   The app will start on `http://localhost:5000`

### Option 2: Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NZSLInterpreting
   ```

2. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up Claude API Key**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your API key:
   ```
   ANTHROPIC_API_KEY=your_actual_api_key_here
   ```

4. **Run the Application**
   ```bash
   python app.py
   ```
   The app will start on `http://localhost:5000`

## How to Use

1. **Watch the video** - NZSL sentences will loop automatically (use speed controls if needed)
2. **Type your interpretation** - What do you think the signed sentence means?
3. **Submit for scoring** - Claude AI will score your translation (0-10) and provide feedback
4. **Review results** - See how your interpretation compares to the official translation
5. **Track progress** - View your practice history and improvement statistics
6. **Next video** - Click the green "Next Video" button to practice with a new sentence
7. **Replay videos** - Use the history modal to revisit previous sentences

### Features in Detail

- **Speed Control**: Toggle between normal and half-speed playback
- **Interpretation History**: All attempts are saved locally in your browser
- **Progress Tracking**: See total interpretations, average score, and improvement trends
- **Clear History**: Option to reset your practice history if needed

## Technical Details

### Architecture
- **Backend**: Flask server (Python) proxies Claude API calls to keep API key secure
- **Frontend**: Vanilla HTML/CSS/JavaScript with localStorage for history
- **Videos**: Streamed directly from AWS S3 (NZSL dictionary hosting)
- **Data**: 554 video examples extracted from SQLite database
- **AI Model**: Claude 3.5 Haiku for semantic scoring and feedback

### Video Data Structure
Each video example includes:
- Video URL (AWS S3 hosted)
- Official English translation
- Sign sequence (ordered list of signs)
- Common word rank (based on frequency research)
- Dictionary word ID for reference links

### AI Scoring Logic
Claude 3.5 Haiku evaluates interpretations based on:
- **Semantic meaning similarity** - understanding core concepts
- **Context awareness** - recognizing perspective (I/you/they)
- **Flexible interpretation** - allowing valid alternative phrasings
- **Communication success** - prioritizing meaning over exact wording
- **Encouraging feedback** - providing constructive guidance for improvement

### Data Sources
- **Video content**: NZSL.nz dictionary (Deaf Studies Research Unit, Victoria University of Wellington)
- **Sign frequency**: McKee, D., & Kennedy, G. D. (2006). The distribution of signs in New Zealand sign language. *Sign Language Studies*, *6*(4), 372-390.

## File Structure

```
├── app.py                 # Flask backend server
├── index.html            # Main webpage with embedded CSS
├── script.js             # Frontend JavaScript application
├── video_examples.json   # Video data (554 examples)
├── matched_signs.json    # Sign ID mappings from common words
├── words.json           # Top 300 most common NZSL signs
├── requirements.txt     # Python dependencies
├── Dockerfile          # Docker container configuration
├── docker-compose.yml  # Docker Compose setup
├── .env.example       # Environment variables template
├── .gitignore        # Git ignore patterns
└── README.md        # This documentation
```

## API Costs

The app uses Claude 3.5 Haiku which is very cost-effective:
- **Input**: $1.00 per 1M tokens
- **Output**: $5.00 per 1M tokens
- **Typical interpretation scoring**: ~$0.001-0.002 per attempt
- **Usage tracking**: Built-in cost monitoring in the Flask app

## Notes

- **Data Privacy**: All interpretation history is stored locally in your browser (localStorage)
- **Internet Required**: Videos stream from external hosting, AI scoring requires API access
- **No Registration**: No user accounts or server-side data storage
- **Mobile Friendly**: Responsive design works on phones and tablets
- **Educational Use**: Designed for personal NZSL learning and practice

## Contributing

This project was created for personal learning but contributions are welcome. Feel free to:
- Report issues or suggest improvements
- Submit pull requests for new features
- Share feedback on the learning experience

## License

This project uses video content from the NZSL dictionary under appropriate attribution. See the About section in the app for full data source credits.
# NZSL Translation Practice

A comprehensive web application for practicing New Zealand Sign Language (NZSL) with two integrated learning modes: interpretation practice and grammar practice. Master both comprehension and sentence structure through interactive exercises with AI-powered feedback.

## Features

### 🎬 Interpretation Practice
- **437 video examples** from the top 350 most common NZSL signs (covering 297 unique signs)
- **AI-powered scoring** (0-10) with personalized feedback using Claude 3.5 Haiku
- **Interpretation history tracking** with localStorage - view past attempts and track improvement
- **Progress statistics** showing average scores and improvement trends
- **Video speed control** - watch at normal or half speed for better comprehension
- **Clickable sign glosses** - tap any sign in the sequence to see definition videos
- **Semantic scoring** - focuses on meaning rather than exact word matching
- **Replay functionality** - revisit any previous sentence from your history

### 🧩 Grammar Practice
- **5,347 NZSL sentence examples** for comprehensive grammar practice
- **Advanced drag-and-drop interface** with position indicators and reordering
- **Sophisticated partial scoring** using consecutive joins algorithm
- **Real-time visual feedback** with ✅/❌ emojis between word tokens
- **Clickable correct answers** - tap glosses to see sign definition videos
- **Hint system** with video examples (2-point penalty)
- **10-question sessions** with streamlined scoring (out of 100 points)
- **Unique token tracking** to handle duplicate words correctly

### 🌐 Shared Features
- **Tab-based interface** - seamlessly switch between practice modes
- **URL hash navigation** - direct linking (`#grammar`, `#interpretation`)
- **Responsive design** optimized for desktop and mobile devices
- **Progressive Web App (PWA)** - installable on mobile devices and desktop
- **Automatic dark mode** - follows your system/browser theme preference
- **Consistent styling** across both practice modes

## Setup

### Prerequisites

- **Claude API Key**: Sign up at [Anthropic](https://console.anthropic.com/) to get your API key
- **Docker** (for Option 1) or **Python 3.11+** (for Option 2)

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nzsl-translation-practice
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
   cd nzsl-translation-practice
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

### 🎬 Interpretation Practice Mode
1. **Watch the video** - NZSL sentences will loop automatically (use speed controls if needed)
2. **Type your interpretation** - What do you think the signed sentence means?
3. **Submit for scoring** - Claude AI will score your translation (0-10) and provide feedback
4. **Review results** - See how your interpretation compares to the official translation
5. **Explore sign details** - Click on any sign in the sequence to see definition videos
6. **Track progress** - View your practice history and improvement statistics
7. **Next video** - Click the green "Next Video" button to practice with a new sentence

### 🧩 Grammar Practice Mode
1. **Read the English sentence** - Understand what needs to be translated into NZSL
2. **Drag and drop words** - Arrange the provided NZSL glosses in the correct order
3. **Use position indicators** - Visual guides show where words will be placed
4. **Get hints if needed** - Video examples available (2-point penalty)
5. **Submit your answer** - See partial scoring with ✅/❌ feedback between words
6. **Review correct order** - Click on glosses in the correct answer to see definitions
7. **Continue practicing** - Work through 10-question sessions

### 🌐 Navigation
- **Switch tabs** - Use "📹 Interpretation Practice" and "🧩 Grammar Practice" tabs
- **Direct linking** - Share specific modes: 
  - Grammar: `http://localhost:20254/#grammar`
  - Interpretation: `http://localhost:20254/#interpretation`

### Features in Detail

- **Speed Control** (Interpretation): Toggle between normal and half-speed playback
- **Drag & Drop** (Grammar): Advanced interface with reordering and duplicate word handling
- **Interpretation History**: All attempts are saved locally in your browser
- **Progress Tracking**: See total interpretations, average score, and improvement trends
- **Clickable Glosses**: Tap any sign gloss to view definition videos in popup modal
- **Visual Feedback**: Real-time emoji indicators show correct/incorrect word connections

## Technical Details

### Architecture
- **Backend**: Flask server (Python) with SQLite database and Claude API integration
- **Frontend**: Vanilla HTML/CSS/JavaScript with advanced DOM manipulation
- **Data Storage**: SQLite database with 5,347+ NZSL sentences and sign definitions
- **Videos**: Streamed directly from AWS S3 (NZSL dictionary hosting)
- **AI Model**: Claude 3.5 Haiku for semantic scoring and personalized feedback
- **Client Storage**: localStorage for interpretation history and progress tracking

### Data Structure

#### Interpretation Practice Data
Each video example includes:
- Video URL (AWS S3 hosted)
- Official English translation
- Enhanced sign sequence with definition videos
- Common word rank (based on frequency research)
- Dictionary word ID for cross-referencing

#### Grammar Practice Data
Each sentence example includes:
- English sentence for translation
- NZSL gloss sequence with sign IDs
- Parsed sign data for clickable glosses
- Video examples for hints
- Structured for partial scoring algorithm

### Scoring Systems

#### AI Interpretation Scoring (Claude 3.5 Haiku)
Evaluates interpretations based on:
- **Semantic meaning similarity** - understanding core concepts
- **Context awareness** - recognizing perspective (I/you/they)
- **Flexible interpretation** - allowing valid alternative phrasings
- **Communication success** - prioritizing meaning over exact wording
- **Encouraging feedback** - providing constructive guidance for improvement

#### Grammar Partial Scoring Algorithm
Advanced consecutive joins scoring:
- **Exact match bonus** - Full points for perfect word order
- **Consecutive segments** - Partial credit for correct word sequences
- **Position awareness** - Rewards properly placed word groups
- **Hint penalties** - 2-point deduction for video assistance
- **Real-time feedback** - Emoji indicators show correct/incorrect joins

### Data Sources
- **Video content**: NZSL.nz dictionary (Deaf Studies Research Unit, Victoria University of Wellington)
- **Grammar sentences**: NZSL.nz sentence corpus (5,347+ examples)
- **Sign frequency**: McKee, D., & Kennedy, G. D. (2006). The distribution of signs in New Zealand sign language. *Sign Language Studies*, *6*(4), 372-390.
- **Database structure**: Comprehensive SQLite database with signs, videos, examples, and definitions

## File Structure

```
├── app.py                 # Flask backend server with dual game support
├── index.html            # Main webpage with tab interface
├── script.js             # Frontend JavaScript for both practice modes
├── nzsl.db               # SQLite database with 5,347+ sentences and definitions
├── matched_signs.json    # Sign ID mappings for interpretation practice
├── requirements.txt      # Python dependencies
├── Dockerfile           # Docker container configuration  
├── docker-compose.yml   # Docker Compose setup
├── .env.example        # Environment variables template
├── .gitignore         # Git ignore patterns
├── NZSLGrammar/       # Grammar practice game assets
│   ├── game_data.js   # 5,347 NZSL sentence examples
│   ├── game_data.tsv  # Raw TSV data source
│   ├── game.js        # Original standalone game logic
│   ├── index.html     # Original standalone game interface
│   └── styles.css     # Grammar-specific styling
├── assets/            # Static assets directory
│   └── icons/         # Favicons and web app manifest
│       ├── favicon.ico
│       ├── apple-touch-icon.png
│       ├── android-chrome-*.png
│       └── site.webmanifest
└── README.md         # This documentation
```

## API Costs

The app uses Claude 3.5 Haiku for interpretation scoring (grammar practice is client-side):
- **Input**: $1.00 per 1M tokens
- **Output**: $5.00 per 1M tokens
- **Typical interpretation scoring**: ~$0.001-0.002 per attempt
- **Grammar practice**: No API costs (local scoring algorithm)
- **Usage tracking**: Built-in cost monitoring in the Flask app

## Notes

- **Data Privacy**: All practice history is stored locally in your browser (localStorage)
- **Internet Required**: Videos stream from external hosting, interpretation scoring requires API access
- **Offline Grammar**: Grammar practice works offline (no API required)
- **No Registration**: No user accounts or server-side data storage
- **Mobile Friendly**: Responsive design with touch-optimized drag-and-drop
- **PWA Support**: Can be installed as an app on mobile devices and desktop
- **Educational Use**: Designed for comprehensive NZSL learning and practice
- **Accessibility**: Keyboard navigation support and screen reader compatibility

## Contributing

This project was created for personal learning but contributions are welcome. Feel free to:
- Report issues or suggest improvements
- Submit pull requests for new features
- Share feedback on the learning experience

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0)** to be compatible with the NZSL Dictionary content used.

### Key Points:
- ✅ **Free to use** for educational and non-commercial purposes
- ✅ **Can modify and redistribute** with proper attribution
- ✅ **Must share adaptations** under the same license
- ❌ **No commercial use** without permission

### Attribution Requirements:
This application uses content from the [NZSL Dictionary](https://nzsl.nz) (© Victoria University of Wellington) which is licensed under CC BY-NC-SA 3.0. Our application code is compatible under CC BY-NC-SA 4.0.

**For commercial use**: Contact howard@gri.gg for licensing options.

See the [LICENSE](LICENSE) file for complete terms.
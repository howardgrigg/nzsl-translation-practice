'use strict';

// Tab functionality
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and content
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
}

// Initialize tabs when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
});

class NZSLPractice {
    constructor() {
        this.currentVideo = null;
        this.preloadedVideo = null; // Store preloaded next video
        this.preloadedVideoElement = null; // Store preloaded video element
        this.practiceHistory = this.loadPracticeHistory();
        this.initializeElements();
        this.setupEventListeners();
        this.updateStatsDisplay();
        this.initializeDarkMode();
        this.loadRandomVideo(); // Load first video
    }

    initializeElements() {
        this.video = document.getElementById('signVideo');
        this.videoLoading = document.getElementById('videoLoading');
        this.videoInfo = document.getElementById('videoInfo');
        this.signSequence = document.getElementById('signSequence');
        this.userTranslation = document.getElementById('userTranslation');
        this.submitBtn = document.getElementById('submitBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.speedBtn = document.getElementById('speedBtn');
        this.results = document.getElementById('results');
        this.loading = document.getElementById('loading');
        this.scoreNumber = document.getElementById('scoreNumber');
        this.feedbackText = document.getElementById('feedbackText');
        this.userTranslationDisplay = document.getElementById('userTranslationDisplay');
        this.originalTranslationDisplay = document.getElementById('originalTranslationDisplay');
        this.wordInfo = document.getElementById('wordInfo');
        this.statsDisplay = document.getElementById('statsDisplay');
        this.historyBtn = document.getElementById('historyBtn');
        this.historyModal = document.getElementById('historyModal');
        this.historyList = document.getElementById('historyList');
        this.closeHistory = document.getElementById('closeHistory');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        
        // Definition modal elements
        this.definitionModal = document.getElementById('definitionModal');
        this.definitionVideo = document.getElementById('definitionVideo');
        this.definitionTitle = document.getElementById('definitionTitle');
        this.definitionMeanings = document.getElementById('definitionMeanings');
        this.closeDefinition = document.getElementById('closeDefinition');
    }

    async loadRandomVideo() {
        try {
            // Check if we have a preloaded video ready
            if (this.preloadedVideo && this.preloadedVideoElement) {
                // Use preloaded video data and element
                this.currentVideo = this.preloadedVideo;
                this.preloadedVideo = null;
                
                // Show loading state briefly for smooth transition
                this.resetUI();
                this.videoLoading.style.display = 'flex';
                this.videoInfo.textContent = 'Loading video...';
                
                // Use the preloaded video element's source (already loaded)
                this.video.src = this.preloadedVideoElement.src;
                this.video.load();
                
                // Clean up preloaded element
                this.preloadedVideoElement = null;
                
                // Update sign sequence display
                this.updateSignSequence();
                
                return;
            }
            
            // No preloaded video available, fetch normally
            this.resetUI();
            this.videoLoading.style.display = 'flex';
            this.videoInfo.textContent = 'Loading video...';
            
            // Fetch random video from server
            const response = await fetch('/random_video');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.currentVideo = await response.json();
            
            // Load video
            this.video.src = this.currentVideo.video_url;
            this.video.load();
            
            // Update sign sequence display
            this.updateSignSequence();
            
        } catch (error) {
            console.error('Error loading video:', error);
            this.videoLoading.style.display = 'none';
            this.videoInfo.textContent = 'Error loading video. Please refresh the page or try again.';
            
            // Show retry button
            this.videoInfo.innerHTML = `
                Error loading video. 
                <button onclick="app.loadRandomVideo()" style="margin-left: 10px; padding: 5px 10px; cursor: pointer;">
                    Try Again
                </button>
            `;
        }
    }

    async preloadNextVideo() {
        try {
            // Don't preload if we already have a preloaded video
            if (this.preloadedVideo && this.preloadedVideoElement) return;
            
            console.log('Preloading next video data...');
            const response = await fetch('/random_video');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.preloadedVideo = await response.json();
            console.log('Next video data preloaded successfully');
            
            // Now preload the actual video file
            console.log('Preloading video file...');
            this.preloadedVideoElement = document.createElement('video');
            this.preloadedVideoElement.preload = 'auto';
            this.preloadedVideoElement.muted = true;
            this.preloadedVideoElement.playsInline = true;
            
            // Create a promise to track video loading
            const videoLoadPromise = new Promise((resolve, reject) => {
                const onCanPlay = () => {
                    console.log('Video file preloaded successfully');
                    this.preloadedVideoElement.removeEventListener('canplay', onCanPlay);
                    this.preloadedVideoElement.removeEventListener('error', onError);
                    resolve();
                };
                
                const onError = (error) => {
                    console.error('Error preloading video file:', error);
                    this.preloadedVideoElement.removeEventListener('canplay', onCanPlay);
                    this.preloadedVideoElement.removeEventListener('error', onError);
                    // Don't reject - just continue without preloaded video
                    this.preloadedVideoElement = null;
                    resolve();
                };
                
                this.preloadedVideoElement.addEventListener('canplay', onCanPlay);
                this.preloadedVideoElement.addEventListener('error', onError);
            });
            
            // Start loading the video
            this.preloadedVideoElement.src = this.preloadedVideo.video_url;
            this.preloadedVideoElement.load();
            
            // Wait for video to be ready (or fail silently)
            await videoLoadPromise;
            
        } catch (error) {
            console.error('Error preloading next video:', error);
            // Clean up on error
            this.preloadedVideo = null;
            this.preloadedVideoElement = null;
            // Fail silently - user will just get normal loading experience
        }
    }

    setupEventListeners() {
        this.submitBtn.addEventListener('click', () => this.submitTranslation());
        this.nextBtn.addEventListener('click', () => this.loadRandomVideo());
        this.speedBtn.addEventListener('click', () => this.toggleSpeed());
        this.historyBtn?.addEventListener('click', () => this.showHistory());
        this.closeHistory?.addEventListener('click', () => this.hideHistory());
        this.clearHistoryBtn?.addEventListener('click', () => this.clearHistory());
        
        // Definition modal event listeners
        this.closeDefinition?.addEventListener('click', () => this.hideDefinitionModal());
        this.definitionModal?.addEventListener('click', (e) => {
            if (e.target === this.definitionModal) {
                this.hideDefinitionModal();
            }
        });
        
        // Submit on Enter (but allow Shift+Enter for new lines)
        this.userTranslation.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.submitTranslation();
            }
        });

        // Auto-resize textarea
        this.userTranslation.addEventListener('input', () => {
            this.autoResizeTextarea();
        });

        // Video event listeners
        this.video.addEventListener('loadstart', () => {
            this.videoLoading.style.display = 'flex';
            this.videoInfo.textContent = '';
        });

        this.video.addEventListener('canplay', () => {
            this.videoLoading.style.display = 'none';
            this.updateVideoInfo();
        });

        this.video.addEventListener('error', (e) => {
            console.error('Video error:', e);
            this.videoLoading.style.display = 'none';
            this.videoInfo.textContent = 'Error loading video. Trying next video...';
            setTimeout(() => this.loadRandomVideo(), 2000);
        });

        // Click outside modal to close
        this.historyModal?.addEventListener('click', (e) => {
            if (e.target === this.historyModal) {
                this.hideHistory();
            }
        });
    }

    // loadRandomVideo method is now defined above

    updateSignSequence() {
        if (!this.currentVideo.sign_sequence) {
            this.signSequence.textContent = 'No sign sequence available';
            return;
        }
        
        const signsHTML = this.currentVideo.sign_sequence.map(sign => 
            `<span class="sign-word" data-sign-id="${sign.id}" title="Tap to see definition">${sign.word}</span>`
        ).join(' → ');
        
        this.signSequence.innerHTML = `Signs: ${signsHTML}`;
        
        // Add click event listeners to sign words
        this.signSequence.querySelectorAll('.sign-word').forEach(wordElement => {
            wordElement.addEventListener('click', (e) => {
                const signId = e.target.dataset.signId;
                if (signId) {
                    // Find the sign data in the current video's sign sequence
                    const signData = this.currentVideo.sign_sequence.find(sign => sign.id == signId);
                    if (signData && signData.definition_video_url) {
                        this.showDefinitionVideo(signData);
                    } else {
                        console.log('No definition video available for this sign');
                    }
                }
            });
        });
    }

    updateVideoInfo() {
        if (!this.currentVideo) return;
        
        // Keep it blank once video is ready
        this.videoInfo.textContent = '';
    }

    resetUI() {
        this.userTranslation.value = '';
        this.results.style.display = 'none';
        this.loading.style.display = 'none';
        this.signSequence.style.display = 'none'; // Hide sign sequence for new video
        this.videoLoading.style.display = 'flex'; // Show loading animation
        
        // Reset video speed to normal
        this.video.playbackRate = 1;
        this.speedBtn.textContent = 'Normal Speed';
        this.speedBtn.classList.remove('slow');
        
        // Reset button states to initial
        this.updateButtonStates('initial');
        
        this.autoResizeTextarea();
    }

    updateButtonStates(state) {
        if (state === 'initial') {
            // Initial state: submit button enabled and primary, next button secondary
            this.submitBtn.disabled = false;
            this.submitBtn.className = 'btn-primary';
            this.nextBtn.className = 'btn-secondary';
        } else if (state === 'submitted') {
            // After submission: submit button disabled, next button becomes primary green
            this.submitBtn.disabled = true;
            this.submitBtn.className = 'btn-primary btn-disabled';
            this.nextBtn.className = 'btn-primary btn-success';
        }
    }

    autoResizeTextarea() {
        this.userTranslation.style.height = 'auto';
        this.userTranslation.style.height = Math.max(100, this.userTranslation.scrollHeight) + 'px';
    }

    toggleSpeed() {
        if (this.video.playbackRate === 1) {
            // Switch to half speed
            this.video.playbackRate = 0.5;
            this.speedBtn.textContent = 'Half Speed';
            this.speedBtn.classList.add('slow');
        } else {
            // Switch back to normal speed
            this.video.playbackRate = 1;
            this.speedBtn.textContent = 'Normal Speed';
            this.speedBtn.classList.remove('slow');
        }
    }

    async submitTranslation() {
        const userText = this.userTranslation.value.trim();
        
        if (!userText) {
            alert('Please enter your interpretation first.');
            return;
        }

        if (!this.currentVideo) {
            alert('No video loaded. Please try again.');
            return;
        }

        // Show loading state
        this.loading.style.display = 'block';
        this.submitBtn.disabled = true;

        try {
            const response = await fetch('/score_translation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    original_translation: this.currentVideo.english_translation,
                    user_translation: userText,
                    sign_sequence: this.currentVideo.sign_sequence || []
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.displayResults(result, userText);
            
            // Start preloading the next video after successful submission
            this.preloadNextVideo();

        } catch (error) {
            console.error('Error scoring interpretation:', error);
            alert('Error scoring interpretation. Please try again.');
        } finally {
            this.loading.style.display = 'none';
            this.submitBtn.disabled = false;
        }
    }

    displayResults(result, userText) {
        // Display score with color coding
        const score = Math.round(result.score * 10) / 10; // Round to 1 decimal place
        this.scoreNumber.textContent = score;
        
        // Remove existing score classes
        this.scoreNumber.className = 'score-number';
        
        // Add appropriate color class
        if (score <= 3) {
            this.scoreNumber.classList.add('score-0-3');
        } else if (score <= 6) {
            this.scoreNumber.classList.add('score-4-6');
        } else if (score <= 8) {
            this.scoreNumber.classList.add('score-7-8');
        } else {
            this.scoreNumber.classList.add('score-9-10');
        }

        // Display feedback
        this.feedbackText.textContent = result.feedback;

        // Display interpretations
        this.userTranslationDisplay.textContent = userText;
        this.originalTranslationDisplay.textContent = this.currentVideo.english_translation;

        // Show sign sequence now that they've submitted
        this.signSequence.style.display = 'block';

        // Show word information and dictionary link
        const actualGloss = this.currentVideo.actual_gloss || this.currentVideo.common_word;
        const minorMeanings = this.currentVideo.minor_meanings;
        const displayText = minorMeanings ? `${actualGloss} (${minorMeanings})` : actualGloss;
        
        this.wordInfo.innerHTML = `
            <div class="word-details">
                Sign: <strong>${displayText}</strong> • 
                Rank: <strong>#${this.currentVideo.rank}</strong>
            </div>
            <a href="https://www.nzsl.nz/signs/${this.currentVideo.word_id}" target="_blank" class="dictionary-link">
                View in NZSL Dictionary
            </a>
        `;

        // Show results
        this.results.style.display = 'block';
        this.results.scrollIntoView({ behavior: 'smooth' });

        // Save to practice history
        this.savePracticeSession(userText, result.score);

        // Update button states after displaying results
        this.updateButtonStates('submitted');
    }

    // Practice history management
    loadPracticeHistory() {
        try {
            const history = localStorage.getItem('nzsl_practice_history');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error loading practice history:', error);
            return [];
        }
    }

    savePracticeSession(userTranslation, score) {
        if (!this.currentVideo) return;

        const session = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            videoId: this.currentVideo.example_id,
            commonWord: this.currentVideo.common_word,
            actualGloss: this.currentVideo.actual_gloss,
            minorMeanings: this.currentVideo.minor_meanings,
            rank: this.currentVideo.rank,
            videoUrl: this.currentVideo.video_url,
            englishTranslation: this.currentVideo.english_translation,
            signSequence: this.currentVideo.sign_sequence,
            userTranslation: userTranslation,
            score: score
        };

        this.practiceHistory.unshift(session); // Add to beginning
        
        // Keep only last 100 sessions to avoid localStorage bloat
        if (this.practiceHistory.length > 100) {
            this.practiceHistory = this.practiceHistory.slice(0, 100);
        }

        try {
            localStorage.setItem('nzsl_practice_history', JSON.stringify(this.practiceHistory));
            this.updateStatsDisplay();
        } catch (error) {
            console.error('Error saving practice history:', error);
        }
    }

    updateStatsDisplay() {
        if (!this.statsDisplay) return;

        if (this.practiceHistory.length === 0) {
            this.statsDisplay.innerHTML = '<div class="stats-text">Start practicing to see your progress!</div>';
            return;
        }

        const totalInterpretations = this.practiceHistory.length;
        const averageScore = this.practiceHistory.reduce((sum, session) => sum + session.score, 0) / totalInterpretations;
        
        // Calculate improvement (last 10 vs previous 10)
        let improvementText = '';
        if (totalInterpretations >= 20) {
            const recent = this.practiceHistory.slice(0, 10);
            const previous = this.practiceHistory.slice(10, 20);
            const recentAvg = recent.reduce((sum, s) => sum + s.score, 0) / 10;
            const previousAvg = previous.reduce((sum, s) => sum + s.score, 0) / 10;
            const improvement = recentAvg - previousAvg;
            
            if (improvement > 0.5) {
                improvementText = '<div class="improvement positive">🎉 Improving! +' + improvement.toFixed(1) + ' points</div>';
            } else if (improvement < -0.5) {
                improvementText = '<div class="improvement negative">Keep practicing! -' + Math.abs(improvement).toFixed(1) + ' points</div>';
            } else {
                improvementText = '<div class="improvement stable">📊 Steady progress!</div>';
            }
        }

        this.statsDisplay.innerHTML = `
            <div class="stats-summary">
                <span class="stat-item">Interpretations: <strong>${totalInterpretations}</strong></span>
                <span class="stat-item">Average: <strong>${averageScore.toFixed(1)}/10</strong></span>
            </div>
            ${improvementText}
        `;
    }

    showHistory() {
        if (!this.historyModal) return;

        this.renderHistoryList();
        this.historyModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    hideHistory() {
        if (!this.historyModal) return;
        
        this.historyModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    renderHistoryList() {
        if (!this.historyList) return;

        if (this.practiceHistory.length === 0) {
            this.historyList.innerHTML = '<div class="no-history">No interpretations yet. Start practicing to build your history!</div>';
            return;
        }

        const historyHTML = this.practiceHistory.map(session => {
            const date = new Date(session.timestamp).toLocaleDateString();
            const time = new Date(session.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const scoreClass = this.getScoreClass(session.score);
            
            // Use actual gloss if available, fallback to commonWord for older sessions
            const displayWord = session.actualGloss || session.commonWord;
            
            return `
                <div class="history-item" data-session-id="${session.id}">
                    <div class="history-header">
                        <span class="history-word">${displayWord}</span>
                        <span class="history-score ${scoreClass}">${session.score}/10</span>
                    </div>
                    <div class="history-meta">
                        <span class="history-date">${date} ${time}</span>
                        <span class="history-rank">Rank #${session.rank}</span>
                    </div>
                    <div class="history-translations">
                        <div class="history-user">You: "${session.userTranslation.replace(/"/g, '&quot;')}"</div>
                        <div class="history-official">Official: "${session.englishTranslation.replace(/"/g, '&quot;')}"</div>
                    </div>
                    <button class="replay-btn" onclick="app.replaySession('${session.id}')">Replay Video</button>
                </div>
            `;
        }).join('');

        this.historyList.innerHTML = historyHTML;
    }

    getScoreClass(score) {
        if (score <= 3) return 'score-0-3';
        if (score <= 6) return 'score-4-6';
        if (score <= 8) return 'score-7-8';
        return 'score-9-10';
    }

    replaySession(sessionId) {
        const session = this.practiceHistory.find(s => s.id == sessionId);
        if (!session) return;

        // Set current video to the session video
        this.currentVideo = {
            example_id: session.videoId,
            common_word: session.commonWord,
            actual_gloss: session.actualGloss,
            minor_meanings: session.minorMeanings,
            rank: session.rank,
            video_url: session.videoUrl,
            english_translation: session.englishTranslation,
            sign_sequence: session.signSequence
        };

        // Reset UI and load the video
        this.resetUI();
        this.video.src = this.currentVideo.video_url;
        this.video.load();
        this.updateSignSequence();

        // Close history modal
        this.hideHistory();

        // Scroll to video
        document.querySelector('.video-container').scrollIntoView({ behavior: 'smooth' });
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all interpretation history? This cannot be undone.')) {
            this.practiceHistory = [];
            localStorage.removeItem('nzsl_practice_history');
            this.updateStatsDisplay();
            this.renderHistoryList();
        }
    }

    // Definition modal functionality
    showDefinitionVideo(signData) {
        try {
            // Update modal content directly from embedded data
            this.definitionTitle.textContent = `Sign: ${signData.gloss}`;
            this.definitionVideo.src = signData.definition_video_url;
            
            // Show meanings if available
            if (signData.minor_meanings) {
                this.definitionMeanings.innerHTML = `
                    <h4>Alternative meanings:</h4>
                    <p>${signData.minor_meanings}</p>
                `;
            } else {
                this.definitionMeanings.innerHTML = '';
            }

            // Show modal
            this.definitionModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

        } catch (error) {
            console.error('Error loading definition video:', error);
            this.definitionTitle.textContent = 'Definition not available';
            this.definitionMeanings.innerHTML = '<p>Sorry, the definition video for this sign could not be loaded.</p>';
        }
    }

    hideDefinitionModal() {
        this.definitionModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Stop the video
        this.definitionVideo.pause();
        this.definitionVideo.src = '';
    }

    // Dark mode functionality - follows browser/system preference
    initializeDarkMode() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Apply theme based on system preference
        if (prefersDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }

        // Listen for system theme changes and update automatically
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (e.matches) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
            }
        });
    }
}

// Shared utility function for creating clickable glosses
function createClickableGlosses(signSequence, clickHandler) {
    if (!signSequence || signSequence.length === 0) {
        return 'No sign sequence available';
    }
    
    const signsHTML = signSequence.map(sign => 
        `<span class="sign-word" data-sign-id="${sign.id}" title="Tap to see definition">${sign.word}</span>`
    ).join(' → ');
    
    return `${signsHTML}`;
}

// Function to parse NZSL sequence string into sign objects
function parseNZSLSequence(nzslString) {
    if (!nzslString) return [];
    
    const pattern = /([a-zA-Z\-\^:]+)\[(\d+)\]/g;
    const signs = [];
    let match;
    
    while ((match = pattern.exec(nzslString)) !== null) {
        signs.push({
            word: match[1],
            id: parseInt(match[2])
        });
    }
    
    return signs;
}

class NZSLGrammarGame {
    constructor() {
        this.currentQuestion = 0;
        this.score = 0;
        this.totalQuestions = Math.min(10, gameData.length);
        this.gameQuestions = [];
        this.currentAnswer = [];
        this.correctAnswer = [];
        this.hintUsed = false;
        this.dropZoneSetup = false;
        
        // Touch drag properties
        this.touchStartTime = 0;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isDragging = false;
        this.potentialDrag = false;
        this.draggedElement = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.startGame();
    }

    initializeElements() {
        this.englishText = document.getElementById('english-text');
        this.availableWords = document.getElementById('available-words');
        this.answerZone = document.getElementById('answer-zone');
        this.hintBtn = document.getElementById('hint-btn');
        this.dictionaryBtn = document.getElementById('dictionary-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.submitBtn = document.getElementById('submit-btn-grammar');
        this.nextBtn = document.getElementById('next-btn-grammar');
        this.scoreElement = document.getElementById('grammar-score');
        this.currentQuestionElement = document.getElementById('current-question');
        this.totalQuestionsElement = document.getElementById('total-questions');
        this.videoHint = document.getElementById('video-hint');
        this.hintVideo = document.getElementById('hint-video');
    }

    setupEventListeners() {
        this.hintBtn.addEventListener('click', () => this.showHint());
        this.dictionaryBtn.addEventListener('click', () => this.openDictionary());
        this.clearBtn.addEventListener('click', () => this.clearAnswer());
        this.submitBtn.addEventListener('click', () => this.submitAnswer());
        this.nextBtn.addEventListener('click', () => this.nextQuestion());
    }

    startGame() {
        // Shuffle the game data and select questions
        this.gameQuestions = this.shuffleArray([...gameData]).slice(0, this.totalQuestions);
        this.totalQuestionsElement.textContent = this.totalQuestions;
        this.loadQuestion();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    parseNZSLGloss(nzslString) {
        // Extract words from the NZSL gloss, removing the [id] parts
        return nzslString.split(' ').map(word => {
            // Handle special cases like ^fs:bnz and ^cl:point-armpit
            if (word.startsWith('^')) {
                return word;
            }
            // Remove the [id] part
            return word.replace(/\[\d+\]/, '');
        });
    }

    loadQuestion() {
        if (this.currentQuestion >= this.totalQuestions) {
            this.endGame();
            return;
        }

        const question = this.gameQuestions[this.currentQuestion];
        this.englishText.textContent = question.english;
        
        // Parse the correct NZSL answer
        this.correctAnswer = this.parseNZSLGloss(question.nzsl);
        
        // Parse the sign sequence for clickable glosses
        this.currentSignSequence = parseNZSLSequence(question.nzsl);
        
        // Create shuffled word tokens
        const shuffledWords = this.shuffleArray([...this.correctAnswer]);
        this.createWordTokens(shuffledWords);
        
        // Reset game state
        this.currentAnswer = [];
        this.answerZone.innerHTML = '';
        this.hintUsed = false;
        this.videoHint.style.display = 'none';
        this.dictionaryBtn.style.display = 'none';
        
        // Hide video feedback container
        const feedbackContainer = document.getElementById('video-feedback-container');
        if (feedbackContainer) {
            feedbackContainer.style.display = 'none';
        }
        
        // Show elements that might have been hidden after previous submission
        const wordBank = document.querySelector('.word-bank');
        if (wordBank) {
            wordBank.style.display = 'block';
        }
        this.hintBtn.style.display = 'inline-block';
        this.hintBtn.disabled = false;
        this.hintBtn.textContent = '💡 Hint (-2 points)';
        this.clearBtn.style.display = 'inline-block';
        
        this.updateUI();
    }

    createWordTokens(words) {
        this.availableWords.innerHTML = '';
        
        words.forEach((word, index) => {
            const token = document.createElement('div');
            token.className = 'word-token';
            token.textContent = word;
            token.draggable = true;
            token.dataset.word = word;
            token.dataset.originalIndex = index;
            
            // Add drag event listeners
            token.addEventListener('dragstart', (e) => this.handleDragStart(e));
            token.addEventListener('dragend', (e) => this.handleDragEnd(e));
            token.addEventListener('click', (e) => this.handleTokenClick(e));
            
            // Add touch event listeners for mobile
            token.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            token.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            token.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
            
            this.availableWords.appendChild(token);
        });
        
        // Setup drop zone only once
        if (!this.dropZoneSetup) {
            this.setupDropZone();
            this.dropZoneSetup = true;
        }
    }

    setupDropZone() {
        this.answerZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.answerZone.addEventListener('drop', (e) => this.handleDrop(e));
        this.answerZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    }

    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.word);
        e.dataTransfer.setData('source', e.target.parentElement.id);
        e.dataTransfer.setData('sourceIndex', e.target.dataset.answerIndex || '');
        
        // Create a unique identifier for this specific token
        const uniqueId = 'token_' + Date.now() + '_' + Math.random();
        e.target.dataset.uniqueId = uniqueId;
        e.dataTransfer.setData('uniqueId', uniqueId);
        
        e.target.classList.add('dragging');
        this.draggedElement = e.target;
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedElement = null;
        // Remove all drop indicators
        document.querySelectorAll('.drop-indicator').forEach(indicator => {
            indicator.remove();
        });
        this.answerZone.classList.remove('drag-over');
    }

    handleDragOver(e) {
        e.preventDefault();
        this.answerZone.classList.add('drag-over');
        
        // Show drop position indicator
        this.showDropIndicator(e);
    }

    handleDragLeave(e) {
        // Only remove drag-over if we're actually leaving the answer zone
        if (!this.answerZone.contains(e.relatedTarget)) {
            this.answerZone.classList.remove('drag-over');
            document.querySelectorAll('.drop-indicator').forEach(indicator => {
                indicator.remove();
            });
        }
    }

    showDropIndicator(e) {
        // Remove existing indicators
        document.querySelectorAll('.drop-indicator').forEach(indicator => {
            indicator.remove();
        });

        const tokens = Array.from(this.answerZone.children);
        let insertIndex = tokens.length;

        // Find the closest position to insert
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const rect = token.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            
            if (e.clientX < centerX) {
                insertIndex = i;
                break;
            }
        }

        // Create drop indicator
        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';
        indicator.innerHTML = '|';

        if (insertIndex === tokens.length) {
            // Insert at the end
            this.answerZone.appendChild(indicator);
        } else {
            // Insert before the token at insertIndex
            this.answerZone.insertBefore(indicator, tokens[insertIndex]);
        }
    }

    handleDrop(e) {
        e.preventDefault();
        this.answerZone.classList.remove('drag-over');
        
        // Remove drop indicators
        document.querySelectorAll('.drop-indicator').forEach(indicator => {
            indicator.remove();
        });

        const word = e.dataTransfer.getData('text/plain');
        const source = e.dataTransfer.getData('source');
        const sourceIndex = e.dataTransfer.getData('sourceIndex');

        // Calculate drop position
        const tokens = Array.from(this.answerZone.children);
        let insertIndex = tokens.length;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const rect = token.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            
            if (e.clientX < centerX) {
                insertIndex = i;
                break;
            }
        }

        if (source === 'available-words') {
            // Moving from available words to answer
            const uniqueId = e.dataTransfer.getData('uniqueId');
            this.addWordToAnswerAtPosition(word, insertIndex, uniqueId);
        } else if (source === 'answer-zone') {
            // Reordering within answer zone
            this.reorderWordInAnswer(parseInt(sourceIndex), insertIndex);
        }
    }

    handleTokenClick(e) {
        const word = e.target.dataset.word;
        if (e.target.parentElement.id === 'available-words') {
            this.addWordToAnswer(word);
        }
    }

    // Touch event handlers for mobile drag and drop
    handleTouchStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.touchStartTime = Date.now();
        this.isDragging = false;
        this.draggedElement = e.target;
        
        // Store initial touch position
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        
        // Immediate visual feedback - no delay
        this.draggedElement.classList.add('dragging');
        
        // Mark as potentially dragging after minimal movement check
        this.potentialDrag = true;
    }

    handleTouchMove(e) {
        if (!this.draggedElement || !this.potentialDrag) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const touch = e.touches[0];
        
        // Check if touch has moved enough to be considered a drag
        const deltaX = Math.abs(touch.clientX - this.touchStartX);
        const deltaY = Math.abs(touch.clientY - this.touchStartY);
        
        if (deltaX > 5 || deltaY > 5) {
            this.isDragging = true;
            
            // Show drop indicator in answer zone
            const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
            if (this.answerZone.contains(elementUnder) || elementUnder === this.answerZone) {
                this.showDropIndicatorFromTouch(touch);
            } else {
                // Remove drop indicators when not over answer zone
                document.querySelectorAll('.drop-indicator').forEach(indicator => {
                    indicator.remove();
                });
            }
        }
    }

    handleTouchEnd(e) {
        if (!this.draggedElement) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const touchDuration = Date.now() - this.touchStartTime;
        const touch = e.changedTouches[0];
        
        // Clean up visual feedback
        this.draggedElement.classList.remove('dragging');
        document.querySelectorAll('.drop-indicator').forEach(indicator => {
            indicator.remove();
        });
        
        // If it was a quick tap (not a drag), treat as click
        if (touchDuration < 300 && !this.isDragging) {
            this.handleTokenClick({ target: this.draggedElement });
            this.resetTouchState();
            return;
        }
        
        // Handle drag drop
        if (this.isDragging) {
            const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
            
            if (this.answerZone.contains(elementUnderTouch) || elementUnderTouch === this.answerZone) {
                // Calculate drop position
                const insertIndex = this.calculateTouchDropPosition(touch);
                
                const word = this.draggedElement.dataset.word;
                const source = this.draggedElement.parentElement.id;
                const sourceIndex = this.draggedElement.dataset.answerIndex;
                
                if (source === 'available-words') {
                    // Moving from available words to answer
                    const uniqueId = 'touch_' + Date.now() + '_' + Math.random();
                    this.addWordToAnswerAtPosition(word, insertIndex, uniqueId);
                } else if (source === 'answer-zone') {
                    // Reordering within answer zone
                    this.reorderWordInAnswer(parseInt(sourceIndex), insertIndex);
                }
            }
        }
        
        this.resetTouchState();
    }

    resetTouchState() {
        this.draggedElement = null;
        this.isDragging = false;
        this.potentialDrag = false;
        this.touchStartTime = 0;
        this.touchStartX = 0;
        this.touchStartY = 0;
    }

    showDropIndicatorFromTouch(touch) {
        // Remove existing indicators
        document.querySelectorAll('.drop-indicator').forEach(indicator => {
            indicator.remove();
        });

        const tokens = Array.from(this.answerZone.children);
        let insertIndex = tokens.length;

        // Find the closest position to insert
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const rect = token.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            
            if (touch.clientX < centerX) {
                insertIndex = i;
                break;
            }
        }

        // Create drop indicator
        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';
        indicator.innerHTML = '|';

        if (insertIndex === tokens.length) {
            // Insert at the end
            this.answerZone.appendChild(indicator);
        } else {
            // Insert before the token at insertIndex
            this.answerZone.insertBefore(indicator, tokens[insertIndex]);
        }
    }

    calculateTouchDropPosition(touch) {
        const tokens = Array.from(this.answerZone.children);
        let insertIndex = tokens.length;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const rect = token.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            
            if (touch.clientX < centerX) {
                insertIndex = i;
                break;
            }
        }

        return insertIndex;
    }

    addWordToAnswer(word) {
        this.addWordToAnswerAtPosition(word, this.currentAnswer.length);
    }

    addWordToAnswerAtPosition(word, insertIndex, uniqueId = null) {
        let availableToken;
        
        if (uniqueId) {
            // Find the specific token by unique ID (for drag and drop)
            availableToken = Array.from(this.availableWords.children).find(
                token => token.dataset.uniqueId === uniqueId
            );
        } else {
            // Find any unused token with this word (for click handling)
            availableToken = Array.from(this.availableWords.children).find(
                token => token.dataset.word === word && !token.classList.contains('used')
            );
        }
        
        if (availableToken) {
            availableToken.classList.add('used');
            availableToken.style.display = 'none';
            
            // Insert into answer at specific position
            this.currentAnswer.splice(insertIndex, 0, word);
            this.updateAnswerDisplay();
            this.updateUI();
        }
    }

    reorderWordInAnswer(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        
        // Adjust toIndex if moving from earlier to later position
        if (fromIndex < toIndex) {
            toIndex--;
        }
        
        // Move the word in the array
        const word = this.currentAnswer.splice(fromIndex, 1)[0];
        this.currentAnswer.splice(toIndex, 0, word);
        
        this.updateAnswerDisplay();
        this.updateUI();
    }

    updateAnswerDisplay() {
        // Clear everything including emojis
        this.answerZone.innerHTML = '';
        
        this.currentAnswer.forEach((word, index) => {
            const token = document.createElement('div');
            token.className = 'word-token in-answer';
            token.textContent = word;
            token.dataset.word = word;
            token.dataset.answerIndex = index;
            token.draggable = true;
            
            // Add drag event listeners for reordering
            token.addEventListener('dragstart', (e) => this.handleDragStart(e));
            token.addEventListener('dragend', (e) => this.handleDragEnd(e));
            token.addEventListener('click', () => this.removeWordFromAnswer(index));
            
            // Add touch event listeners for mobile reordering
            token.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            token.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            token.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
            
            this.answerZone.appendChild(token);
        });
    }

    removeWordFromAnswer(index) {
        const word = this.currentAnswer[index];
        this.currentAnswer.splice(index, 1);
        
        // Show the word back in available words
        const availableToken = Array.from(this.availableWords.children).find(
            token => token.dataset.word === word && token.classList.contains('used')
        );
        
        if (availableToken) {
            availableToken.classList.remove('used');
            availableToken.style.display = 'flex';
        }
        
        this.updateAnswerDisplay();
        this.updateUI();
    }

    clearAnswer() {
        this.currentAnswer = [];
        
        // Show all available words again
        Array.from(this.availableWords.children).forEach(token => {
            token.classList.remove('used');
            token.style.display = 'flex';
        });
        
        this.updateAnswerDisplay();
        this.updateUI();
    }

    submitAnswer() {
        if (this.currentAnswer.length === 0) return;

        const scoreResult = this.calculatePartialScore();
        
        // Apply hint penalty to the score
        let finalPoints = scoreResult.points;
        if (this.hintUsed) {
            finalPoints = Math.max(0, finalPoints - 2);
        }
        
        this.score += finalPoints;
        
        // Highlight the answer tokens first
        if (scoreResult.isExact) {
            this.highlightAnswerTokens('correct');
        } else if (scoreResult.points > 0) {
            this.highlightPartialTokens(scoreResult.wordScores);
        } else {
            this.highlightAnswerTokens('incorrect');
        }

        // Show feedback in video container
        this.showVideoFeedback(scoreResult, finalPoints);

        this.prepareNextQuestion();
    }

    calculatePartialScore() {
        // Handle empty or wrong length answers
        if (this.currentAnswer.length === 0) {
            return { points: 0, isExact: false, feedback: '', wordScores: [] };
        }

        const maxPoints = 10;
        const correctLength = this.correctAnswer.length;
        const userLength = this.currentAnswer.length;
        
        // Check for exact match first
        if (this.checkAnswer()) {
            return { 
                points: maxPoints, 
                isExact: true, 
                feedback: '', 
                wordScores: this.currentAnswer.map(() => 'correct')
            };
        }

        // Only score based on consecutive sequences
        const sequenceResult = this.calculateConsecutiveSequences();
        const totalScore = Math.min(sequenceResult.points, maxPoints);
        
        return {
            points: totalScore,
            isExact: false,
            feedback: sequenceResult.feedback,
            wordScores: sequenceResult.wordScores
        };
    }

    checkAnswer() {
        if (this.currentAnswer.length !== this.correctAnswer.length) {
            return false;
        }
        
        return this.currentAnswer.every((word, index) => word === this.correctAnswer[index]);
    }

    calculateConsecutiveSequences() {
        const userLength = this.currentAnswer.length;
        const correctLength = this.correctAnswer.length;
        
        // Handle length mismatch
        if (userLength !== correctLength) {
            return {
                points: 0,
                feedback: `Wrong number of words (got ${userLength}, expected ${correctLength})`,
                wordScores: new Array(userLength).fill('incorrect')
            };
        }
        
        let wordScores = new Array(userLength).fill('incorrect');
        let correctJoins = 0;
        let totalJoins = userLength - 1; // Number of joins = number of words - 1
        
        // Check each adjacent pair (join) in user's answer
        for (let i = 0; i < userLength - 1; i++) {
            const userPair = [this.currentAnswer[i], this.currentAnswer[i + 1]];
            
            // Check if this pair appears consecutively anywhere in the correct answer
            let pairFound = false;
            for (let j = 0; j < correctLength - 1; j++) {
                const correctPair = [this.correctAnswer[j], this.correctAnswer[j + 1]];
                if (userPair[0] === correctPair[0] && userPair[1] === correctPair[1]) {
                    pairFound = true;
                    break;
                }
            }
            
            if (pairFound) {
                correctJoins++;
                // Mark both words in the correct join as correct
                wordScores[i] = 'correct';
                wordScores[i + 1] = 'correct';
            }
        }
        
        // Calculate score: (correct joins / total joins) * 10, rounded
        const percentage = totalJoins > 0 ? correctJoins / totalJoins : 0;
        const points = Math.round(percentage * 10);
        
        // Generate visual feedback showing joins
        let joinVisualization = [];
        for (let i = 0; i < userLength; i++) {
            joinVisualization.push(this.currentAnswer[i]);
            
            if (i < userLength - 1) {
                // Check if this join is correct
                const userPair = [this.currentAnswer[i], this.currentAnswer[i + 1]];
                let isCorrectJoin = false;
                for (let j = 0; j < correctLength - 1; j++) {
                    const correctPair = [this.correctAnswer[j], this.correctAnswer[j + 1]];
                    if (userPair[0] === correctPair[0] && userPair[1] === correctPair[1]) {
                        isCorrectJoin = true;
                        break;
                    }
                }
                joinVisualization.push(isCorrectJoin ? ' ✅ ' : ' ❌ ');
            }
        }
        
        const feedback = `${correctJoins}/${totalJoins} correct joins: ${joinVisualization.join('')}`;
        
        return {
            points: points,
            feedback: feedback,
            wordScores: wordScores
        };
    }

    highlightPartialTokens(wordScores) {
        const tokens = this.answerZone.querySelectorAll('.word-token');
        tokens.forEach((token, index) => {
            if (index < wordScores.length) {
                token.classList.add(wordScores[index]);
            }
        });
    }

    highlightAnswerTokens(type) {
        Array.from(this.answerZone.children).forEach(token => {
            token.classList.add(type);
        });
    }


    prepareNextQuestion() {
        this.submitBtn.style.display = 'none';
        this.nextBtn.style.display = 'inline-block';
        this.dictionaryBtn.style.display = 'inline-block';
        
        // Hide available glosses box and hint/clear buttons after submission
        const wordBank = document.querySelector('.word-bank');
        if (wordBank) {
            wordBank.style.display = 'none';
        }
        this.hintBtn.style.display = 'none';
        this.clearBtn.style.display = 'none';
        
        this.updateUI();
    }

    showVideoAfterSubmission() {
        const question = this.gameQuestions[this.currentQuestion];
        if (question.video) {
            this.hintVideo.src = question.video;
            this.videoHint.style.display = 'block';
            
            // Ensure video stays in container
            this.hintVideo.setAttribute('playsinline', 'true');
            this.hintVideo.setAttribute('webkit-playsinline', 'true');
            this.hintVideo.load(); // Reload the video element
            
            // Try to autoplay, but don't worry if it fails (mobile restrictions)
            const playPromise = this.hintVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Video autoplay prevented by browser (mobile restrictions):', error);
                    // On mobile, user will need to tap play button - that's okay
                });
            }
            
            // Update the video hint title to reflect it's now showing the answer
            const videoTitle = this.videoHint.querySelector('h3');
            if (!this.hintUsed && videoTitle) {
                videoTitle.textContent = 'Correct Signing:';
            }
        }
    }

    showVideoFeedback(scoreResult, finalPoints) {
        // Show the video first
        this.showVideoAfterSubmission();
        
        // Insert emojis between answer tokens to show join correctness
        this.insertJoinEmojis(scoreResult);
        
        // Show feedback container with score only
        const feedbackContainer = document.getElementById('video-feedback-container');
        if (feedbackContainer) {
            feedbackContainer.style.display = 'block';
            
            // Clear previous content
            feedbackContainer.innerHTML = '';
            
            // Add clean score display 
            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'video-feedback-score';
            
            const scoreDisplay = document.createElement('div');
            scoreDisplay.className = 'score-display';
            scoreDisplay.textContent = finalPoints;
            
            // Color the score based on value
            if (finalPoints >= 9) {
                scoreDisplay.style.background = '#27ae60';
            } else if (finalPoints >= 7) {
                scoreDisplay.style.background = '#f1c40f';
            } else if (finalPoints >= 4) {
                scoreDisplay.style.background = '#f39c12';
            } else {
                scoreDisplay.style.background = '#e74c3c';
            }
            
            const scoreLabel = document.createElement('div');
            scoreLabel.className = 'score-label';
            scoreLabel.textContent = `out of 10 points${this.hintUsed ? ' (hint penalty applied)' : ''}`;
            
            scoreDiv.appendChild(scoreDisplay);
            scoreDiv.appendChild(scoreLabel);
            feedbackContainer.appendChild(scoreDiv);
            
            // Show correct answer if not perfect
            if (!scoreResult.isExact) {
                const correctDiv = document.createElement('div');
                correctDiv.className = 'video-correct-answer';
                const glossesHTML = createClickableGlosses(this.currentSignSequence);
                correctDiv.innerHTML = `<strong>Correct NZSL order:</strong> ${glossesHTML}`;
                feedbackContainer.appendChild(correctDiv);
                
                // Add click event listeners to the glosses
                this.addGlossClickListeners(correctDiv);
            }
        }
    }

    addGlossClickListeners(container) {
        container.querySelectorAll('.sign-word').forEach(wordElement => {
            wordElement.addEventListener('click', async (e) => {
                const signId = e.target.dataset.signId;
                if (signId) {
                    await this.showSignDefinition(signId);
                }
            });
        });
    }

    async showSignDefinition(signId) {
        try {
            // Get sign data from the server (reuse the existing database query logic)
            const response = await fetch('/get_sign_definition', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sign_id: signId })
            });
            
            if (response.ok) {
                const signData = await response.json();
                
                // Use the interpretation game's modal elements
                const definitionModal = document.getElementById('definitionModal');
                const definitionTitle = document.getElementById('definitionTitle');
                const definitionVideo = document.getElementById('definitionVideo');
                const definitionMeanings = document.getElementById('definitionMeanings');
                
                if (definitionModal && definitionTitle && definitionVideo) {
                    definitionTitle.textContent = `Sign: ${signData.gloss}`;
                    definitionVideo.src = signData.definition_video_url;
                    
                    if (signData.minor_meanings) {
                        definitionMeanings.innerHTML = `
                            <h4>Alternative meanings:</h4>
                            <p>${signData.minor_meanings}</p>
                        `;
                    } else {
                        definitionMeanings.innerHTML = '';
                    }
                    
                    definitionModal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                }
            }
        } catch (error) {
            console.error('Error fetching sign definition:', error);
        }
    }

    insertJoinEmojis(scoreResult) {
        if (scoreResult.isExact) {
            // For perfect answers, show all green checkmarks
            this.insertEmojisInAnswerZone(this.currentAnswer.map(() => '✅'));
        } else if (scoreResult.points > 0) {
            // Calculate which joins are correct for emoji display
            const joinEmojis = [];
            const userLength = this.currentAnswer.length;
            const correctLength = this.correctAnswer.length;
            
            if (userLength === correctLength) {
                // Check each adjacent pair (join) in user's answer
                for (let i = 0; i < userLength - 1; i++) {
                    const userPair = [this.currentAnswer[i], this.currentAnswer[i + 1]];
                    
                    // Check if this pair appears consecutively anywhere in the correct answer
                    let pairFound = false;
                    for (let j = 0; j < correctLength - 1; j++) {
                        const correctPair = [this.correctAnswer[j], this.correctAnswer[j + 1]];
                        if (userPair[0] === correctPair[0] && userPair[1] === correctPair[1]) {
                            pairFound = true;
                            break;
                        }
                    }
                    
                    joinEmojis.push(pairFound ? '✅' : '❌');
                }
            } else {
                // Wrong length - all joins are incorrect
                for (let i = 0; i < userLength - 1; i++) {
                    joinEmojis.push('❌');
                }
            }
            
            this.insertEmojisInAnswerZone(joinEmojis);
        } else {
            // All incorrect
            const joinEmojis = [];
            for (let i = 0; i < this.currentAnswer.length - 1; i++) {
                joinEmojis.push('❌');
            }
            this.insertEmojisInAnswerZone(joinEmojis);
        }
    }

    insertEmojisInAnswerZone(joinEmojis) {
        const tokens = Array.from(this.answerZone.children);
        
        // Insert emojis between tokens (but not after the last token)
        for (let i = joinEmojis.length - 1; i >= 0; i--) {
            const emoji = document.createElement('span');
            emoji.className = 'join-emoji';
            emoji.textContent = joinEmojis[i];
            
            // Insert after the token at index i
            if (i + 1 < tokens.length) {
                this.answerZone.insertBefore(emoji, tokens[i + 1]);
            }
        }
    }

    nextQuestion() {
        this.currentQuestion++;
        this.nextBtn.style.display = 'none';
        this.submitBtn.style.display = 'inline-block';
        this.dictionaryBtn.style.display = 'none';
        this.loadQuestion();
    }

    showHint() {
        if (this.hintUsed) return;
        
        this.hintUsed = true;
        const question = this.gameQuestions[this.currentQuestion];
        
        if (question.video) {
            this.hintVideo.src = question.video;
            this.videoHint.style.display = 'block';
        }
        
        this.hintBtn.disabled = true;
        this.hintBtn.textContent = '💡 Hint Used (-2 points)';
    }

    openDictionary() {
        const question = this.gameQuestions[this.currentQuestion];
        if (question.word_id) {
            window.open(`https://www.nzsl.nz/signs/${question.word_id}`, '_blank');
        }
    }


    updateUI() {
        this.scoreElement.textContent = this.score;
        this.currentQuestionElement.textContent = this.currentQuestion + 1;
        this.submitBtn.disabled = this.currentAnswer.length === 0;
    }

    endGame() {
        // Show game complete message in video container
        const feedbackContainer = document.getElementById('video-feedback-container');
        if (feedbackContainer) {
            feedbackContainer.style.display = 'block';
            feedbackContainer.innerHTML = `
                <div class="video-feedback-score">
                    <div class="score-display" style="background: #27ae60;">${this.score}</div>
                    <div class="score-label">out of ${this.totalQuestions * 10} total points</div>
                </div>
                <div class="video-feedback-message correct">
                    🎉 Game Complete! Final Score: ${this.score}/${this.totalQuestions * 10}
                </div>
            `;
        }
        
        this.submitBtn.style.display = 'none';
        this.nextBtn.style.display = 'none';
        this.clearBtn.style.display = 'none';
        this.hintBtn.style.display = 'none';
        this.dictionaryBtn.style.display = 'none';
        
        // Hide the word bank at game end
        const wordBank = document.querySelector('.word-bank');
        if (wordBank) {
            wordBank.style.display = 'none';
        }
    }
}

// Initialize the application when the page loads
let app;
let grammarGame;
document.addEventListener('DOMContentLoaded', () => {
    app = new NZSLPractice();
});

// Initialize grammar game when grammar tab is activated
function initializeGrammarGame() {
    if (typeof gameData !== 'undefined' && !grammarGame) {
        grammarGame = new NZSLGrammarGame();
    }
}

// Update tab initialization to include grammar game
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    function showTab(targetTab) {
        // Remove active class from all buttons and content
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to corresponding button and content
        const targetButton = document.querySelector(`[data-tab="${targetTab}"]`);
        if (targetButton) {
            targetButton.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
            
            // Update URL hash
            window.location.hash = targetTab;
            
            // Initialize grammar game when grammar tab is activated
            if (targetTab === 'grammar') {
                setTimeout(() => initializeGrammarGame(), 100);
            }
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            showTab(targetTab);
        });
    });

    // Handle URL hash on page load and hash changes
    function handleHashChange() {
        const hash = window.location.hash.substring(1); // Remove the #
        if (hash && (hash === 'interpretation' || hash === 'grammar')) {
            showTab(hash);
        } else {
            // Default to interpretation tab if no valid hash
            showTab('interpretation');
        }
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Handle initial load
    handleHashChange();
}
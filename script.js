class NZSLPractice {
    constructor() {
        this.videoData = [];
        this.currentVideo = null;
        this.practiceHistory = this.loadPracticeHistory();
        this.initializeElements();
        this.loadVideoData();
        this.setupEventListeners();
        this.updateStatsDisplay();
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
    }

    async loadVideoData() {
        try {
            const response = await fetch('/video_examples.json');
            this.videoData = await response.json();
            console.log(`Loaded ${this.videoData.length} video examples`);
            this.loadRandomVideo();
        } catch (error) {
            console.error('Error loading video data:', error);
            this.videoInfo.textContent = 'Error loading video data. Please refresh the page.';
        }
    }

    setupEventListeners() {
        this.submitBtn.addEventListener('click', () => this.submitTranslation());
        this.nextBtn.addEventListener('click', () => this.loadRandomVideo());
        this.speedBtn.addEventListener('click', () => this.toggleSpeed());
        this.historyBtn?.addEventListener('click', () => this.showHistory());
        this.closeHistory?.addEventListener('click', () => this.hideHistory());
        this.clearHistoryBtn?.addEventListener('click', () => this.clearHistory());
        
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

    loadRandomVideo() {
        if (this.videoData.length === 0) return;
        
        // Select random video
        const randomIndex = Math.floor(Math.random() * this.videoData.length);
        this.currentVideo = this.videoData[randomIndex];
        
        // Reset UI
        this.resetUI();
        
        // Load video
        this.video.src = this.currentVideo.video_url;
        this.video.load();
        
        // Update sign sequence display
        this.updateSignSequence();
    }

    updateSignSequence() {
        if (!this.currentVideo.sign_sequence) {
            this.signSequence.textContent = 'No sign sequence available';
            return;
        }
        
        const signs = this.currentVideo.sign_sequence.map(sign => sign.word).join(' → ');
        this.signSequence.textContent = `Signs: ${signs}`;
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
        this.wordInfo.innerHTML = `
            <div class="word-details">
                Common word: <strong>${this.currentVideo.common_word}</strong> • 
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
            
            return `
                <div class="history-item" data-session-id="${session.id}">
                    <div class="history-header">
                        <span class="history-word">${session.commonWord}</span>
                        <span class="history-score ${scoreClass}">${session.score}/10</span>
                    </div>
                    <div class="history-meta">
                        <span class="history-date">${date} ${time}</span>
                        <span class="history-rank">Rank #${session.rank}</span>
                    </div>
                    <div class="history-translations">
                        <div class="history-user">You: "${session.userTranslation}"</div>
                        <div class="history-official">Official: "${session.englishTranslation}"</div>
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
}

// Initialize the application when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new NZSLPractice();
});
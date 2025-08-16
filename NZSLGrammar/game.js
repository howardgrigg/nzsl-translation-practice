class NZSLGrammarGame {
    constructor() {
        this.currentQuestion = 0;
        this.score = 0;
        this.totalQuestions = Math.min(20, gameData.length);
        this.gameQuestions = [];
        this.currentAnswer = [];
        this.correctAnswer = [];
        this.hintUsed = false;
        
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
        this.submitBtn = document.getElementById('submit-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.feedback = document.getElementById('feedback');
        this.scoreElement = document.getElementById('score');
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
        
        // Create shuffled word tokens
        const shuffledWords = this.shuffleArray([...this.correctAnswer]);
        this.createWordTokens(shuffledWords);
        
        // Reset game state
        this.currentAnswer = [];
        this.answerZone.innerHTML = ''; // Clear previous answer tokens
        this.hintUsed = false;
        this.videoHint.style.display = 'none';
        this.dictionaryBtn.style.display = 'none'; // Hide dictionary button during question
        document.querySelector('.word-bank').style.display = 'block'; // Show available words again
        this.clearFeedback();
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
            
            this.setupDragAndDrop(token);
            this.availableWords.appendChild(token);
        });
    }

    setupDragAndDrop(token) {
        token.addEventListener('dragstart', (e) => {
            token.classList.add('dragging');
            e.dataTransfer.setData('text/plain', token.dataset.word);
            e.dataTransfer.setData('application/x-source', token.parentElement.id);
        });

        token.addEventListener('dragend', () => {
            token.classList.remove('dragging');
        });

        token.addEventListener('click', () => {
            if (token.parentElement.id === 'available-words') {
                this.moveToAnswer(token);
            } else {
                this.moveToAvailable(token);
            }
        });
    }

    setupDropZones() {
        [this.availableWords, this.answerZone].forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('drag-over');
            });

            zone.addEventListener('dragleave', () => {
                zone.classList.remove('drag-over');
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                
                const word = e.dataTransfer.getData('text/plain');
                const sourceId = e.dataTransfer.getData('application/x-source');
                const token = document.querySelector(`[data-word="${word}"]`);
                
                if (zone.id === 'answer-zone' && sourceId === 'available-words') {
                    this.moveToAnswer(token);
                } else if (zone.id === 'available-words' && sourceId === 'answer-zone') {
                    this.moveToAvailable(token);
                }
            });
        });
    }

    moveToAnswer(token) {
        if (token.parentElement.id === 'available-words') {
            this.currentAnswer.push(token.dataset.word);
            token.classList.add('in-answer');
            this.answerZone.appendChild(token);
            this.updateUI();
        }
    }

    moveToAvailable(token) {
        if (token.parentElement.id === 'answer-zone') {
            const wordIndex = this.currentAnswer.indexOf(token.dataset.word);
            if (wordIndex > -1) {
                this.currentAnswer.splice(wordIndex, 1);
            }
            token.classList.remove('in-answer');
            this.availableWords.appendChild(token);
            this.updateUI();
        }
    }

    clearAnswer() {
        const answerTokens = this.answerZone.querySelectorAll('.word-token');
        answerTokens.forEach(token => {
            this.moveToAvailable(token);
        });
    }

    showHint() {
        if (this.hintUsed) return;
        
        this.hintUsed = true;
        this.score = Math.max(0, this.score - 2); // Deduct 2 points
        
        const currentQuestion = this.gameQuestions[this.currentQuestion];
        this.hintVideo.src = currentQuestion.video;
        this.videoHint.style.display = 'block';
        
        this.hintBtn.disabled = true;
        this.hintBtn.textContent = '💡 Hint Used (-2 points)';
        
        this.updateScore();
    }

    openDictionary() {
        const currentQuestion = this.gameQuestions[this.currentQuestion];
        const dictionaryUrl = `https://www.nzsl.nz/signs/${currentQuestion.word_id}`;
        window.open(dictionaryUrl, '_blank');
    }

    showVideoAfterSubmission() {
        const currentQuestion = this.gameQuestions[this.currentQuestion];
        this.hintVideo.src = currentQuestion.video;
        this.videoHint.style.display = 'block';
        
        // Update the video hint title to reflect it's now showing the answer
        const videoTitle = this.videoHint.querySelector('h3');
        if (!this.hintUsed) {
            videoTitle.textContent = 'Correct Signing:';
        }
    }

    submitAnswer() {
        if (this.currentAnswer.length === 0) return;

        const scoreResult = this.calculatePartialScore();
        this.score += scoreResult.points;
        
        let feedbackMessage = '';
        if (scoreResult.isExact) {
            feedbackMessage = 'Perfect! All words in correct order!';
            this.showFeedback(feedbackMessage, 'correct');
            this.highlightTokens('correct');
        } else if (scoreResult.points > 0) {
            feedbackMessage = `Partial credit: ${scoreResult.points}/10 points. ${scoreResult.feedback}`;
            this.showFeedback(feedbackMessage, 'partial');
            this.highlightPartialTokens(scoreResult.wordScores);
            this.showCorrectAnswer();
        } else {
            feedbackMessage = 'Incorrect. The correct order is shown below:';
            this.showFeedback(feedbackMessage, 'incorrect');
            this.highlightTokens('incorrect');
            this.showCorrectAnswer();
        }

        if (this.hintUsed) {
            feedbackMessage += ' (Hint penalty: -2 points already applied)';
            this.showFeedback(feedbackMessage, scoreResult.points > 0 ? 'partial' : 'incorrect');
        }

        // Always show video after submission and hide hint button and available words
        this.showVideoAfterSubmission();
        this.hintBtn.style.display = 'none';
        this.clearBtn.style.display = 'none'; // Hide clear button after submission
        this.dictionaryBtn.style.display = 'inline-block'; // Show dictionary link after submission
        document.querySelector('.word-bank').style.display = 'none';

        this.updateScore();
        this.submitBtn.style.display = 'none';
        this.nextBtn.style.display = 'inline-block';
    }

    checkAnswer() {
        if (this.currentAnswer.length !== this.correctAnswer.length) {
            return false;
        }
        
        return this.currentAnswer.every((word, index) => word === this.correctAnswer[index]);
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
                joinVisualization.push(isCorrectJoin ? '-' : '*');
            }
        }
        
        const feedback = `${correctJoins}/${totalJoins} correct joins: ${joinVisualization.join('')}`;
        
        return {
            points: points,
            feedback: feedback,
            wordScores: wordScores
        };
    }
    
    calculateSequencePoints(sequenceLength) {
        // Points for consecutive sequences:
        // 1 word = 1 point
        // 2 words = 3 points  
        // 3 words = 5 points
        // 4+ words = 7+ points
        return Math.min(sequenceLength * 2 - 1, 10);
    }

    highlightTokens(type) {
        const tokens = this.answerZone.querySelectorAll('.word-token');
        tokens.forEach(token => {
            token.classList.add(type);
        });
    }

    highlightPartialTokens(wordScores) {
        const tokens = this.answerZone.querySelectorAll('.word-token');
        tokens.forEach((token, index) => {
            if (index < wordScores.length) {
                token.classList.add(wordScores[index]);
            }
        });
    }

    showCorrectAnswer() {
        const correctDiv = document.createElement('div');
        correctDiv.className = 'feedback correct-answer';
        correctDiv.innerHTML = `<strong>Correct NZSL order:</strong> ${this.correctAnswer.join(' ')}`;
        this.feedback.appendChild(correctDiv);
    }

    showFeedback(message, type) {
        this.feedback.innerHTML = message;
        this.feedback.className = `feedback ${type}`;
    }

    clearFeedback() {
        this.feedback.innerHTML = '';
        this.feedback.className = 'feedback';
    }

    nextQuestion() {
        this.currentQuestion++;
        this.currentQuestionElement.textContent = this.currentQuestion + 1;
        this.submitBtn.style.display = 'inline-block';
        this.nextBtn.style.display = 'none';
        this.loadQuestion();
    }

    updateUI() {
        this.submitBtn.disabled = this.currentAnswer.length === 0;
        this.currentQuestionElement.textContent = this.currentQuestion + 1;
        
        // Reset buttons for new question
        this.hintBtn.style.display = 'inline-block';
        this.hintBtn.disabled = false;
        this.hintBtn.textContent = '💡 Hint (-2 points)';
        this.clearBtn.style.display = 'inline-block'; // Show clear button for new question
        
        // Reset video hint title
        const videoTitle = this.videoHint.querySelector('h3');
        videoTitle.textContent = 'Video Hint:';
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
    }

    endGame() {
        const percentage = Math.round((this.score / (this.totalQuestions * 10)) * 100);
        let message = `Game Complete! Final Score: ${this.score}/${this.totalQuestions * 10} (${percentage}%)`;
        
        if (percentage >= 80) {
            message += " Excellent work!";
        } else if (percentage >= 60) {
            message += " Good job!";
        } else {
            message += " Keep practicing!";
        }

        this.showFeedback(message, 'correct');
        this.submitBtn.style.display = 'none';
        this.nextBtn.textContent = 'Play Again';
        this.nextBtn.style.display = 'inline-block';
        this.nextBtn.onclick = () => location.reload();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new NZSLGrammarGame();
    game.setupDropZones();
});
// Flashcard Master - Main Application Logic

class FlashcardApp {
    constructor() {
        this.flashcards = [];
        this.currentCardIndex = 0;
        this.studyQueue = [];
        this.mistakes = [];
        this.reviewQueue = [];
        this.currentReviewIndex = 0;
        this.sessionStats = {
            correct: 0,
            wrong: 0
        };
        this.currentImage = null;
        this.testQueue = [];
        this.testStats = {
            correct: 0,
            wrong: 0
        };
        this.currentTestIndex = 0;
        this.performanceHistory = [];
        
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.renderLibrary();
        this.updateStudyInterface();
        this.updateReviewInterface();
    }

    // Storage Methods
    loadFromStorage() {
        const stored = localStorage.getItem('flashcards');
        if (stored) {
            this.flashcards = JSON.parse(stored);
        }

        const storedMistakes = localStorage.getItem('mistakes');
        if (storedMistakes) {
            this.mistakes = JSON.parse(storedMistakes);
        }

        const storedProgress = localStorage.getItem('studyProgress');
        if (storedProgress) {
            const progress = JSON.parse(storedProgress);
            this.currentCardIndex = progress.currentCardIndex || 0;
            this.studyQueue = progress.studyQueue || [];
            
            // If we have a saved study queue, use it
            if (this.studyQueue.length === 0 && this.flashcards.length > 0) {
                this.initializeStudyQueue();
            }
        } else {
            this.initializeStudyQueue();
        }
    }

    saveToStorage() {
        localStorage.setItem('flashcards', JSON.stringify(this.flashcards));
        localStorage.setItem('mistakes', JSON.stringify(this.mistakes));
        
        const progress = {
            currentCardIndex: this.currentCardIndex,
            studyQueue: this.studyQueue
        };
        localStorage.setItem('studyProgress', JSON.stringify(progress));
    }

    // Initialize study queue with all flashcards
    initializeStudyQueue() {
        this.studyQueue = this.flashcards.map((card, index) => index);
        this.shuffleArray(this.studyQueue);
        this.currentCardIndex = 0;
        this.currentStreak = 0;
        this.bestStreak = parseInt(localStorage.getItem('bestStreak') || '0');
    }

    // Shuffle array utility - Fisher-Yates shuffle for true randomization
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Event Listeners
    setupEventListeners() {
        // Tab Navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Input Method Toggle
        document.querySelectorAll('.method-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchInputMethod(e.target.dataset.method));
        });

        // Create Cards
        document.getElementById('create-cards-btn').addEventListener('click', () => this.createCardsFromText());
        
        // URL Import
        document.getElementById('fetch-url-btn').addEventListener('click', () => this.fetchFromURL());
        document.getElementById('save-url-cards-btn').addEventListener('click', () => this.createCardsFromURL());
        
        // Image Upload
        document.getElementById('upload-btn').addEventListener('click', () => {
            document.getElementById('image-upload').click();
        });
        
        document.getElementById('image-upload').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('save-card-btn').addEventListener('click', () => this.saveImageCard());

        // CSV Import/Export
        document.getElementById('csv-upload-btn').addEventListener('click', () => {
            document.getElementById('csv-upload').click();
        });
        document.getElementById('csv-upload').addEventListener('change', (e) => this.handleCSVUpload(e));
        document.getElementById('export-csv-btn').addEventListener('click', () => this.exportToCSV());

        // AI Generate
        document.getElementById('ai-generate-btn').addEventListener('click', () => this.generateWithAI());

        // Study Controls
        const flashcard = document.getElementById('flashcard');
        if (flashcard) {
            flashcard.addEventListener('click', () => this.flipCard(flashcard));
        }
        
        document.getElementById('correct-btn').addEventListener('click', () => this.handleAnswer(true));
        document.getElementById('wrong-btn').addEventListener('click', () => this.handleAnswer(false));

        // Review Controls
        const reviewFlashcard = document.getElementById('review-flashcard');
        if (reviewFlashcard) {
            reviewFlashcard.addEventListener('click', () => this.flipCard(reviewFlashcard));
        }
        
        document.getElementById('review-correct-btn').addEventListener('click', () => this.handleReviewAnswer(true));
        document.getElementById('review-wrong-btn').addEventListener('click', () => this.handleReviewAnswer(false));

        // Library Controls
        document.getElementById('clear-all-btn').addEventListener('click', () => this.clearAllCards());
        document.getElementById('reset-progress-btn').addEventListener('click', () => this.resetProgress());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    handleKeyPress(e) {
        // Only handle shortcuts on study and review tabs
        const activeTab = document.querySelector('.section.active');
        if (!activeTab) return;

        const tabId = activeTab.id;

        // Space or Enter to flip card
        if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();
            if (tabId === 'study-section') {
                const flashcard = document.getElementById('flashcard');
                if (flashcard && flashcard.offsetParent !== null) {
                    this.flipCard(flashcard);
                }
            } else if (tabId === 'review-section') {
                const flashcard = document.getElementById('review-flashcard');
                if (flashcard && flashcard.offsetParent !== null) {
                    this.flipCard(flashcard);
                }
            }
        }

        // Arrow keys for correct/wrong
        if (e.code === 'ArrowRight' || e.code === 'KeyC') {
            e.preventDefault();
            if (tabId === 'study-section' && this.studyQueue.length > 0) {
                this.handleAnswer(true);
            } else if (tabId === 'review-section' && this.reviewQueue.length > 0) {
                this.handleReviewAnswer(true);
            }
        }

        if (e.code === 'ArrowLeft' || e.code === 'KeyW') {
            e.preventDefault();
            if (tabId === 'study-section' && this.studyQueue.length > 0) {
                this.handleAnswer(false);
            } else if (tabId === 'review-section' && this.reviewQueue.length > 0) {
                this.handleReviewAnswer(false);
            }
        }
    }

    // Tab Management
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Update sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${tabName}-section`).classList.add('active');

        // Refresh interfaces when switching tabs
        if (tabName === 'study') {
            this.updateStudyInterface();
        } else if (tabName === 'test') {
            this.updateTestInterface();
        } else if (tabName === 'review') {
            this.updateReviewInterface();
        } else if (tabName === 'stats') {
            this.updateStatsInterface();
        } else if (tabName === 'library') {
            this.renderLibrary();
        }
    }

    // Input Method Toggle
    switchInputMethod(method) {
        document.querySelectorAll('.method-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.method === method) {
                btn.classList.add('active');
            }
        });

        document.querySelectorAll('.input-method').forEach(methodDiv => {
            methodDiv.classList.remove('active');
        });

        if (method === 'text') {
            document.getElementById('text-input-method').classList.add('active');
        } else if (method === 'url') {
            document.getElementById('url-input-method').classList.add('active');
        } else if (method === 'image') {
            document.getElementById('image-input-method').classList.add('active');
        } else if (method === 'csv') {
            document.getElementById('csv-input-method').classList.add('active');
        } else if (method === 'ai') {
            document.getElementById('ai-input-method').classList.add('active');
        }
    }

    // URL Import Methods
    async fetchFromURL() {
        const urlInput = document.getElementById('url-input').value.trim();
        const feedback = document.getElementById('creation-feedback');

        if (!urlInput) {
            this.showFeedback(feedback, 'Please enter a URL', 'error');
            return;
        }

        // Check if it's a valid URL
        try {
            new URL(urlInput);
        } catch (e) {
            this.showFeedback(feedback, 'Please enter a valid URL', 'error');
            return;
        }

        this.showFeedback(feedback, 'Fetching content...', 'success');

        try {
            // Use a CORS proxy for fetching content
            const proxyUrl = 'https://api.allorigins.win/get?url=';
            const response = await fetch(proxyUrl + encodeURIComponent(urlInput));
            const data = await response.json();
            
            if (data.contents) {
                // Extract text from HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.contents, 'text/html');
                
                // Remove script and style tags
                doc.querySelectorAll('script, style, nav, header, footer').forEach(el => el.remove());
                
                // Get text content
                const textContent = doc.body.textContent || doc.body.innerText || '';
                const cleanText = textContent.replace(/\s+/g, ' ').trim();
                
                document.getElementById('url-content').value = cleanText.substring(0, 5000); // Limit to 5000 chars
                document.getElementById('url-card-input').style.display = 'block';
                this.showFeedback(feedback, 'Content loaded. Format as: Question | Answer', 'success');
            } else {
                throw new Error('No content found');
            }
        } catch (error) {
            this.showFeedback(feedback, 'Could not fetch content from URL. Try copying and pasting the text directly', 'error');
        }
    }

    createCardsFromURL() {
        const content = document.getElementById('url-content').value.trim();
        const feedback = document.getElementById('creation-feedback');

        if (!content) {
            this.showFeedback(feedback, 'No content to create cards from', 'error');
            return;
        }

        const lines = content.split('\n').filter(line => line.trim());
        let createdCount = 0;
        let errorCount = 0;

        lines.forEach(line => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length === 2 && parts[0] && parts[1]) {
                this.flashcards.push({
                    id: Date.now() + Math.random(),
                    question: parts[0],
                    answer: parts[1],
                    type: 'text',
                    correctCount: 0,
                    wrongCount: 0,
                    lastStudied: null
                });
                createdCount++;
            } else {
                errorCount++;
            }
        });

        this.saveToStorage();
        this.initializeStudyQueue();
        this.renderLibrary();
        this.updateStudyInterface();

        if (createdCount > 0) {
            this.showFeedback(feedback, `Successfully created ${createdCount} card${createdCount > 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} skipped)` : ''}`, 'success');
            document.getElementById('url-input').value = '';
            document.getElementById('url-content').value = '';
            document.getElementById('url-card-input').style.display = 'none';
        } else {
            this.showFeedback(feedback, 'No valid cards created', 'error');
        }
    }

    // Create Flashcards from Text
    createCardsFromText() {
        const input = document.getElementById('bulk-input').value.trim();
        const feedback = document.getElementById('creation-feedback');

        if (!input) {
            this.showFeedback(feedback, 'Please enter some content to create flashcards', 'error');
            return;
        }

        const lines = input.split('\n').filter(line => line.trim());
        let createdCount = 0;
        let errorCount = 0;

        lines.forEach(line => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length === 2 && parts[0] && parts[1]) {
                this.flashcards.push({
                    id: Date.now() + Math.random(),
                    question: parts[0],
                    answer: parts[1],
                    type: 'text',
                    correctCount: 0,
                    wrongCount: 0,
                    lastStudied: null
                });
                createdCount++;
            } else {
                errorCount++;
            }
        });

        this.saveToStorage();
        this.initializeStudyQueue();
        this.renderLibrary();
        this.updateStudyInterface();

        if (createdCount > 0) {
            this.showFeedback(feedback, `Successfully created ${createdCount} card${createdCount > 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} skipped due to format)` : ''}`, 'success');
            document.getElementById('bulk-input').value = '';
        } else {
            this.showFeedback(feedback, 'No valid cards created. Please check your format', 'error');
        }
    }

    // Image Upload Handling
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImage = e.target.result;
            const preview = document.getElementById('image-preview');
            preview.innerHTML = `<img src="${this.currentImage}" alt="Uploaded image">`;
            document.getElementById('manual-card-input').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    saveImageCard() {
        const question = document.getElementById('question-input').value.trim();
        const answer = document.getElementById('answer-input').value.trim();
        const feedback = document.getElementById('creation-feedback');

        if (!question || !answer) {
            this.showFeedback(feedback, 'Please enter both question and answer', 'error');
            return;
        }

        this.flashcards.push({
            id: Date.now() + Math.random(),
            question: question,
            answer: answer,
            image: this.currentImage,
            type: 'image',
            correctCount: 0,
            wrongCount: 0,
            lastStudied: null,
            nextReview: Date.now(),
            easeFactor: 2.5,
            interval: 0
        });

        this.saveToStorage();
        this.initializeStudyQueue();
        this.renderLibrary();
        this.updateStudyInterface();

        // Reset form
        document.getElementById('question-input').value = '';
        document.getElementById('answer-input').value = '';
        document.getElementById('image-preview').innerHTML = '';
        document.getElementById('manual-card-input').style.display = 'none';
        document.getElementById('image-upload').value = '';
        this.currentImage = null;

        this.showFeedback(feedback, 'Card created successfully', 'success');
    }

    // Study Interface
    updateStudyInterface() {
        const noCardsMsg = document.getElementById('no-cards-message');
        const studyInterface = document.getElementById('study-interface');

        if (this.flashcards.length === 0) {
            noCardsMsg.style.display = 'block';
            studyInterface.style.display = 'none';
            return;
        }

        noCardsMsg.style.display = 'none';
        studyInterface.style.display = 'block';

        // Check if study session is complete
        if (this.studyQueue.length === 0) {
            this.showStudyComplete();
            return;
        }

        this.displayCurrentCard();
        this.updateStudyStats();
    }

    displayCurrentCard() {
        if (this.studyQueue.length === 0) return;

        const cardIndex = this.studyQueue[0];
        const card = this.flashcards[cardIndex];
        
        const flashcard = document.getElementById('flashcard');
        flashcard.classList.remove('flipped');

        // Trigger animation by removing and re-adding
        const front = flashcard.querySelector('.flashcard-front');
        front.style.animation = 'none';
        setTimeout(() => {
            front.style.animation = '';
        }, 10);

        const questionContent = document.getElementById('question-content');
        const answerContent = document.getElementById('answer-content');

        questionContent.innerHTML = card.question;
        if (card.image) {
            questionContent.innerHTML += `<br><img src="${card.image}" alt="Flashcard image">`;
        }

        answerContent.innerHTML = card.answer;

        // Update progress
        const completed = this.flashcards.length - this.studyQueue.length;
        const total = this.flashcards.length;
        const progress = (completed / total) * 100;

        document.getElementById('progress-fill').style.width = `${progress}%`;
        document.getElementById('progress-text').textContent = `${completed} / ${total}`;
    }

    updateStudyStats() {
        document.getElementById('correct-count').textContent = this.sessionStats.correct;
        document.getElementById('wrong-count').textContent = this.sessionStats.wrong;
        document.getElementById('remaining-count').textContent = this.studyQueue.length;
        document.getElementById('streak-count').textContent = this.currentStreak;
        
        // Add pulse animation to streak when it increases
        const streakElement = document.getElementById('streak-count');
        if (this.currentStreak > 0) {
            streakElement.classList.add('pulse');
            setTimeout(() => streakElement.classList.remove('pulse'), 600);
        }
    }

    flipCard(flashcard) {
        flashcard.classList.toggle('flipped');
    }

    handleAnswer(isCorrect) {
        if (this.studyQueue.length === 0) return;

        // Slide out the current card
        const flashcard = document.getElementById('flashcard');
        flashcard.classList.remove('flipped');
        flashcard.classList.add('slide-out');

        const cardIndex = this.studyQueue.shift();
        const card = this.flashcards[cardIndex];

        card.lastStudied = new Date().toISOString();

        if (isCorrect) {
            card.correctCount++;
            this.sessionStats.correct++;
            this.currentStreak++;
            
            // Update best streak
            if (this.currentStreak > this.bestStreak) {
                this.bestStreak = this.currentStreak;
                localStorage.setItem('bestStreak', this.bestStreak.toString());
            }
            
            // Remove from mistakes if it was there
            this.mistakes = this.mistakes.filter(m => m !== cardIndex);
        } else {
            card.wrongCount++;
            this.sessionStats.wrong++;
            this.currentStreak = 0;
            
            // Add to mistakes if not already there
            if (!this.mistakes.includes(cardIndex)) {
                this.mistakes.push(cardIndex);
            }
            // Add back to queue for review in this session
            this.studyQueue.push(cardIndex);
        }

        this.saveToStorage();

        // Wait for slide-out animation to complete, then show next card
        setTimeout(() => {
            flashcard.classList.remove('slide-out');
            
            if (this.studyQueue.length === 0) {
                this.showStudyComplete();
            } else {
                this.updateStudyInterface();
                // Trigger slide-in animation
                flashcard.classList.add('slide-in');
                
                // Remove slide-in class after animation completes
                setTimeout(() => {
                    flashcard.classList.remove('slide-in');
                }, 500);
            }
        }, 400);
    }

    showAnswerFeedback(isCorrect) {
        const flashcard = document.getElementById('flashcard');
        const overlay = document.createElement('div');
        overlay.className = isCorrect ? 'feedback-overlay correct-overlay' : 'feedback-overlay wrong-overlay';
        
        flashcard.appendChild(overlay);
        
        setTimeout(() => {
            overlay.remove();
        }, 600);
    }

    showStudyComplete() {
        const flashcard = document.getElementById('flashcard');
        flashcard.classList.remove('flipped');
        
        const total = this.sessionStats.correct + this.sessionStats.wrong;
        const accuracy = total > 0 ? Math.round((this.sessionStats.correct / total) * 100) : 0;
        
        let message = 'Session Complete';
        if (accuracy >= 90) {
            message = 'Excellent Work!';
            this.createConfetti();
        } else if (accuracy >= 70) {
            message = 'Great Job!';
        } else if (accuracy >= 50) {
            message = 'Good Effort!';
        }
        
        document.getElementById('question-content').innerHTML = `
            <div style="text-align: center;">
                <h3 style="font-size: 1.8rem; margin-bottom: 1rem; font-weight: 600;">${message}</h3>
                <p style="margin-top: 1rem; font-size: 1.3rem; color: var(--accent-primary); font-weight: 600;">${accuracy}% Accuracy</p>
                <p style="margin-top: 0.75rem; font-size: 1.1rem; color: var(--text-secondary);">Correct: ${this.sessionStats.correct} · Wrong: ${this.sessionStats.wrong}</p>
                ${this.bestStreak > 0 ? `<p style="margin-top: 0.5rem; color: var(--text-muted);">Best Streak: ${this.bestStreak}</p>` : ''}
                ${this.mistakes.length > 0 ? `<p style="margin-top: 1rem; color: var(--text-muted);">${this.mistakes.length} cards to review</p>` : '<p style="margin-top: 1rem; color: var(--success);">Perfect! All done</p>'}
            </div>
        `;
        
        document.querySelector('#study-interface .answer-buttons').style.display = 'none';
    }

    createConfetti() {
        const colors = ['#00d4ff', '#7c3aed', '#ec4899', '#22c55e', '#f59e0b'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 0.3 + 's';
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 4000);
            }, i * 30);
        }
    }

    // Review Interface
    updateReviewInterface() {
        const noMistakesMsg = document.getElementById('no-mistakes-message');
        const reviewInterface = document.getElementById('review-interface');

        if (this.mistakes.length === 0) {
            noMistakesMsg.style.display = 'block';
            reviewInterface.style.display = 'none';
            return;
        }

        noMistakesMsg.style.display = 'none';
        reviewInterface.style.display = 'block';

        // Initialize review queue and shuffle
        if (this.reviewQueue.length === 0) {
            this.reviewQueue = [...this.mistakes];
            this.shuffleArray(this.reviewQueue);
            this.currentReviewIndex = 0;
        }

        this.displayCurrentReviewCard();
    }

    displayCurrentReviewCard() {
        if (this.reviewQueue.length === 0) {
            this.showReviewComplete();
            return;
        }

        const cardIndex = this.reviewQueue[0];
        const card = this.flashcards[cardIndex];
        
        const flashcard = document.getElementById('review-flashcard');
        flashcard.classList.remove('flipped');

        // Trigger animation
        const front = flashcard.querySelector('.flashcard-front');
        front.style.animation = 'none';
        setTimeout(() => {
            front.style.animation = '';
        }, 10);

        const questionContent = document.getElementById('review-question-content');
        const answerContent = document.getElementById('review-answer-content');

        questionContent.innerHTML = card.question;
        if (card.image) {
            questionContent.innerHTML += `<br><img src="${card.image}" alt="Flashcard image">`;
        }

        answerContent.innerHTML = card.answer;

        // Update progress
        const completed = this.mistakes.length - this.reviewQueue.length;
        const total = this.mistakes.length;
        const progress = (completed / total) * 100;

        document.getElementById('review-progress-fill').style.width = `${progress}%`;
        document.getElementById('review-progress-text').textContent = `${completed} / ${total}`;
    }

    handleReviewAnswer(isCorrect) {
        if (this.reviewQueue.length === 0) return;

        // Slide out the current card
        const flashcard = document.getElementById('review-flashcard');
        flashcard.classList.remove('flipped');
        flashcard.classList.add('slide-out');

        const cardIndex = this.reviewQueue.shift();

        if (isCorrect) {
            // Remove from mistakes
            this.mistakes = this.mistakes.filter(m => m !== cardIndex);
        } else {
            // Keep in mistakes and add back to queue
            this.reviewQueue.push(cardIndex);
        }

        this.saveToStorage();

        // Wait for slide-out animation to complete, then show next card
        setTimeout(() => {
            flashcard.classList.remove('slide-out');
            
            if (this.reviewQueue.length === 0) {
                this.showReviewComplete();
            } else {
                this.displayCurrentReviewCard();
                // Trigger slide-in animation
                flashcard.classList.add('slide-in');
                
                // Remove slide-in class after animation completes
                setTimeout(() => {
                    flashcard.classList.remove('slide-in');
                }, 500);
            }
        }, 400);
    }

    showReviewFeedback(isCorrect) {
        const flashcard = document.getElementById('review-flashcard');
        const overlay = document.createElement('div');
        overlay.className = isCorrect ? 'feedback-overlay correct-overlay' : 'feedback-overlay wrong-overlay';
        
        flashcard.appendChild(overlay);
        
        setTimeout(() => {
            overlay.remove();
        }, 600);
    }

    showReviewComplete() {
        const flashcard = document.getElementById('review-flashcard');
        flashcard.classList.remove('flipped');
        
        document.getElementById('review-question-content').innerHTML = `
            <div style="text-align: center;">
                <h3 style="font-size: 1.8rem; margin-bottom: 1rem; font-weight: 600;">Review Complete</h3>
                <p style="margin-top: 1rem; color: var(--text-secondary); font-size: 1.1rem;">You're all caught up</p>
            </div>
        `;
        
        document.querySelector('#review-interface .answer-buttons').style.display = 'none';
        
        // Reset review queue
        this.reviewQueue = [];
        this.updateReviewInterface();
    }

    // Library Management
    renderLibrary() {
        const libraryList = document.getElementById('library-list');

        if (this.flashcards.length === 0) {
            libraryList.innerHTML = '<div class="empty-state"><h3>No Cards Yet</h3><p>Create some to see them here</p></div>';
            return;
        }

        libraryList.innerHTML = '';

        this.flashcards.forEach((card, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'library-card';
            
            cardDiv.innerHTML = `
                <div class="library-card-question">${card.question}</div>
                <div class="library-card-answer">${card.answer}</div>
                ${card.image ? '<div style="margin: 10px 0;"><img src="' + card.image + '" style="max-width: 100%; max-height: 150px; border-radius: 8px;"></div>' : ''}
                <div class="library-card-stats">
                    <span>Correct: ${card.correctCount}</span>
                    <span>Wrong: ${card.wrongCount}</span>
                    <span>${card.lastStudied ? new Date(card.lastStudied).toLocaleDateString() : 'Not studied'}</span>
                </div>
                <button class="library-card-delete" data-index="${index}">Delete</button>
            `;

            cardDiv.querySelector('.library-card-delete').addEventListener('click', () => this.deleteCard(index));

            libraryList.appendChild(cardDiv);
        });
    }

    deleteCard(index) {
        if (!confirm('Delete this card?')) return;

        this.flashcards.splice(index, 1);
        
        // Update mistakes array (adjust indices)
        this.mistakes = this.mistakes.map(m => m > index ? m - 1 : m).filter(m => m !== index);
        
        // Update study queue
        this.studyQueue = this.studyQueue.map(s => s > index ? s - 1 : s).filter(s => s !== index);
        
        this.saveToStorage();
        this.renderLibrary();
        this.updateStudyInterface();
        this.updateReviewInterface();
    }

    clearAllCards() {
        if (!confirm('Delete all cards? This cannot be undone.')) return;

        this.flashcards = [];
        this.mistakes = [];
        this.studyQueue = [];
        this.reviewQueue = [];
        this.sessionStats = { correct: 0, wrong: 0 };
        this.currentCardIndex = 0;

        localStorage.clear();
        
        this.renderLibrary();
        this.updateStudyInterface();
        this.updateReviewInterface();
    }

    resetProgress() {
        if (!confirm('Reset all progress? Your cards will remain but statistics will be cleared.')) return;

        this.flashcards.forEach(card => {
            card.correctCount = 0;
            card.wrongCount = 0;
            card.lastStudied = null;
        });

        this.mistakes = [];
        this.sessionStats = { correct: 0, wrong: 0 };
        this.initializeStudyQueue();
        
        this.saveToStorage();
        this.renderLibrary();
        this.updateStudyInterface();
        this.updateReviewInterface();
    }

    // Utility Methods
    showFeedback(element, message, type) {
        element.textContent = message;
        element.className = `feedback ${type}`;
        element.style.display = 'block';

        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }

    // CSV Import/Export Methods
    handleCSVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const csv = e.target.result;
            this.parseCSV(csv);
        };
        reader.readAsText(file);
    }

    parseCSV(csv) {
        const lines = csv.split('\n').filter(line => line.trim());
        let createdCount = 0;
        const feedback = document.getElementById('creation-feedback');

        lines.forEach((line, index) => {
            // Skip header row if it exists
            if (index === 0 && (line.toLowerCase().includes('question') || line.toLowerCase().includes('front'))) {
                return;
            }

            const parts = line.split(',').map(part => part.trim().replace(/^"|"$/g, ''));
            if (parts.length >= 2 && parts[0] && parts[1]) {
                this.flashcards.push({
                    id: Date.now() + Math.random(),
                    question: parts[0],
                    answer: parts[1],
                    type: 'text',
                    correctCount: 0,
                    wrongCount: 0,
                    lastStudied: null,
                    nextReview: Date.now(),
                    easeFactor: 2.5,
                    interval: 0
                });
                createdCount++;
            }
        });

        this.saveToStorage();
        this.initializeStudyQueue();
        this.renderLibrary();
        this.updateStudyInterface();

        this.showFeedback(feedback, `Successfully imported ${createdCount} cards from CSV`, 'success');
        document.getElementById('csv-upload').value = '';
    }

    exportToCSV() {
        if (this.flashcards.length === 0) {
            const feedback = document.getElementById('creation-feedback');
            this.showFeedback(feedback, 'No cards to export', 'error');
            return;
        }

        let csv = 'Question,Answer,Correct Count,Wrong Count,Last Studied\n';
        this.flashcards.forEach(card => {
            const question = `"${card.question.replace(/"/g, '""')}"`;
            const answer = `"${card.answer.replace(/"/g, '""')}"`;
            const lastStudied = card.lastStudied ? new Date(card.lastStudied).toLocaleDateString() : 'Never';
            csv += `${question},${answer},${card.correctCount},${card.wrongCount},${lastStudied}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flashcards-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        const feedback = document.getElementById('creation-feedback');
        this.showFeedback(feedback, `Exported ${this.flashcards.length} cards to CSV`, 'success');
    }

    // AI Generation Methods
    generateWithAI() {
        const input = document.getElementById('ai-input').value.trim();
        const feedback = document.getElementById('creation-feedback');

        if (!input) {
            this.showFeedback(feedback, 'Please enter some text to generate flashcards from', 'error');
            return;
        }

        // Simple AI simulation - extract key sentences and create Q&A pairs
        this.showFeedback(feedback, 'Generating flashcards...', 'success');

        setTimeout(() => {
            const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 20);
            let createdCount = 0;

            sentences.forEach(sentence => {
                const words = sentence.trim().split(' ');
                if (words.length > 5) {
                    // Create a simple Q&A by hiding key nouns
                    const keyWord = words.find(w => w.length > 5 && /^[A-Z]/.test(w)) || words[Math.floor(words.length / 2)];
                    const question = `What is ${keyWord.toLowerCase()}?`;
                    const answer = sentence.trim();

                    this.flashcards.push({
                        id: Date.now() + Math.random(),
                        question: question,
                        answer: answer,
                        type: 'text',
                        correctCount: 0,
                        wrongCount: 0,
                        lastStudied: null,
                        nextReview: Date.now(),
                        easeFactor: 2.5,
                        interval: 0
                    });
                    createdCount++;
                }
            });

            this.saveToStorage();
            this.initializeStudyQueue();
            this.renderLibrary();
            this.updateStudyInterface();

            this.showFeedback(feedback, `Generated ${createdCount} flashcards with AI`, 'success');
            document.getElementById('ai-input').value = '';
        }, 1000);
    }

    // Test Mode Methods
    updateTestInterface() {
        const noCardsMsg = document.getElementById('no-test-cards-message');
        const testInterface = document.getElementById('test-interface');

        if (this.flashcards.length === 0) {
            noCardsMsg.style.display = 'block';
            testInterface.style.display = 'none';
            return;
        }

        noCardsMsg.style.display = 'none';
        testInterface.style.display = 'block';

        if (this.testQueue.length === 0) {
            this.initializeTestQueue();
        }

        this.displayTestQuestion();
        this.updateTestStats();
    }

    initializeTestQueue() {
        this.testQueue = this.flashcards.map((card, index) => index);
        this.shuffleArray(this.testQueue);
        this.currentTestIndex = 0;
        this.testStats = { correct: 0, wrong: 0 };
    }

    displayTestQuestion() {
        if (this.testQueue.length === 0) {
            this.showTestComplete();
            return;
        }

        const cardIndex = this.testQueue[0];
        const card = this.flashcards[cardIndex];
        
        document.getElementById('test-question').textContent = card.question;

        // Generate multiple choice options
        const options = this.generateTestOptions(card.answer, cardIndex);
        const optionsContainer = document.getElementById('test-options');
        optionsContainer.innerHTML = '';

        options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'test-option';
            optionDiv.textContent = option.text;
            optionDiv.addEventListener('click', () => this.handleTestAnswer(option.isCorrect, optionDiv, optionsContainer));
            optionsContainer.appendChild(optionDiv);
        });

        // Update progress
        const completed = this.flashcards.length - this.testQueue.length;
        const total = this.flashcards.length;
        const progress = (completed / total) * 100;

        document.getElementById('test-progress-fill').style.width = `${progress}%`;
        document.getElementById('test-progress-text').textContent = `${completed} / ${total}`;
    }

    generateTestOptions(correctAnswer, correctIndex) {
        const options = [{ text: correctAnswer, isCorrect: true }];
        
        // Get 3 random wrong answers from other cards
        const wrongAnswers = this.flashcards
            .map((card, index) => ({ answer: card.answer, index }))
            .filter((item, index) => index !== correctIndex)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(item => ({ text: item.answer, isCorrect: false }));

        options.push(...wrongAnswers);
        
        // Shuffle options
        return this.shuffleArray(options);
    }

    handleTestAnswer(isCorrect, selectedOption, optionsContainer) {
        // Disable all options
        const allOptions = optionsContainer.querySelectorAll('.test-option');
        allOptions.forEach(opt => opt.classList.add('disabled'));

        // Mark selected option
        if (isCorrect) {
            selectedOption.classList.add('correct');
            this.testStats.correct++;
        } else {
            selectedOption.classList.add('wrong');
            this.testStats.wrong++;
            // Show correct answer
            allOptions.forEach(opt => {
                if (opt.textContent === this.flashcards[this.testQueue[0]].answer) {
                    opt.classList.add('correct');
                }
            });
        }

        this.testQueue.shift();

        // Wait before showing next question
        setTimeout(() => {
            if (this.testQueue.length === 0) {
                this.showTestComplete();
            } else {
                this.displayTestQuestion();
            }
            this.updateTestStats();
        }, 1500);
    }

    updateTestStats() {
        document.getElementById('test-correct-count').textContent = this.testStats.correct;
        document.getElementById('test-wrong-count').textContent = this.testStats.wrong;
        
        const total = this.testStats.correct + this.testStats.wrong;
        const accuracy = total > 0 ? Math.round((this.testStats.correct / total) * 100) : 0;
        document.getElementById('test-accuracy').textContent = accuracy + '%';
    }

    showTestComplete() {
        const total = this.testStats.correct + this.testStats.wrong;
        const accuracy = total > 0 ? Math.round((this.testStats.correct / total) * 100) : 0;
        
        document.getElementById('test-question').innerHTML = `
            <div style="text-align: center;">
                <h3 style="font-size: 1.8rem; margin-bottom: 1rem; font-weight: 600;">Test Complete!</h3>
                <p style="margin-top: 1rem; font-size: 1.3rem; color: var(--accent-primary); font-weight: 600;">${accuracy}% Accuracy</p>
                <p style="margin-top: 0.75rem; font-size: 1.1rem; color: var(--text-secondary);">Score: ${this.testStats.correct} / ${total}</p>
            </div>
        `;
        document.getElementById('test-options').innerHTML = '';
    }

    // Stats Dashboard Methods
    updateStatsInterface() {
        this.updateStatCards();
        this.updatePerformanceChart();
        this.updateDifficultyChart();
    }

    updateStatCards() {
        // Total cards
        document.getElementById('total-cards-stat').textContent = this.flashcards.length;

        // Mastered cards (>= 3 correct, 0 wrong)
        const mastered = this.flashcards.filter(c => c.correctCount >= 3 && c.wrongCount === 0).length;
        document.getElementById('mastered-cards-stat').textContent = mastered;

        // Total reviews
        const totalReviews = this.flashcards.reduce((sum, c) => sum + c.correctCount + c.wrongCount, 0);
        document.getElementById('total-reviews-stat').textContent = totalReviews;

        // Overall accuracy
        const totalCorrect = this.flashcards.reduce((sum, c) => sum + c.correctCount, 0);
        const totalWrong = this.flashcards.reduce((sum, c) => sum + c.wrongCount, 0);
        const accuracy = totalCorrect + totalWrong > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0;
        document.getElementById('accuracy-stat').textContent = accuracy + '%';

        // Best streak
        const bestStreak = localStorage.getItem('bestStreak') || 0;
        document.getElementById('best-streak-stat').textContent = bestStreak;

        // Study days (simplified - count unique dates from lastStudied)
        const studyDates = new Set(
            this.flashcards
                .filter(c => c.lastStudied)
                .map(c => new Date(c.lastStudied).toDateString())
        );
        document.getElementById('study-days-stat').textContent = studyDates.size;
    }

    updatePerformanceChart() {
        const canvas = document.getElementById('performance-chart');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Simple bar chart of correct vs wrong
        const totalCorrect = this.flashcards.reduce((sum, c) => sum + c.correctCount, 0);
        const totalWrong = this.flashcards.reduce((sum, c) => sum + c.wrongCount, 0);
        
        const maxValue = Math.max(totalCorrect, totalWrong, 1);
        const barWidth = 100;
        const spacing = 80;
        
        // Draw correct bar
        ctx.fillStyle = '#22c55e';
        const correctHeight = (totalCorrect / maxValue) * 150;
        ctx.fillRect(80, 160 - correctHeight, barWidth, correctHeight);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Correct', 130, 185);
        ctx.fillText(totalCorrect, 130, 200);
        
        // Draw wrong bar
        ctx.fillStyle = '#ef4444';
        const wrongHeight = (totalWrong / maxValue) * 150;
        ctx.fillRect(80 + barWidth + spacing, 160 - wrongHeight, barWidth, wrongHeight);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText('Wrong', 230, 185);
        ctx.fillText(totalWrong, 230, 200);
    }

    updateDifficultyChart() {
        const container = document.getElementById('difficulty-chart');
        container.innerHTML = '';

        // Categorize cards by difficulty
        const easy = this.flashcards.filter(c => c.correctCount >= 3 && c.wrongCount === 0).length;
        const medium = this.flashcards.filter(c => {
            const total = c.correctCount + c.wrongCount;
            const accuracy = total > 0 ? c.correctCount / total : 0;
            return accuracy >= 0.5 && accuracy < 1 && c.wrongCount > 0;
        }).length;
        const hard = this.flashcards.filter(c => {
            const total = c.correctCount + c.wrongCount;
            const accuracy = total > 0 ? c.correctCount / total : 0;
            return accuracy < 0.5 || (total === 0 && c.wrongCount > 0);
        }).length;
        const notStudied = this.flashcards.filter(c => c.correctCount === 0 && c.wrongCount === 0).length;

        const total = this.flashcards.length || 1;

        const difficulties = [
            { label: 'Easy (Mastered)', value: easy, color: '#22c55e' },
            { label: 'Medium', value: medium, color: '#f59e0b' },
            { label: 'Hard', value: hard, color: '#ef4444' },
            { label: 'Not Studied', value: notStudied, color: '#64748b' }
        ];

        difficulties.forEach(diff => {
            const item = document.createElement('div');
            item.className = 'difficulty-bar-item';
            
            const label = document.createElement('div');
            label.className = 'difficulty-label';
            label.textContent = diff.label;
            
            const barBg = document.createElement('div');
            barBg.className = 'difficulty-bar-bg';
            
            const barFill = document.createElement('div');
            barFill.className = 'difficulty-bar-fill';
            barFill.style.width = `${(diff.value / total) * 100}%`;
            barFill.style.background = diff.color;
            
            const barValue = document.createElement('span');
            barValue.className = 'difficulty-bar-value';
            barValue.textContent = diff.value;
            
            barFill.appendChild(barValue);
            barBg.appendChild(barFill);
            item.appendChild(label);
            item.appendChild(barBg);
            container.appendChild(item);
        });
    }

    // Spaced Repetition Algorithm (SM-2)
    updateSpacedRepetition(card, quality) {
        // quality: 0-5 (0=total blackout, 5=perfect)
        if (quality >= 3) {
            if (card.interval === 0) {
                card.interval = 1;
            } else if (card.interval === 1) {
                card.interval = 6;
            } else {
                card.interval = Math.round(card.interval * card.easeFactor);
            }
        } else {
            card.interval = 0;
        }

        card.easeFactor = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        
        if (card.easeFactor < 1.3) {
            card.easeFactor = 1.3;
        }

        card.nextReview = Date.now() + (card.interval * 24 * 60 * 60 * 1000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.flashcardApp = new FlashcardApp();
});


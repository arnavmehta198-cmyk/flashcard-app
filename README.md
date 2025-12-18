# Flashcards

A modern, intelligent flashcard application designed for effective studying and retention.

🌐 **Live Demo:** [https://arnavmehta198-cmyk.github.io/flashcard-app/](https://arnavmehta198-cmyk.github.io/flashcard-app/)

## Features

### Card Creation & Customization
- **Text Input** - Paste multiple cards at once using `Question | Answer` format
- **URL Import** - Import content directly from any webpage
- **Image & GIF Support** - Add images and animated GIFs to flashcards for visual learning
- **Audio Recording** - Record audio directly or add audio URLs for pronunciation practice
- **CSV Import/Export** - Import cards from CSV files or export your deck for backup
- **AI Generation** - Automatically generate flashcards from study notes (Smart text parsing)
- **Deck Organization** - Group cards into subjects, classes, or custom folders

### Study Modes & Techniques
- **Flashcard Mode** - Traditional flip-through review with smooth slide animations
- **Multiple Choice Test** - Quiz yourself with automatically generated options
- **Writing Mode** - Type out answers to test recall without hints
- **Matching Game** - Match questions with answers in an interactive game format
- **Audio Playback** - Listen to pronunciation with adjustable speeds (0.5x - 2x) for language learning
- **Spaced Repetition** - SM-2 algorithm shows difficult cards more often for optimal retention
- **Randomized Order** - Questions are shuffled for better learning
- **Visual Feedback** - Instant color-coded feedback and smooth transitions
- **Streak Tracking** - Track your current streak and best streak
- **Keyboard Shortcuts** - Space to flip, Arrow keys or C/W for correct/wrong
- **Confetti Celebration** - Earn confetti for 90%+ accuracy
- **Offline Access** - Study without internet connection (uses local storage)

### Review System
- **Automatic mistake tracking**
- **Randomized review order** for better retention
- Dedicated review mode for incorrect answers
- Visual feedback on review answers
- Keyboard shortcuts support
- Spaced repetition until mastery

### Data Persistence
- Automatic saving to browser storage
- Resume exactly where you left off
- No re-entry of existing cards needed

### Tracking & Sharing
- **Progress Dashboard** - Monitor scores, speed, and performance metrics
- **Performance Charts** - Visual graphs showing correct vs wrong answers
- **Difficulty Distribution** - See which cards need more practice (Easy/Medium/Hard)
- **Study Streaks** - Monitor your consistency and best streaks
- **Mastery Tracking** - Track cards you've mastered vs need review
- **Shareable Decks** - Generate links to share your flashcard sets with friends or students
- **Deck Import** - Import shared decks from other users via URL

### Library Management
- Complete card overview with deck filtering
- Individual card statistics (correct/wrong counts, last studied, difficulty)
- Organize cards by subject, class, or custom folders
- Delete cards or reset progress as needed
- Export entire deck or specific folders to CSV for backup

## Usage

1. Open `index.html` in your browser

2. Create cards:
   - Text: `What is the capital of France? | Paris`
   - URL: Paste any webpage link to import content
   - Image: Upload and manually create card

3. Study:
   - Click card to reveal answer
   - Mark as correct or wrong

4. Review:
   - Practice incorrectly answered cards
   - Continue until mastered

## Keyboard Shortcuts

- **Space/Enter** - Flip the current card
- **→ or C** - Mark as correct
- **← or W** - Mark as wrong

## Advanced Features

- **Adaptive Learning** - Spaced repetition algorithm adapts to your performance
- **Visual Learning** - Graphs, charts, and animations throughout the interface
- **Audio Recording** - Built-in microphone recording with Web Audio API
- **Multiple Test Formats** - Choose from multiple choice, writing, or matching games
- **Smart Import** - Import from CSV, URLs, or shared links
- **Deck Organization** - Group and filter cards by subject or difficulty

## Technical Details

- Pure HTML, CSS, JavaScript (no external dependencies)
- localStorage for data persistence and offline access
- Web Audio API for recording and playback
- Canvas API for performance charts
- Responsive design for mobile, tablet, and desktop
- Fully offline-capable Progressive Web App

## Browser Support

Compatible with all modern web browsers.

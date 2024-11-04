# Infection Game

A fast-paced, interactive web game where players must contain infections by drawing lines on the screen. Save as many lives as possible by strategically isolating infected entities from healthy ones!

![Infection Game Screenshot](screenshot.png)

🎮 [Play Now](https://hazemelraffiee.github.io/infection-game/)

## 🚀 Getting Started

### Prerequisites

- Node.js v22.x
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hazemelraffiee/infection-game.git
cd infection-game
```

2. Install dependencies:
```bash
npm install
```

### Development

Run the development server:
```bash
npm run dev
```

### Building and Previewing

Build for production:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```
The preview will be available at:
```
http://localhost:5173/infection-game/
```

### Deployment

The game is configured for GitHub Pages deployment:

```bash
npm run deploy
```

This will automatically run the build process and deploy to GitHub Pages. The game will be available at:
```
https://hazemelraffiee.github.io/infection-game/
```

Note: Pushing to the main branch triggers an automatic deployment.

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (runs TypeScript build first)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally
- `npm run deploy` - Deploy to GitHub Pages

## 🎯 How to Play

1. Click or tap the "Play Now" button to start
2. Draw lines on the screen by clicking/touching and dragging
3. Contain infected entities (red) to protect healthy ones (green)
4. Don't let your lines touch any entities while drawing
5. Game ends when all infections are contained
6. Your score is based on the number of entities saved

## 🛠️ Technical Stack

### Core Dependencies
- React
- React DOM
- Lucide React
- Emotion/React
- Emotion/Styled

### Development Dependencies
- TypeScript
- Vite
- ESLint
- TailwindCSS
- PostCSS
- Autoprefixer

## 🏆 Features

### Game Mechanics
- Smooth line drawing system
- Physics-based entity movement
- Collision detection
- Infection spread mechanics

### UI/UX
- Intuitive touch and mouse controls
- Responsive design for all screen sizes
- Visual feedback for player actions
- Clean, modern interface

### Leaderboard System
- Dual tracking (scores and times)
- Persistent storage
- Top scores display
- Current attempt highlighting

## 🔧 Advanced Features

### Secret Controls
- Press `Ctrl + Shift + R` to reset leaderboards

### Customization
The game includes various customizable settings:
- Ball count
- Ball radius
- Speed scale
- Leaderboard size

## 📱 Mobile Support
- Touch-optimized controls
- Responsive layout
- Dynamic viewport handling
- Mobile browser optimization

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

Please ensure your PR adheres to the following guidelines:
- Follow the existing code style
- Run `npm run lint` before submitting
- Update documentation as needed
- Add tests if applicable

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## System Requirements

- Node.js v22.x
- Modern web browser with canvas support
- Recommended: Touch screen for mobile play
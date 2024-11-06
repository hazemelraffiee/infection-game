import { useState, useEffect, useCallback } from 'react';
import { HelpCircle, Play, X } from 'lucide-react';
import GameCanvas from './GameCanvas';
import GameOverScreen from './GameOverScreen';
import NameInputDialog from './NameInputDialog';
import { useGameSettings } from './GameSettings';
import { GameState, LeaderboardEntry } from './types';
import BackgroundMusic from './BackgroundMusic';
import logoUrl from '../assets/logo.svg';

// Tutorial Modal Component
const TutorialModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="relative max-w-lg mx-4 transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative bg-black/80 rounded-2xl p-8 border border-emerald-500/30 shadow-2xl">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    
                    <div className="flex items-center mb-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 flex items-center justify-center mr-4 shadow-lg">
                            <Play className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white">How to Play</h2>
                    </div>

                    <div className="space-y-4 text-lg text-emerald-100 leading-relaxed">
                        <p>
                            Draw lines to contain the infection! Keep your barriers strong and prevent
                            any contact with infected particles.
                        </p>
                        <p>
                            Your mission: contain all infections while protecting as many lives as possible.
                            The faster you contain the outbreak, the higher your score!
                        </p>
                    </div>

                    <div className="mt-8 text-center">
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full font-bold transition-colors"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// StartScreen Component
const StartScreen = ({ onStart }: { onStart: () => void }) => {
    const [showTutorial, setShowTutorial] = useState(false);

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/70 to-black/90 p-6">
            <div className="flex flex-col items-center animate-fade-in">
                <img src={logoUrl} alt="Infection Game Logo" className="w-64 h-64 mb-2 animate-pulse" />
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-emerald-400 mb-2 animate-title text-center">
                    INFECTION
                </h1>
                <div className="text-xl font-bold tracking-widest text-emerald-500 uppercase mb-8">
                    Contain the Outbreak
                </div>

                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={onStart}
                        className="group relative flex items-center gap-4 px-16 py-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-full text-3xl font-bold shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                    >
                        <Play className="h-10 w-10" />
                        Play Now
                        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                        <div className="absolute -inset-1 bg-emerald-500 rounded-full blur opacity-30 group-hover:opacity-40 transition-opacity" />
                    </button>

                    <button
                        onClick={() => setShowTutorial(true)}
                        className="flex items-center gap-2 px-6 py-3 text-emerald-400 hover:text-emerald-300 transition-colors text-lg font-semibold"
                    >
                        <HelpCircle className="w-5 h-5" />
                        How to Play
                    </button>
                </div>
            </div>

            <TutorialModal 
                isOpen={showTutorial} 
                onClose={() => setShowTutorial(false)} 
            />
        </div>
    );
};

// Styles for animations
const styles = `
@keyframes title {
    0% { transform: scale(0.9); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
}

@keyframes fade-in {
    0% { opacity: 0; transform: translateY(-20px); }
    100% { opacity: 1; transform: translateY(0); }
}

.animate-title {
    animation: title 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.animate-fade-in {
    animation: fade-in 1s ease-out forwards;
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Main Game Component
export const InfectionGame = () => {
    const settings = useGameSettings();
    const [showNameInput, setShowNameInput] = useState(false);
    const [gameState, setGameState] = useState<GameState>(() => ({
        isGameOver: false,
        infectionStarted: false,
        currentScore: 0,
        gameStartTime: null,
        gameEndTime: null,
        highScores: [],
        bestTimes: [],
    }));

    // Load leaderboard data
    useEffect(() => {
        const loadLeaderboard = () => {
            try {
                const highScores = JSON.parse(localStorage.getItem('highScores') ?? '[]');
                const bestTimes = JSON.parse(localStorage.getItem('bestTimes') ?? '[]');
                setGameState(prev => ({ ...prev, highScores, bestTimes }));
            } catch (error) {
                console.error('Error loading leaderboard:', error);
                localStorage.setItem('highScores', '[]');
                localStorage.setItem('bestTimes', '[]');
            }
        };

        loadLeaderboard();
    }, []);

    // Leaderboard management
    const isLeaderboardWorthy = useCallback((type: 'score' | 'time', value: number): boolean => {
        const board = type === 'score' ? gameState.highScores : gameState.bestTimes;
        if (board.length < settings.leaderboardSize) return true;
        return type === 'score'
            ? value > board[board.length - 1].value
            : value < board[board.length - 1].value;
    }, [gameState.highScores, gameState.bestTimes, settings.leaderboardSize]);

    const addToLeaderboard = useCallback((type: 'score' | 'time', value: number, playerName: string) => {
        const board = type === 'score' ? [...gameState.highScores] : [...gameState.bestTimes];
        const entry: LeaderboardEntry = {
            playerName,
            value,
            date: new Date().toISOString()
        };

        board.push(entry);
        board.sort((a, b) => type === 'score' ? b.value - a.value : a.value - b.value);
        if (board.length > settings.leaderboardSize) {
            board.length = settings.leaderboardSize;
        }

        setGameState(prev => ({
            ...prev,
            [type === 'score' ? 'highScores' : 'bestTimes']: board
        }));
        localStorage.setItem(
            type === 'score' ? 'highScores' : 'bestTimes',
            JSON.stringify(board)
        );
    }, [gameState.highScores, gameState.bestTimes, settings.leaderboardSize]);

    // Game flow handlers
    const startGame = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            isGameOver: false,
            infectionStarted: true,
            gameStartTime: Date.now(),
            currentScore: 0,
            gameEndTime: null
        }));
    }, []);

    const resetGame = useCallback(() => {
        startGame();
    }, [startGame]);

    const handleGameOver = useCallback(() => {
        const endTime = Date.now();
        const gameTime = (endTime - (gameState.gameStartTime || 0)) / 1000;

        setGameState(prev => ({
            ...prev,
            isGameOver: true,
            gameEndTime: endTime,
            infectionStarted: false,
        }));

        if (isLeaderboardWorthy('score', gameState.currentScore) ||
            isLeaderboardWorthy('time', gameTime)) {
            setShowNameInput(true);
        }
    }, [gameState.gameStartTime, gameState.currentScore, isLeaderboardWorthy]);

    const handleNameSubmit = useCallback((playerName: string) => {
        const gameTime = (gameState.gameEndTime! - gameState.gameStartTime!) / 1000;

        if (isLeaderboardWorthy('score', gameState.currentScore)) {
            addToLeaderboard('score', gameState.currentScore, playerName);
        }
        if (isLeaderboardWorthy('time', gameTime)) {
            addToLeaderboard('time', gameTime, playerName);
        }

        setShowNameInput(false);
    }, [gameState.gameEndTime, gameState.gameStartTime, gameState.currentScore, isLeaderboardWorthy, addToLeaderboard]);

    // Leaderboard reset handler
    const handleResetLeaderboard = useCallback(() => {
        // Reset leaderboard state
        setGameState(prev => ({
            ...prev,
            highScores: [],
            bestTimes: []
        }));

        // Clear localStorage
        localStorage.setItem('highScores', '[]');
        localStorage.setItem('bestTimes', '[]');

        // Show notification
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border-radius: 5px;
            font-size: 12px;
            z-index: 9999;
            animation: fadeOut 2s forwards;
        `;
        flash.textContent = '🗑️ Leaderboard reset';
        document.body.appendChild(flash);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeOut {
                0% { opacity: 1; }
                70% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            document.body.removeChild(flash);
            document.head.removeChild(style);
        }, 2000);
    }, []);

    // Handle keyboard shortcut for leaderboard reset
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                handleResetLeaderboard();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleResetLeaderboard]);

    return (
        <div className="relative w-full h-full overflow-hidden bg-virus-base">
            {/* Pattern overlay with animation */}
            <div className="absolute inset-0 bg-virus-pattern bg-repeat bg-[length:7em_7em] animate-pulse-slow" />
            
            {/* Content container */}
            <div className="relative z-10 w-full h-full">
                <BackgroundMusic />
                <GameCanvas
                    gameState={gameState}
                    setGameState={setGameState}
                    settings={settings}
                    onGameOver={handleGameOver}
                />

                {!gameState.infectionStarted && !gameState.isGameOver && (
                    <StartScreen onStart={startGame} />
                )}

                {gameState.isGameOver && !showNameInput && (
                    <GameOverScreen
                        currentScore={gameState.currentScore}
                        gameTime={(gameState.gameEndTime! - gameState.gameStartTime!) / 1000}
                        highScores={gameState.highScores}
                        bestTimes={gameState.bestTimes}
                        onPlayAgain={resetGame}
                        onResetLeaderboard={handleResetLeaderboard} // Pass the handler here
                    />
                )}

                {showNameInput && (
                    <NameInputDialog
                        score={gameState.currentScore}
                        time={(gameState.gameEndTime! - gameState.gameStartTime!) / 1000}
                        onSubmit={handleNameSubmit}
                    />
                )}
            </div>
        </div>
    );
};

export default InfectionGame;
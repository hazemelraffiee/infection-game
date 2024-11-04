import { useState, useEffect, useCallback } from 'react';
import { Play } from 'lucide-react';
import GameCanvas from './GameCanvas';
import GameOverScreen from './GameOverScreen';
import NameInputDialog from './NameInputDialog';
import { useGameSettings } from './GameSettings';
import { GameState, LeaderboardEntry } from './types';

export const InfectionGame = () => {
    const settings = useGameSettings();
    const [showNameInput, setShowNameInput] = useState(false);
    const [showTutorial, setShowTutorial] = useState(true);
    const [gameState, setGameState] = useState<GameState>(() => ({
        isGameOver: false,
        infectionStarted: false,
        currentScore: 0,
        gameStartTime: null,
        gameEndTime: null,
        highScores: [],
        bestTimes: [],
        gameInstance: null
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
        setShowTutorial(false);
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
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();

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
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // UI Components
    const StartScreen = () => (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
            {showTutorial && (
                <div className="mb-8 max-w-md bg-white rounded-lg p-6 shadow-lg">
                    <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center mr-2">
                            <Play className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold">How to Play</h2>
                    </div>
                    <p className="text-gray-600">
                        Draw lines to contain the infection! Don't let your lines touch any balls.
                        The game ends when all infections are contained. Save as many lives as you can!
                    </p>
                </div>
            )}
            <button
                onClick={startGame}
                className="group relative flex items-center gap-3 px-12 py-6 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-full text-3xl font-bold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
                <Play className="h-10 w-10" />
                Play Now
                <div className="absolute -inset-1 bg-emerald-500 rounded-full blur opacity-30 group-hover:opacity-40 transition-opacity" />
            </button>
        </div>
    );

    return (
        <div className="relative w-full h-full overflow-hidden">
            <GameCanvas
                gameState={gameState}
                setGameState={setGameState}
                settings={settings}
                onGameOver={handleGameOver}
            />

            {!gameState.infectionStarted && !gameState.isGameOver && <StartScreen />}

            {gameState.isGameOver && !showNameInput && (
                <GameOverScreen
                    currentScore={gameState.currentScore}
                    gameTime={(gameState.gameEndTime! - gameState.gameStartTime!) / 1000}
                    highScores={gameState.highScores}
                    bestTimes={gameState.bestTimes}
                    onPlayAgain={resetGame}
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
    );
};

export default InfectionGame;
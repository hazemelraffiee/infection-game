import React, { useState } from 'react';
import { Star, Timer } from 'lucide-react';
import { LeaderboardEntry } from './types';

interface GameOverScreenProps {
    currentScore: number;
    gameTime: number;
    highScores: LeaderboardEntry[];
    bestTimes: LeaderboardEntry[];
    onPlayAgain: () => void;
    onResetLeaderboard: () => void;
}

// LeaderboardPanel component
const LeaderboardPanel: React.FC<{
    title: string;
    entries: LeaderboardEntry[];
    valueFormatter: (value: number) => string;
    icon: string;
    currentValue: number;
}> = ({ title, entries, valueFormatter, icon, currentValue }) => (
    <div className="w-full md:w-72 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{icon}</span>
            <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <div className="space-y-2">
            {entries.map((entry, i) => {
                const isCurrentScore = Math.abs(entry.value - currentValue) < 0.1;
                const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : null;

                return (
                    <div
                        key={`${entry.playerName}-${entry.date}`}
                        className={`flex items-center p-3 rounded-xl transition-colors duration-300 ${isCurrentScore
                                ? 'bg-emerald-500/20 border border-emerald-500/30'
                                : 'bg-white/5 hover:bg-white/10'
                            }`}
                    >
                        <span className="w-8 text-base text-emerald-300 font-bold">
                            {medal || `${i + 1}.`}
                        </span>
                        <span className="flex-grow truncate text-white/90">
                            {entry.playerName}
                        </span>
                        <span className="font-bold text-emerald-400">
                            {valueFormatter(entry.value)}
                        </span>
                    </div>
                );
            })}
        </div>
    </div>
);

// Earthquake animation styles
const earthquakeStyles = `
    @keyframes earthquake {
        0%, 100% { transform: translate(0, 0) rotate(0); }
        10% { transform: translate(-2px, -2px) rotate(-1deg); }
        20% { transform: translate(2px, 2px) rotate(1deg); }
        30% { transform: translate(-3px, 0) rotate(0); }
        40% { transform: translate(3px, -2px) rotate(1deg); }
        50% { transform: translate(-2px, 2px) rotate(-1deg); }
        60% { transform: translate(2px, -1px) rotate(0); }
        70% { transform: translate(-2px, 1px) rotate(-1deg); }
        80% { transform: translate(-1px, -1px) rotate(1deg); }
        90% { transform: translate(1px, 2px) rotate(0); }
    }

    .animate-earthquake {
        animation: earthquake 0.82s cubic-bezier(.36,.07,.19,.97) both;
        transform: translate3d(0, 0, 0);
        backface-visibility: hidden;
        perspective: 1000px;
    }
`;

const GameOverScreen: React.FC<GameOverScreenProps> = ({
    currentScore,
    gameTime,
    highScores,
    bestTimes,
    onPlayAgain,
    onResetLeaderboard
}) => {
    const [activeBoard, setActiveBoard] = useState<'scores' | 'times'>('scores');
    const [isShaking, setIsShaking] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const [lastClickTime, setLastClickTime] = useState(Date.now());
    const CLICK_TIMEOUT = 2000; // 2 seconds timeout between clicks
    const REQUIRED_CLICKS = 5;

    const triggerShake = () => {
        if (!isShaking) {
            const currentTime = Date.now();

            // Reset click count if too much time has passed
            if (currentTime - lastClickTime > CLICK_TIMEOUT) {
                setClickCount(1);
            } else {
                setClickCount(prev => prev + 1);
            }

            setLastClickTime(currentTime);
            setIsShaking(true);

            // Check if we've reached the required clicks
            if (clickCount + 1 >= REQUIRED_CLICKS) {
                // Clear leaderboard
                onResetLeaderboard();

                // Show feedback notification
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
                    // Reset click count
                    setClickCount(0);
                }, 2000);

                // Reset click count
                setClickCount(0);
            }

            // Reset shake after animation
            setTimeout(() => setIsShaking(false), 820);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-4xl">
                {/* Stats Container */}
                <div className="text-center mb-8 space-y-6">
                    <style dangerouslySetInnerHTML={{ __html: earthquakeStyles }} />

                    <h1
                        onClick={triggerShake}
                        className={`text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-emerald-400 cursor-pointer select-none transition-transform
                            ${isShaking ? 'animate-earthquake' : 'hover:scale-105'}`}
                    >
                        GAME OVER
                    </h1>

                    <div className="flex justify-center gap-8">
                        <div className={`flex flex-col items-center ${isShaking ? 'animate-earthquake' : ''}`}>
                            <div className="text-5xl font-bold text-emerald-400 mb-2">
                                {currentScore}
                            </div>
                            <div className="text-emerald-200 font-medium">Lives Saved</div>
                        </div>
                        <div className="w-px bg-gradient-to-b from-transparent via-emerald-500/50 to-transparent" />
                        <div className={`flex flex-col items-center ${isShaking ? 'animate-earthquake' : ''}`}>
                            <div className="text-5xl font-bold text-emerald-400 mb-2">
                                {gameTime.toFixed(1)}s
                            </div>
                            <div className="text-emerald-200 font-medium">Time</div>
                        </div>
                    </div>
                </div>

                {/* Mobile Toggle */}
                <div className="flex justify-center gap-3 mb-6 md:hidden">
                    <button
                        onClick={() => setActiveBoard('scores')}
                        className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-colors ${activeBoard === 'scores'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-white/5 text-white/70'
                            }`}
                    >
                        <Star className="w-5 h-5" />
                        <span className="font-medium">Scores</span>
                    </button>
                    <button
                        onClick={() => setActiveBoard('times')}
                        className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-colors ${activeBoard === 'times'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-white/5 text-white/70'
                            }`}
                    >
                        <Timer className="w-5 h-5" />
                        <span className="font-medium">Times</span>
                    </button>
                </div>

                {/* Desktop Leaderboards */}
                <div className="hidden md:flex justify-center gap-6 mb-8">
                    <LeaderboardPanel
                        title="Best Scores"
                        entries={highScores}
                        valueFormatter={(v) => `${v}`}
                        icon="🌟"
                        currentValue={currentScore}
                    />
                    <LeaderboardPanel
                        title="Best Times"
                        entries={bestTimes}
                        valueFormatter={(v) => `${v.toFixed(1)}s`}
                        icon="⚡"
                        currentValue={gameTime}
                    />
                </div>

                {/* Mobile Leaderboard */}
                <div className="md:hidden mb-8">
                    {activeBoard === 'scores' ? (
                        <LeaderboardPanel
                            title="Best Scores"
                            entries={highScores}
                            valueFormatter={(v) => `${v}`}
                            icon="🌟"
                            currentValue={currentScore}
                        />
                    ) : (
                        <LeaderboardPanel
                            title="Best Times"
                            entries={bestTimes}
                            valueFormatter={(v) => `${v.toFixed(1)}s`}
                            icon="⚡"
                            currentValue={gameTime}
                        />
                    )}
                </div>

                {/* Play Again Button */}
                <div className="flex justify-center">
                    <button
                        onClick={onPlayAgain}
                        className="group relative px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full text-xl font-bold shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                    >
                        Play Again
                        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                        <div className="absolute -inset-1 bg-emerald-500 rounded-full blur opacity-30 group-hover:opacity-40 transition-opacity" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameOverScreen;
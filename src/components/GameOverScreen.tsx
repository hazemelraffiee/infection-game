import React, { useState } from 'react';
import { Play, Star, Timer } from 'lucide-react';
import { LeaderboardEntry } from './types';

interface GameOverScreenProps {
    currentScore: number;
    gameTime: number;
    highScores: LeaderboardEntry[];
    bestTimes: LeaderboardEntry[];
    onPlayAgain: () => void;
}

const LeaderboardPanel = ({
    title,
    entries,
    valueFormatter,
    icon,
    currentValue
}: {
    title: string;
    entries: LeaderboardEntry[];
    valueFormatter: (value: number) => string;
    icon: string;
    currentValue: number;
}) => (
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
                        className={`flex items-center p-3 rounded-xl transition-colors duration-300 ${
                            isCurrentScore 
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

const GameOverScreen: React.FC<GameOverScreenProps> = ({
    currentScore,
    gameTime,
    highScores,
    bestTimes,
    onPlayAgain
}) => {
    const [activeBoard, setActiveBoard] = useState<'scores' | 'times'>('scores');

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-4xl">
                {/* Stats Container */}
                <div className="text-center mb-8 space-y-6">
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-emerald-400 animate-title">
                        GAME OVER
                    </h1>
                    
                    <div className="flex justify-center gap-8">
                        <div className="flex flex-col items-center">
                            <div className="text-5xl font-bold text-emerald-400 mb-2">
                                {currentScore}
                            </div>
                            <div className="text-emerald-200 font-medium">Lives Saved</div>
                        </div>
                        <div className="w-px bg-gradient-to-b from-transparent via-emerald-500/50 to-transparent" />
                        <div className="flex flex-col items-center">
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
                        className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-colors ${
                            activeBoard === 'scores' 
                            ? 'bg-emerald-500/20 text-emerald-300' 
                            : 'bg-white/5 text-white/70'
                        }`}
                    >
                        <Star className="w-5 h-5" />
                        <span className="font-medium">Scores</span>
                    </button>
                    <button
                        onClick={() => setActiveBoard('times')}
                        className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-colors ${
                            activeBoard === 'times' 
                            ? 'bg-emerald-500/20 text-emerald-300' 
                            : 'bg-white/5 text-white/70'
                        }`}
                    >
                        <Timer className="w-5 h-5" />
                        <span className="font-medium">Times</span>
                    </button>
                </div>

                {/* Leaderboards */}
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
                        className="group relative flex items-center gap-3 px-12 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-full text-xl font-bold shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                    >
                        <Play className="w-6 h-6" />
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
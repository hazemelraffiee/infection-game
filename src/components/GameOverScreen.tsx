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

const GameOverScreen: React.FC<GameOverScreenProps> = ({
    currentScore,
    gameTime,
    highScores,
    bestTimes,
    onPlayAgain
}) => {
    const [activeBoard, setActiveBoard] = useState<'scores' | 'times'>('scores');

    const LeaderboardPanel: React.FC<{
        title: string;
        entries: LeaderboardEntry[];
        valueFormatter: (value: number) => string;
        icon: string;
        currentValue: number;
    }> = ({ title, entries, valueFormatter, icon, currentValue }) => (
        <div className="w-full md:w-60 p-4 bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-xl md:text-2xl">{icon}</span>
                <h3 className="text-lg md:text-xl font-bold text-gray-800">{title}</h3>
            </div>
            <div className="space-y-2">
                {entries.map((entry, i) => {
                    const isCurrentScore = 
                        Math.abs(entry.value - currentValue) < 0.1;
                    const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : null;

                    return (
                        <div
                            key={`${entry.playerName}-${entry.date}`}
                            className={`flex items-center p-2 rounded-lg ${
                                isCurrentScore ? 'bg-emerald-50' : i % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                            }`}
                        >
                            <span className="w-6 md:w-8 text-sm md:text-base text-gray-600 font-bold">
                                {medal || `${i + 1}.`}
                            </span>
                            <span className="flex-grow truncate text-sm md:text-base text-gray-700">
                                {entry.playerName}
                            </span>
                            <span className="text-sm md:text-base font-bold text-emerald-600">
                                {valueFormatter(entry.value)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
            <div className="w-full max-w-[700px] bg-gradient-to-b from-white to-gray-50 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 space-y-4 md:space-y-6">
                {/* Trophy and Title */}
                <div className="text-center space-y-1 md:space-y-2">
                    <span className="text-3xl md:text-4xl">🏆</span>
                    <h2 className="text-2xl md:text-4xl font-bold text-gray-800">Game Over!</h2>
                </div>

                {/* Stats Box */}
                <div className="bg-gray-50 rounded-xl p-4 md:p-6 flex justify-around items-center">
                    <div className="text-center">
                        <div className="text-2xl md:text-3xl font-bold text-emerald-600">
                            {currentScore}
                        </div>
                        <div className="text-xs md:text-sm text-gray-500">Lives Saved</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl md:text-3xl font-bold text-red-500">
                            {gameTime.toFixed(1)}s
                        </div>
                        <div className="text-xs md:text-sm text-gray-500">Time</div>
                    </div>
                </div>

                {/* Mobile Toggle Buttons */}
                <div className="flex justify-center gap-2 md:hidden">
                    <button
                        onClick={() => setActiveBoard('scores')}
                        className={`p-2 rounded-lg flex items-center gap-2 ${
                            activeBoard === 'scores' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                        <Star className="w-5 h-5" />
                        <span className="font-medium">Scores</span>
                    </button>
                    <button
                        onClick={() => setActiveBoard('times')}
                        className={`p-2 rounded-lg flex items-center gap-2 ${
                            activeBoard === 'times' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                        <Timer className="w-5 h-5" />
                        <span className="font-medium">Times</span>
                    </button>
                </div>

                {/* Leaderboards */}
                <div className="hidden md:flex justify-between gap-4">
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

                {/* Mobile Single Leaderboard */}
                <div className="md:hidden">
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
                        className="group relative flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-full text-lg md:text-xl font-bold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    >
                        <Play className="w-5 h-5 md:w-6 md:h-6" />
                        Play Again
                        <div className="absolute -inset-1 bg-emerald-500 rounded-full blur opacity-30 group-hover:opacity-40 transition-opacity" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameOverScreen;
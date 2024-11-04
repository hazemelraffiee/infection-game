import React, { useState } from 'react';

interface NameInputDialogProps {
    score: number;
    time: number;
    onSubmit: (name: string) => void;
}

const NameInputDialog: React.FC<NameInputDialogProps> = ({
    score,
    time,
    onSubmit
}) => {
    const [name, setName] = useState('');

    // German QWERTZ keyboard layout with umlauts
    const keyboardRows = [
        ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P', 'Ü', '⌫'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ö', 'Ä'],
        ['Y', 'X', 'C', 'V', 'B', 'N', 'M', 'ß']
    ];

    const handleKeyClick = (key: string) => {
        if (key === '⌫') {
            setName(prev => prev.slice(0, -1));
        } else if (name.length < 20) {
            setName(prev => prev + key);
        }
    };

    const achievements = [];
    if (score > 0) achievements.push('High Score');
    if (time > 0) achievements.push('Best Time');

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="fixed inset-0 bg-black/70" />
            
            <div className="relative min-w-[400px] max-w-[500px] bg-gradient-to-b from-white to-gray-50 p-8 rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="text-center space-y-4 mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">
                        {achievements.length > 1 ? '🏆' : '🌟'} Congratulations!
                    </h2>
                    <p className="text-lg text-gray-600">
                        You achieved: <span className="font-semibold">{achievements.join(' and ')}</span>
                    </p>
                </div>

                {/* Name Input */}
                <div className="mb-6">
                    <label className="block text-gray-700 text-lg font-semibold mb-2">
                        Enter your name:
                    </label>
                    <input
                        type="text"
                        value={name}
                        readOnly
                        className="w-full px-4 py-3 rounded-xl 
                                 border-2 border-blue-400 
                                 bg-white
                                 text-gray-800 text-xl tracking-wide
                                 shadow-inner"
                        maxLength={20}
                        placeholder="Type using the keyboard below"
                    />
                </div>

                {/* Keyboard */}
                <div className="mx-auto space-y-2">
                    {keyboardRows.map((row, rowIndex) => (
                        <div 
                            key={rowIndex}
                            className="flex justify-center gap-1.5"
                            style={{
                                paddingLeft: rowIndex * 20 // Indent each row progressively
                            }}
                        >
                            {row.map((key) => (
                                <button
                                    key={key}
                                    onClick={() => handleKeyClick(key)}
                                    className={`
                                        relative group
                                        ${key === '⌫' ? 'w-16' : 'w-11'}
                                        h-11
                                        bg-gradient-to-b from-white to-gray-100
                                        hover:from-gray-50 hover:to-gray-200
                                        active:from-gray-200 active:to-gray-300
                                        border border-gray-300
                                        rounded-lg
                                        font-semibold text-gray-700
                                        shadow-sm
                                        transition-all duration-150
                                        hover:shadow-md hover:-translate-y-0.5
                                        active:translate-y-0 active:shadow-sm
                                        focus:outline-none focus:ring-2 focus:ring-blue-300
                                    `}
                                >
                                    {/* Key Content */}
                                    <span className="absolute inset-0 flex items-center justify-center">
                                        {key}
                                    </span>
                                    
                                    {/* Hover/Press Effect Overlay */}
                                    <span className="absolute inset-0 rounded-lg bg-white opacity-0 group-hover:opacity-10 group-active:opacity-20 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Submit Button */}
                <button
                    onClick={() => onSubmit(name || 'Anonymous')}
                    className="mt-8 w-full 
                             bg-gradient-to-b from-emerald-500 to-emerald-600 
                             hover:from-emerald-400 hover:to-emerald-500
                             active:from-emerald-600 active:to-emerald-700
                             text-white rounded-full py-3.5 px-6
                             font-bold text-lg
                             shadow-lg
                             transition-all duration-300
                             hover:shadow-xl hover:-translate-y-0.5
                             active:translate-y-0 active:shadow-md
                             focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default NameInputDialog;
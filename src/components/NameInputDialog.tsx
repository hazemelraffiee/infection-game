import { useState, useEffect } from 'react';
import { Star, Timer, Trophy, Delete, Send } from 'lucide-react';

interface NameInputDialogProps {
    score: number;
    time: number;
    onSubmit: (name: string) => void;
}

interface Achievement {
    icon: JSX.Element;
    label: string;
    value: string;
}

const NameInputDialog: React.FC<NameInputDialogProps> = ({ score, time, onSubmit }) => {
    const [name, setName] = useState('');
    const [activeAchievement, setActiveAchievement] = useState(0);
    
    const achievements: Achievement[] = [
        { icon: <Star className="w-6 h-6" />, label: 'New High Score', value: `${score} Lives Saved` },
        { icon: <Timer className="w-6 h-6" />, label: 'Record Time', value: `${time.toFixed(1)}s` }
    ];

    // Standard keyboard layout
    const keyboardRows: string[][] = [
        ['A', 'B', 'C', 'D', 'E', 'F', '⌫'],
        ['G', 'H', 'I', 'J', 'K', 'L', 'M'],
        ['N', 'O', 'P', 'Q', 'R', 'S', 'T'],
        ['U', 'V', 'W', 'X', 'Y', 'Z', '⏎']
    ];

    // Achievement rotation
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveAchievement((prev) => (prev + 1) % achievements.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    const handleKeyClick = (key: string): void => {
        if (key === '⌫') {
            setName(prev => prev.slice(0, -1));
        } else if (key === '⏎') {
            handleSubmit();
        } else if (name.length < 20) {
            setName(prev => prev + key);
        }
    };

    const handleSubmit = () => {
        onSubmit(name || 'Anonymous');
    };

    // Handle physical keyboard input
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Backspace') {
                setName(prev => prev.slice(0, -1));
                event.preventDefault();
            } else if (event.key === 'Enter') {
                handleSubmit();
            } else if (event.key.length === 1 && name.length < 20) {
                const key = event.key.toUpperCase();
                if (/^[A-Z]$/.test(key)) {
                    setName(prev => prev + key);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [name, onSubmit]);

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
            
            <div className="relative w-full max-w-lg animate-fade-in">
                <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 shadow-2xl">
                    {/* Animated background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 via-black/50 to-emerald-900/30 animate-gradient" />
                    
                    {/* Content container */}
                    <div className="relative">
                        {/* Header */}
                        <div className="pt-8 pb-6 px-6">
                            <div className="flex items-center justify-center gap-3 mb-6">
                                <Trophy className="w-8 h-8 text-emerald-400" />
                                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-emerald-400">
                                    NEW RECORD!
                                </h2>
                            </div>

                            {/* Animated achievements */}
                            <div className="relative h-20">
                                {achievements.map((achievement, index) => (
                                    <div
                                        key={index}
                                        className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${
                                            index === activeAchievement
                                                ? 'opacity-100 transform translate-y-0'
                                                : 'opacity-0 transform -translate-y-4'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                            {achievement.icon}
                                            <span className="font-bold">{achievement.label}</span>
                                        </div>
                                        <div className="text-2xl font-bold text-emerald-300">
                                            {achievement.value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Name input */}
                        <div className="px-6 pb-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={name}
                                    readOnly
                                    placeholder="ENTER YOUR NAME"
                                    className="w-full px-4 py-4 rounded-xl
                                        bg-emerald-950/50 backdrop-blur-sm
                                        border-2 border-emerald-500/30 
                                        text-emerald-100 text-xl tracking-wide text-center
                                        placeholder-emerald-700/50 font-bold
                                        shadow-inner"
                                    maxLength={20}
                                />
                                <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                            </div>
                        </div>

                        {/* Keyboard */}
                        <div className="p-6 pt-2">
                            <div className="grid grid-cols-7 gap-2 mb-6">
                                {keyboardRows.map((row, rowIndex) => 
                                    row.map((key, keyIndex) => (
                                        <button
                                            key={`${rowIndex}-${keyIndex}`}
                                            onClick={() => handleKeyClick(key)}
                                            className={`
                                                relative group aspect-square
                                                ${key === '⌫' ? 'bg-red-500/30 hover:bg-red-500/40' : 
                                                  key === '⏎' ? 'bg-emerald-500/30 hover:bg-emerald-500/40' :
                                                  'bg-emerald-600/20 hover:bg-emerald-500/30'}
                                                border border-emerald-400/30 
                                                hover:border-emerald-400/50
                                                rounded-xl
                                                font-bold text-2xl text-emerald-300
                                                hover:text-emerald-200
                                                transition-all duration-200
                                                hover:scale-105 hover:-translate-y-0.5
                                                active:scale-95
                                                flex items-center justify-center
                                                shadow-lg shadow-emerald-900/20
                                                hover:shadow-emerald-900/40
                                            `}
                                        >
                                            {key === '⌫' ? <Delete className="w-7 h-7" /> :
                                             key === '⏎' ? <Send className="w-7 h-7" /> : key}
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400/0 to-emerald-400/0 group-hover:from-emerald-400/10 group-hover:to-emerald-400/5 transition-colors" />
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* Submit button */}
                            <button
                                onClick={handleSubmit}
                                className="
                                    w-full flex items-center justify-center gap-2
                                    bg-gradient-to-r from-emerald-600 to-emerald-500
                                    hover:from-emerald-500 hover:to-emerald-400
                                    px-6 py-4 rounded-xl
                                    text-white font-bold text-xl
                                    transition-all duration-200
                                    hover:scale-105 hover:-translate-y-1
                                    group
                                    border border-emerald-400/30
                                    hover:border-emerald-400/50
                                    shadow-lg shadow-emerald-900/20
                                    hover:shadow-emerald-900/40
                                "
                            >
                                <Trophy className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                Save Record
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NameInputDialog;
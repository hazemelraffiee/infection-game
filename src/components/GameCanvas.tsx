// GameCanvas.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { GameInstance } from './GameInstance';
import { Dimensions, GameSettings, GameState } from './types';


interface GameCanvasProps {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    settings: GameSettings;
    onGameOver: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
    gameState,
    setGameState,
    settings,
    onGameOver,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const requestIdRef = useRef<number>();
    const gameInstanceRef = useRef<GameInstance | null>(null);
    const lastTimeRef = useRef<number>(performance.now());
    const infectionTimeoutRef = useRef<number>();

    const [dimensions, setDimensions] = useState<Dimensions>({
        width: window.innerWidth,
        height: window.innerHeight
    });

    // Initialize or reset game instance
    const resetGame = useCallback(() => {
        if (!gameInstanceRef.current) {
            gameInstanceRef.current = new GameInstance(dimensions, settings);
        } else {
            gameInstanceRef.current.reset();
        }
    }, [dimensions, settings]);

    // Game loop
    const gameLoop = useCallback(() => {
        if (!ctxRef.current || !gameInstanceRef.current) return;

        const now = performance.now();
        const deltaTime = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        const isActive = gameState.infectionStarted && !gameState.isGameOver;
        const isBackgroundState = !gameState.infectionStarted || gameState.isGameOver;

        gameInstanceRef.current.update(deltaTime, isActive);
        gameInstanceRef.current.draw(ctxRef.current, isBackgroundState);

        // Check game end condition
        if (isActive) {
            const { isOver, survivors } = gameInstanceRef.current.checkGameOver();
            if (isOver) {
                setGameState(prev => ({ ...prev, currentScore: survivors }));
                onGameOver();
                return;
            }
        }

        requestIdRef.current = requestAnimationFrame(gameLoop);
    }, [gameState.infectionStarted, gameState.isGameOver, onGameOver, setGameState]);

    // Initialize canvas and game instance
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctxRef.current = ctx;
        resetGame();
        lastTimeRef.current = performance.now();
        requestIdRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (requestIdRef.current) {
                cancelAnimationFrame(requestIdRef.current);
            }
        };
    }, [dimensions, settings, gameLoop, resetGame]);

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (!canvasRef.current || !gameInstanceRef.current) return;

            const width = window.innerWidth;
            const height = window.innerHeight;

            setDimensions({ width, height });
            canvasRef.current.width = width;
            canvasRef.current.height = height;
            gameInstanceRef.current.resize({ width, height });
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, [settings]);

    // Handle game state changes and infection start
    useEffect(() => {
        // Clear any existing timeout
        if (infectionTimeoutRef.current) {
            window.clearTimeout(infectionTimeoutRef.current);
        }
    
        if (gameState.infectionStarted && gameInstanceRef.current) {
            resetGame();
            infectionTimeoutRef.current = window.setTimeout(() => {
                if (gameInstanceRef.current) {
                    gameInstanceRef.current.startInfection();
                }
            }, 2000);
        }
    
        return () => {
            if (infectionTimeoutRef.current) {
                window.clearTimeout(infectionTimeoutRef.current);
            }
        };
    }, [gameState.infectionStarted, resetGame]);

    // Input handlers
    const getInputPos = useCallback((evt: React.TouchEvent | React.MouseEvent) => {
        if (!canvasRef.current) return null;

        const rect = canvasRef.current.getBoundingClientRect();
        const event = 'touches' in evt ? evt.touches[0] : evt;
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }, []);

    const handleStart = useCallback((evt: React.TouchEvent | React.MouseEvent) => {
        evt.preventDefault();
        if (!gameState.infectionStarted || gameState.isGameOver || !gameInstanceRef.current) return;

        const pos = getInputPos(evt);
        if (!pos) return;

        gameInstanceRef.current.startLine(pos.x, pos.y);
    }, [gameState.infectionStarted, gameState.isGameOver, getInputPos]);

    const handleMove = useCallback((evt: React.TouchEvent | React.MouseEvent) => {
        evt.preventDefault();
        if (!gameInstanceRef.current) return;

        const pos = getInputPos(evt);
        if (!pos) return;

        gameInstanceRef.current.updateLine(pos.x, pos.y);
    }, [getInputPos]);

    const handleEnd = useCallback((evt: React.TouchEvent | React.MouseEvent) => {
        evt.preventDefault();
        if (!gameInstanceRef.current) return;

        gameInstanceRef.current.endLine();
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            className="absolute inset-0 w-full h-full touch-none"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            onTouchCancel={handleEnd}
        />
    );
};

export default GameCanvas;
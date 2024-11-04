import { useEffect, useRef, useState, useCallback } from 'react';
import { Ball } from './Ball';
import { CurvyLine } from './CurvyLine';
import { ParticleSystem } from './ParticleSystem';
import { BASE_SETTINGS, GameSettings } from './GameSettings';

export interface GameState {
    isGameOver: boolean;
    infectionStarted: boolean;
    currentScore: number;
    gameStartTime: number | null;
    gameEndTime: number | null;
    highScores: LeaderboardEntry[];
    bestTimes: LeaderboardEntry[];
}

export interface LeaderboardEntry {
    playerName: string;
    value: number;
    date: string;
}

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
    const ballsRef = useRef<Ball[]>([]);
    const linesRef = useRef<CurvyLine[]>([]);
    const currentLineRef = useRef<CurvyLine | null>(null);
    const isDrawingRef = useRef(false);
    const particleSystemRef = useRef<ParticleSystem>(new ParticleSystem());
    const lastTimeRef = useRef<number>(performance.now());

    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    // Define gameLoop first
    const gameLoop = useCallback(() => {
        if (!ctxRef.current || gameState.isGameOver) {
            console.log('Game loop stopping:', {
                hasContext: !!ctxRef.current,
                isGameOver: gameState.isGameOver
            });
            return;
        }

        // Debug ball positions and velocities
        if (Math.random() < 0.01) { // Log only occasionally to avoid spam
            console.log('Ball states:', ballsRef.current.map(ball => ({
                pos: ball.getPosition(),
                infected: ball.isInfected(),
                dead: ball.isDead()
            })));
        }

        const now = performance.now();
        const deltaTime = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        const ctx = ctxRef.current;

        // Clear canvas with gradient background
        const gradient = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height);
        gradient.addColorStop(0, '#e0f7fa');
        gradient.addColorStop(1, '#b2ebf2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);

        // Update particle system
        particleSystemRef.current.update();
        particleSystemRef.current.draw(ctx);

        // Update all balls
        ballsRef.current.forEach(ball => {
            ball.update(deltaTime, dimensions, linesRef.current);
        });

        // Check collisions between balls
        for (let i = 0; i < ballsRef.current.length; i++) {
            for (let j = i + 1; j < ballsRef.current.length; j++) {
                ballsRef.current[i].checkCollisionWith(ballsRef.current[j]);
            }
        }

        // Draw in layers
        // 1. Dead balls
        ballsRef.current.forEach(ball => {
            if (ball.isDead()) ball.draw(ctx);
        });

        // 2. Lines
        linesRef.current.forEach(line => line.draw(ctx));
        if (currentLineRef.current) {
            currentLineRef.current.draw(ctx);
        }

        // 3. Active balls
        ballsRef.current.forEach(ball => {
            if (!ball.isDead()) ball.draw(ctx);
        });

        // Check game end condition
        const hasInfectedBalls = ballsRef.current.some(ball => ball.isInfected());
        const allSettled = !hasInfectedBalls && ballsRef.current.some(ball => ball.isDead());
        
        if (allSettled && !gameState.isGameOver) {
            console.log('Game ending because:', {
                hasInfectedBalls,
                ballStates: ballsRef.current.map(ball => ({
                    infected: ball.isInfected(),
                    dead: ball.isDead()
                }))
            });
            const score = ballsRef.current.filter(ball => !ball.isDead()).length;
            setGameState(prev => ({ ...prev, currentScore: score }));
            onGameOver();
            return;
        }

        requestIdRef.current = requestAnimationFrame(gameLoop);
    }, [dimensions, gameState.isGameOver, onGameOver]);

    // Then define startGameLoop
    const startGameLoop = useCallback(() => {
        console.log('Starting game loop');
        lastTimeRef.current = performance.now();
        requestIdRef.current = requestAnimationFrame(gameLoop);
    }, [gameLoop]);

    // Initialize canvas context
    useEffect(() => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctxRef.current = ctx;
        
        return () => {
            if (requestIdRef.current) {
                cancelAnimationFrame(requestIdRef.current);
            }
        };
    }, []);

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (!canvasRef.current) return;
            
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            setDimensions({ width, height });
            canvasRef.current.width = width;
            canvasRef.current.height = height;
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initialize balls and start game loop
    useEffect(() => {
        if (!gameState.infectionStarted || gameState.isGameOver || !ctxRef.current) {
            return;
        }
    
        console.log('Initializing balls');
        ballsRef.current = [];
        linesRef.current = [];
        currentLineRef.current = null;
        isDrawingRef.current = false;
        particleSystemRef.current = new ParticleSystem();
    
        // Initialize balls with constant speed
        const BASE_SPEED = 150;  // Single constant speed for all balls
    
        for (let i = 0; i < settings.ballCount; i++) {
            const x = Math.random() * (dimensions.width - 2 * settings.ballRadius) + settings.ballRadius;
            const y = Math.random() * (dimensions.height - 2 * settings.ballRadius) + settings.ballRadius;
            const angle = Math.random() * 2 * Math.PI;
            
            // All balls get the same base speed, just in different directions
            const vx = Math.cos(angle) * BASE_SPEED;
            const vy = Math.sin(angle) * BASE_SPEED;
    
            ballsRef.current.push(new Ball({
                x,
                y,
                vx,
                vy,
                radius: settings.ballRadius,
                speedScale: settings.speedScale
            }));
        }
    
        // Start infection after a short delay
        const infectionTimeout = window.setTimeout(() => {
            console.log('Starting infection');
            const randomBall = ballsRef.current[Math.floor(Math.random() * ballsRef.current.length)];
            randomBall.infect(settings.infectionDuration);
        }, 2000);
        
        startGameLoop();
        
        return () => {
            console.log('Cleaning up game resources');
            window.clearTimeout(infectionTimeout);
            if (requestIdRef.current) {
                cancelAnimationFrame(requestIdRef.current);
                requestIdRef.current = undefined;
            }
        };
    }, [gameState.infectionStarted, gameState.isGameOver, dimensions, settings, startGameLoop]);

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
        if (!gameState.infectionStarted || gameState.isGameOver) return;

        const pos = getInputPos(evt);
        if (!pos) return;

        isDrawingRef.current = true;
        currentLineRef.current = new CurvyLine();
        currentLineRef.current.addPoint(pos.x, pos.y);
    }, [gameState.infectionStarted, gameState.isGameOver, getInputPos]);

    const handleMove = useCallback((evt: React.TouchEvent | React.MouseEvent) => {
        evt.preventDefault();
        if (!isDrawingRef.current || !currentLineRef.current) return;

        const pos = getInputPos(evt);
        if (!pos) return;

        currentLineRef.current.addPoint(pos.x, pos.y);

        const touchingActiveBall = ballsRef.current.some(ball =>
            !ball.isDead() && currentLineRef.current?.collidesWithBall(ball)
        );

        if (touchingActiveBall) {
            isDrawingRef.current = false;
            currentLineRef.current = null;
        }
    }, [getInputPos]);

    const handleEnd = useCallback((evt: React.TouchEvent | React.MouseEvent) => {
        evt.preventDefault();
        if (!isDrawingRef.current || !currentLineRef.current) return;

        currentLineRef.current.complete();
        linesRef.current.push(currentLineRef.current);
        
        isDrawingRef.current = false;
        currentLineRef.current = null;
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
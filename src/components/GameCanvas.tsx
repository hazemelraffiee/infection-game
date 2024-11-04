import { useEffect, useRef, useState, useCallback } from 'react';
import { Ball } from './Ball';
import { CurvyLine } from './CurvyLine';
import { ParticleSystem } from './ParticleSystem';
import { GameSettings } from './GameSettings';

export interface GameState {
    isGameOver: boolean;
    infectionStarted: boolean;
    currentScore: number;
    gameStartTime: number | null;
    gameEndTime: number | null;
    highScores: LeaderboardEntry[];
    bestTimes: LeaderboardEntry[];
    shouldResetLines?: boolean;
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

const initializeBalls = (dimensions: { width: number; height: number }, settings: GameSettings, particleSystem: ParticleSystem) => {
    const balls: Ball[] = [];
    const BASE_SPEED = 150;

    for (let i = 0; i < settings.ballCount; i++) {
        const x = Math.random() * (dimensions.width - 2 * settings.ballRadius) + settings.ballRadius;
        const y = Math.random() * (dimensions.height - 2 * settings.ballRadius) + settings.ballRadius;
        const angle = Math.random() * 2 * Math.PI;

        const vx = Math.cos(angle) * BASE_SPEED;
        const vy = Math.sin(angle) * BASE_SPEED;

        const ball = new Ball({
            x, y, vx, vy,
            radius: settings.ballRadius,
            speedScale: settings.speedScale
        });
        ball.setParticleSystem(particleSystem);  // Connect particle system to ball
        ball.cure();
        balls.push(ball);
    }
    return balls;
};

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

    const gameLoop = useCallback(() => {
        if (!ctxRef.current) return;

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

        // Update and draw particle system if game is active
        if (gameState.infectionStarted && !gameState.isGameOver) {
            particleSystemRef.current.update();
            particleSystemRef.current.draw(ctx);
        }

        // Always update balls
        ballsRef.current.forEach(ball => {
            if (gameState.infectionStarted && !gameState.isGameOver) {
                ball.update(deltaTime, dimensions, linesRef.current);
            } else {
                ball.update(deltaTime, dimensions, []); // No line collisions in background mode
            }
        });

        // Always check ball collisions
        for (let i = 0; i < ballsRef.current.length; i++) {
            for (let j = i + 1; j < ballsRef.current.length; j++) {
                ballsRef.current[i].checkCollisionWith(ballsRef.current[j]);
            }
        }

        // Add darkening overlay if in background state
        const isBackgroundState = !gameState.infectionStarted || gameState.isGameOver;
        if (isBackgroundState) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        }

        // Draw in layers
        // 1. Dead balls
        ballsRef.current.forEach(ball => {
            if (ball.isDead()) ball.draw(ctx);
        });

        // 2. Lines (only in active gameplay)
        if (!isBackgroundState) {
            linesRef.current.forEach(line => line.draw(ctx));
            if (currentLineRef.current) {
                currentLineRef.current.draw(ctx);
            }
        }

        // 3. Active balls
        ballsRef.current.forEach(ball => {
            if (!ball.isDead()) ball.draw(ctx);
        });

        // Check game end condition
        if (gameState.infectionStarted && !gameState.isGameOver) {
            const hasInfectedBalls = ballsRef.current.some(ball => ball.isInfected());
            const hasSomeDead = ballsRef.current.some(ball => ball.isDead());
            
            // End condition: either some balls died, or achieved perfect score
            const isGameOver = !hasInfectedBalls && (hasSomeDead || gameState.gameStartTime && Date.now() - gameState.gameStartTime > 7000);

            if (isGameOver) {
                const score = ballsRef.current.filter(ball => !ball.isDead()).length;
                setGameState(prev => ({ ...prev, currentScore: score }));
                onGameOver();
                return;
            }
        }

        requestIdRef.current = requestAnimationFrame(gameLoop);
    }, [dimensions, gameState.infectionStarted, gameState.isGameOver, onGameOver]);

    // Initialize everything
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctxRef.current = ctx;
        particleSystemRef.current = new ParticleSystem();  // Initialize particle system first
        ballsRef.current = initializeBalls(dimensions, settings, particleSystemRef.current);  // Pass particle system to balls
        lastTimeRef.current = performance.now();
        requestIdRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (requestIdRef.current) {
                cancelAnimationFrame(requestIdRef.current);
            }
        };
    }, [dimensions, settings, gameLoop]);

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (!canvasRef.current) return;

            const width = window.innerWidth;
            const height = window.innerHeight;

            setDimensions({ width, height });
            canvasRef.current.width = width;
            canvasRef.current.height = height;

            // Reinitialize balls on resize
            ballsRef.current = initializeBalls({ width, height }, settings, particleSystemRef.current);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, [settings]);

    // Handle game state changes
    useEffect(() => {
        if (gameState.infectionStarted) {
            // Clear all lines
            linesRef.current = [];
            currentLineRef.current = null;
            isDrawingRef.current = false;
            
            // Create new particle system and reconnect to balls
            particleSystemRef.current = new ParticleSystem();
            ballsRef.current.forEach(ball => ball.setParticleSystem(particleSystemRef.current));
            
            // Make sure all balls are healthy at game start
            ballsRef.current.forEach(ball => ball.cure());
    
            // Start infection after delay
            const infectionTimeout = window.setTimeout(() => {
                if (ballsRef.current.length > 0) {
                    const randomBall = ballsRef.current[Math.floor(Math.random() * ballsRef.current.length)];
                    randomBall.infect();
                }
            }, 2000);
    
            return () => clearTimeout(infectionTimeout);
        }
    }, [gameState.infectionStarted]);

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
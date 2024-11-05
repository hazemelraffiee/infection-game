import { Ball } from './Ball';
import { CurvyLine } from './CurvyLine';
import { BASE_SETTINGS } from './GameSettings';
import { ParticleSystem } from './ParticleSystem';
import { Dimensions, GameSettings, GameOverState } from './types';

export class GameInstance {
    private balls: Ball[] = [];
    private lines: CurvyLine[] = [];
    private currentLine: CurvyLine | null = null;
    private particleSystem: ParticleSystem;
    private isDrawing: boolean = false;
    private dimensions: Dimensions;
    private readonly settings: GameSettings;
    private hasStartedInfection: boolean = false;
    private offscreenCanvas!: HTMLCanvasElement;
    private offscreenCtx!: CanvasRenderingContext2D;

    constructor(dimensions: Dimensions, settings: GameSettings) {
        // Existing constructor code...
        this.dimensions = dimensions;
        this.settings = settings;
        this.particleSystem = new ParticleSystem();
        this.initializeBalls();

        // Initialize the offscreen canvas
        this.initializeOffscreenCanvas();
    }

    private initializeOffscreenCanvas(): void {
        const virusSize = 24; // Assuming the virus is designed for a 24x24 viewBox
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = virusSize;
        this.offscreenCanvas.height = virusSize;
        const ctx = this.offscreenCanvas.getContext('2d');
        if (ctx) {
            this.offscreenCtx = ctx;
        }
    }

    private initializeBalls(): void {
        this.balls = [];
        this.hasStartedInfection = false;

        for (let i = 0; i < this.settings.ballCount; i++) {
            const x = Math.random() * (this.dimensions.width - 2 * this.settings.ballRadius) + this.settings.ballRadius;
            const y = Math.random() * (this.dimensions.height - 2 * this.settings.ballRadius) + this.settings.ballRadius;
            const angle = Math.random() * 2 * Math.PI;

            const vx = Math.cos(angle);
            const vy = Math.sin(angle);

            const ball = new Ball({
                x,
                y,
                vx,
                vy,
                radius: this.settings.ballRadius,
                speedScale: this.settings.speedScale,
                baseSpeed: BASE_SETTINGS.baseSpeed, // Pass base speed
            });
            ball.setParticleSystem(this.particleSystem);
            ball.cure(); // Start as healthy
            this.balls.push(ball);
        }
    }

    public reset(): void {
        // Clear all game state
        this.lines = [];
        this.currentLine = null;
        this.isDrawing = false;
        this.hasStartedInfection = false;

        // Create new particle system
        this.particleSystem = new ParticleSystem();

        // Reinitialize balls
        this.initializeBalls();
    }

    public resize(dimensions: Dimensions): void {
        this.dimensions = dimensions;
        this.reset();
    }

    public startInfection(): void {
        if (this.balls.length > 0 && !this.hasStartedInfection) {
            const randomBall = this.balls[Math.floor(Math.random() * this.balls.length)];
            randomBall.infect();
            this.hasStartedInfection = true;
        }
    }

    public update(deltaTime: number, isActive: boolean): void {
        // Update particle system if game is active
        if (isActive) {
            this.particleSystem.update();
        }

        // Update balls
        this.balls.forEach(ball => {
            ball.update(deltaTime, this.dimensions, isActive ? this.lines : []); // No line collisions in background mode
        });

        // Check ball collisions
        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                this.balls[i].checkCollisionWith(this.balls[j]);
            }
        }

        // Update lines
        this.lines = this.lines.filter(line => {
            if (line.isDisappearing) {
                line.update(deltaTime);
                if (line.isFullyDisappeared()) {
                    return false; // Remove the line
                }
            }
            return true;
        });
    }

    public draw(ctx: CanvasRenderingContext2D, isBackgroundState: boolean): void {
        // Clear the entire canvas first to prevent trails
        ctx.clearRect(0, 0, this.dimensions.width, this.dimensions.height);

        this.drawBackground(ctx);

        if (!isBackgroundState) {
            this.particleSystem.draw(ctx);
        }

        this.drawGameElements(ctx, isBackgroundState);

        if (isBackgroundState) {
            this.drawDarkeningOverlay(ctx);
        }
    }

    private drawBackground(ctx: CanvasRenderingContext2D): void {
        // Update time variable
        const time = performance.now() / 1000;

        // Clear the background
        ctx.clearRect(0, 0, this.dimensions.width, this.dimensions.height);

        // Set a background color or gradient if desired
        ctx.fillStyle = '#e0f7fa';
        ctx.fillRect(0, 0, this.dimensions.width, this.dimensions.height);

        // Update the offscreen canvas with the animated virus
        this.updateOffscreenCanvas(time);

        // Determine the size of each virus tile
        const tileSize = 100; // Adjust this value to change the size and spacing of the viruses

        // Precompute the scale factor
        const scale = tileSize / 24; // Assuming the virus is designed for a 24x24 viewBox

        // Loop over the canvas to fill it with virus tiles
        for (let y = 0; y < this.dimensions.height + tileSize; y += tileSize) {
            for (let x = 0; x < this.dimensions.width + tileSize; x += tileSize) {
                // Save the context
                ctx.save();

                // Translate to the current tile position
                ctx.translate(x, y);

                // Optionally, add some rotation or scaling variation for visual interest
                const rotation = ((x + y) / (this.dimensions.width + this.dimensions.height)) * Math.PI * 2;
                ctx.rotate(rotation * 0.02); // Slight rotation variation

                // Scale the context
                ctx.scale(scale, scale);

                // Draw the virus from the offscreen canvas
                ctx.drawImage(this.offscreenCanvas, 0, 0);

                // Restore the context
                ctx.restore();
            }
        }
    }

    private updateOffscreenCanvas(time: number): void {
        const ctx = this.offscreenCtx;
        if (!ctx) return;

        // Clear the offscreen canvas
        ctx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

        // Draw the virus onto the offscreen canvas
        this.drawVirus(ctx, time);
    }

    // Helper method to draw the virus at the current context position
    private drawVirus(ctx: CanvasRenderingContext2D, time: number): void {
        // Main virus body with animated radius
        {
            const duration = 4; // seconds
            const baseRadius = 7;
            const radiusOffset = 0.3;
            const radius = baseRadius + radiusOffset * Math.sin((2 * Math.PI / duration) * time);

            // Apply glow effect
            ctx.save();
            ctx.shadowColor = 'rgba(225, 245, 254, 0.9)'; // #E1F5FE with some alpha
            ctx.shadowBlur = 20; // Increase shadow blur to 20 for a larger glow radius

            // Create radial gradient
            const gradient = ctx.createRadialGradient(12, 12, 0, 12, 12, radius);
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.6, '#F8FDFF');
            gradient.addColorStop(1, '#E1F5FE');

            ctx.beginPath();
            ctx.arc(12, 12, radius, 0, 2 * Math.PI);
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#E1F5FE';
            ctx.stroke();
            ctx.restore();
        }

        // Corner spikes with rotation animation and glow
        const spikes = [
            { x: 18, y: 6, dx: -1.05, dy: 1.05003, duration: 3, angleMax: 10 },
            { x: 5, y: 5, dx: 2, dy: 2, duration: 3.2, angleMax: -10 },
            { x: 17, y: 18, dx: -0.5498, dy: -0.5498, duration: 2.8, angleMax: 10 },
            { x: 6, y: 19, dx: 1.05003, dy: -1.05002, duration: 3.4, angleMax: -10 },
        ];

        spikes.forEach(spike => {
            const angleDegrees = spike.angleMax * Math.sin((2 * Math.PI / spike.duration) * time);
            const angleRadians = angleDegrees * Math.PI / 180;

            ctx.save();
            ctx.translate(spike.x, spike.y);
            ctx.rotate(angleRadians);

            // Apply glow effect to spikes
            ctx.shadowColor = 'rgba(225, 245, 254, 0.7)'; // Slightly less intense glow
            ctx.shadowBlur = 12; // Adjust shadow blur

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(spike.dx, spike.dy);
            ctx.strokeStyle = '#F8FDFF';
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.restore();
        });

        // Circles and semi-circles with animation and glow
        const elements = [
            // Large circle
            {
                type: 'circle',
                x: 14.5,
                y: 13,
                radius: 1.5,
                strokeStyle: '#E1F5FE',
                fillStyle: '#FFFFFF',
                lineWidth: 1.5,
                opacityAnim: { duration: 2, min: 0.7, max: 1 },
                glow: true,
            },
            // Small circle
            {
                type: 'circle',
                x: 10,
                y: 9,
                radius: 1,
                strokeStyle: '#E1F5FE',
                fillStyle: '#FFFFFF',
                lineWidth: 1.5,
                opacityAnim: { duration: 1.8, min: 0.7, max: 1 },
                glow: true,
            },
            // Tiny circle with radius animation
            {
                type: 'circle',
                x: 9,
                y: 13,
                radiusAnim: { duration: 1.5, min: 1, max: 1.2 },
                fillStyle: '#FFFFFF',
                glow: true,
            },
            // Outer circles with radius animation
            {
                type: 'circle',
                x: 19.5,
                y: 4.5,
                radiusAnim: { duration: 2, min: 1.5, max: 1.7 },
                strokeStyle: '#F8FDFF',
                lineWidth: 1.5,
                glow: true,
            },
            {
                type: 'circle',
                x: 3.5,
                y: 3.5,
                radiusAnim: { duration: 2.2, min: 1.5, max: 1.7 },
                strokeStyle: '#F8FDFF',
                lineWidth: 1.5,
                glow: true,
            },
            // Semi-circle with opacity animation
            {
                type: 'semi-circle',
                x: 3.5,
                y: 12,
                radius: 1.5,
                startAngle: Math.PI / 2,
                endAngle: (3 * Math.PI) / 2,
                strokeStyle: '#E1F5FE',
                fillStyle: '#FFFFFF',
                lineWidth: 1.5,
                opacityAnim: { duration: 1.6, min: 0.8, max: 1 },
                glow: true,
            },
            // Additional outer circles
            {
                type: 'circle',
                x: 18.5,
                y: 19.5,
                radiusAnim: { duration: 2.4, min: 1.5, max: 1.7 },
                strokeStyle: '#F8FDFF',
                lineWidth: 1.5,
                glow: true,
            },
            {
                type: 'circle',
                x: 4.5,
                y: 20.5,
                radiusAnim: { duration: 2.6, min: 1.5, max: 1.7 },
                strokeStyle: '#F8FDFF',
                lineWidth: 1.5,
                glow: true,
            },
            // Top semi-circle with opacity animation
            {
                type: 'semi-circle',
                x: 12,
                y: 3.5,
                radius: 1.5,
                startAngle: 0,
                endAngle: Math.PI,
                strokeStyle: '#E1F5FE',
                fillStyle: '#FFFFFF',
                lineWidth: 1.5,
                opacityAnim: { duration: 2, min: 0.8, max: 1 },
                glow: true,
            },
            // Right semi-circle with opacity animation
            {
                type: 'semi-circle',
                x: 19.5,
                y: 12,
                radius: 1.5,
                startAngle: (-Math.PI) / 2,
                endAngle: Math.PI / 2,
                strokeStyle: '#E1F5FE',
                fillStyle: '#FFFFFF',
                lineWidth: 1.5,
                opacityAnim: { duration: 1.8, min: 0.8, max: 1 },
                glow: true,
            },
            // Bottom semi-circle with opacity animation
            {
                type: 'semi-circle',
                x: 12,
                y: 19,
                radius: 1.5,
                startAngle: Math.PI,
                endAngle: 0,
                strokeStyle: '#E1F5FE',
                fillStyle: '#FFFFFF',
                lineWidth: 1.5,
                opacityAnim: { duration: 2.2, min: 0.8, max: 1 },
                glow: true,
            },
        ];

        elements.forEach(element => {
            ctx.save();

            // Handle opacity animation
            if (element.opacityAnim) {
                const { duration, min, max } = element.opacityAnim;
                const opacity =
                    min +
                    (max - min) * (0.5 + 0.5 * Math.sin((2 * Math.PI / duration) * time));
                ctx.globalAlpha = opacity;
            }

            // Handle radius animation
            let radius = element.radius ?? 0;
            if (element.radiusAnim) {
                const { duration, min, max } = element.radiusAnim;
                radius =
                    min +
                    (max - min) * (0.5 + 0.5 * Math.sin((2 * Math.PI / duration) * time));
            }

            // Apply glow effect if specified
            if (element.glow) {
                ctx.shadowColor = 'rgba(225, 245, 254, 0.7)'; // Adjust alpha as needed
                ctx.shadowBlur = 10; // Adjust shadow blur for elements
            }

            ctx.beginPath();

            if (element.type === 'circle') {
                ctx.arc(element.x, element.y, radius, 0, 2 * Math.PI);
            } else if (element.type === 'semi-circle') {
                ctx.arc(element.x, element.y, radius, element.startAngle ?? 0, element.endAngle ?? 0);
            }

            if (element.fillStyle) {
                ctx.fillStyle = element.fillStyle;
                ctx.fill();
            }

            if (element.strokeStyle) {
                ctx.strokeStyle = element.strokeStyle;
                ctx.lineWidth = element.lineWidth || 1;
                ctx.stroke();
            }

            ctx.restore();
        });
    }

    private drawGameElements(ctx: CanvasRenderingContext2D, isBackgroundState: boolean): void {
        // Draw dead balls first
        this.balls.forEach(ball => {
            if (ball.isDead()) ball.draw(ctx);
        });

        // Draw lines if in active gameplay
        if (!isBackgroundState) {
            this.lines.forEach(line => line.draw(ctx));
            if (this.currentLine) {
                this.currentLine.draw(ctx);
            }
        }

        // Draw active balls last
        this.balls.forEach(ball => {
            if (!ball.isDead()) ball.draw(ctx);
        });
    }

    private drawDarkeningOverlay(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.dimensions.width, this.dimensions.height);
    }

    public startLine(x: number, y: number): void {
        this.isDrawing = true;
        this.currentLine = new CurvyLine();
        this.currentLine.addPoint(x, y);
    }

    public updateLine(x: number, y: number): boolean {
        if (!this.isDrawing || !this.currentLine) return false;

        this.currentLine.addPoint(x, y);

        const touchingActiveBall = this.balls.some(ball =>
            !ball.isDead() && this.currentLine?.collidesWithBall(ball)
        );

        if (touchingActiveBall) {
            this.isDrawing = false;

            // Start the disappearing effect
            this.currentLine.startDisappearing();

            // Add particle effects along the line
            if (this.particleSystem) {
                this.particleSystem.addLineDisappearanceEffect(this.currentLine.getPoints(), '#ff6b6b');
            }

            this.lines.push(this.currentLine);
            this.currentLine = null;

            return true;
        }
        return false;
    }

    public endLine(): void {
        if (!this.isDrawing || !this.currentLine) return;

        this.currentLine.complete();
        this.lines.push(this.currentLine);
        this.isDrawing = false;
        this.currentLine = null;
    }

    public checkGameOver(): GameOverState {
        // Only check for game over if infection has started
        if (!this.hasStartedInfection) {
            return {
                isOver: false,
                survivors: this.balls.length
            };
        }

        const hasInfectedBalls = this.balls.some(ball => ball.isInfected());
        const hasSomeDead = this.balls.some(ball => ball.isDead());
        const survivors = this.balls.filter(ball => !ball.isDead()).length;

        // Game is over only when there are no more infected balls AND
        // either some balls have died or we've saved everyone
        return {
            isOver: !hasInfectedBalls && (hasSomeDead || survivors === this.balls.length),
            survivors
        };
    }
}
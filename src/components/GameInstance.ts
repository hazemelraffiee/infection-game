import { Ball } from './Ball';
import { CurvyLine } from './CurvyLine';
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
    private static readonly BASE_SPEED = 150;
    private hasStartedInfection: boolean = false;

    constructor(dimensions: Dimensions, settings: GameSettings) {
        this.dimensions = dimensions;
        this.settings = settings;
        this.particleSystem = new ParticleSystem();
        this.initializeBalls();
    }

    private initializeBalls(): void {
        this.balls = [];
        this.hasStartedInfection = false;

        for (let i = 0; i < this.settings.ballCount; i++) {
            const x = Math.random() * (this.dimensions.width - 2 * this.settings.ballRadius) + this.settings.ballRadius;
            const y = Math.random() * (this.dimensions.height - 2 * this.settings.ballRadius) + this.settings.ballRadius;
            const angle = Math.random() * 2 * Math.PI;

            const vx = Math.cos(angle) * GameInstance.BASE_SPEED;
            const vy = Math.sin(angle) * GameInstance.BASE_SPEED;

            const ball = new Ball({
                x, y, vx, vy,
                radius: this.settings.ballRadius,
                speedScale: this.settings.speedScale
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
            if (isActive) {
                ball.update(deltaTime, this.dimensions, this.lines);
            } else {
                ball.update(deltaTime, this.dimensions, []); // No line collisions in background mode
            }
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
        const gradient = ctx.createLinearGradient(0, 0, this.dimensions.width, this.dimensions.height);
        gradient.addColorStop(0, '#e0f7fa');
        gradient.addColorStop(1, '#b2ebf2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.dimensions.width, this.dimensions.height);
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
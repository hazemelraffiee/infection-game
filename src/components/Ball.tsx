import { CurvyLine } from "./CurvyLine";
import { ParticleSystem } from "./ParticleSystem";
import { BallConfig } from "./types";

type BallColor = 'green' | 'red' | 'grey';
type Dimensions = { width: number; height: number };

export class Ball {
    // Position and physics properties
    private x: number;
    private y: number;
    private vx: number;
    private vy: number;
    private readonly radius: number;
    // private readonly speedScale: number;
    private readonly baseSpeed: number;

    // Visual state properties
    private color: BallColor;
    private pulsePhase: number;
    private scale: number;
    private targetScale: number;

    // Gameplay state
    private infectedTime: number | null;
    private lastCollisionTime: { [key: string]: number };

    // Constants
    private static readonly COLLISION_COOLDOWN = 100;
    // private static readonly BASE_MIN_ESCAPE_VELOCITY = 50;
    // private static readonly BASE_JITTER = 20;
    // private static readonly DAMPING = 0.95;
    private static readonly INFECTION_DURATION = 5000;

    private particleSystem: ParticleSystem | null = null;

    constructor({ x, y, vx, vy, radius, speedScale }: BallConfig) {
        // Initialize position and physics
        this.x = x;
        this.y = y;

        // Calculate and store base speed from initial velocity
        const initialSpeed = Math.hypot(vx, vy);
        this.baseSpeed = initialSpeed * speedScale;

        // Normalize initial velocity to maintain constant speed
        const normalizedVx = (vx / initialSpeed) * this.baseSpeed;
        const normalizedVy = (vy / initialSpeed) * this.baseSpeed;

        this.vx = normalizedVx;
        this.vy = normalizedVy;
        this.radius = radius;
        // this.speedScale = speedScale;

        // Initialize visual state
        this.color = 'green';
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.scale = 1;
        this.targetScale = 1;

        // Initialize gameplay state
        this.infectedTime = null;
        this.lastCollisionTime = {};

        this.particleSystem = null;  // Will be set by setParticleSystem
    }

    public setParticleSystem(particleSystem: ParticleSystem): void {
        this.particleSystem = particleSystem;
    }

    private normalizeVelocity(): void {
        if (this.isDead()) return;

        const currentSpeed = Math.hypot(this.vx, this.vy);
        if (currentSpeed === 0) return;  // Prevent division by zero

        // Normalize to maintain constant base speed
        this.vx = (this.vx / currentSpeed) * this.baseSpeed;
        this.vy = (this.vy / currentSpeed) * this.baseSpeed;
    }

    public update(deltaTime: number, dimensions: Dimensions, lines: CurvyLine[]): void {
        if (this.isDead()) return;

        const originalState = this.saveState();

        this.updatePosition(deltaTime);
        this.handleWallCollisions(dimensions);
        this.handleLineCollisions(lines, originalState);
        this.updateVisualEffects();
        this.checkInfectionStatus();

        // Ensure speed remains constant after all updates
        this.normalizeVelocity();
    }

    private saveState() {
        return {
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy
        };
    }

    private updatePosition(deltaTime: number): void {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
    }

    private handleWallCollisions(dimensions: Dimensions): void {
        let velocityChanged = false;

        if (this.x + this.radius > dimensions.width || this.x - this.radius < 0) {
            this.vx *= -1;
            this.x = Math.max(this.radius, Math.min(this.x, dimensions.width - this.radius));
            velocityChanged = true;
        }
        if (this.y + this.radius > dimensions.height || this.y - this.radius < 0) {
            this.vy *= -1;
            this.y = Math.max(this.radius, Math.min(this.y, dimensions.height - this.radius));
            velocityChanged = true;
        }

        // Ensure constant speed after wall collisions
        if (velocityChanged) {
            this.normalizeVelocity();
        }
    }

    private handleLineCollisions(lines: CurvyLine[], originalState: any): void {
        lines.forEach((line, index) => {
            if (this.isCollisionInCooldown(index)) return;

            const collision = line.getCollisionInfo(this);
            if (!collision.collides) return;
            this.lastCollisionTime[index] = Date.now();

            if (!this.handleCollisionCorrection(collision, originalState)) {
                this.handleCollisionResponse(collision);
            }
        });
    }

    private isCollisionInCooldown(lineIndex: number): boolean {
        const now = Date.now();
        return this.lastCollisionTime[lineIndex] !== undefined &&
            now - this.lastCollisionTime[lineIndex] < Ball.COLLISION_COOLDOWN;
    }

    private handleCollisionCorrection(collision: any, originalState: any): boolean {
        const correctionX = collision.correctedX - this.x;
        const correctionY = collision.correctedY - this.y;
        const correctionDistance = Math.hypot(correctionX, correctionY);

        if (correctionDistance > this.radius * 2) {
            this.x = originalState.x;
            this.y = originalState.y;
            this.vx = originalState.vx;
            this.vy = originalState.vy;
            return true;
        }

        this.x = collision.correctedX;
        this.y = collision.correctedY;
        return false;
    }

    private handleCollisionResponse(collision: any): void {
        // Reflect velocity without damping
        const dotProduct = this.vx * collision.normal.x + this.vy * collision.normal.y;
        this.vx = this.vx - 2 * dotProduct * collision.normal.x;
        this.vy = this.vy - 2 * dotProduct * collision.normal.y;

        // Normalize velocity to maintain constant speed
        this.normalizeVelocity();
    }

    private updateVisualEffects(): void {
        // Update pulse phase
        if (this.isInfected()) {
            this.pulsePhase += 0.1;  // Faster pulse for infected
        } else if (!this.isDead()) {
            this.pulsePhase += 0.05;  // Normal pulse for healthy
        }

        // Smooth scale animation
        this.scale += (this.targetScale - this.scale) * 0.1;
    }

    private checkInfectionStatus(): void {
        if (this.isInfected() && Date.now() - this.infectedTime! >= Ball.INFECTION_DURATION) {
            if (Math.random() < 0.5) {
                this.die();
            } else {
                this.cure();
            }
        }
    }

    public checkCollisionWith(other: Ball): void {
        if (this.isDead() || other.isDead()) return;

        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.radius + other.radius) {
            this.handleBallCollision(other, dx, dy);
        }
    }

    private handleBallCollision(other: Ball, dx: number, dy: number): void {
        // Handle infection spread
        if (this.isInfected() && !other.isInfected()) {
            other.infect();
            // Add collision particles at the point of contact
            if (this.particleSystem) {
                const collisionX = (this.x + other.x) / 2;
                const collisionY = (this.y + other.y) / 2;
                this.particleSystem.addCollisionEffect(collisionX, collisionY, '#ff6b6b');
            }
        } else if (!this.isInfected() && other.isInfected()) {
            this.infect();
            // Add collision particles at the point of contact
            if (this.particleSystem) {
                const collisionX = (this.x + other.x) / 2;
                const collisionY = (this.y + other.y) / 2;
                this.particleSystem.addCollisionEffect(collisionX, collisionY, '#ff6b6b');
            }
        }

        // Calculate collision response maintaining constant speeds for both balls
        const distance = Math.hypot(dx, dy);
        if (distance === 0) return;  // Prevent division by zero

        // Normalized collision normal
        const nx = dx / distance;
        const ny = dy / distance;

        // Apply collision response while maintaining each ball's original speed
        const thisSpeed = this.baseSpeed;
        const otherSpeed = other.baseSpeed;

        // Calculate new velocities maintaining original speeds
        this.vx = nx * thisSpeed;
        this.vy = ny * thisSpeed;
        other.vx = -nx * otherSpeed;
        other.vy = -ny * otherSpeed;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();

        // Calculate pulse factor
        const pulseFactor = this.calculatePulseFactor();

        // Apply visual effects
        this.applyGlowEffect(ctx, pulseFactor);

        // Draw main ball
        this.drawBallBody(ctx, pulseFactor);

        // Add highlight
        this.drawHighlight(ctx);

        ctx.restore();
    }

    private calculatePulseFactor(): number {
        if (this.isInfected()) {
            return 1 + Math.sin(this.pulsePhase) * 0.15;
        } else if (!this.isDead()) {
            return 1 + Math.sin(this.pulsePhase) * 0.1;
        }
        return 1;
    }

    private applyGlowEffect(ctx: CanvasRenderingContext2D, pulseFactor: number): void {
        if (this.isInfected()) {
            ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
            ctx.shadowBlur = 20 * pulseFactor;
        } else if (!this.isDead()) {
            ctx.shadowColor = 'rgba(0, 255, 0, 0.3)';
            ctx.shadowBlur = 10;
        }
    }

    private drawBallBody(ctx: CanvasRenderingContext2D, pulseFactor: number): void {
        const scaledRadius = this.radius * this.scale * pulseFactor;

        ctx.beginPath();
        ctx.arc(this.x, this.y, scaledRadius, 0, Math.PI * 2);

        const gradient = ctx.createRadialGradient(
            this.x - this.radius * 0.3,
            this.y - this.radius * 0.3,
            0,
            this.x,
            this.y,
            scaledRadius
        );

        this.applyGradientColors(gradient);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    private applyGradientColors(gradient: CanvasGradient): void {
        if (this.isInfected()) {
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(1, '#ff0000');
        } else if (!this.isDead()) {
            gradient.addColorStop(0, '#90ee90');
            gradient.addColorStop(1, '#32cd32');
        } else {
            gradient.addColorStop(0, '#a0a0a0');
            gradient.addColorStop(1, '#808080');
        }
    }

    private drawHighlight(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        ctx.arc(
            this.x - this.radius * 0.3,
            this.y - this.radius * 0.3,
            this.radius * 0.4,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
    }

    public infect(): void {
        const wasAlreadyInfected = this.isInfected()
        this.color = 'red';
        this.infectedTime = Date.now();
        this.targetScale = 1.2;
        if (!wasAlreadyInfected && this.particleSystem) {
            this.particleSystem.addInfectionEffect(this.x, this.y);
        }
    }

    public cure(): void {
        if (this.isInfected()) {  // Only emit particles if was infected
            this.color = 'green';
            this.infectedTime = null;
            this.targetScale = 1;
            
            // Emit cure particles
            if (this.particleSystem) {
                this.particleSystem.addCureEffect(this.x, this.y);
            }
        }
    }

    public die(): void {
        this.color = 'grey';
        this.vx = 0;
        this.vy = 0;
        this.targetScale = 0.8;
    }

    public isInfected(): boolean {
        return this.color === 'red';
    }

    public isDead(): boolean {
        return this.color === 'grey';
    }

    public getPosition(): { x: number; y: number } {
        return { x: this.x, y: this.y };
    }

    public getRadius(): number {
        return this.radius * this.scale;
    }
}
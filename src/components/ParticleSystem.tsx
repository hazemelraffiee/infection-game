import { Point } from "./types";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    scale: number;
    color: string;
}

export class ParticleSystem {
    private particles: Particle[];
    private readonly LIFETIME = 0.8;
    private readonly DECAY = 0.025;
    private readonly COUNT = 4;
    private readonly LINE_COUNT = 2;
    private readonly SPEED = 5;
    private readonly SIZE = 3;
    private readonly MAX = 80;
    private readonly DRAG = 0.98;
    private readonly GRAVITY = 0.1;
    private readonly TWO_PI = Math.PI * 2;

    constructor() {
        this.particles = [];
    }

    private createParticle(x: number, y: number, color: string, speedMult = 1): Particle {
        const angle = Math.random() * this.TWO_PI;
        const speed = this.SPEED * (0.7 + Math.random() * 0.5) * speedMult;
        
        return {
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: this.LIFETIME,
            scale: 0.9 + Math.random() * 0.4,
            color
        };
    }

    public addParticles(x: number, y: number, color: string): void {
        if (this.particles.length > this.MAX - this.COUNT) {
            this.particles.splice(0, this.COUNT);
        }

        const batchSize = Math.min(this.COUNT, this.MAX - this.particles.length);
        for (let i = 0; i < batchSize; i++) {
            this.particles.push(this.createParticle(x, y, color));
        }
    }

    public addLineDisappearanceEffect(points: Point[]): void {
        if (this.particles.length >= this.MAX) return;

        const stride = Math.max(1, Math.floor(points.length / 15));
        const remainingSlots = this.MAX - this.particles.length;
        const maxPoints = Math.floor(remainingSlots / this.LINE_COUNT);
        const baseColor = '#00ffff';

        for (let i = 0; i < Math.min(points.length, maxPoints); i += stride) {
            const point = points[i];
            for (let j = 0; j < this.LINE_COUNT; j++) {
                this.particles.push(this.createParticle(point.x, point.y, baseColor, 1.2));
            }
        }
    }

    public update(): void {
        let i = this.particles.length;
        
        while (i--) {
            const p = this.particles[i];
            
            p.x += p.vx;
            p.y += p.vy;
            p.vy += this.GRAVITY;
            p.vx *= this.DRAG;
            p.vy *= this.DRAG;
            p.life -= this.DECAY;

            if (p.life <= 0) {
                // Fast array removal
                const last = this.particles.pop();
                if (i < this.particles.length) {
                    this.particles[i] = last!;
                }
            }
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        const len = this.particles.length;
        if (len === 0) return;

        ctx.save();
        ctx.globalAlpha = 0.8;

        // Group particles by color for batch rendering
        const colorGroups: { [key: string]: Particle[] } = {};
        
        for (let i = 0; i < len; i++) {
            const p = this.particles[i];
            if (!colorGroups[p.color]) {
                colorGroups[p.color] = [];
            }
            colorGroups[p.color].push(p);
        }

        // Draw each color group
        for (const color in colorGroups) {
            const particles = colorGroups[color];
            
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.shadowBlur = 6;
            ctx.shadowColor = color;

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                const size = this.SIZE * p.scale;
                ctx.moveTo(p.x + size, p.y);
                ctx.arc(p.x, p.y, size, 0, this.TWO_PI);
            }
            
            ctx.fill();
        }

        ctx.restore();
    }

    public addInfectionEffect(x: number, y: number): void {
        this.addParticles(x, y, '#ff2d6f');
    }

    public addCureEffect(x: number, y: number): void {
        this.addParticles(x, y, '#39ff14');
    }

    public addDeathEffect(x: number, y: number): void {
        this.addParticles(x, y, '#45526c');
    }

    public addCollisionEffect(x: number, y: number, color: string): void {
        if (this.particles.length >= this.MAX) return;
        
        const batchSize = Math.min(this.COUNT - 1, this.MAX - this.particles.length);
        for (let i = 0; i < batchSize; i++) {
            this.particles.push(this.createParticle(x, y, color, 1.2));
        }
    }

    public clear(): void {
        this.particles.length = 0;
    }

    public hasParticles(): boolean {
        return this.particles.length > 0;
    }
}
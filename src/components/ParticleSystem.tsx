import { Point } from "./types";

interface Particle {
    x: number;
    y: number;
    color: string;
    velocity: {
        x: number;
        y: number;
    };
    life: number;
    scale: number;
    rotation: number;
    rotationSpeed: number;
}

export class ParticleSystem {
    private particles: Particle[];
    private readonly PARTICLE_LIFETIME = 1.0;
    private readonly PARTICLE_DECAY = 0.02;
    private readonly PARTICLE_COUNT = 6;
    private readonly PARTICLE_SPEED = 5;
    private readonly PARTICLE_SIZE = 3;

    constructor() {
        this.particles = [];
    }

    public addParticles(x: number, y: number, color: string): void {
        for (let i = 0; i < this.PARTICLE_COUNT; i++) {
            const angle = (Math.PI * 2 * i) / this.PARTICLE_COUNT;
            const speed = this.PARTICLE_SPEED * (0.5 + Math.random() * 0.5);
            
            this.particles.push({
                x,
                y,
                color,
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                life: this.PARTICLE_LIFETIME,
                scale: 1 + Math.random() * 0.5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }

    public addLineDisappearanceEffect(points: Point[]): void {
        points.forEach(point => {
            // Increased number of particles per point for more dramatic effect
            for (let i = 0; i < 3; i++) {
                const baseColor = '#00ffff';  // Cyan base color matching the lines
                this.particles.push({
                    x: point.x,
                    y: point.y,
                    color: baseColor,
                    velocity: {
                        x: (Math.random() - 0.5) * this.PARTICLE_SPEED * 1.2,
                        y: (Math.random() - 0.5) * this.PARTICLE_SPEED * 1.2
                    },
                    life: this.PARTICLE_LIFETIME * (0.8 + Math.random() * 0.4),
                    scale: 0.8 + Math.random() * 0.6,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.15
                });
            }
        });
    }

    public update(): void {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            // Update position
            particle.x += particle.velocity.x;
            particle.y += particle.velocity.y;

            // Add some gravity effect
            particle.velocity.y += 0.1;

            // Update rotation
            particle.rotation += particle.rotationSpeed;

            // Decrease life
            particle.life -= this.PARTICLE_DECAY;

            // Apply some drag
            particle.velocity.x *= 0.98;
            particle.velocity.y *= 0.98;

            // Remove dead particles
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();

        this.particles.forEach(particle => {
            ctx.save();

            // Enhanced transparency effect
            ctx.globalAlpha = particle.life * 0.8;  // Slightly more opaque

            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            ctx.scale(particle.scale, particle.scale);

            // Enhanced gradient for more dramatic effect
            const gradient = ctx.createRadialGradient(
                0, 0, 0,
                0, 0, this.PARTICLE_SIZE
            );
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(0.6, this.adjustColorAlpha(particle.color, 0.5));
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.beginPath();
            ctx.fillStyle = gradient;

            // Enhanced shape variety
            if (Math.random() < 0.4) {  // Increased chance for special shapes
                // Diamond/crystal shape
                const size = this.PARTICLE_SIZE;
                ctx.moveTo(0, -size);
                ctx.lineTo(size, 0);
                ctx.lineTo(0, size);
                ctx.lineTo(-size, 0);
                ctx.closePath();
            } else if (Math.random() < 0.3) {
                // Star shape
                this.drawStar(ctx, 0, 0, this.PARTICLE_SIZE, this.PARTICLE_SIZE * 0.5, 5);
            } else {
                // Enhanced circle with inner detail
                ctx.arc(0, 0, this.PARTICLE_SIZE, 0, Math.PI * 2);
                ctx.fill();
                // Inner ring
                ctx.beginPath();
                ctx.arc(0, 0, this.PARTICLE_SIZE * 0.5, 0, Math.PI * 2);
            }

            ctx.fill();

            // Enhanced glow effect
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 8;  // Increased glow
            ctx.fill();

            ctx.restore();
        });

        ctx.restore();
    }

    public addInfectionEffect(x: number, y: number): void {
        this.addParticles(x, y, '#ff2d6f');  // Matching the neon pink from balls
    }

    public addCureEffect(x: number, y: number): void {
        this.addParticles(x, y, '#39ff14');  // Matching the neon green from balls
    }

    public addDeathEffect(x: number, y: number): void {
        this.addParticles(x, y, '#45526c');  // Matching the muted blue-grey from balls
    }

    public addCollisionEffect(x: number, y: number, color: string): void {
        for (let i = 0; i < this.PARTICLE_COUNT / 2; i++) {
            this.particles.push({
                x,
                y,
                color,
                velocity: {
                    x: (Math.random() - 0.5) * this.PARTICLE_SPEED,
                    y: (Math.random() - 0.5) * this.PARTICLE_SPEED
                },
                life: this.PARTICLE_LIFETIME * 0.7,
                scale: 0.5 + Math.random() * 0.5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1
            });
        }
    }

    public clear(): void {
        this.particles = [];
    }

    public hasParticles(): boolean {
        return this.particles.length > 0;
    }

    private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerRadius: number, innerRadius: number, points: number): void {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / points;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = cx + Math.cos(rot) * radius;
            const y = cy + Math.sin(rot) * radius;
            ctx.lineTo(x, y);
            rot += step;
        }

        ctx.closePath();
    }

    private adjustColorAlpha(color: string, alpha: number): string {
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return color;
    }
}
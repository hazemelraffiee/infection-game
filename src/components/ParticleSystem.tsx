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

    public addLineDisappearanceEffect(points: Point[], color: string): void {
        points.forEach(point => {
            for (let i = 0; i < 2; i++) { // Adjust the number for effect intensity
                this.particles.push({
                    x: point.x,
                    y: point.y,
                    color,
                    velocity: {
                        x: (Math.random() - 0.5) * this.PARTICLE_SPEED,
                        y: (Math.random() - 0.5) * this.PARTICLE_SPEED
                    },
                    life: this.PARTICLE_LIFETIME,
                    scale: 0.5 + Math.random() * 0.5,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.1
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

            // Set transparency based on life
            ctx.globalAlpha = particle.life;

            // Move to particle position and apply rotation
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            ctx.scale(particle.scale, particle.scale);

            // Create gradient for particle
            const gradient = ctx.createRadialGradient(
                0, 0, 0,
                0, 0, this.PARTICLE_SIZE
            );
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            // Draw particle
            ctx.beginPath();
            ctx.fillStyle = gradient;

            // Draw different shapes for variety
            if (Math.random() < 0.3) {
                // Star shape
                for (let i = 0; i < 5; i++) {
                    const angle = (Math.PI * 2 * i) / 5;
                    const x = Math.cos(angle) * this.PARTICLE_SIZE;
                    const y = Math.sin(angle) * this.PARTICLE_SIZE;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
            } else {
                // Circle shape
                ctx.arc(0, 0, this.PARTICLE_SIZE, 0, Math.PI * 2);
            }

            ctx.fill();

            // Add glow effect
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 5;
            ctx.fill();

            ctx.restore();
        });

        ctx.restore();
    }

    public addInfectionEffect(x: number, y: number): void {
        this.addParticles(x, y, '#ff6b6b');
    }

    public addCureEffect(x: number, y: number): void {
        this.addParticles(x, y, '#90ee90');
    }

    public addDeathEffect(x: number, y: number): void {
        this.addParticles(x, y, '#808080');
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
}
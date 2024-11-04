import { Ball } from './Ball';
import { CollisionInfo, Point } from './types';

export class CurvyLine {
    private readonly points: Point[];
    private isComplete: boolean;
    private readonly MIN_POINT_DISTANCE = 5;

    constructor() {
        this.points = [];
        this.isComplete = false;
    }

    public addPoint(x: number, y: number): void {
        // Only add point if it's far enough from the last point
        if (this.points.length === 0 || 
            this.getDistanceToLastPoint(x, y) > this.MIN_POINT_DISTANCE) {
            this.points.push({ x, y });
        }
    }

    private getDistanceToLastPoint(x: number, y: number): number {
        if (this.points.length === 0) return Infinity;
        const lastPoint = this.points[this.points.length - 1];
        return Math.hypot(x - lastPoint.x, y - lastPoint.y);
    }

    public complete(): void {
        this.isComplete = true;
    }

    public getCollisionInfo(ball: Ball): CollisionInfo {
        let minDist = Infinity;
        let closestSegment: { start: Point; end: Point } | null = null;
        let closestPoint: Point | null = null;
        
        const ballPos = ball.getPosition();
        const ballRadius = ball.getRadius();

        // Check collision with each segment of the curve
        for (let i = 0; i < this.points.length - 1; i++) {
            const start = this.points[i];
            const end = this.points[i + 1];
            
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const lineLength = Math.hypot(dx, dy);
            
            // Skip extremely short line segments
            if (lineLength < 1) continue;
            
            // Calculate closest point on line segment
            const dot = ((ballPos.x - start.x) * dx + 
                        (ballPos.y - start.y) * dy) / (lineLength * lineLength);
            
            let pointX: number, pointY: number;
            
            if (dot < 0) {
                pointX = start.x;
                pointY = start.y;
            } else if (dot > 1) {
                pointX = end.x;
                pointY = end.y;
            } else {
                pointX = start.x + dot * dx;
                pointY = start.y + dot * dy;
            }
            
            const distance = Math.hypot(ballPos.x - pointX, ballPos.y - pointY);
            
            if (distance < minDist) {
                minDist = distance;
                closestSegment = { start, end };
                closestPoint = { x: pointX, y: pointY };
            }
        }
        
        if (!closestPoint || !closestSegment || minDist >= ballRadius) {
            return { 
                collides: false, 
                normal: { x: 0, y: 0 }, 
                correctedX: 0, 
                correctedY: 0 
            };
        }
        
        // Calculate normal vector from line to ball
        const dx = ballPos.x - closestPoint.x;
        const dy = ballPos.y - closestPoint.y;
        const dist = Math.hypot(dx, dy);
        
        // Prevent division by zero
        if (dist < 0.0001) {
            return {
                collides: true,
                normal: { x: 1, y: 0 },
                correctedX: ballPos.x + ballRadius,
                correctedY: ballPos.y
            };
        }
        
        const normal = {
            x: dx / dist,
            y: dy / dist
        };
        
        return {
            collides: true,
            normal,
            correctedX: closestPoint.x + normal.x * ballRadius,
            correctedY: closestPoint.y + normal.y * ballRadius
        };
    }

    public collidesWithBall(ball: Ball): boolean {
        const ballPos = ball.getPosition();
        const ballRadius = ball.getRadius();

        // Check collision with each segment of the curve
        for (let i = 0; i < this.points.length - 1; i++) {
            const start = this.points[i];
            const end = this.points[i + 1];
            
            const lineLength = Math.hypot(end.x - start.x, end.y - start.y);
            
            // Skip extremely short segments
            if (lineLength < 1) continue;
            
            // Calculate closest point on line segment
            const dot = ((ballPos.x - start.x) * (end.x - start.x) + 
                        (ballPos.y - start.y) * (end.y - start.y)) / (lineLength * lineLength);
            
            let closestX: number, closestY: number;
            
            if (dot < 0) {
                closestX = start.x;
                closestY = start.y;
            } else if (dot > 1) {
                closestX = end.x;
                closestY = end.y;
            } else {
                closestX = start.x + dot * (end.x - start.x);
                closestY = start.y + dot * (end.y - start.y);
            }
            
            const distance = Math.hypot(ballPos.x - closestX, ballPos.y - closestY);
            
            if (distance < ballRadius) {
                return true;
            }
        }
        
        return false;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        if (this.points.length < 2) return;
        
        ctx.save();
        
        // Add glow effect
        ctx.shadowColor = this.isComplete ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 100, 255, 0.5)';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        
        // Create smooth curve through points
        for (let i = 1; i < this.points.length - 2; i++) {
            const xc = (this.points[i].x + this.points[i + 1].x) / 2;
            const yc = (this.points[i].y + this.points[i + 1].y) / 2;
            ctx.quadraticCurveTo(
                this.points[i].x,
                this.points[i].y,
                xc,
                yc
            );
        }
        
        // Handle the last two points
        if (this.points.length > 2) {
            const lastIndex = this.points.length - 1;
            ctx.quadraticCurveTo(
                this.points[lastIndex - 1].x,
                this.points[lastIndex - 1].y,
                this.points[lastIndex].x,
                this.points[lastIndex].y
            );
        } else {
            ctx.lineTo(
                this.points[1].x,
                this.points[1].y
            );
        }
        
        // Create line gradient
        const gradient = ctx.createLinearGradient(
            this.points[0].x,
            this.points[0].y,
            this.points[this.points.length - 1].x,
            this.points[this.points.length - 1].y
        );
        
        if (this.isComplete) {
            gradient.addColorStop(0, '#2c3e50');
            gradient.addColorStop(1, '#34495e');
        } else {
            gradient.addColorStop(0, '#3498db');
            gradient.addColorStop(1, '#2980b9');
        }
        
        // Apply line styles
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        ctx.restore();
    }
}
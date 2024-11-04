export interface LeaderboardEntry {
    playerName: string;
    value: number;
    date: string;
}

export interface GameState {
    isGameOver: boolean;
    infectionStarted: boolean;
    currentScore: number;
    gameStartTime: number | null;
    gameEndTime: number | null;
    highScores: LeaderboardEntry[];
    bestTimes: LeaderboardEntry[];
    shouldResetGame?: boolean;
}

export interface Dimensions {
    width: number;
    height: number;
}

export interface GameOverState {
    isOver: boolean;
    survivors: number;
}

export interface BallConfig {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    speedScale: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface CollisionInfo {
    collides: boolean;
    normal: {
        x: number;
        y: number;
    };
    correctedX: number;
    correctedY: number;
}

export interface GameSettings {
    ballCount: number;
    ballRadius: number;
    infectionDuration: number;
    leaderboardSize: number;
    speedScale: number;
}
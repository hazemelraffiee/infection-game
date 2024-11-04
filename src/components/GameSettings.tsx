import { useState, useEffect } from 'react';

export interface GameSettings {
    ballCount: number;
    ballRadius: number;
    infectionDuration: number;
    leaderboardSize: number;
    speedScale: number;
}

export const BASE_SETTINGS = {
    infectionDuration: 10 * 1000,
    leaderboardSize: 5,
    ballCount: 30, // Fixed ball count
    // Base values for a laptop screen (1366x768)
    baseScreenArea: 1366 * 768,
    baseBallRadius: 30,
    baseSpeed: 150,
};

export const useGameSettings = () => {
    const [settings, setSettings] = useState<GameSettings>({
        ballCount: BASE_SETTINGS.ballCount,
        ballRadius: BASE_SETTINGS.baseBallRadius,
        infectionDuration: BASE_SETTINGS.infectionDuration,
        leaderboardSize: BASE_SETTINGS.leaderboardSize,
        speedScale: 1,
    });

    useEffect(() => {
        const updateSettings = () => {
            // Calculate current screen area ratio compared to base laptop screen
            const currentArea = window.innerWidth * window.innerHeight;
            const areaRatio = Math.sqrt(currentArea / BASE_SETTINGS.baseScreenArea);

            // Calculate new ball radius and speed scale
            const scaledBallRadius = Math.round(BASE_SETTINGS.baseBallRadius * Math.sqrt(areaRatio));
            const speedScale = Math.sqrt(areaRatio);  // Scale speed similarly to radius

            // For debugging
            console.log('Screen size:', window.innerWidth, 'x', window.innerHeight);
            console.log('Area ratio:', areaRatio);
            console.log('New ball radius:', scaledBallRadius);
            console.log('Speed scale:', speedScale);

            setSettings(prev => {
                if (prev.ballRadius === scaledBallRadius && prev.speedScale === speedScale) {
                    return prev;
                }
                return {
                    ...prev,
                    ballRadius: scaledBallRadius,
                    speedScale: speedScale
                };
            });
        };

        // Initial update
        updateSettings();

        // Debounced update on resize
        let resizeTimeout: ReturnType<typeof setTimeout>;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateSettings, 100);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimeout);
        };
    }, []);

    return settings;
};
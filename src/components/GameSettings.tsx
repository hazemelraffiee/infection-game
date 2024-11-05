import { useState, useEffect } from 'react';
import { GameSettings } from './types';

export const BASE_SETTINGS = {
    infectionDuration: 10 * 1000,
    leaderboardSize: 5,
    ballCount: 20, // Default ball count for mobile screens
    // Base values for a laptop screen (1366x768)
    baseScreenArea: 1366 * 768,
    baseBallRadius: 40, // Adjusted base radius for better scaling
    baseSpeed: 150,
    minSpeedScale: 0.3, // Minimum speed scale (30% of base speed)
    maxSpeedScale: 1.5, // Maximum speed scale (150% of base speed)
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
            const currentArea = window.innerWidth * window.innerHeight;
            const areaRatio = currentArea / BASE_SETTINGS.baseScreenArea;
            const lengthScale = Math.sqrt(areaRatio);

            // Adjust ball radius with limits
            let scaledBallRadius = Math.round(BASE_SETTINGS.baseBallRadius * lengthScale);

            // Adjust speed scale inversely for smaller screens
            let speedScale = Math.pow(lengthScale, 0.8); // Adjust exponent as needed
            speedScale = Math.max(BASE_SETTINGS.minSpeedScale, Math.min(BASE_SETTINGS.maxSpeedScale, speedScale));

            // Adjust ball count based on screen size
            let newBallCount = window.innerWidth > 1024 ? 30 : 20; // 1024px is a common breakpoint between mobile and desktop

            setSettings(prev => {
                if (
                    prev.ballRadius === scaledBallRadius &&
                    prev.speedScale === speedScale &&
                    prev.ballCount === newBallCount
                ) {
                    return prev;
                }
                return {
                    ...prev,
                    ballRadius: scaledBallRadius,
                    speedScale: speedScale,
                    ballCount: newBallCount,
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
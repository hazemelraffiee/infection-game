import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import musicUrl from '../assets/music.mp3';

const BackgroundMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const audio = new Audio(musicUrl);
    audio.loop = true;
    audioRef.current = audio;

    const handleCanPlayThrough = () => {
      setIsLoaded(true);
    };

    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    // Clean up
    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = 1;
        audioRef.current.play();
      } else {
        audioRef.current.volume = 0;
      }
      setIsMuted(!isMuted);
    }
  };

  // Auto-play when component loads (after user interaction)
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (audioRef.current && isLoaded && !isMuted) {
        audioRef.current.play().catch(() => {
          // Handle auto-play restrictions
          setIsMuted(true);
        });
      }
      document.removeEventListener('click', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    return () => document.removeEventListener('click', handleFirstInteraction);
  }, [isLoaded, isMuted]);

  return (
    <button
      onClick={toggleMute}
      className="fixed bottom-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors duration-200 z-50"
      aria-label={isMuted ? "Unmute background music" : "Mute background music"}
    >
      {isMuted ? (
        <VolumeX className="w-6 h-6 text-white/80" />
      ) : (
        <Volume2 className="w-6 h-6 text-white/80" />
      )}
    </button>
  );
};

export default BackgroundMusic;

import { useState, useEffect, useRef } from 'react';
import { cn } from '../components/Layout';

export default function IntroScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const finishIntro = () => {
    setIsFading(true);
    setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 1000); // 1s fade out
  };

  useEffect(() => {
    // Fallback in case video doesn't load or play
    const timeout = setTimeout(() => {
      if (isVisible && !isFading) {
        finishIntro();
      }
    }, 8000); // Max 8 seconds

    return () => clearTimeout(timeout);
  }, [isVisible, isFading]);

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] bg-zinc-950 flex items-center justify-center transition-opacity duration-1000",
        isFading ? "opacity-0" : "opacity-100"
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={finishIntro}
        className="w-full h-full object-cover max-w-4xl max-h-[80vh] rounded-2xl shadow-2xl"
        src="/intro.mp4" // User needs to place their video here
      />
      <button 
        onClick={finishIntro}
        className="absolute bottom-8 right-8 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md text-sm font-medium transition-colors"
      >
        Skip Intro
      </button>
    </div>
  );
}

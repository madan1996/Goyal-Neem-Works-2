import React, { useState } from 'react';
import { Volume2, Loader2, StopCircle } from 'lucide-react';

interface AudioPlayerProps {
  text: string;
  lang?: 'en-US' | 'hi-IN';
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ text, lang = 'hi-IN', className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Attempt to pick a natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang === lang && v.name.includes('Google'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <button 
      onClick={(e) => { e.stopPropagation(); handlePlay(); }}
      className={`p-2 rounded-full hover:bg-earth-100 transition-colors text-herb-600 ${className}`}
      title={isPlaying ? "Stop" : "Listen"}
    >
      {isPlaying ? <StopCircle className="h-5 w-5 animate-pulse" /> : <Volume2 className="h-5 w-5" />}
    </button>
  );
};
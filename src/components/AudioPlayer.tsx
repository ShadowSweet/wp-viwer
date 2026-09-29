import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Mic, Volume2, AlertCircle } from 'lucide-react';
import { Attachment } from '../types/chat';

interface AudioPlayerProps {
  attachment: Attachment;
  isOutgoing?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ attachment, isOutgoing = false }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(attachment.duration || 0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [hasError, setHasError] = useState(false);

  // Pseudo-waveform bar heights (WhatsApp style, 28 bars with varying heights)
  const barHeights = React.useMemo(() => {
    // Generate deterministic pseudo-random heights based on fileName
    let hash = 0;
    for (let i = 0; i < attachment.fileName.length; i++) {
      hash = (hash << 5) - hash + attachment.fileName.charCodeAt(i);
      hash |= 0;
    }
    const bars: number[] = [];
    for (let i = 0; i < 28; i++) {
      const pseudoVal = Math.abs(Math.sin((hash + i * 17) * 0.45));
      // heights between 4px and 24px
      bars.push(Math.round(4 + pseudoVal * 20));
    }
    return bars;
  }, [attachment.fileName]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setHasError(true);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [attachment.url]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Playback error:', err);
        setHasError(true);
      });
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const cycleSpeed = () => {
    const audio = audioRef.current;
    if (!audio) return;

    let nextRate = 1;
    if (playbackRate === 1) nextRate = 1.5;
    else if (playbackRate === 1.5) nextRate = 2;
    else nextRate = 1;

    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const isVoice = attachment.mediaType === 'voice';

  return (
    <div className="flex flex-col min-w-[240px] max-w-[320px] select-none py-1">
      <audio ref={audioRef} src={attachment.url} preload="metadata" />

      {hasError ? (
        <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-500/20">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <div className="flex-1">
            <p className="font-medium">Audio no compatible directamente con este navegador</p>
            <a
              href={attachment.url}
              download={attachment.fileName}
              className="text-emerald-400 underline hover:text-emerald-300 mt-1 inline-block"
            >
              Descargar {attachment.fileName}
            </a>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {/* Avatar / Mic icon */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pausar audio' : 'Reproducir audio'}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition shadow-sm active:scale-95 ${
                isOutgoing
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-white'
              }`}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[9px] text-emerald-400">
              {isVoice ? <Mic className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
            </div>
          </div>

          {/* Waveform and progress */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Waveform Bars */}
            <div
              onClick={handleSeek}
              className="h-8 flex items-center gap-[2.5px] cursor-pointer group py-1"
              title="Haz clic para avanzar o retroceder"
            >
              {barHeights.map((height, idx) => {
                const barRatio = idx / barHeights.length;
                const isPlayed = barRatio <= progressRatio;
                return (
                  <div
                    key={idx}
                    style={{ height: `${height}px` }}
                    className={`w-[3px] rounded-full transition-colors ${
                      isPlayed
                        ? isOutgoing
                          ? 'bg-emerald-400'
                          : 'bg-[#53bdeb]'
                        : isOutgoing
                        ? 'bg-emerald-800/80 group-hover:bg-emerald-700'
                        : 'bg-neutral-600 group-hover:bg-neutral-500'
                    }`}
                  />
                );
              })}
            </div>

            {/* Time and Speed */}
            <div className="flex items-center justify-between text-[11px] text-[#8696a0] font-mono leading-none mt-0.5">
              <span>{formatTime(currentTime > 0 ? currentTime : duration)}</span>

              <button
                type="button"
                onClick={cycleSpeed}
                title="Velocidad de reproducción"
                className="text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded bg-black/20 hover:bg-black/40 text-neutral-300 transition"
              >
                {playbackRate}x
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Mic, Volume2, AlertCircle } from 'lucide-react';
import { Attachment } from '../types/chat';

interface AudioPlayerProps {
  messageId: string;
  attachment: Attachment;
  isOutgoing?: boolean;
  isPlaying?: boolean;
  playbackRate?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onChangeRate?: (rate: number) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  messageId: _messageId,
  attachment,
  isOutgoing = false,
  isPlaying = false,
  playbackRate = 1,
  onPlay,
  onPause,
  onEnded,
  onChangeRate,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(attachment.duration || 0);
  const [hasError, setHasError] = useState(false);

  // Pseudo-waveform bar heights (WhatsApp style, 24 bars)
  const barHeights = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < attachment.fileName.length; i++) {
      hash = (hash << 5) - hash + attachment.fileName.charCodeAt(i);
      hash |= 0;
    }
    const bars: number[] = [];
    for (let i = 0; i < 24; i++) {
      const pseudoVal = Math.abs(Math.sin((hash + i * 17) * 0.45));
      bars.push(Math.round(4 + pseudoVal * 18));
    }
    return bars;
  }, [attachment.fileName]);

  // Sync playback state with isPlaying prop
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = playbackRate;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn('Playback error:', err);
        setHasError(true);
        onPause?.();
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, playbackRate]);

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
      setCurrentTime(0);
      onEnded?.();
    };

    const handleError = () => {
      setHasError(true);
      onPause?.();
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
  }, [attachment.url, onEnded, onPause]);

  const togglePlay = () => {
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clickX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    let nextRate = 1;
    if (playbackRate === 1) nextRate = 1.5;
    else if (playbackRate === 1.5) nextRate = 2;
    else nextRate = 1;

    onChangeRate?.(nextRate);
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
    <div className="flex flex-col w-full max-w-[260px] sm:max-w-[300px] select-none py-1">
      <audio ref={audioRef} src={attachment.url} preload="metadata" />

      {hasError ? (
        <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-500/20">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <div className="flex-1">
            <p className="font-medium text-[11px]">Audio no compatible con este navegador</p>
            <a
              href={attachment.url}
              download={attachment.fileName}
              className="text-emerald-400 underline hover:text-emerald-300 mt-1 inline-block text-[11px]"
            >
              Descargar {attachment.fileName}
            </a>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Big touch target Avatar / Play button */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pausar audio' : 'Reproducir audio'}
              className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition shadow-sm active:scale-95 cursor-pointer ${
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
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[9px] text-emerald-400 pointer-events-none">
              {isVoice ? <Mic className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
            </div>
          </div>

          {/* Waveform and progress */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            {/* Waveform Bars with generous touch padding */}
            <div
              onClick={handleSeek}
              onTouchStart={handleSeek}
              className="h-8 flex items-center gap-[2.5px] cursor-pointer group py-1.5 touch-manipulation"
              title="Toca para avanzar o retroceder"
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

            {/* Time and Speed Control */}
            <div className="flex items-center justify-between text-[11px] text-[#8696a0] font-mono leading-none mt-0.5">
              <span>{formatTime(currentTime > 0 ? currentTime : duration)}</span>

              {/* Speed Button (1×, 1.5×, 2×) */}
              <button
                type="button"
                onClick={cycleSpeed}
                title="Cambiar velocidad de reproducción (1× / 1.5× / 2×)"
                aria-label={`Velocidad de audio: ${playbackRate}×`}
                className="text-[11px] font-sans font-bold px-2 py-0.5 rounded-full bg-black/30 hover:bg-black/50 text-emerald-300 border border-emerald-500/25 transition active:scale-95 touch-manipulation"
              >
                {playbackRate === 1 ? '1×' : playbackRate === 1.5 ? '1.5×' : '2×'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

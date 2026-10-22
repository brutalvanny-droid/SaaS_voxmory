import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Play, Pause, Volume2, SkipBack, Music } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  title: string;
  subtitle: string;
  coverUrl?: string;
  startTime?: number;
  endTime?: number;
}

export default function AudioPlayer({ audioUrl, title, subtitle, coverUrl, startTime, endTime }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [imageError, setImageError] = useState(false);
  const [audioError, setAudioError] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLInputElement | null>(null);

  const minTime = startTime || 0;

  useEffect(() => {
    // Reset player states when audio url changes
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentTime(minTime);
    setDuration(0);
    setImageError(false);
    setAudioError(false);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      audioRef.current.currentTime = minTime;
    }
  }, [audioUrl, startTime, coverUrl]);

  // Check if metadata is already loaded (for cached audios)
  useEffect(() => {
    if (audioRef.current && audioRef.current.readyState >= 1) {
      handleLoadedMetadata();
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // If current time is out of range, reset it to minTime
      if (audioRef.current.currentTime < minTime || (endTime && audioRef.current.currentTime >= endTime)) {
        audioRef.current.currentTime = minTime;
        setCurrentTime(minTime);
      }
      
      setIsLoading(true);
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
        fetch('/api/stats/listen', { method: 'POST' }).catch(() => {});
      }).catch(err => {
        setIsLoading(false);
        console.error('Error playing audio', err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const rawTime = audioRef.current.currentTime;
    
    // Check end trimming bound
    if (endTime && rawTime >= endTime) {
      audioRef.current.pause();
      audioRef.current.currentTime = minTime;
      setCurrentTime(minTime);
      setIsPlaying(false);
    } else if (rawTime < minTime) {
      audioRef.current.currentTime = minTime;
      setCurrentTime(minTime);
    } else {
      setCurrentTime(rawTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const audioDur = audioRef.current.duration;
    setDuration(audioDur);
    
    // Set initial position
    audioRef.current.currentTime = minTime;
    setCurrentTime(minTime);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = minTime;
    }
    setCurrentTime(minTime);
  };

  /**
   * Le fichier n'a pas pu être lu.
   *
   * Nous ne remplaçons plus le morceau par une piste de démonstration
   * trouvée ailleurs : le visiteur aurait entendu une chanson qui n'est pas
   * la nôtre en croyant l'inverse. On prévient simplement, le temps que le
   * studio redépose le fichier.
   */
  const handleAudioError = () => {
    setIsLoading(false);
    setIsPlaying(false);
    if (audioUrl) setAudioError(true);
  };

  const handleProgressChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const maxLimit = endTime && endTime < duration ? endTime : duration;
  const displayCurrent = Math.max(0, currentTime - minTime);
  const displayDuration = duration > 0 ? Math.max(0, maxLimit - minTime) : 0;
  const progressPercent = displayDuration > 0 ? (displayCurrent / displayDuration) * 100 : 0;

  // Custom high-fidelity waveform profile (looks like a professional audio master file)
  const waveformProfile = [
    15, 22, 35, 50, 40, 58, 72, 85, 60, 45, 65, 80, 95, 78, 62, 50,
    45, 58, 70, 88, 92, 75, 60, 68, 52, 38, 42, 30, 25, 18, 12, 8
  ];

  return (
    <div className="bg-[#0B0D10] border border-[#A3FF12]/15 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-xl shadow-[#0B0D10]/20 max-w-2xl mx-auto w-full">
      <audio
        ref={audioRef}
        // Une chanson peut exister sans fichier audio encore déposé : passer
        // une chaîne vide ferait retélécharger la page entière par le
        // navigateur. On préfère ne pas renseigner l'attribut.
        src={audioUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        // Le clic droit permettrait d'enregistrer le fichier complet alors
        // que le studio n'a voulu faire entendre qu'un extrait. On le
        // désactive : ce n'est pas un verrou absolu, mais cela décourage le
        // geste le plus courant.
        onContextMenu={(e) => e.preventDefault()}
        onCanPlay={() => setIsLoading(false)}
        onCanPlayThrough={() => setIsLoading(false)}
        onWaiting={() => { if (isPlaying) setIsLoading(true); }}
        onPlaying={() => { setIsLoading(false); setIsPlaying(true); }}
        onPause={() => { setIsPlaying(false); setIsLoading(false); }}
        onError={handleAudioError}
      />

      {/* Cover art or placeholder */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
        {coverUrl && !imageError ? (
          <img
            src={coverUrl}
            alt={title}
            className={`w-full h-full object-cover transition-all duration-700 ${isPlaying ? 'scale-110 rotate-3' : ''}`}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#0B0D10] via-[#07080A] to-[#0B0D10] flex items-center justify-center">
            <Music className="w-8 h-8 text-[#A3FF12]/80 animate-pulse" />
          </div>
        )}
        
        {/* Glowing record spinner when playing */}
        {isPlaying && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#A3FF12] animate-ping" />
          </div>
        )}
      </div>

      {/* Title & Player Controls */}
      <div className="flex-grow w-full space-y-2">
        <div className="text-center sm:text-left">
          <h4 className="font-sans font-bold text-white text-sm sm:text-base leading-tight tracking-wide">{title}</h4>
          <span className="text-xs text-[#A3FF12] font-medium">{subtitle}</span>
        </div>

        {audioError ? (
          <p className="text-[11px] text-[#FF9B9B] bg-[#FF9B9B]/10 border border-[#FF9B9B]/20 rounded-lg px-3 py-2 my-1.5">
            Fichier audio indisponible pour le moment. Le studio a été prévenu.
          </p>
        ) : (
        <>
        {/* Animated Audio Waveform Visualizer */}
        <div className="h-10 flex items-center justify-between gap-[2px] px-2 bg-black/50 rounded-xl border border-white/5 py-1.5 my-1.5 overflow-hidden">
          {waveformProfile.map((height, index) => {
            const barPercent = (index / (waveformProfile.length - 1)) * 100;
            const isActive = barPercent <= progressPercent;

            // Vary animations across the waveform for a lifelike organic dance
            const animClass = index % 3 === 0 
              ? 'animate-wave-fast' 
              : index % 3 === 1 
                ? 'animate-wave-mid' 
                : 'animate-wave-slow';

            const animationDelayValue = `${(index * 0.035).toFixed(3)}s`;

            return (
              <div
                key={index}
                onClick={() => {
                  if (audioRef.current && displayDuration > 0) {
                    const clickTime = minTime + (barPercent / 100) * displayDuration;
                    audioRef.current.currentTime = clickTime;
                    setCurrentTime(clickTime);
                  }
                }}
                style={{ 
                  height: `${height}%`,
                  animationDelay: isPlaying && isActive ? animationDelayValue : undefined,
                  willChange: isPlaying && isActive ? 'transform' : undefined
                }}
                className={`w-[4px] rounded-full transition-all duration-300 cursor-pointer origin-center ${
                  isActive 
                    ? 'bg-gradient-to-t from-[#A3FF12] via-[#A3FF12] to-[#7ACC00] shadow-[0_0_8px_rgba(163,255,18,0.25)]' 
                    : 'bg-white/10 hover:bg-white/35'
                } ${isPlaying && isActive ? animClass : ''}`}
                title={`Aller à ${Math.round(barPercent)}%`}
              />
            );
          })}
        </div>

        {/* Audio Slider bar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#8A949F] w-8 text-right">{formatTime(displayCurrent)}</span>
          <input
            ref={progressBarRef}
            type="range"
            min={minTime}
            max={maxLimit || 100}
            value={currentTime}
            onChange={handleProgressChange}
            className="flex-grow h-1.5 rounded-lg appearance-none cursor-pointer accent-[#A3FF12] bg-white/10"
          />
          <span className="text-[10px] font-mono text-[#8A949F] w-8">{formatTime(displayDuration || (maxLimit - minTime))}</span>
        </div>

        </>
        )}
        {/* Controls Panel */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = minTime;
                  setCurrentTime(minTime);
                }
              }}
              title="Reset"
              className="text-[#8A949F] hover:text-white transition-all cursor-pointer"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            
            <button
              onClick={togglePlay}
              disabled={audioError || !audioUrl}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#A3FF12] via-[#A3FF12] to-[#7ACC00] text-black flex items-center justify-center hover:scale-105 transition-all shadow-md shadow-[#A3FF12]/20 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black pl-0.5" />
              )}
            </button>

            {/* Simulated mini active wave status indicator */}
            {isLoading ? (
              <span className="text-[10px] text-[#A3FF12] font-mono animate-pulse px-2">Chargement...</span>
            ) : isPlaying ? (
              <span className="text-[10px] text-[#A3FF12] font-mono px-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping inline-block" />
                Lecture en cours
              </span>
            ) : (
              <span className="text-[10px] text-[#8A949F] font-mono px-2">Prêt</span>
            )}
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-[#8A949F]" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 rounded-lg appearance-none cursor-pointer accent-[#A3FF12]/80 bg-white/10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

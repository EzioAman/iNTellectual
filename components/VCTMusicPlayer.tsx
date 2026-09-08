"use client";

import React, { useState, useEffect, useRef } from "react";
import { VCT_PLAYLIST, MusicTrack } from "@/lib/musicTracks";
import { soundFx } from "@/lib/soundEngine";

interface VCTMusicPlayerProps {
  accentColor: string;
  isCompact?: boolean;
}

export const VCTMusicPlayer: React.FC<VCTMusicPlayerProps> = ({
  accentColor,
  isCompact = true,
}) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.15); // Default 15% volume
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState("0:00");
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [audioMode, setAudioMode] = useState<"TRACK" | "SYNTH">("TRACK");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const visualizerRef = useRef<HTMLCanvasElement | null>(null);
  const synthIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const currentTrack: MusicTrack = VCT_PLAYLIST[currentTrackIndex] || VCT_PLAYLIST[0];

  // Helper to format seconds as MM:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Setup HTML Audio element properties
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
    audio.loop = isLooping;
  }, [volume, isMuted, isLooping]);

  // Handle Track Changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || audioMode === "SYNTH") return;

    audio.src = currentTrack.src;
    audio.load();
    if (isPlaying) {
      audio
        .play()
        .then(() => setStatusMessage(null))
        .catch((err) => {
          console.warn("Audio file playback blocked, offering procedural synth fallback:", err);
          // If audio file playback fails, automatically start procedural synth
          startProceduralSynth();
        });
    }
  }, [currentTrackIndex, audioMode]);

  // Audio Event Listeners for progress and looping
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTimeFormatted(formatTime(audio.currentTime));
      }
    };

    const handleEnded = () => {
      if (isLooping) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        // Next track
        setCurrentTrackIndex((prev) => (prev + 1) % VCT_PLAYLIST.length);
      }
    };

    const handleError = () => {
      console.warn("Audio file format or network issue; switching to procedural synth fallback");
      startProceduralSynth();
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [isLooping]);

  // Built-in Procedural Web Audio Ambient Synth Engine
  const startProceduralSynth = () => {
    setAudioMode("SYNTH");
    setIsPlaying(true);
    setStatusMessage("Procedural Lo-Fi Synth Active");

    if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);

    // Play initial chord and schedule recurring ambient progression
    playSynthNote();
    synthIntervalRef.current = setInterval(() => {
      playSynthNote();
    }, 4000);
  };

  const stopProceduralSynth = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
  };

  // Play rich ambient Web Audio chord with smooth attack and decay
  const playSynthNote = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === "suspended") ctx.resume();

      const chords = [
        [220, 261.63, 329.63], // A Minor
        [174.61, 220, 261.63], // F Major
        [261.63, 329.63, 392], // C Major
        [196, 246.94, 293.66], // G Major
      ];
      const selectedChord = chords[Math.floor(Math.random() * chords.length)];

      const currentEffectiveVolume = isMuted ? 0 : volume * 0.4;

      selectedChord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = idx === 0 ? "sawtooth" : "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(800 + idx * 200, ctx.currentTime);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(currentEffectiveVolume, ctx.currentTime + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 4.0);
      });
    } catch (err) {
      console.warn("Web Audio ambient synth error:", err);
    }
  };

  // Toggle Play / Pause
  const togglePlay = () => {
    soundFx.playClick();
    const audio = audioRef.current;

    if (isPlaying) {
      if (audio) audio.pause();
      stopProceduralSynth();
      setIsPlaying(false);
    } else {
      if (audioMode === "SYNTH") {
        startProceduralSynth();
      } else if (audio) {
        audio
          .play()
          .then(() => {
            setIsPlaying(true);
            setStatusMessage(null);
          })
          .catch((err) => {
            console.warn("Browser blocked audio play; falling back to Web Audio synth:", err);
            startProceduralSynth();
          });
      }
    }
  };

  const handleNextTrack = () => {
    soundFx.playHover();
    if (audioMode === "SYNTH") {
      setAudioMode("TRACK");
      stopProceduralSynth();
    }
    setCurrentTrackIndex((prev) => (prev + 1) % VCT_PLAYLIST.length);
  };

  const handlePrevTrack = () => {
    soundFx.playHover();
    if (audioMode === "SYNTH") {
      setAudioMode("TRACK");
      stopProceduralSynth();
    }
    setCurrentTrackIndex((prev) => (prev === 0 ? VCT_PLAYLIST.length - 1 : prev - 1));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    const audio = audioRef.current;
    if (audio && audio.duration) {
      audio.currentTime = (val / 100) * audio.duration;
    }
  };

  // Animated Audio Visualizer Canvas
  useEffect(() => {
    const canvas = visualizerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 8;
      const barWidth = 3;
      const gap = 2;

      for (let i = 0; i < bars; i++) {
        let height = 3;
        if (isPlaying) {
          height = 3 + Math.abs(Math.sin(phase + i * 0.6)) * 14;
        }

        ctx.fillStyle = isPlaying ? accentColor : "#475569";
        ctx.fillRect(i * (barWidth + gap), canvas.height - height, barWidth, height);
      }

      phase += 0.15;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, accentColor]);

  // Clean up synth timer on unmount
  useEffect(() => {
    return () => {
      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
    };
  }, []);

  return (
    <div className="relative">
      {/* HIDDEN HTML5 AUDIO ELEMENT */}
      <audio
        ref={audioRef}
        src={currentTrack.src}
        preload="auto"
        crossOrigin="anonymous"
      />

      {/* COMPACT PLAYER BAR */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg hover:border-white/20 transition-all">
        {/* EQUALIZER CANVAS */}
        <div className="flex items-center cursor-pointer" onClick={togglePlay} title="Toggle Audio Playback">
          <canvas ref={visualizerRef} width={40} height={18} className="rounded" />
        </div>

        {/* TRACK INFO */}
        <div className="hidden sm:flex flex-col text-left max-w-[130px] md:max-w-[170px] overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[9px] font-mono uppercase px-1 rounded font-bold"
              style={{
                backgroundColor: `${accentColor}20`,
                color: accentColor,
              }}
            >
              {audioMode === "SYNTH" ? "SYNTH" : currentTrack.tag}
            </span>
            <span className="text-xs font-mono font-bold text-white truncate">
              {audioMode === "SYNTH" ? "Cyber Lo-Fi Ambient" : currentTrack.title}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 truncate">
            {audioMode === "SYNTH" ? "Web Audio Procedural Synth" : currentTrack.artist}
          </span>
        </div>

        {/* CONTROLS (PREV, PLAY/PAUSE, NEXT) */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevTrack}
            className="w-6 h-6 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors"
            title="Previous Track"
          >
            ⏮
          </button>

          <button
            onClick={togglePlay}
            className="w-7 h-7 rounded-full flex items-center justify-center text-black font-bold shadow-md transition-transform hover:scale-105"
            style={{ backgroundColor: accentColor }}
            title={isPlaying ? "Pause Music" : "Play Looping Valorant Soundtrack"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>

          <button
            onClick={handleNextTrack}
            className="w-6 h-6 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors"
            title="Next Track"
          >
            ⏭
          </button>
        </div>

        {/* VOLUME & LOOP POPOVER TOGGLE */}
        <div className="relative">
          <button
            onClick={() => setShowVolumeSlider((prev) => !prev)}
            className="w-7 h-7 rounded-full hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors relative"
            title={`Volume: ${Math.round(volume * 100)}% (Click to adjust)`}
          >
            {isMuted || volume === 0 ? "🔇" : volume < 0.3 ? "🔈" : "🔊"}
            <span
              className="absolute -top-1 -right-1 text-[8px] font-mono px-1 rounded-full font-bold"
              style={{
                backgroundColor: accentColor,
                color: "#000",
              }}
            >
              {Math.round(volume * 100)}%
            </span>
          </button>

          {/* VOLUME SLIDER POPOVER */}
          {showVolumeSlider && (
            <div className="absolute right-0 top-10 z-50 p-4 rounded-2xl bg-[#090c14] border border-white/20 shadow-2xl backdrop-blur-2xl w-60 space-y-3 animate-fade-in font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-syncopate font-bold text-[10px] text-white">AUDIO SETTINGS</span>
                <span className="text-[10px] font-bold" style={{ color: accentColor }}>
                  {Math.round(volume * 100)}% VOL
                </span>
              </div>

              {/* SLIDER */}
              <div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    if (val > 0) setIsMuted(false);
                  }}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* QUICK VOLUME PRESETS */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={() => {
                    setVolume(0.15);
                    setIsMuted(false);
                  }}
                  className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] text-slate-300 font-bold border border-white/10"
                >
                  15% (DEF)
                </button>
                <button
                  onClick={() => {
                    setVolume(0.5);
                    setIsMuted(false);
                  }}
                  className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] text-slate-300 font-bold border border-white/10"
                >
                  50%
                </button>
                <button
                  onClick={() => {
                    setVolume(1.0);
                    setIsMuted(false);
                  }}
                  className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] text-slate-300 font-bold border border-white/10"
                >
                  100%
                </button>
                <button
                  onClick={() => setIsMuted((prev) => !prev)}
                  className={`px-2 py-1 rounded text-[9px] font-bold border ${
                    isMuted ? "bg-rose-950 text-rose-300 border-rose-500/40" : "bg-white/5 text-slate-400 border-white/10"
                  }`}
                >
                  {isMuted ? "MUTED" : "MUTE"}
                </button>
              </div>

              {/* AUDIO ENGINE MODE TOGGLE */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">ENGINE:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setAudioMode("TRACK");
                      stopProceduralSynth();
                      if (isPlaying && audioRef.current) audioRef.current.play().catch(() => {});
                    }}
                    className={`px-2 py-0.5 rounded ${
                      audioMode === "TRACK" ? "bg-white/20 text-white font-bold" : "text-slate-500 hover:text-white"
                    }`}
                  >
                    TRACKS
                  </button>
                  <button
                    onClick={() => {
                      if (audioRef.current) audioRef.current.pause();
                      startProceduralSynth();
                    }}
                    className={`px-2 py-0.5 rounded ${
                      audioMode === "SYNTH" ? "bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40" : "text-slate-500 hover:text-white"
                    }`}
                  >
                    SYNTH BEATS
                  </button>
                </div>
              </div>

              {/* LOOP TOGGLE */}
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>LOOP PLAYBACK:</span>
                <button
                  onClick={() => setIsLooping((prev) => !prev)}
                  className={`px-2 py-0.5 rounded font-bold ${
                    isLooping ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40" : "bg-white/5 text-slate-500"
                  }`}
                >
                  {isLooping ? "ENABLED" : "OFF"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

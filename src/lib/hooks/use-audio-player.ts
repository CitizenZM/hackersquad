"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  isLoaded: boolean;
  hasEnded: boolean;
}

export function useAudioPlayer(audioUrl: string | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    progress: 0,
    isLoaded: false,
    hasEnded: false,
  });

  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setState((s) => ({ ...s, duration: audio.duration, isLoaded: true }));
    });

    audio.addEventListener("timeupdate", () => {
      const progress = audio.duration > 0 ? audio.currentTime / audio.duration : 0;
      setState((s) => ({
        ...s,
        currentTime: audio.currentTime,
        progress,
      }));
    });

    audio.addEventListener("ended", () => {
      setState((s) => ({ ...s, isPlaying: false, hasEnded: true }));
    });

    audio.addEventListener("pause", () => {
      setState((s) => ({ ...s, isPlaying: false }));
    });

    audio.addEventListener("play", () => {
      setState((s) => ({ ...s, isPlaying: true, hasEnded: false }));
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl]);

  const play = useCallback(() => {
    audioRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (audioRef.current?.paused) {
      audioRef.current?.play();
    } else {
      audioRef.current?.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const seekToPercent = useCallback((pct: number) => {
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = pct * audioRef.current.duration;
    }
  }, []);

  const restart = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  }, []);

  return {
    ...state,
    play,
    pause,
    togglePlay,
    seek,
    seekToPercent,
    restart,
  };
}

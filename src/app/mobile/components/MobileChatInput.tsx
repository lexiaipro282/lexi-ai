"use client";

import React, { useRef, useState, useEffect, FormEvent } from "react";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
}

interface WindowWithAPIs {
  webkitSpeechRecognition?: new () => SpeechRecognition;
  SpeechRecognition?: new () => SpeechRecognition;
  webkitAudioContext?: typeof AudioContext;
  AudioContext?: typeof AudioContext;
}

declare const window: WindowWithAPIs;

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface MobileChatInputProps {
  onSubmit: (message: string, model: string) => Promise<void>;
  isLoading: boolean;
  onModelChange: (model: string) => void;
}

export function MobileChatInput({ onSubmit, isLoading, onModelChange }: MobileChatInputProps) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const pannerRef = useRef<PannerNode | null>(null);

  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedModel, setSelectedModel] = useState("AUTO");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.3);

  const models = ["AUTO", "LEXI AI PRO", "LEXI ADVANCED", "LEXI VISION"];

  // Sound effect functions
  const playSwitchSound = async () => {
    try {
      const audio = new Audio("/assets/audio/lexiclick.mp3");
      audio.volume = 0.3;
      await audio.play();
    } catch (error: unknown) {
      console.error("Error playing switch sound:", error);
    }
  };

  const playSendSound = async () => {
    try {
      const audio = new Audio("/assets/audio/send.mp3");
      audio.volume = 0.4;
      await audio.play();
    } catch (error: unknown) {
      console.error("Error playing send sound:", error);
    }
  };

  const playMicOnSound = async () => {
    try {
      const audio = new Audio("/assets/audio/micon.mp3");
      audio.volume = 0.3;
      await audio.play();
    } catch (error: unknown) {
      console.error("Error playing mic on sound:", error);
    }
  };

  const playMicOffSound = async () => {
    try {
      const audio = new Audio("/assets/audio/micoff.mp3");
      audio.volume = 0.3;
      await audio.play();
    } catch (error: unknown) {
      console.error("Error playing mic off sound:", error);
    }
  };

  const playPlaySound = async () => {
    try {
      const audio = new Audio("/assets/audio/play.mp3");
      audio.volume = 0.3;
      await audio.play();
    } catch (error: unknown) {
      console.error("Error playing play sound:", error);
    }
  };

  const playPauseSound = async () => {
    try {
      const audio = new Audio("/assets/audio/pause.mp3");
      audio.volume = 0.3;
      await audio.play();
    } catch (error: unknown) {
      console.error("Error playing pause sound:", error);
    }
  };

  // Initialize Web Audio API
  const initializeAudio = () => {
    if (audioContextRef.current) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext as typeof AudioContext)();
    audioContextRef.current = audioContext;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = audioVolume;
    gainNode.connect(audioContext.destination);
    gainNodeRef.current = gainNode;

    const panner = audioContext.createPanner();
    panner.connect(gainNode);
    pannerRef.current = panner;
  };

  const handleBackgroundAudioToggle = async () => {
    if (!backgroundAudioRef.current) {
      backgroundAudioRef.current = new Audio("/assets/audio/ambience.mp3");
      backgroundAudioRef.current.loop = true;
    }

    if (isPlaying) {
      setIsPlaying(false);
      await playPauseSound();

      if (backgroundAudioRef.current.paused) return;
      const audio = backgroundAudioRef.current;
      const startVolume = audio.volume;
      const steps = 15;
      const duration = 500;
      const stepDuration = duration / steps;

      for (let i = 0; i < steps; i++) {
        await new Promise((resolve) => setTimeout(resolve, stepDuration));
        audio.volume = startVolume * (1 - (i + 1) / steps);
      }
      audio.pause();
      audio.volume = startVolume;
    } else {
      setIsPlaying(true);
      await playPlaySound();

      initializeAudio();
      if (!backgroundAudioRef.current) return;

      const audio = backgroundAudioRef.current;
      if (audio.paused) {
        audio.currentTime = 0;
        await audio.play();
      }

      const targetVolume = 0.2;
      const startVolume = 0;
      const steps = 30;
      const duration = 3000;
      const stepDuration = duration / steps;

      audio.volume = 0;
      for (let i = 0; i < steps; i++) {
        await new Promise((resolve) => setTimeout(resolve, stepDuration));
        audio.volume = startVolume + (targetVolume * (i + 1)) / steps;
      }
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      playMicOnSound();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setQuery((prev) => prev + transcript);
        } else {
          interimTranscript += transcript;
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      playMicOffSound();
    };

    recognitionRef.current = recognition;
  }, []);

  const handleVoiceClick = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
    }
  };

  const handleModelSelect = (model: string) => {
    playSwitchSound();
    setSelectedModel(model);
    onModelChange(model);
    setDropdownOpen(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading || isProcessing) return;

    setIsProcessing(true);
    try {
      playSendSound();
      await onSubmit(query, selectedModel);
      setQuery("");
    } catch (error: unknown) {
      console.error("Error submitting message:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getModelIcon = (model: string) => {
    switch (model) {
      case "AUTO":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5m-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11m3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
          </svg>
        );
      case "LEXI AI PRO":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
        );
      case "LEXI ADVANCED":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8m0-14a3 3 0 1 0 3 3 3 3 0 0 0-3-3m0 5a2 2 0 1 1 2-2 2 2 0 0 1-2 2m8-5h-5v2h5zm0 4h-5v2h5z"/>
          </svg>
        );
      case "LEXI VISION":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="1" />
            <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            <path d="M12 7a5 5 0 1 0 5 5 5 5 0 0 0-5-5m0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 border-t border-white/10 backdrop-blur-md p-3">
      <form onSubmit={handleSubmit} className="max-w-full">
        <div className="flex flex-col gap-2">
          {/* Model Selector (Visible on small devices) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                playSwitchSound();
                setDropdownOpen(!dropdownOpen);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-1.5">
                {getModelIcon(selectedModel)}
                {selectedModel}
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-black/95 border border-white/20 rounded-lg overflow-hidden z-50 max-h-48 overflow-y-auto">
                {models.map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => handleModelSelect(model)}
                    className="w-full px-2.5 py-2 text-xs text-white hover:bg-white/10 flex items-center gap-1.5 justify-start transition-colors border-b border-white/5 last:border-b-0"
                  >
                    {getModelIcon(model)}
                    {model}
                    {model === selectedModel && <span className="ml-auto text-blue-400">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="flex gap-2 items-end">
            {/* Audio control button (only for PRO, ADVANCED, and VISION) */}
            {(selectedModel === "LEXI AI PRO" || selectedModel === "LEXI ADVANCED" || selectedModel === "LEXI VISION") && (
              <button
                type="button"
                onClick={() => {
                  playSwitchSound();
                  handleBackgroundAudioToggle();
                }}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex-shrink-0 transition-colors"
                aria-label={isPlaying ? "Pause background audio" : "Play background audio"}
              >
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            )}

            {/* Input field */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={isListening ? "Listening..." : "Message..."}
                disabled={isLoading || isListening}
                className="w-full px-3 py-2 text-xs bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all disabled:opacity-50"
              />
            </div>

            {/* Send or Voice button */}
            {query.trim() ? (
              <button
                type="submit"
                disabled={isLoading}
                className={`flex items-center justify-center w-8 h-8 rounded-full bg-white text-black flex-shrink-0 transition-opacity ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                aria-label="Send message"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-[2]">
                    <path d="M6 11L12 5M12 5L18 11M12 5V19" stroke="currentColor" strokeLinecap="square" />
                  </svg>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  playSwitchSound();
                  handleVoiceClick();
                }}
                className={`relative w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 flex-shrink-0 ${
                  isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : isProcessing ? "bg-blue-500 hover:bg-blue-600" : "bg-white hover:bg-gray-100"
                }`}
                aria-label={isListening ? "Stop voice recording" : "Start voice recording"}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={isListening ? "text-white" : "text-black"}>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

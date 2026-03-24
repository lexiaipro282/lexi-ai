"use client";

import { useState, useRef, useEffect, FormEvent } from "react";

// Speech Recognition API types
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
    webkitAudioContext?: typeof AudioContext;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare const SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

export function ChatInput({
  onSubmit,
  isLoading,
  onModelChange,
}: {
  onSubmit: (query: string, model: string) => void;
  isLoading: boolean;
  onModelChange?: (model: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedModel, setSelectedModel] = useState("AUTO");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const pannerRef = useRef<PannerNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const switchSoundRef = useRef<HTMLAudioElement | null>(null);
  const typeAudioRef = useRef<HTMLAudioElement | null>(null);
  const spaceAudioRef = useRef<HTMLAudioElement | null>(null);

  const models = ["AUTO", "LEXI AI PRO", "LEXI ADVANCED", "LEXI VISION"];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
          setDropdownOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognitionConstructor = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognitionConstructor();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setIsProcessing(false);
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        setIsProcessing(true);

        setTimeout(() => {
          setIsProcessing(false);
        }, 1000);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const handleVoiceClick = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      playMicOffSound();
    } else {
      recognitionRef.current.start();
      playMicOnSound();
    }
  };

  // Play switch sound effect
  const playSwitchSound = () => {
    try {
      const audio = new Audio("/assets/audio/lexiclick.mp3");
      audio.volume = 0.6;
      audio.play().catch((error) => {
        console.log("Click sound play error:", error);
      });
    } catch (error) {
      console.log("Switch sound unavailable:", error);
    }
  };

  // Play typing sound effect
  const playTypeSound = () => {
    try {
      const audio = new Audio("/assets/audio/chat.mp3");
      audio.volume = 0.4;
      audio.currentTime = 0;
      audio.play().catch((error) => {
        console.log("Type sound play error:", error);
      });
    } catch (error) {
      console.log("Type sound unavailable:", error);
    }
  };

  // Play space sound effect
  const playSpaceSound = () => {
    try {
      const audio = new Audio("/assets/audio/space.mp3");
      audio.volume = 0.5;
      audio.play().catch((error) => {
        console.log("Space sound play error:", error);
      });
    } catch (error) {
      console.log("Space sound unavailable:", error);
    }
  };

  // Play send sound effect
  const playSendSound = () => {
    try {
      const audio = new Audio("/assets/audio/send.mp3");
      audio.volume = 0.6;
      audio.play().catch((error) => {
        console.log("Send sound play error:", error);
      });
    } catch (error) {
      console.log("Send sound unavailable:", error);
    }
  };

  // Play play button sound effect
  const playPlaySound = () => {
    try {
      const audio = new Audio("/assets/audio/play.mp3");
      audio.volume = 0.6;
      audio.play().catch((error) => {
        console.log("Play sound play error:", error);
      });
    } catch (error) {
      console.log("Play sound unavailable:", error);
    }
  };

  // Play pause button sound effect
  const playPauseSound = () => {
    try {
      const audio = new Audio("/assets/audio/pause.mp3");
      audio.volume = 0.6;
      audio.play().catch((error) => {
        console.log("Pause sound play error:", error);
      });
    } catch (error) {
      console.log("Pause sound unavailable:", error);
    }
  };

  // Play microphone on sound effect
  const playMicOnSound = () => {
    try {
      const audio = new Audio("/assets/audio/micon.mp3");
      audio.volume = 0.6;
      audio.play().catch((error) => {
        console.log("Mic on sound play error:", error);
      });
    } catch (error) {
      console.log("Mic on sound unavailable:", error);
    }
  };

  // Play microphone off sound effect
  const playMicOffSound = () => {
    try {
      const audio = new Audio("/assets/audio/micoff.mp3");
      audio.volume = 0.6;
      audio.play().catch((error) => {
        console.log("Mic off sound play error:", error);
      });
    } catch (error) {
      console.log("Mic off sound unavailable:", error);
    }
  };

  // Play backspace sound effect
  const playBackspaceSound = () => {
    try {
      const audio = new Audio("/assets/audio/backspace.mp3");
      audio.volume = 0.6;
      audio.play().catch((error) => {
        console.log("Backspace sound play error:", error);
      });
    } catch (error) {
      console.log("Backspace sound unavailable:", error);
    }
  };

  // Initialize audio for background ambience
  const initializeAudio = async () => {
    try {
      if (!backgroundAudioRef.current) {
        const audio = new Audio();
        const audioUrl = selectedModel === "LEXI VISION" 
          ? "/assets/audio/ambience2.mp3"
          : "/assets/audio/ambience.mp3";
        audio.src = audioUrl;
        audio.loop = true;
        audio.crossOrigin = "anonymous";
        backgroundAudioRef.current = audio;
      }

      // Set up Web Audio context for volume and panning control
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
      }

      const ctx = audioContextRef.current;
      
      // Only create nodes if they haven't been created yet
      if (!gainRef.current) {
        gainRef.current = ctx.createGain();
        gainRef.current.gain.value = 0; // Start at 0 for fade-in
      }

      if (!pannerRef.current) {
        pannerRef.current = ctx.createPanner();
        pannerRef.current.panningModel = "HRTF";
        pannerRef.current.distanceModel = "inverse";
        pannerRef.current.refDistance = 1;
        pannerRef.current.maxDistance = 10000;
        pannerRef.current.rolloffFactor = 1;
        pannerRef.current.setPosition(-5, 0, -5);
        
        // Connect the audio element through the panner and gain nodes
        try {
          const source = ctx.createMediaElementSource(backgroundAudioRef.current!);
          source.connect(pannerRef.current);
          pannerRef.current.connect(gainRef.current);
          gainRef.current.connect(ctx.destination);
        } catch (err) {
          console.warn('Could not connect to Web Audio API, using direct audio playback:', err);
          // Fallback: just use direct audio without Web Audio processing
        }
      }

      return true;
    } catch (error) {
      console.error('Audio initialization error:', error);
      return false;
    }
  };

  // Handle background audio play/pause
  const handleBackgroundAudioToggle = async () => {
    try {
      if (!isPlaying) {
        const success = await initializeAudio();
        if (!success) return;

        const audio = backgroundAudioRef.current;
        if (audio) {
          audio.currentTime = 0;
          audio.play();
          playPlaySound();
          setIsPlaying(true);
          setAudioVolume(0);

          // Fade in over 3 seconds
          if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
          
          let currentVolume = 0;
          const targetVolume = 0.3;
          const duration = 3000; // 3 seconds
          const steps = 30;
          const stepDuration = duration / steps;
          const volumeIncrement = targetVolume / steps;

          fadeIntervalRef.current = setInterval(() => {
            if (currentVolume < targetVolume) {
              currentVolume += volumeIncrement;
              const newVolume = Math.min(currentVolume, targetVolume);
              
              // Update Web Audio gain if available
              if (gainRef.current) {
                gainRef.current.gain.value = newVolume;
              }
              // Update HTML5 audio volume as fallback
              if (audio) {
                audio.volume = newVolume;
              }
              setAudioVolume(newVolume);
            } else {
              if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            }
          }, stepDuration);
        }
      } else {
        // Fade out
        playPauseSound();
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        
        let currentVolume = audioVolume;
        const steps = 15;
        const stepDuration = 500 / steps;
        const volumeDecrement = currentVolume / steps;

        fadeIntervalRef.current = setInterval(() => {
          if (currentVolume > 0) {
            currentVolume -= volumeDecrement;
            const newVolume = Math.max(currentVolume, 0);
            
            // Update Web Audio gain if available
            if (gainRef.current) {
              gainRef.current.gain.value = newVolume;
            }
            // Update HTML5 audio volume as fallback
            const audio = backgroundAudioRef.current;
            if (audio) {
              audio.volume = newVolume;
            }
            setAudioVolume(newVolume);
          } else {
            if (gainRef.current) gainRef.current.gain.value = 0;
            const audio = backgroundAudioRef.current;
            if (audio) {
              audio.volume = 0;
              audio.pause();
            }
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
          }
        }, stepDuration);

        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Audio toggle error:', error);
    }
  };

  // Update audio when model changes
  useEffect(() => {
    if (isPlaying) {
      // Stop current audio
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
      }
      setIsPlaying(false);
      setAudioVolume(0);

      // Reset audio reference to force reload with new file
      backgroundAudioRef.current = null;
    }
  }, [selectedModel]);

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      playSendSound();
      onSubmit(query, selectedModel);
      setQuery("");
    }
  };

  return (
    <div className="w-full max-w-[720px] mx-auto">
      <form onSubmit={handleFormSubmit}>
        <div
          className={`relative rounded-full bg-[#0d0d0d] border transition-all duration-200 ${
            isFocused ? "border-white shadow-lg shadow-black/20" : "border-white/60"
          }`}
          style={{ overflow: "visible" }}
        >
          <div className="flex items-center px-4 py-2">
            {/* Attach button */}
            <button type="button" onClick={playSwitchSound} className="p-2.5 rounded-full hover:bg-white/5 transition-colors" aria-label="Attach file">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            {/* Input field */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.code === "Space") {
                  playSpaceSound();
                } else if (e.code === "Backspace") {
                  playBackspaceSound();
                } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                  playTypeSound();
                }
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="EXPLORE LEXI AI®"
              className="flex-1 bg-transparent px-3 py-3 text-white placeholder-gray-500 focus:outline-none text-[15px]"
            />

            {/* Right controls */}
            <div className="flex items-center gap-1">
              {/* Model selector */}
              <div ref={dropdownRef} className="relative">
                <button
                  ref={buttonRef}
                  type="button"
                  onClick={() => {
                    playSwitchSound();
                    setDropdownOpen(!dropdownOpen);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-white/5 transition-colors"
                >
                  {/* Model Icons */}
                  {selectedModel === "AUTO" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
                  {selectedModel === "LEXI AI PRO" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="M12 2l5 8h7l-6 4 2 8-7-5-7 5 2-8-6-4h7l5-8z" /></svg>}
                  {selectedModel === "LEXI ADVANCED" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 15h6" /></svg>}
                  {selectedModel === "LEXI VISION" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
                  
                  <span className="text-sm font-medium text-white">{selectedModel}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    className="absolute z-[9999] top-full right-0 mt-2 w-80 bg-[#0d0d0d] border border-white/60 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                    style={{
                      boxShadow: "0 25px 80px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 255, 255, 0.05) inset",
                      backgroundColor: "rgba(15, 15, 15, 0.95)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <div className="py-1">
                      {models.map((model, index) => (
                        <button
                          key={model}
                          type="button"
                          onClick={() => {
                            playSwitchSound();
                            setSelectedModel(model);
                            setDropdownOpen(false);
                            if (onModelChange) onModelChange(model);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-all duration-150 flex items-center gap-2.5 ${
                            selectedModel === model ? "bg-white/10 text-white font-medium" : "text-gray-300 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {model === "AUTO" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
                          {model === "LEXI AI PRO" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="M12 2l5 8h7l-6 4 2 8-7-5-7 5 2-8-6-4h7l5-8z" /></svg>}
                          {model === "LEXI ADVANCED" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 15h6" /></svg>}
                          {model === "LEXI VISION" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
                          <span className="flex-1">{model}</span>
                          {selectedModel === model && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white"><polyline points="20 6 9 17 4 12" /></svg>}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-white/20 mx-4 my-2"></div>
                    <div className="px-4 pb-3">
                      <div className="flex gap-2">
                        <a href="#" className="flex-1 px-4 py-2 text-center text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">ACCESS PORTAL</a>
                        <a href="#" className="flex-1 px-4 py-2 text-center text-sm bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium">GET STARTED</a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Microphone button */}
              <button 
                type="button" 
                onClick={() => {
                  playSwitchSound();
                  handleVoiceClick();
                }}
                className={`p-2.5 rounded-full transition-colors ${isListening ? 'bg-red-500/20 hover:bg-red-500/30' : 'hover:bg-white/5'}`} 
                aria-label="Voice input"
              >
                {isListening ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-red-500 animate-pulse">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" />
                    <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                )}
              </button>

              {/* Background audio button - only for LEXI AI PRO and LEXI VISION */}
              {(selectedModel === "LEXI AI PRO" || selectedModel === "LEXI VISION") && (
                <button
                  type="button"
                  onClick={() => {
                    playSwitchSound();
                    handleBackgroundAudioToggle();
                  }}
                  className={`p-2.5 rounded-full transition-colors ${
                    isPlaying 
                      ? "bg-white/10 hover:bg-white/15" 
                      : "hover:bg-white/5"
                  }`}
                  aria-label={isPlaying ? "Stop background music" : "Play background music"}
                >
                  {isPlaying ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              )}

              {/* Send/Voice button */}
              {query.trim() ? (
                <button type="submit" disabled={isLoading} className={`group flex flex-col justify-center rounded-full focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50 transition-opacity ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`} aria-label="Send message">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-black ring-1 ring-transparent">
                    {isLoading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-[2]"><path d="M6 11L12 5M12 5L18 11M12 5V19" stroke="currentColor" strokeLinecap="square" /></svg>}
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    playSwitchSound();
                    handleVoiceClick();
                  }}
                  className={`relative h-10 w-10 flex items-center justify-center gap-0.5 rounded-full transition-all duration-200 ${
                    isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : isProcessing ? "bg-blue-500 hover:bg-blue-600" : "bg-white hover:bg-gray-100"
                  } group`}
                  aria-label={isListening ? "Stop voice recording" : "Start voice recording"}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    [0.4, 0.8, 1.2, 0.7, 1.0, 0.4].map((height, i) => (
                      <div
                        key={i}
                        className={`w-0.5 rounded-full transition-all duration-200 ${isListening ? "bg-white animate-pulse" : "bg-black group-hover:animate-pulse"}`}
                        style={{ height: `${height}rem`, animationDelay: isListening ? `${i * 0.1}s` : "0s" }}
                      />
                    ))
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Hint */}
      <div className="flex justify-center mt-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 border border-white/60 rounded-full px-3 py-1.5 hover:border-white transition-colors cursor-pointer group">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#0d0d0d]">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span className="font-bold text-white uppercase">• HOLD CTRL+D TO DICTATE</span>
        </div>
      </div>
    </div>
  );
}
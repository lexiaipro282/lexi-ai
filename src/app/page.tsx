"use client";

import { useEffect, useRef, useState } from "react";
import { InteractiveBackground } from "@/components/Interactivebg";
import { Header } from "@/components/Header";
import { LexiLogo } from "@/components/LexiLogo";
import { ChatInput } from "@/components/ChatInput";
import { Chat } from "@/components/Chat";
import { useLexiLearning } from "@/hooks/useLexiLearning";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("AUTO");
  const [introVisible, setIntroVisible] = useState(true);
  const [splashExiting, setSplashExiting] = useState(false);
  const introAudioRef = useRef<HTMLAudioElement | null>(null);

  const completeIntro = () => {
    setIntroVisible(false);
    setSplashExiting(false);
  };

  const handleStart = () => {
    if (introAudioRef.current) {
      introAudioRef.current.currentTime = 0;
      const playPromise = introAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn("Intro audio play failed:", error);
        });
      }
    }

    setSplashExiting(true);

    window.setTimeout(() => {
      completeIntro();
    }, 850);
  };

  useEffect(() => {
    if (!introVisible) return;
    const audio = introAudioRef.current;
    if (!audio) return;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn("Auto-play introduction audio was blocked:", error);
      });
    }
  }, [introVisible]);

  // Initialize learning system
  const { userProfile, updateProfileFromMessage } = useLexiLearning("desktop-user");

  const handleSubmit = async (query: string, model: string) => {
    setSelectedModel(model);
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    // Update user profile with this message and full history
    updateProfileFromMessage(query, newMessages);
    
    setIsLoading(true);

    try {
      const response = await fetch("/api/lexi-ai-pro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: query,
          model: model,
          conversationHistory: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userProfile: userProfile || undefined, // Send user profile for learning
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("lexi-ai-pro error", response.status, errorText);
        return; // Exit gracefully without throwing
      }

      const data = await response.json();

      if (!data || typeof data.response !== "string" || data.response.trim().length === 0) {
        console.warn("lexi-ai-pro returned no response", data);
        return; // Exit gracefully without throwing
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  if (introVisible) {
    return (
      <>
        <audio
          ref={introAudioRef}
          src="/assets/audio/introduction.mp3"
          preload="auto"
          className="hidden"
          onEnded={() => console.log("Intro audio finished")}
        />

        <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
          <video
            className="absolute inset-0 w-full h-full object-cover opacity-55"
            autoPlay
            loop
            muted
            style={{ border: "none", pointerEvents: "none" }}
          >
            <source src="/assets/bg/overlay.mp4" type="video/mp4" />
          </video>

          <div className="absolute inset-0 bg-[#050505] bg-opacity-90" />

          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(100)].map((_, i) => (
              <span
                key={`snow-${i}`}
                className="snowflake"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${6 + Math.random() * 4}s`,
                  opacity: 0.2 + Math.random() * 0.8,
                  transform: `translateY(-10vh)`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <div
            className={`mb-10 ${splashExiting ? "animate-logo-zoom-out" : "animate-pulse"} duration-1000`}
          >
            <LexiLogo />
          </div>
          <h1 className="mb-4 text-3xl font-bold sm:text-4xl">WELCOME TO LEXI AI®</h1>
          <p className="mb-8 max-w-xl text-sm text-gray-300 sm:text-base">
             THE MOST POWERFUL AI RESEARCH & DEVELOPMENT PLATFORM
          </p>
          <button
            className="rounded-full bg-white px-8 py-3 font-semibold text-black shadow-lg transition hover:bg-gray-200"
            onClick={handleStart}
          >
            Get Started
          </button>

          {splashExiting && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(30)].map((_, i) => {
                const dx = (Math.random() - 0.5) * 120;
                const dy = (Math.random() - 0.5) * 120;
                return (
                  <span
                    key={`desktop-dot-${i}`}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 0.25}s`,
                      width: `${3 + Math.random() * 3}px`,
                      height: `${3 + Math.random() * 3}px`,
                      '--x': `${dx}px`,
                      '--y': `${dy}px`,
                    } as React.CSSProperties}
                    className="absolute rounded-full bg-white opacity-90 animate-particle-burst"
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <audio
        ref={introAudioRef}
        src="/assets/audio/introduction.mp3"
        preload="auto"
        className="hidden"
        onEnded={() => console.log("Intro audio finished")}
      />

      <div className="relative min-h-screen overflow-hidden bg-[#050505]">
        {/* Video Background - Looping */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-55"
        autoPlay
        loop
        muted
        style={{ border: "none", pointerEvents: "none" }}
      >
        <source src="/assets/bg/overlay.mp4" type="video/mp4" />
      </video>

      {/* Interactive gradient background - overlayed */}
      <InteractiveBackground theme={selectedModel === "LEXI VISION" ? "blue-phoenix" : "default"} />

      {/* Header navigation */}
      <Header />

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto -mt-16">
          {/* Logo - only show when no messages */}
          {messages.length === 0 && (
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <LexiLogo />
            </div>
          )}

          {/* Chat display */}
          {messages.length > 0 && (
            <div className="w-full mb-8 max-h-[50vh] overflow-y-auto">
              <Chat messages={messages} isLoading={isLoading} onRemoveMessage={handleRemoveMessage} />
            </div>
          )}

          {/* Chat input */}
          <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
            <ChatInput onSubmit={handleSubmit} isLoading={isLoading} onModelChange={setSelectedModel} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-4 md:bottom-6 inset-x-0 flex justify-center z-10">
        <p className="text-[11px] sm:text-xs text-gray-500">
          BY USING LEXI AI YOU AGREE TO OUR{" "}
          <a href="#" className="text-white hover:underline">
            TERMS
          </a>{" "}
          AND{" "}
          <a href="#" className="text-white hover:underline">
            PRIVACY POLICY
          </a>
          .
        </p>
      </footer>
    </div>
  </>
  );
}

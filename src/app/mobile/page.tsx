"use client";

import { useEffect, useRef, useState } from "react";
import { MobileInteractiveBackground } from "./components/MobileInteractivebg";
import { MobileHeader } from "./components/MobileHeader";
import { MobileLexiLogo } from "./components/MobileLexiLogo";
import { MobileChatInput } from "./components/MobileChatInput";
import { MobileChat } from "./components/MobileChat";
import { useLexiLearning } from "@/hooks/useLexiLearning";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function MobileHome() {
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
  const { userProfile, updateProfileFromMessage } = useLexiLearning("mobile-user");

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
      // Error message removed - no fallback shown to user
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
          <div className="absolute inset-0 bg-[#050505]" />

          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(70)].map((_, i) => (
              <span
                key={`snow-mobile-${i}`}
                className="snowflake"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${5 + Math.random() * 4}s`,
                  opacity: 0.2 + Math.random() * 0.8,
                  transform: `translateY(-10vh)`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center">
            <div
              className={`mb-8 ${
                splashExiting ? "animate-logo-zoom-out" : "animate-pulse"
              } duration-1000`}
            >
              <MobileLexiLogo />
            </div>
          <h1 className="mb-4 text-2xl font-bold">Welcome to Lexi AI (Mobile)</h1>
          <p className="mb-8 max-w-md text-sm text-gray-300">
            Tap get started to hear the introduction and enter the chat experience.
          </p>
          <button
            className="rounded-full bg-white px-6 py-3 font-semibold text-black shadow-lg transition hover:bg-gray-200"
            onClick={handleStart}
          >
            Get Started
          </button>

          {splashExiting && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(24)].map((_, i) => {
                const dx = (Math.random() - 0.5) * 110;
                const dy = (Math.random() - 0.5) * 110;
                return (
                  <span
                    key={`mobile-dot-${i}`}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 0.2}s`,
                      width: `${2 + Math.random() * 3}px`,
                      height: `${2 + Math.random() * 3}px`,
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
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      {/* Interactive gradient background */}
      <MobileInteractiveBackground theme={selectedModel === "LEXI VISION" ? "blue-phoenix" : "default"} />

      {/* Header navigation */}
      <MobileHeader />

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-3 pt-16">
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
          {/* Logo - only show when no messages */}
          {messages.length === 0 && (
            <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <MobileLexiLogo />
            </div>
          )}

          {/* Chat display */}
          {messages.length > 0 && (
            <div className="w-full mb-6 max-h-[60vh] overflow-y-auto">
              <MobileChat 
                messages={messages} 
                isLoading={isLoading} 
                onRemoveMessage={handleRemoveMessage} 
              />
            </div>
          )}

          {/* Chat input */}
          <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
            <MobileChatInput 
              onSubmit={handleSubmit} 
              isLoading={isLoading} 
              onModelChange={setSelectedModel} 
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-2 inset-x-0 flex justify-center z-10">
        <p className="text-[10px] text-gray-500 px-4 text-center">
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
  );
}

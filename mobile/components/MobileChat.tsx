"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatProps {
  messages: Message[];
  isLoading: boolean;
  onRemoveMessage?: (messageId: string) => void;
}

export function MobileChat({ messages, isLoading, onRemoveMessage }: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [vanishingMessages, setVanishingMessages] = useState<Set<string>>(new Set());

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Set up auto-vanish for messages after 2 minutes
  useEffect(() => {
    const timers: Array<NodeJS.Timeout> = [];

    messages.forEach((message) => {
      if (!vanishingMessages.has(message.id)) {
        const timer = setTimeout(() => {
          // Start vanishing animation
          setVanishingMessages((prev) => new Set(prev).add(message.id));

          // Remove message after animation completes
          setTimeout(() => {
            if (onRemoveMessage) {
              onRemoveMessage(message.id);
            }
          }, 800);
        }, 30 * 1000); // 30 seconds

        timers.push(timer);
      }
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [messages, vanishingMessages, onRemoveMessage]);

  return (
    <div className="w-full mb-4">
      <div className="space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            } animate-in fade-in slide-in-from-bottom-2 duration-300 ${
              vanishingMessages.has(message.id) ? "particle-vanish" : ""
            }`}
            style={
              vanishingMessages.has(message.id)
                ? {
                    "--tx": `${Math.random() * 200 - 100}px`,
                    "--ty": `${Math.random() * -200}px`,
                  } as React.CSSProperties
                : undefined
            }
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2.5 text-sm ${
                message.role === "user"
                  ? "bg-white text-black"
                  : "bg-white/10 text-white border border-white/20"
              }`}
            >
              <p className="break-words whitespace-pre-wrap">
                {message.content}
              </p>
              <p className="text-xs mt-1.5 opacity-60">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2.5">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

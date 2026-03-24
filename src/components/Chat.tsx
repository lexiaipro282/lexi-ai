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

export function Chat({ messages, isLoading, onRemoveMessage }: ChatProps) {
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

          // Remove message after animation completes (800ms)
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

  if (messages.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="w-full max-w-[720px] mx-auto mb-8">
      <div className="space-y-4">
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
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-white text-black"
                  : "bg-white/10 text-white border border-white/20"
              }`}
            >
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
              <p className="text-xs mt-2 opacity-60">
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
            <div className="bg-white/10 text-white border border-white/20 rounded-2xl px-4 py-3">
              <div className="flex gap-2 items-center">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

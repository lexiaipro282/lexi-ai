"use client";

import { useState } from "react";
import { MobileInteractiveBackground } from "./components/MobileInteractivebg";
import { MobileHeader } from "./components/MobileHeader";
import { MobileLexiLogo } from "./components/MobileLexiLogo";
import { MobileChatInput } from "./components/MobileChatInput";
import { MobileChat } from "./components/MobileChat";

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

  const handleSubmit = async (query: string, model: string) => {
    setSelectedModel(model);
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
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
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content || "No response",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, there was an error processing your request.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden flex flex-col">
      {/* Background */}
      <MobileInteractiveBackground />

      {/* Header */}
      <MobileHeader />

      {/* Content area */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden pt-16">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <MobileLexiLogo />
              <p className="text-center text-gray-400 text-sm px-4">
                Welcome to LEXI AI®. Start by typing your question or use voice input.
              </p>
            </div>
          )}
          {messages.length > 0 && (
            <MobileChat
              messages={messages}
              isLoading={isLoading}
              onRemoveMessage={handleRemoveMessage}
            />
          )}
        </div>

        {/* Input area */}
        <div className="relative z-20 px-4 pb-4 bg-gradient-to-t from-black via-black to-transparent pt-4">
          <MobileChatInput
            onSubmit={handleSubmit}
            isLoading={isLoading}
            onModelChange={setSelectedModel}
          />
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
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
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

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

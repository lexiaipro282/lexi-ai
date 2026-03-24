import { useState, useEffect, useCallback } from "react";
import {
  getUserProfile,
  saveUserProfile,
  analyzeUserInput,
  UserProfile,
  ConversationContext,
  prepareConversationContext,
} from "@/lib/userLearning";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function useLexiLearning(userId: string) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [conversationContext, setConversationContext] = useState<ConversationContext | null>(null);

  // Initialize user profile on mount
  useEffect(() => {
    const profile = getUserProfile(userId);
    setUserProfile(profile);
  }, [userId]);

  // Update profile when user sends a message
  const updateProfileFromMessage = useCallback(
    (message: string, messages: Message[]) => {
      if (!userProfile) return;

      const updatedProfile = {
        ...userProfile,
        ...analyzeUserInput(message, userProfile),
      };

      setUserProfile(updatedProfile);
      saveUserProfile(updatedProfile);

      // Update conversation context
      const context = prepareConversationContext(
        messages.map((m) => ({ role: m.role, content: m.content })),
        updatedProfile
      );
      setConversationContext(context);
    },
    [userProfile]
  );

  // Return the actual profile object, not a callback that might be stale
  return {
    userProfile, // Use this directly in components
    conversationContext,
    updateProfileFromMessage,
    getProfileForAPI: () => userProfile, // Latest profile reference
  };
}

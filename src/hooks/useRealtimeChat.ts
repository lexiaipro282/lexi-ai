"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { UserProfile } from "@/lib/userLearning";

interface RealtimeSession {
  sessionId: string;
  sessionIdActive: boolean;
  isListening: boolean;
  transcript: string;
}

interface UseLexiRealtimeOptions {
  userProfile?: UserProfile;
  voice?: string;
  instructions?: string;
  autoCleanup?: boolean; // Auto cleanup old sessions
}

/**
 * React hook for LEXI Realtime voice conversations
 * 
 * Usage:
 * const {
 *   sessionId,
 *   isConnected,
 *   transcript,
 *   error,
 *   startSession,
 *   sendText,
 *   sendAudio,
 *   stopSession,
 * } = useLexiRealtime({ userProfile });
 * 
 * await startSession();
 * sendText("Hello!");
 */
export function useLexiRealtime(options: UseLexiRealtimeOptions = {}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Start a new realtime session
   */
  const startSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/lexi-realtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfile: options.userProfile,
          voice: options.voice || "Eve",
          instructions: options.instructions,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start realtime session");
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      setIsConnected(true);

      // Start polling for status updates
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      pollIntervalRef.current = setInterval(() => {
        updateSessionStatus(data.sessionId);
      }, 500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("[Realtime Hook] Error starting session:", err);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  /**
   * Update session status from server
   */
  const updateSessionStatus = useCallback(async (id: string) => {
    try {
      const response = await fetch(
        `/api/lexi-realtime?sessionId=${id}&action=status`
      );
      if (!response.ok) return;

      const data = await response.json();
      setIsListening(data.isListening);
      if (data.transcript) {
        setTranscript(data.transcript);
      }
    } catch (err) {
      // Silently fail on polling errors
    }
  }, []);

  /**
   * Send text message to LEXI
   */
  const sendText = useCallback(
    async (text: string) => {
      if (!sessionId) {
        setError("No active session");
        return;
      }

      try {
        const response = await fetch("/api/lexi-realtime", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send-text",
            sessionId,
            data: { text },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send text");
        }

        console.log("[Realtime Hook] Text sent:", text);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("[Realtime Hook] Error sending text:", err);
      }
    },
    [sessionId]
  );

  /**
   * Send audio buffer to LEXI
   */
  const sendAudio = useCallback(
    async (audioBuffer: ArrayBuffer | Buffer) => {
      if (!sessionId) {
        setError("No active session");
        return;
      }

      try {
        // Convert to base64 if needed
        let base64Audio: string;
        if (typeof Buffer !== "undefined" && audioBuffer instanceof Buffer) {
          base64Audio = audioBuffer.toString("base64");
        } else {
          // Browser ArrayBuffer
          base64Audio = btoa(
            String.fromCharCode.apply(null, Array.from(new Uint8Array(audioBuffer)))
          );
        }

        const response = await fetch("/api/lexi-realtime", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send-audio",
            sessionId,
            data: { audio: base64Audio },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send audio");
        }

        console.log("[Realtime Hook] Audio sent");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("[Realtime Hook] Error sending audio:", err);
      }
    },
    [sessionId]
  );

  /**
   * Stop the current session
   */
  const stopSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/lexi-realtime?sessionId=${sessionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[Realtime Hook] Session closed, final transcript:", data.transcript);
      }
    } catch (err) {
      console.error("[Realtime Hook] Error stopping session:", err);
    } finally {
      setSessionId(null);
      setIsConnected(false);
      setIsListening(false);
      setTranscript("");

      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
  }, [sessionId]);

  /**
   * Cancel the current response
   */
  const cancelResponse = useCallback(async () => {
    if (!sessionId) {
      setError("No active session");
      return;
    }

    try {
      const response = await fetch("/api/lexi-realtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel response");
      }

      console.log("[Realtime Hook] Response cancelled");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("[Realtime Hook] Error cancelling:", err);
    }
  }, [sessionId]);

  /**
   * Auto cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (options.autoCleanup && sessionId) {
        // Don't await - just fire and forget
        fetch(`/api/lexi-realtime?sessionId=${sessionId}`, {
          method: "DELETE",
        }).catch(console.error);
      }
    };
  }, [sessionId, options.autoCleanup]);

  return {
    // State
    sessionId,
    isConnected,
    isListening,
    isLoading,
    transcript,
    error,

    // Actions
    startSession,
    stopSession,
    sendText,
    sendAudio,
    cancelResponse,
  };
}

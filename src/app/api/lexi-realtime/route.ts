import { NextRequest, NextResponse } from "next/server";
import { LexiRealtimeManager } from "@/lib/lexiRealtime";
import { UserProfile } from "@/lib/userLearning";

interface RealtimeStartRequest {
  userProfile?: UserProfile;
  voice?: string;
  instructions?: string;
}

interface RealtimeAction {
  action: "start" | "stop" | "send-text" | "send-audio" | "cancel" | "status";
  sessionId?: string;
  data?: Record<string, unknown>;
}

// Global realtime manager instance
// In production, you'd want to use a proper session store (Redis, etc.)
const realtimeManagers = new Map<string, LexiRealtimeManager>();
const sessionTranscripts = new Map<string, string>();

/**
 * POST /api/lexi-realtime
 * 
 * Start a new realtime session
 * Body: { userProfile?, voice?, instructions? }
 * 
 * GET /api/lexi-realtime?sessionId=xyz&action=status
 * Get session status
 * 
 * POST /api/lexi-realtime
 * Body: { action: "send-text", sessionId: "xyz", data: { text: "Hello" } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RealtimeStartRequest | RealtimeAction;

    // Check if this is an action request or a start request
    if ("action" in body) {
      return handleRealtimeAction(body as RealtimeAction);
    }

    // Start a new realtime session
    const { userProfile, voice = "Eve", instructions } = body as RealtimeStartRequest;

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let transcripts = "";

    const manager = new LexiRealtimeManager({
      voice,
      instructions,
      onSessionCreated: (id) => {
        console.log(`[API] Realtime session created: ${id}`);
      },
      onTranscript: (text) => {
        transcripts += text + " ";
        sessionTranscripts.set(sessionId, transcripts);
        console.log(`[API] Transcript: ${text}`);
      },
      onDone: (usage) => {
        console.log(`[API] Session done, tokens: ${usage?.total_tokens}`);
      },
      onError: (error) => {
        console.error(`[API] Realtime error:`, error);
      },
    });

    // Connect to realtime API
    await manager.connect();
    realtimeManagers.set(sessionId, manager);
    sessionTranscripts.set(sessionId, "");

    return NextResponse.json({
      success: true,
      sessionId,
      message: "Realtime session started",
    });
  } catch (error) {
    console.error("[API] Realtime error:", error);
    return NextResponse.json(
      { error: "Failed to start realtime session", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/lexi-realtime
 * 
 * Query options:
 * - sessionId=xyz&action=status : Get session status
 * - sessionId=xyz&action=transcript : Get transcript
 * - action=cleanup : Clean up old sessions
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const sessionId = searchParams.get("sessionId");

  if (action === "cleanup") {
    // Clean up old sessions (older than 30 minutes)
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    let cleaned = 0;

    for (const [id, manager] of realtimeManagers.entries()) {
      const sessionTime = parseInt(id.split("_")[1]);
      if (now - sessionTime > maxAge) {
        manager.disconnect().catch(console.error);
        realtimeManagers.delete(id);
        sessionTranscripts.delete(id);
        cleaned++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleaned} old sessions`,
      activeSessions: realtimeManagers.size,
    });
  }

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId parameter required" },
      { status: 400 }
    );
  }

  if (action === "transcript") {
    const transcript = sessionTranscripts.get(sessionId) || "";
    return NextResponse.json({
      sessionId,
      transcript,
    });
  }

  if (action === "status") {
    const manager = realtimeManagers.get(sessionId);
    if (!manager) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const session = manager.getSession();
    return NextResponse.json({
      sessionId,
      isActive: session.isActive,
      isListening: session.isListening,
      transcript: sessionTranscripts.get(sessionId) || "",
    });
  }

  return NextResponse.json(
    { error: "Unknown action" },
    { status: 400 }
  );
}

/**
 * DELETE /api/lexi-realtime?sessionId=xyz
 * Stop a realtime session
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId parameter required" },
      { status: 400 }
    );
  }

  const manager = realtimeManagers.get(sessionId);
  if (!manager) {
    return NextResponse.json(
      { error: "Session not found" },
      { status: 404 }
    );
  }

  await manager.disconnect();
  realtimeManagers.delete(sessionId);
  const transcript = sessionTranscripts.get(sessionId);
  sessionTranscripts.delete(sessionId);

  return NextResponse.json({
    success: true,
    message: "Session closed",
    sessionId,
    transcript,
  });
}

/**
 * Handle realtime actions (send text, audio, cancel, etc.)
 */
async function handleRealtimeAction(request: RealtimeAction) {
  const { action, sessionId, data } = request;

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId required" },
      { status: 400 }
    );
  }

  const manager = realtimeManagers.get(sessionId);
  if (!manager) {
    return NextResponse.json(
      { error: "Session not found" },
      { status: 404 }
    );
  }

  try {
    switch (action) {
      case "send-text":
        if (!data?.text || typeof data.text !== "string") {
          return NextResponse.json(
            { error: "text required in data" },
            { status: 400 }
          );
        }
        manager.sendText(data.text);
        return NextResponse.json({ success: true, message: "Text sent" });

      case "send-audio":
        if (!data?.audio) {
          return NextResponse.json(
            { error: "audio required in data" },
            { status: 400 }
          );
        }
        // Expect base64 or Buffer
        const audioData = data.audio;
        const isBuffer = Buffer.isBuffer(audioData);
        const buffer = isBuffer
          ? (audioData as Buffer)
          : Buffer.from(String(audioData), "base64");
        manager.sendAudio(buffer);
        return NextResponse.json({ success: true, message: "Audio sent" });

      case "cancel":
        manager.cancel();
        return NextResponse.json({ success: true, message: "Response cancelled" });

      case "status":
        const session = manager.getSession();
        return NextResponse.json({
          sessionId,
          isActive: session.isActive,
          isListening: session.isListening,
          transcript: sessionTranscripts.get(sessionId) || "",
        });

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error(`[API] Error handling action ${action}:`, error);
    return NextResponse.json(
      { error: `Failed to ${action}`, details: String(error) },
      { status: 500 }
    );
  }
}

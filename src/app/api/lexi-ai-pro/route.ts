import { NextRequest, NextResponse } from "next/server";
import { queryLexiAPI } from "@/lib/lexiApi";
import { UserProfile } from "@/lib/userLearning";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface LexiRequest {
  message: string;
  model: string;
  conversationHistory: Message[];
  userProfile?: UserProfile;
}

async function queryLexiAI(
  text: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  userProfile?: UserProfile
) {
  // Use LEXI API for responses (powered by x.ai)
  return await queryLexiAPI(
    text,
    conversationHistory as Array<{ role: string; content: string }>,
    userProfile
  );
}

function formatPrompt(text: string, history: Message[], userProfile?: UserProfile): string {
  // Note: This function is superseded by queryLexiAPI which handles system prompts internally
  let prompt = `[CONVERSATION]\n`;

  // Add conversation history
  for (const msg of history.slice(-4)) {
    if (msg.role === "user") {
      prompt += `User: ${msg.content}\n`;
    } else {
      prompt += `LEXI: ${msg.content}\n`;
    }
  }

  // Add current message
  prompt += `User: ${text}\nLEXI:`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LexiRequest;
    const { message, model, conversationHistory = [], userProfile } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Invalid message" },
        { status: 400 }
      );
    }

    // Get AI response with user profile for learning
    const aiResponse = await queryLexiAI(message, conversationHistory, userProfile);

    return NextResponse.json({
      response: aiResponse,
      model: model || "AUTO",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

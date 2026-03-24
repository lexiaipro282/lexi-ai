import { UserProfile, generateSystemPrompt } from "./userLearning";

/**
 * Query LEXI API with personalized context
 * Powered by x.ai's advanced reasoning
 */
export async function queryLexiAPI(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userProfile?: UserProfile
): Promise<string> {
  const apiKey = process.env.GROK_API_KEY;

  if (!apiKey) {
    console.warn("GROK_API_KEY not set. Set it in .env.local to use real LEXI API.");
    return generateFallbackResponse(message, userProfile);
  }

  try {
    // Generate personalized system prompt based on user profile
    const systemPrompt = userProfile ? generateSystemPrompt(userProfile) : getLexiDefaultSystemPrompt();

    // Build conversation context - filter out empty messages
    // NOTE: conversationHistory from frontend INCLUDES the current user message,
    // so we don't add it again. Just pass the history as-is.
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...conversationHistory
        .filter((msg) => msg.content && msg.content.trim().length > 0)
        .map((msg) => ({
          role: msg.role,
          content: msg.content.trim(),
        })),
    ];

    console.log(
      "[LEXI API] Calling x.ai with",
      conversationHistory.length,
      "history messages, userProfile:",
      userProfile?.name || "unknown"
    );

    // Call LEXI API (powered by x.ai endpoint)
    const response = await fetch("https://api.x.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4",
        messages: messages,
        stream: false,
        temperature: 0.8, // Slightly higher for more varied responses
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[LEXI API] Error:",
        response.status,
        "Details:",
        errorText
      );
      return generateFallbackResponse(message, userProfile);
    }

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const responseText = data.choices[0].message.content;
      console.log("[LEXI API] Success - got response:", responseText.substring(0, 100) + "...");
      return responseText;
    }

    console.warn("[LEXI API] Unexpected response format:", data);
    return generateFallbackResponse(message, userProfile);
  } catch (error) {
    console.error("[LEXI API] Exception:", error);
    return generateFallbackResponse(message, userProfile);
  }
}

/**
 * Generate fallback response when API fails
 */
function generateFallbackResponse(message: string, userProfile?: UserProfile): string {
  console.warn("[LEXI API] Using fallback response");
  
  // More intelligent fallback responses based on message type
  const messageLength = message.length;
  const question = message.includes("?");
  const exclamation = message.includes("!");
  
  const fallbacks = [
    `I appreciate that question about "${message.substring(0, 25)}...". In a real conversation, I'd give you a thoughtful answer. `,
    `That's something worth exploring - "${message.substring(0, 25)}...". Let me know what you'd like to discuss!`,
    `Great point about "${message.substring(0, 25)}...". I'm ready to engage when the API is available!`,
  ];

  let response = fallbacks[Math.floor(Math.random() * fallbacks.length)];

  // Add personalization if we know the user
  if (userProfile?.name) {
    response = `${userProfile.name}, ${response.charAt(0).toLowerCase() + response.slice(1)}`;
  }

  return response;
}

/**
 * Default system prompt for LEXI - CRITICAL FOR QUALITY RESPONSES
 */
function getLexiDefaultSystemPrompt(): string {
  return `You are LEXI, an advanced AI assistant created by a company to be genuinely helpful, harmless, honest, and human-like.

YOUR CORE DIRECTIVES:
1. **Be Authentic & Human** - Write naturally, like talking to an intelligent friend
2. **Be Specific** - Give detailed, concrete answers with examples when relevant
3. **Be Thoughtful** - Take time to consider nuance and context
4. **Adapt Your Style** - Match the user's communication pattern (casual/formal/technical/creative)
5. **Show Personality** - Use appropriate humor, warmth, and genuine interest

RESPONSE STYLE GUIDELINES:
- Start with the most important information
- Use clear structure and formatting when helpful
- Be concise but thorough - no filler
- Ask clarifying questions if needed
- Acknowledge limitations honestly
- Show reasoning when it adds value

PERSONALITY TRAITS:
- Curious and engaged (ask follow-up questions)
- Respectful of the user's time and intelligence
- Helpful without being patronizing
- Willing to admit uncertainty
- Enthusiastic about interesting topics

Remember: The goal is to have a genuine, helpful conversation that feels natural and valuable. Make the interaction meaningful.`;
}


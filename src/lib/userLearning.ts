/**
 * LEXI AI Learning System
 * Tracks user preferences, communication style, and interaction history
 * Adapts personality and responses based on this data
 */

export interface UserProfile {
  userId: string;
  name?: string; // User's name when discovered
  communicationStyle: "technical" | "casual" | "formal" | "creative";
  detectedTopics: string[];
  emotionalContext: "neutral" | "excited" | "frustrated" | "curious" | "reflective";
  preferences: {
    responseLength: "brief" | "detailed" | "moderate";
    humor: boolean;
    useEmojis: boolean;
    formality: number; // 0-1, 0 = casual, 1 = formal
  };
  conversationCount: number;
  averageSentiment: number; // -1 to 1
  recentTopics: string[];
  lastInteractionTime: number;
  learningData: {
    positiveKeywords: string[];
    negativeKeywords: string[];
    preferredAnswerStyle: string; // "examples" | "explanations" | "brief"
  };
  // NEW: Deeper learning
  personalityTraits: string[]; // e.g., ["curious", "detail-oriented", "impatient"]
  memoryNotes: string[]; // Long-term memory of user preferences
  interests: string[]; // Things user cares about
  avoidedTopics: string[]; // Things user dislikes
  communicationPatterns: {
    frequentPhrases: string[];
    askingPattern: "question_heavy" | "statement_heavy" | "mixed";
    responseExpectation: "fast_answers" | "detailed_analysis" | "conversational";
  };
}

export interface ConversationContext {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  userProfile: UserProfile;
  sessionTopic?: string;
  emotionalTriggers?: string[];
}

/**
 * Initialize or retrieve user profile from localStorage
 */
export function getUserProfile(userId: string): UserProfile {
  if (typeof window === "undefined") {
    return getDefaultProfile(userId);
  }

  try {
    const stored = localStorage.getItem(`lexi_profile_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error retrieving profile:", error);
  }

  return getDefaultProfile(userId);
}

/**
 * Get default/new user profile
 */
function getDefaultProfile(userId: string): UserProfile {
  return {
    userId,
    name: undefined,
    communicationStyle: "casual",
    detectedTopics: [],
    emotionalContext: "neutral",
    preferences: {
      responseLength: "moderate",
      humor: true,
      useEmojis: false,
      formality: 0.3,
    },
    conversationCount: 0,
    averageSentiment: 0,
    recentTopics: [],
    lastInteractionTime: Date.now(),
    learningData: {
      positiveKeywords: [],
      negativeKeywords: [],
      preferredAnswerStyle: "explanations",
    },
    personalityTraits: [],
    memoryNotes: [],
    interests: [],
    avoidedTopics: [],
    communicationPatterns: {
      frequentPhrases: [],
      askingPattern: "mixed",
      responseExpectation: "conversational",
    },
  };
}

/**
 * Save user profile to localStorage
 */
export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(`lexi_profile_${profile.userId}`, JSON.stringify(profile));
  } catch (error) {
    console.error("Error saving profile:", error);
  }
}

/**
 * Analyze user input and update profile
 */
export function analyzeUserInput(
  message: string,
  profile: UserProfile
): Partial<UserProfile> {
  const lowerMessage = message.toLowerCase();
  const sentiment = analyzeSentiment(message);
  const topics = extractTopics(message);
  const communicationStyle = detectCommunicationStyle(message, profile);
  const detectedName = extractName(message, profile);
  const personalityTraits = detectPersonalityTraits(message, profile);

  // Update recent topics
  const newRecentTopics = [...new Set([...topics, ...profile.recentTopics])].slice(0, 10);

  // Update sentiment average
  const newAvgSentiment = (profile.averageSentiment * profile.conversationCount + sentiment) / (profile.conversationCount + 1);

  // Track keywords based on sentiment
  const keywords = extractKeywords(message);
  if (sentiment > 0.3) {
    profile.learningData.positiveKeywords = [...new Set([...profile.learningData.positiveKeywords, ...keywords])].slice(0, 20);
  } else if (sentiment < -0.3) {
    profile.learningData.negativeKeywords = [...new Set([...profile.learningData.negativeKeywords, ...keywords])].slice(0, 20);
  }

  // Add personality traits
  const newTraits = [...new Set([...profile.personalityTraits, ...personalityTraits])].slice(0, 15);

  // Add memory note if it's important
  const memoryNote = extractMemoryNote(message, profile);
  const newMemory = memoryNote ? [...profile.memoryNotes, memoryNote].slice(-10) : profile.memoryNotes;

  return {
    ...profile,
    name: detectedName || profile.name,
    recentTopics: newRecentTopics,
    detectedTopics: [...new Set([...profile.detectedTopics, ...topics])].slice(0, 15),
    emotionalContext: detectEmotionalContext(message, sentiment),
    conversationCount: profile.conversationCount + 1,
    averageSentiment: newAvgSentiment,
    communicationStyle,
    lastInteractionTime: Date.now(),
    learningData: profile.learningData,
    personalityTraits: newTraits,
    memoryNotes: newMemory,
  };
}

/**
 * Analyze sentiment of user message (-1 to 1)
 */
function analyzeSentiment(text: string): number {
  const posWords = [
    "great",
    "good",
    "excellent",
    "amazing",
    "love",
    "awesome",
    "perfect",
    "wonderful",
    "fantastic",
    "thanks",
    "thank",
    "appreciate",
    "happy",
    "joy",
    "excited",
  ];
  const negWords = [
    "bad",
    "terrible",
    "hate",
    "awful",
    "poor",
    "wrong",
    "broken",
    "sad",
    "angry",
    "frustrated",
    "frustrated",
    "annoyed",
    "useless",
    "stupid",
    "fail",
  ];

  const lower = text.toLowerCase();
  const posCount = posWords.filter((w) => lower.includes(w)).length;
  const negCount = negWords.filter((w) => lower.includes(w)).length;

  return (posCount - negCount) / Math.max(posCount + negCount, 1);
}

/**
 * Extract main topics from user message
 */
function extractTopics(text: string): string[] {
  const topicKeywords = {
    programming: [
      "code",
      "python",
      "javascript",
      "function",
      "variable",
      "bug",
      "debug",
      "api",
      "database",
      "sql",
    ],
    science: [
      "physics",
      "chemistry",
      "biology",
      "quantum",
      "atom",
      "molecule",
      "research",
      "experiment",
    ],
    business: [
      "market",
      "business",
      "sales",
      "revenue",
      "startups",
      "strategy",
      "analytics",
      "growth",
    ],
    creative: [
      "write",
      "story",
      "poem",
      "art",
      "music",
      "design",
      "creative",
      "paint",
      "sketch",
    ],
    technology: [
      "ai",
      "machine learning",
      "neural",
      "model",
      "algorithm",
      "tech",
      "app",
      "software",
    ],
  };

  const topics: string[] = [];
  const lower = text.toLowerCase();

  for (const [category, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      topics.push(category);
    }
  }

  return topics;
}

/**
 * Extract keywords from message
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 4 && !isCommonWord(word))
    .slice(0, 5);
}

/**
 * Check if word is common/stopword
 */
function isCommonWord(word: string): boolean {
  const stopwords = [
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "is",
    "are",
    "was",
    "be",
  ];
  return stopwords.includes(word);
}

/**
 * Detect communication style from user input
 */
function detectCommunicationStyle(text: string, profile: UserProfile): "technical" | "casual" | "formal" | "creative" {
  const lower = text.toLowerCase();

  // Technical indicators
  if (/code|function|variable|algorithm|debug|api|database|sql|python|javascript|typescript/.test(lower)) {
    return "technical";
  }

  // Formal indicators
  if (/please|kindly|respectfully|regarding|furthermore|nevertheless|consequently/.test(lower)) {
    return "formal";
  }

  // Creative indicators
  if (/imagine|create|write|story|dream|artistic|poetic|inspired/.test(lower)) {
    return "creative";
  }

  // Default to casual or return current style
  return profile.communicationStyle === "technical" || profile.communicationStyle === "formal"
    ? profile.communicationStyle
    : "casual";
}

/**
 * Detect emotional context
 */
function detectEmotionalContext(
  text: string,
  sentiment: number
): "neutral" | "excited" | "frustrated" | "curious" | "reflective" {
  const lower = text.toLowerCase();

  if (sentiment > 0.5) {
    return "excited";
  }

  if (sentiment < -0.3) {
    return "frustrated";
  }

  if (/\?/.test(text) && sentiment < 0.3) {
    return "curious";
  }

  if (/think|believe|consider|wonder|reflect|ponder|question/.test(lower)) {
    return "reflective";
  }

  return "neutral";
}

/**
 * Generate system prompt based on user profile
 */
export function generateSystemPrompt(profile: UserProfile, conversationContext?: string): string {
  const formality = profile.preferences.formality;
  const shouldIncludeHumor = profile.preferences.humor && profile.communicationStyle !== "formal";
  const responseLength = profile.preferences.responseLength;
  const style = profile.communicationStyle;

  let tone = "";
  if (formality > 0.7) {
    tone = "professional and respectful";
  } else if (formality < 0.3) {
    tone = "friendly and conversational";
  } else {
    tone = "balanced and helpful";
  }

  let lengthGuidance = "";
  if (responseLength === "brief") {
    lengthGuidance = "Keep responses concise and to the point (1-3 sentences maximum).";
  } else if (responseLength === "detailed") {
    lengthGuidance = "Provide comprehensive, detailed explanations with multiple examples and thorough analysis.";
  } else {
    lengthGuidance = "Aim for moderate-length responses with key details, context, and one or two examples when relevant.";
  }

  let styleGuidance = "";
  if (style === "technical") {
    styleGuidance = "Use technical terminology, provide code examples when relevant, explain concepts precisely with technical accuracy.";
  } else if (style === "creative") {
    styleGuidance = "Be imaginative, encourage creative thinking, use vivid language and metaphors. Think outside conventional boundaries.";
  } else if (style === "formal") {
    styleGuidance = "Maintain a professional tone with structured, well-organized responses. Use proper grammar and formal vocabulary.";
  } else {
    styleGuidance = "Use natural, everyday language with contractions and colloquial expressions. Talk like you're chatting with a friend.";
  }

  const humorGuidance = shouldIncludeHumor
    ? "Feel free to use appropriate humor, wit, and light-hearted remarks when they fit naturally and enhance the response."
    : "Keep the tone straightforward and serious. Avoid humor and jokes.";

  const emotionalGuidance =
    profile.emotionalContext === "frustrated"
      ? "Show empathy, validate their feelings, and provide supportive, calm solutions. Be encouraging."
      : profile.emotionalContext === "excited"
        ? "Match their enthusiasm and energy! Be upbeat and encouraging. Share in their excitement."
        : profile.emotionalContext === "curious"
          ? "Encourage their curiosity deeply. Provide thorough educational responses with interesting connections and insights."
          : "Maintain a neutral, helpful, balanced approach.";

  const interestsGuidance =
    profile.interests && profile.interests.length > 0
      ? `The user is interested in: ${profile.interests.slice(0, 3).join(", ")}. Draw connections to these areas when relevant and interesting.`
      : "";

  const nameGuidance = profile.name
    ? `The user's name is ${profile.name}. You may use it occasionally when it feels natural, but don't overuse it.`
    : "";

  const traitsGuidance =
    profile.personalityTraits && profile.personalityTraits.length > 0
      ? `User traits detected: ${profile.personalityTraits.slice(0, 3).join(", ")}. Adapt your communication to match these characteristics.`
      : "";

  const memoryGuidance =
    profile.memoryNotes && profile.memoryNotes.length > 0
      ? `You've learned about the user: ${profile.memoryNotes.slice(-2).join(" | ")} Reference this context when relevant.`
      : "";

  return `You are LEXI, an advanced, genuinely helpful AI assistant created to be human-like, authentic, and constantly learning.

CORE DIRECTIVES:
1. Be specific and substantive - give real answers with actual value
2. Be authentic - respond naturally, not like a template
3. Be engaged - show you understand the nuance of what they're asking
4. Be adaptive - tailor everything to this specific person and conversation
5. Be honest - admit uncertainty, don't make things up

TONE & STYLE:
- Be ${tone}
- ${styleGuidance}
- ${humorGuidance}
- ${emotionalGuidance}

RESPONSE STRUCTURE:
- ${lengthGuidance}
- Start with the most important information first
- Use clear formatting with line breaks when helpful
- Provide examples that match the user's context
- When asking questions, ask only when truly needed

CRITICAL RULES:
- Always be helpful, harmless, and honest
- Acknowledge what the user is actually asking
- Don't give generic or canned responses - be specific to THEM
- Use natural language, never sound robotic
- Show genuine understanding and engagement

USER PERSONALIZATION:
${nameGuidance}
${traitsGuidance}
${interestsGuidance}
${memoryGuidance}

CONVERSATION CONTEXT:
${conversationContext || "New conversation started. Make a great first impression."}

Remember: Every response should feel like it's from an intelligent friend who genuinely cares about giving you the best answer possible.`;
}

/**
 * Prepare enhanced conversation context for API
 */
export function prepareConversationContext(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  userProfile: UserProfile
): ConversationContext {
  // Keep last 6 messages for context (3 exchanges)
  const recentMessages = messages.slice(-6);

  const context: ConversationContext = {
    messages: recentMessages,
    userProfile,
    sessionTopic: userProfile.recentTopics[0],
    emotionalTriggers: findEmotionalTriggers(messages),
  };

  return context;
}

/**
 * Find emotional triggers in conversation
 */
function findEmotionalTriggers(messages: Array<{ role: "user" | "assistant"; content: string }>): string[] {
  const triggers: string[] = [];

  const emotionalPatterns = {
    frustration: /can't|doesn't work|broken|not working|confused|lost|stuck/i,
    excitement: /awesome|amazing|love|great|excited|wonderful|fantastic/i,
    curiosity: /how|why|what if|interesting|wondering|question/i,
    need_help: /help|please|need|emergency|urgent|assist/i,
  };

  for (const msg of messages) {
    if (msg.role === "user") {
      for (const [trigger, pattern] of Object.entries(emotionalPatterns)) {
        if (pattern.test(msg.content)) {
          triggers.push(trigger);
        }
      }
    }
  }

  return [...new Set(triggers)];
}

/**
 * Extract user's name from message
 */
function extractName(text: string, profile: UserProfile): string | undefined {
  // Already has a name
  if (profile.name) return undefined;

  // Patterns: "I'm [name]", "I am [name]", "My name is [name]", "Call me [name]"
  const namePatterns = [
    /I'm\s+([A-Z][a-z]+)/,
    /I am\s+([A-Z][a-z]+)/,
    /My name is\s+([A-Z][a-z]+)/,
    /Call me\s+([A-Z][a-z]+)/,
    /You can call me\s+([A-Z][a-z]+)/,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1];
      // Validate it's likely a real name (not a command)
      if (name.length > 2 && name.length < 30) {
        return name;
      }
    }
  }

  return undefined;
}

/**
 * Detect personality traits from message
 */
function detectPersonalityTraits(text: string, profile: UserProfile): string[] {
  const traits: string[] = [];
  const lower = text.toLowerCase();

  const traitPatterns = {
    "detail-oriented": /attention to detail|thorough|precise|exact|specific/i,
    curious: /curious|wondering|interested|fascinated|explore/i,
    analytical: /analyze|analyze deeply|think logically|logic|reason/i,
    creative: /creative|imagine|think outside|novel|unique/i,
    direct: /straight to the point|don't sugar coat|be direct|blunt/i,
    collaborative: /together|team|we|collaborate|partner/i,
    independent: /myself|solo|alone|independent|self-reliant/i,
    patient: /patient|no rush|take time|careful|thorough/i,
    impatient: /quick|fast|now|hurry|asap|urgent/i,
    empathetic: /feel|emotion|understand|compassion|care/i,
    pragmatic: /practical|works|results|efficient|real-world/i,
  };

  for (const [trait, pattern] of Object.entries(traitPatterns)) {
    if (pattern.test(text)) {
      traits.push(trait);
    }
  }

  return traits;
}

/**
 * Extract important memory notes from message
 */
function extractMemoryNote(text: string, profile: UserProfile): string | undefined {
  const lower = text.toLowerCase();

  // Only save notable memories
  const memoryPatterns = [
    /I work in|I'm a|I do|I work as/i,
    /I love|I hate|I'm passionate about|I really care about/i,
    /I live in|I'm from|I moved to/i,
    /I have|I own|I drive a/i,
  ];

  for (const pattern of memoryPatterns) {
    if (pattern.test(text)) {
      // Extract the statement
      const match = text.match(pattern + "\\s+([^.!?]*)/");
      if (match && match[1]) {
        return `Learned: I ${match[1]}`;
      }
    }
  }

  return undefined;
}

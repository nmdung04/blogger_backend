function readInt(name, fallback) {
  const value = parseInt(process.env[name] || "", 10);
  return Number.isFinite(value) ? value : fallback;
}

function readFloat(name, fallback) {
  const value = parseFloat(process.env[name] || "");
  return Number.isFinite(value) ? value : fallback;
}

export function getAIConfig() {
  return {
    enabled: process.env.AI_CHAT_ENABLED !== "false",
    systemPrompt:
      process.env.AI_SYSTEM_PROMPT ||
      "You are a helpful assistant. Answer clearly, accurately, and concisely.",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
    temperature: readFloat("GEMINI_TEMPERATURE", 1.0),
    maxCompletionTokens: readInt("AI_MAX_COMPLETION_TOKENS", 1500),
    maxPromptTokens: readInt("AI_MAX_PROMPT_TOKENS", 8000),
    maxContextMessages: readInt("AI_CONTEXT_MESSAGE_LIMIT", 20),
    maxMessageChars: readInt("AI_MAX_MESSAGE_CHARS", 8000),
    rateLimitWindowMs: readInt("AI_RATE_LIMIT_WINDOW_MS", 60000),
    maxRequestsPerWindow: readInt("AI_MAX_REQUESTS_PER_WINDOW", 10),
    maxConcurrentStreamsPerClient: readInt("AI_MAX_CONCURRENT_STREAMS_PER_CLIENT", 1),
    inputCostPer1kTokens: readFloat("AI_INPUT_COST_PER_1K_TOKENS", 0),
    outputCostPer1kTokens: readFloat("AI_OUTPUT_COST_PER_1K_TOKENS", 0),
  };
}

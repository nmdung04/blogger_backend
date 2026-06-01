import { getAIConfig } from "../config/ai.js";
import { createChatCompletion, streamChatCompletion } from "./gemini.service.js";

const requestBucketsByClient = new Map();
const activeStreamsByClient = new Map();

function createHttpError(message, status = 500) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function ensureChatEnabled() {
  const { enabled } = getAIConfig();
  if (!enabled) {
    throw createHttpError("AI chat is currently disabled", 503);
  }
}

function estimateTokenCount(text = "") {
  return Math.max(1, Math.ceil(String(text).length / 4));
}

function estimateMessagesTokenCount(messages) {
  return messages.reduce((total, message) => {
    return total + estimateTokenCount(message.role) + estimateTokenCount(message.content || "");
  }, 0);
}

function calculateEstimatedCost({ promptTokens, completionTokens }) {
  const { inputCostPer1kTokens, outputCostPer1kTokens } = getAIConfig();
  const inputCost = (promptTokens / 1000) * inputCostPer1kTokens;
  const outputCost = (completionTokens / 1000) * outputCostPer1kTokens;
  return Number((inputCost + outputCost).toFixed(6));
}

function normalizeHistory(history) {
  const { maxContextMessages, maxMessageChars } = getAIConfig();

  if (history == null) {
    return [];
  }

  if (!Array.isArray(history)) {
    throw createHttpError("History must be an array", 400);
  }

  if (history.length > maxContextMessages) {
    throw createHttpError(`History exceeds ${maxContextMessages} messages`, 400);
  }

  return history.map((message, index) => {
    if (!message || typeof message !== "object") {
      throw createHttpError(`History item ${index} is invalid`, 400);
    }

    const role = message.role;
    const content = typeof message.content === "string" ? message.content.trim() : "";

    if (!["user", "assistant"].includes(role)) {
      throw createHttpError(`History item ${index} has invalid role`, 400);
    }

    if (!content) {
      throw createHttpError(`History item ${index} content is required`, 400);
    }

    if (content.length > maxMessageChars) {
      throw createHttpError(`History item ${index} exceeds ${maxMessageChars} characters`, 400);
    }

    return { role, content };
  });
}

function buildModelMessages(history, pendingUserContent) {
  const { systemPrompt, maxPromptTokens } = getAIConfig();
  const systemMessage = { role: "system", content: systemPrompt };
  const contextMessages = [
    ...history,
    {
      role: "user",
      content: pendingUserContent,
    },
  ];

  while (
    contextMessages.length > 1 &&
    estimateMessagesTokenCount([systemMessage, ...contextMessages]) > maxPromptTokens
  ) {
    contextMessages.shift();
  }

  const finalMessages = [systemMessage, ...contextMessages];
  const estimatedPromptTokens = estimateMessagesTokenCount(finalMessages);

  if (estimatedPromptTokens > maxPromptTokens) {
    throw createHttpError("Conversation exceeds the allowed prompt size", 400);
  }

  return {
    finalMessages,
    estimatedPromptTokens,
  };
}

function assertRateLimit(clientKey) {
  const { rateLimitWindowMs, maxRequestsPerWindow } = getAIConfig();
  const now = Date.now();
  const currentBucket = requestBucketsByClient.get(clientKey) || [];
  const nextBucket = currentBucket.filter((timestamp) => now - timestamp < rateLimitWindowMs);

  if (nextBucket.length >= maxRequestsPerWindow) {
    throw createHttpError("Too many AI requests from this client", 429);
  }

  nextBucket.push(now);
  requestBucketsByClient.set(clientKey, nextBucket);
}

function reserveStreamSlot(clientKey) {
  const { maxConcurrentStreamsPerClient } = getAIConfig();
  const activeCount = activeStreamsByClient.get(clientKey) || 0;

  if (activeCount >= maxConcurrentStreamsPerClient) {
    throw createHttpError("Too many active AI streams from this client", 429);
  }

  activeStreamsByClient.set(clientKey, activeCount + 1);
}

function releaseStreamSlot(clientKey) {
  const activeCount = activeStreamsByClient.get(clientKey) || 0;
  if (activeCount <= 1) {
    activeStreamsByClient.delete(clientKey);
    return;
  }

  activeStreamsByClient.set(clientKey, activeCount - 1);
}

function assertMessageAllowed(content) {
  const { maxMessageChars } = getAIConfig();

  if (typeof content !== "string" || !content.trim()) {
    throw createHttpError("Message content is required", 400);
  }

  if (content.length > maxMessageChars) {
    throw createHttpError(`Message exceeds ${maxMessageChars} characters`, 400);
  }
}

function ensureAssistantContent(result) {
  if (!result.content) {
    throw createHttpError("AI response was empty", 502);
  }
}

export async function sendMessage(requestContext, content, history) {
  ensureChatEnabled();
  assertMessageAllowed(content);
  const clientKey = requestContext?.clientKey || "unknown";
  const normalizedContent = content.trim();
  const normalizedHistory = normalizeHistory(history);
  const { finalMessages, estimatedPromptTokens } = buildModelMessages(
    normalizedHistory,
    normalizedContent
  );

  assertRateLimit(clientKey);

  const result = await createChatCompletion({
    messages: finalMessages,
    estimatedPromptTokens,
  });
  ensureAssistantContent(result);

  const estimatedCost = calculateEstimatedCost(result.usage);

  return {
    message: {
      role: "assistant",
      content: result.content,
      model: result.model,
      finishReason: result.finishReason,
    },
    usage: {
      ...result.usage,
      estimatedCost,
    },
  };
}

export async function streamMessage(requestContext, content, history, handlers = {}) {
  ensureChatEnabled();
  assertMessageAllowed(content);
  const clientKey = requestContext?.clientKey || "unknown";
  const normalizedContent = content.trim();
  const normalizedHistory = normalizeHistory(history);
  const { finalMessages, estimatedPromptTokens } = buildModelMessages(
    normalizedHistory,
    normalizedContent
  );

  assertRateLimit(clientKey);
  reserveStreamSlot(clientKey);

  try {
    handlers.onStart?.();

    const result = await streamChatCompletion({
      messages: finalMessages,
      estimatedPromptTokens,
      onToken: handlers.onToken,
    });
    ensureAssistantContent(result);

    const estimatedCost = calculateEstimatedCost(result.usage);

    handlers.onComplete?.({
      message: {
        role: "assistant",
        content: result.content,
        model: result.model,
        finishReason: result.finishReason,
      },
      usage: {
        ...result.usage,
        estimatedCost,
      },
    });
  } finally {
    releaseStreamSlot(clientKey);
  }
}

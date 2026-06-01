import { GoogleGenAI } from "@google/genai";
import { getAIConfig } from "../config/ai.js";

let geminiClient;

function createProviderError(message, status = 500) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw createProviderError("GEMINI_API_KEY is not configured", 503);
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }

  return geminiClient;
}

function extractSystemInstruction(messages) {
  const systemParts = [];

  for (const message of messages) {
    if (message?.role === "system" && typeof message.content === "string" && message.content.trim()) {
      systemParts.push(message.content.trim());
    }
  }

  return systemParts.length ? systemParts.join("\n\n") : null;
}

function toGeminiContents(messages) {
  const contents = [];

  for (const message of messages) {
    if (!message || typeof message !== "object") continue;
    if (message.role === "system") continue;

    const text = typeof message.content === "string" ? message.content.trim() : "";
    if (!text) continue;

    const role = message.role === "assistant" ? "model" : message.role;
    if (role !== "user" && role !== "model") continue;

    contents.push({
      role,
      parts: [{ text }],
    });
  }

  if (contents.length === 0) {
    throw createProviderError("No content provided for AI generation", 400);
  }

  return contents;
}

function estimateTokenCount(text = "") {
  return Math.max(1, Math.ceil(String(text).length / 4));
}

function normalizeUsage({ estimatedPromptTokens, outputText }) {
  const promptTokens = Math.max(1, estimatedPromptTokens || 0);
  const completionTokens = estimateTokenCount(outputText || "");
  const totalTokens = promptTokens + completionTokens;

  return {
    promptTokens,
    completionTokens,
    totalTokens,
  };
}

function extractTextFromChunk(chunk) {
  if (typeof chunk?.text === "string") {
    return chunk.text;
  }

  const parts = chunk?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts.map((part) => part?.text || "").join("");
  }

  return "";
}

function mapGeminiError(err) {
  const status = err?.statusCode || err?.status || 500;
  const message = err?.message || "Gemini request failed";
  return createProviderError(message, status);
}

export async function createChatCompletion({ messages, estimatedPromptTokens = 0 }) {
  const client = getClient();
  const { model, temperature, maxCompletionTokens } = getAIConfig();

  try {
    const response = await client.models.generateContent({
      model,
      contents: toGeminiContents(messages),
      config: {
        systemInstruction: extractSystemInstruction(messages) || undefined,
        temperature,
        maxOutputTokens: maxCompletionTokens,
      },
    });

    const content = (response?.text || "").trim();

    return {
      content,
      finishReason: "stop",
      model,
      usage: normalizeUsage({
        estimatedPromptTokens,
        outputText: content,
      }),
    };
  } catch (err) {
    throw mapGeminiError(err);
  }
}

export async function streamChatCompletion({ messages, estimatedPromptTokens = 0, onToken }) {
  const client = getClient();
  const { model, temperature, maxCompletionTokens } = getAIConfig();

  try {
    const stream = await client.models.generateContentStream({
      model,
      contents: toGeminiContents(messages),
      config: {
        systemInstruction: extractSystemInstruction(messages) || undefined,
        temperature,
        maxOutputTokens: maxCompletionTokens,
      },
    });

    let content = "";

    for await (const chunk of stream) {
      const delta = extractTextFromChunk(chunk);
      if (!delta) continue;

      content += delta;
      onToken?.(delta);
    }

    const finalText = content.trim();

    return {
      content: finalText,
      finishReason: "stop",
      model,
      usage: normalizeUsage({
        estimatedPromptTokens,
        outputText: finalText,
      }),
    };
  } catch (err) {
    throw mapGeminiError(err);
  }
}

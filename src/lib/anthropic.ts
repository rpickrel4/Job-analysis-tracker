import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new MissingApiKeyError();
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      "ANTHROPIC_API_KEY is not set. Add it to your .env file to enable AI features."
    );
    this.name = "MissingApiKeyError";
  }
}

export const CLAUDE_MODEL = "claude-sonnet-5";

export type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * Sends a multi-turn conversation and extracts the text response. Anthropic
 * sometimes wraps JSON answers in prose or code fences even when asked not
 * to, so callers that need JSON should parse with extractJson().
 */
export async function askClaudeConversation(params: {
  system: string;
  messages: ChatTurn[];
  maxTokens?: number;
}): Promise<string> {
  const anthropic = getAnthropicClient();
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: params.maxTokens ?? 4096,
    system: params.system,
    messages: params.messages,
  });
  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock && "text" in textBlock ? textBlock.text : "";
}

/** Sends a single-turn prompt. See askClaudeConversation() for details. */
export async function askClaude(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  return askClaudeConversation({
    system: params.system,
    messages: [{ role: "user", content: params.prompt }],
    maxTokens: params.maxTokens,
  });
}

/** Pulls the first JSON object/array out of a model response. */
export function extractJson<T = unknown>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) {
    throw new Error("No JSON found in model response");
  }
  const openChar = candidate[start];
  const closeChar = openChar === "{" ? "}" : "]";
  let depth = 0;
  let end = -1;
  for (let i = start; i < candidate.length; i++) {
    if (candidate[i] === openChar) depth++;
    else if (candidate[i] === closeChar) {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const slice = end === -1 ? candidate.slice(start) : candidate.slice(start, end + 1);
  return JSON.parse(slice) as T;
}

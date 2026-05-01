/**
 * Claude API Client
 *
 * Calls Claude via a local Express proxy (/api/chat) to avoid CORS
 * and keep the API key server-side. Falls back to direct API call
 * if VITE_ANTHROPIC_API_KEY is set (for environments that allow it).
 */

const MODEL = "claude-sonnet-4-20250514";

/**
 * Send messages to Claude and get a text response.
 * @param {Array} messages - Conversation history
 * @param {string} systemPrompt - System prompt for this call
 * @param {number} maxTokens - Max tokens for the response (default 1500)
 */
export async function callClaude(messages, systemPrompt, maxTokens = 1500) {
  try {
    // Try the local proxy first (started via `npm run dev`)
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API error:", response.status, errorData);
      
      if (response.status === 401) {
        return "API key is missing or invalid. Please set ANTHROPIC_API_KEY in your .env file and restart the server.";
      }
      throw new Error(errorData?.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    return (
      data.content
        ?.map((c) => (c.type === "text" ? c.text : ""))
        .filter(Boolean)
        .join("\n") || "I'm having trouble responding. Could you try again?"
    );
  } catch (err) {
    console.error("callClaude error:", err);
    return "Connection failed. Make sure the dev server is running with `npm run dev` and ANTHROPIC_API_KEY is set in .env";
  }
}

/**
 * Parse a JSON response from Claude, handling common formatting issues.
 */
export function parseClaudeJSON(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

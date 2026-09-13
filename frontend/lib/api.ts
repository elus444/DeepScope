import axios from "axios";
import { supabase } from "./supabaseClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: API_BASE_URL });

// Every request gets the current Supabase access token attached fresh --
// getSession() returns a cached session and transparently refreshes it
// first if it's expired, so a long-open tab never sends a stale token.
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
});

export interface DocumentOut {
  id: string;
  filename: string;
  file_type: string;
  character_count: number;
  chunk_count: number;
  created_at: string;
}

export interface ChatSessionOut {
  id: string;
  title: string;
  created_at: string;
}

export interface CitationOut {
  index: number;
  chunk_id: string;
  filename: string;
  content: string;
  similarity: number;
}

export interface MessageOut {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: CitationOut[];
  created_at: string;
}

export type PipelineStageName = "research" | "summarize" | "critique" | "finalize";

export type AskStreamEvent =
  | { type: "stage"; stage: PipelineStageName; status: "start" }
  | { type: "stage"; stage: PipelineStageName; status: "done"; detail: string }
  | { type: "citations"; citations: CitationOut[] }
  | { type: "answer_chunk"; text: string }
  | { type: "done"; message_id: string; citations: CitationOut[]; metadata: Record<string, unknown> }
  | { type: "error"; message: string };

/**
 * Opens the chat streaming endpoint and calls `onEvent` for each
 * Server-Sent Event as it arrives. Uses fetch + a manual reader
 * (rather than EventSource, which can't send a POST body or headers)
 * so we can attach the same bearer token the rest of the app uses.
 */
export async function streamAsk(
  sessionId: string,
  body: { query: string; top_k: number; document_id: string | null },
  onEvent: (event: AskStreamEvent) => void
): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    let detail = text;
    try {
      detail = JSON.parse(text).detail || text;
    } catch {
      // not JSON, use raw text
    }
    throw new Error(detail || `Request failed with status ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || ""; // last part may be incomplete, keep for next chunk

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      const jsonStr = line.slice(5).trim();
      if (!jsonStr) continue;
      try {
        onEvent(JSON.parse(jsonStr) as AskStreamEvent);
      } catch {
        console.error("Failed to parse SSE event:", jsonStr);
      }
    }
  }
}

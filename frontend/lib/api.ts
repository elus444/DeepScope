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

export interface MessageOut {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: string[];
  created_at: string;
}

export interface AskResponse {
  answer: string;
  sources: string[];
  workflow_log: string[];
  metadata: Record<string, unknown>;
}

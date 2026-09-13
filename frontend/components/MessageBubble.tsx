import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CitationOut } from "../lib/api";
import MessageContent from "./MessageContent";

export interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: CitationOut[];
}

function CopyButton({ text, align }: { text: string; align: "left" | "right" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API can be unavailable (e.g. non-HTTPS/older browser) --
      // fall back to the old textarea+execCommand trick so copy still works.
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.9 }}
      className={`mt-1 w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors ${
        align === "right" ? "self-end" : "self-start"
      }`}
      title={copied ? "Copied!" : "Copy"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.svg
            key="check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-3.5 h-3.5 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
          </motion.svg>
        ) : (
          <motion.svg
            key="copy"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function MessageBubble({
  message,
  onCiteClick,
  streaming,
}: {
  message: Message;
  onCiteClick: (c: CitationOut) => void;
  streaming?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-[0_6px_18px_rgba(124,58,237,0.3)]"
            : "glass-solid text-slate-800"
        }`}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <>
            <MessageContent content={message.content} citations={message.citations || []} onCiteClick={onCiteClick} />
            {streaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-violet-400 animate-pulse align-middle rounded-sm" />
            )}
          </>
        )}
      </div>
      {!streaming && message.content && (
        <CopyButton text={message.content} align={isUser ? "right" : "left"} />
      )}
    </motion.div>
  );
}

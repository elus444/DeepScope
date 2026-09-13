import { motion } from "framer-motion";
import { CitationOut } from "../lib/api";
import MessageContent from "./MessageContent";

export interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: CitationOut[];
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
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
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
    </motion.div>
  );
}

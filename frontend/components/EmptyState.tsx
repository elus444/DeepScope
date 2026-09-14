import { motion } from "framer-motion";

const SUGGESTIONS = [
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    ),
    title: "Summarize a document",
    prompt: "Give me a concise summary of the key points in this document.",
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
    ),
    title: "Compare my documents",
    prompt: "What are the key differences between the documents I've uploaded?",
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    title: "Check facts",
    prompt: "Verify this claim against the documents I've uploaded: ",
  },
];

export default function EmptyState({
  name,
  onPick,
}: {
  name: string;
  onPick: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
      {/* Brand mark */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-14 h-14 mb-6 rounded-2xl bg-gradient-to-br from-violet-400 via-violet-600 to-fuchsia-500 flex items-center justify-center shadow-[0_10px_30px_rgba(139,92,246,0.4)]"
      >
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="text-2xl font-semibold text-slate-800"
      >
        Hello, <span className="shimmer-text">{name}</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="text-slate-500 mt-1 mb-8"
      >
        What would you like to research today?
      </motion.p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl w-full">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.08, duration: 0.4 }}
            whileHover={{ y: -3, boxShadow: "0 12px 28px rgba(124,58,237,0.18)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPick(s.prompt)}
            className="glass-solid text-left p-4 rounded-2xl transition-shadow"
          >
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {s.icon}
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-800">{s.title}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DocumentOut } from "../lib/api";

export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  documents,
  selectedDocumentId,
  onSelectDocument,
  onUploadFile,
  uploading,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  documents: DocumentOut[];
  selectedDocumentId: string;
  onSelectDocument: (id: string) => void;
  onUploadFile: (file: File) => void;
  uploading: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedDoc = documents.find((d) => d.id === selectedDocumentId);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        layout
        className="glass rounded-3xl p-2.5 shadow-[0_16px_40px_rgba(124,58,237,0.14)]"
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!disabled) onSend();
            }
          }}
          disabled={disabled}
          rows={1}
          placeholder="Ask me anything about your documents..."
          className="w-full resize-none bg-transparent px-3 pt-1.5 pb-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
          style={{ minHeight: "26px" }}
        />

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.html,.htm,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadFile(file);
                e.target.value = "";
              }}
            />
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="chip disabled:opacity-50"
              title="Attach a document"
            >
              {uploading ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              )}
              {uploading ? "Uploading..." : "Attach"}
            </motion.button>

            {documents.length > 0 && (
              <div className="relative group">
                <button className="chip max-w-[160px]">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate">{selectedDoc ? selectedDoc.filename : "All documents"}</span>
                </button>
                <div className="absolute bottom-full left-0 mb-2 w-56 glass-solid rounded-xl p-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-30">
                  <button
                    onClick={() => onSelectDocument("")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs ${
                      !selectedDocumentId ? "bg-violet-100 text-violet-800" : "hover:bg-violet-50 text-slate-600"
                    }`}
                  >
                    🌐 All documents
                  </button>
                  {documents.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => onSelectDocument(d.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs truncate ${
                        selectedDocumentId === d.id ? "bg-violet-100 text-violet-800" : "hover:bg-violet-50 text-slate-600"
                      }`}
                    >
                      📄 {d.filename}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white flex items-center justify-center shadow-[0_4px_14px_rgba(124,58,237,0.4)] disabled:opacity-40 disabled:pointer-events-none transition-shadow"
            title="Send"
          >
            <AnimatePresence mode="wait" initial={false}>
              {disabled ? (
                <motion.svg
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, rotate: 360 }}
                  exit={{ opacity: 0 }}
                  transition={{ rotate: { repeat: Infinity, duration: 0.8, ease: "linear" } }}
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="send"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 4 }}
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 12h14M13 6l6 6-6 6" />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

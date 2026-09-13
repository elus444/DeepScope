import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DocumentOut } from "../lib/api";

export default function DocumentsPanel({
  open,
  onClose,
  documents,
  onUpload,
  onDelete,
  uploading,
  uploadStatus,
}: {
  open: boolean;
  onClose: () => void;
  documents: DocumentOut[];
  onUpload: (file: File) => void;
  onDelete: (id: string) => void;
  uploading: boolean;
  uploadStatus: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed right-0 top-0 h-screen w-full max-w-md glass-solid z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-violet-100">
              <h2 className="text-lg font-semibold text-slate-800">Documents</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.html,.htm,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(file);
                  e.target.value = "";
                }}
              />
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-violet-200 rounded-2xl p-8 text-center hover:border-violet-400 hover:bg-violet-50/50 transition-colors disabled:opacity-60"
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {uploading ? "Uploading..." : "Click to upload a document"}
                </p>
                <p className="text-xs text-slate-400 mt-1">PDF, DOCX, HTML, or TXT</p>
              </motion.button>

              <AnimatePresence>
                {uploadStatus && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium overflow-hidden ${
                      uploadStatus.startsWith("✓")
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {uploadStatus}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {documents.map((doc) => (
                    <motion.div
                      key={doc.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between p-3 rounded-xl border border-violet-100 bg-white"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-500 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{doc.filename}</p>
                          <p className="text-xs text-slate-400">
                            {doc.file_type} · {doc.chunk_count} chunks
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onDelete(doc.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors shrink-0 ml-2"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {documents.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">No documents uploaded yet.</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

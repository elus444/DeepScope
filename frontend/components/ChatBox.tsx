import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, streamAsk, DocumentOut, ChatSessionOut, MessageOut, CitationOut } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "./Sidebar";
import EmptyState from "./EmptyState";
import ChatInput from "./ChatInput";
import DocumentsPanel from "./DocumentsPanel";
import MessageBubble, { Message } from "./MessageBubble";
import PipelineView, { INITIAL_PIPELINE_STAGES, PipelineStage } from "./PipelineView";

export default function ChatBox() {
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [documents, setDocuments] = useState<DocumentOut[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [streamingCitations, setStreamingCitations] = useState<CitationOut[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [sessions, setSessions] = useState<ChatSessionOut[]>([]);
  const [activeCitation, setActiveCitation] = useState<CitationOut | null>(null);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const displayName = (user?.email || "there").split("@")[0];

  useEffect(() => {
    fetchDocuments();
    fetchSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const fetchDocuments = async () => {
    try {
      const res = await api.get<DocumentOut[]>("/documents");
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await api.get<ChatSessionOut[]>("/chat/sessions");
      setSessions(res.data);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setSessionId("");
    setPipelineStages([]);
    setInput("");
  };

  const openSession = async (session: ChatSessionOut) => {
    try {
      const res = await api.get<MessageOut[]>(`/chat/sessions/${session.id}/messages`);
      setMessages(res.data.map((m) => ({ role: m.role, content: m.content, citations: m.sources })));
      setSessionId(session.id);
      setPipelineStages([]);
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  };

  const deleteDocument = async (docId: string) => {
    try {
      await api.delete(`/documents/${docId}`);
      if (selectedDocumentId === docId) setSelectedDocumentId("");
      await fetchDocuments();
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadStatus("Uploading...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post<DocumentOut>("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadStatus(`✓ Uploaded: ${res.data.chunk_count} chunks indexed`);
      await fetchDocuments();
      setSelectedDocumentId(res.data.id);
      setTimeout(() => setUploadStatus(""), 3000);
    } catch (err: any) {
      console.error(err);
      setUploadStatus(`✗ ${err.response?.data?.detail || "Upload failed"}`);
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const currentQuery = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: currentQuery }]);
    setIsProcessing(true);
    setPipelineStages(INITIAL_PIPELINE_STAGES);
    setStreamingText("");
    setStreamingCitations([]);

    let fullAnswer = "";

    try {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const created = await api.post<ChatSessionOut>("/chat/sessions", {
          title: currentQuery.slice(0, 60),
        });
        activeSessionId = created.data.id;
        setSessionId(activeSessionId);
        setSessions((prev) => [created.data, ...prev]);
      }

      await streamAsk(
        activeSessionId,
        { query: currentQuery, top_k: 5, document_id: selectedDocumentId || null },
        (event) => {
          if (event.type === "stage") {
            setPipelineStages((prev) =>
              prev.map((s) =>
                s.name === event.stage
                  ? { ...s, status: event.status === "start" ? "active" : "done", detail: event.status === "done" ? event.detail : s.detail }
                  : s
              )
            );
          } else if (event.type === "citations") {
            setStreamingCitations(event.citations);
          } else if (event.type === "answer_chunk") {
            fullAnswer += event.text;
            setStreamingText(fullAnswer);
          } else if (event.type === "done") {
            setMessages((prev) => [...prev, { role: "assistant", content: fullAnswer, citations: event.citations }]);
            setStreamingText("");
            setStreamingCitations([]);
          } else if (event.type === "error") {
            setMessages((prev) => [...prev, { role: "assistant", content: event.message }]);
            setStreamingText("");
          }
        }
      );
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: err.message || "Error contacting backend." }]);
      setStreamingText("");
    } finally {
      setIsProcessing(false);
    }
  };

  const showEmptyState = messages.length === 0 && !streamingText;
  const activeStage = pipelineStages.find((s) => s.status === "active");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        sessions={sessions}
        activeSessionId={sessionId}
        onNewChat={startNewConversation}
        onOpenSession={openSession}
        onOpenDocuments={() => setDocumentsOpen(true)}
        documentCount={documents.length}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        {showEmptyState ? (
          <motion.div layout className="flex-1 flex flex-col overflow-y-auto">
            <EmptyState name={displayName} onPick={setInput} />
            <div className="px-6 pb-10">
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={sendMessage}
                disabled={isProcessing}
                documents={documents}
                selectedDocumentId={selectedDocumentId}
                onSelectDocument={setSelectedDocumentId}
                onUploadFile={uploadFile}
                uploading={uploading}
              />
            </div>
          </motion.div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-8">
              <div className="max-w-2xl mx-auto space-y-4">
                {messages.map((m, idx) => (
                  <MessageBubble key={idx} message={m} onCiteClick={setActiveCitation} />
                ))}

                {isProcessing && streamingText && (
                  <MessageBubble
                    message={{ role: "assistant", content: streamingText, citations: streamingCitations }}
                    onCiteClick={setActiveCitation}
                    streaming
                  />
                )}

                {isProcessing && !streamingText && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-solid rounded-2xl p-4 max-w-xs"
                  >
                    <PipelineView stages={pipelineStages} />
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="px-6 pb-6 pt-2">
              {isProcessing && activeStage && (
                <p className="text-center text-xs text-violet-500 mb-2 animate-pulse">
                  {activeStage.name === "research" && "Searching your documents..."}
                  {activeStage.name === "summarize" && "Drafting an answer..."}
                  {activeStage.name === "critique" && "Double-checking accuracy..."}
                  {activeStage.name === "finalize" && "Finalizing..."}
                </p>
              )}
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={sendMessage}
                disabled={isProcessing}
                documents={documents}
                selectedDocumentId={selectedDocumentId}
                onSelectDocument={setSelectedDocumentId}
                onUploadFile={uploadFile}
                uploading={uploading}
              />
            </div>
          </>
        )}
      </div>

      <DocumentsPanel
        open={documentsOpen}
        onClose={() => setDocumentsOpen(false)}
        documents={documents}
        onUpload={uploadFile}
        onDelete={deleteDocument}
        uploading={uploading}
        uploadStatus={uploadStatus}
      />

      {/* Citation preview modal */}
      <AnimatePresence>
        {activeCitation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCitation(null)}
              className="fixed inset-0 bg-slate-900/25 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md glass-solid rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="chip shrink-0">[{activeCitation.index}]</span>
                  <p className="text-sm font-medium text-slate-800 truncate">{activeCitation.filename}</p>
                </div>
                <button
                  onClick={() => setActiveCitation(null)}
                  className="text-slate-400 hover:text-slate-600 shrink-0 ml-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Match confidence: {(activeCitation.similarity * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap bg-violet-50/70 p-4 rounded-xl border border-violet-100 max-h-64 overflow-y-auto">
                {activeCitation.content}
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

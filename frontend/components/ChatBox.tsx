import { useState, useEffect, useRef } from "react";
import { api, DocumentOut, ChatSessionOut, MessageOut, AskResponse } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBox() {
  const { user, signOut } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [documents, setDocuments] = useState<DocumentOut[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>(""); // "" = search all documents
  const [workflowLog, setWorkflowLog] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAgent, setCurrentAgent] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [sessions, setSessions] = useState<ChatSessionOut[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocuments();
    fetchSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    setWorkflowLog([]);
    setInput("");
    setShowHistory(false);
  };

  const openSession = async (session: ChatSessionOut) => {
    try {
      const res = await api.get<MessageOut[]>(`/chat/sessions/${session.id}/messages`);
      setMessages(res.data.map((m) => ({ role: m.role, content: m.content })));
      setSessionId(session.id);
      setWorkflowLog([]);
      setShowHistory(false);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      e.target.value = "";
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = { role: "user", content: input };
    const currentQuery = input;

    setInput("");
    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);
    setWorkflowLog([]);
    setCurrentAgent("[1/4] Research Agent: Searching your documents...");

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

      const res = await api.post<AskResponse>(`/chat/sessions/${activeSessionId}/messages`, {
        query: currentQuery,
        top_k: 5,
        document_id: selectedDocumentId || null,
      });

      setWorkflowLog(res.data.workflow_log || []);
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.answer }]);
      setCurrentAgent("");
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || "Error contacting backend.";
      setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
      setCurrentAgent("");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  DeepScope
                </h1>
                <p className="text-sm text-gray-500">Intelligent Document Q&A System</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowHistory((s) => !s)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                History
              </button>
              <button
                onClick={startNewConversation}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200"
              >
                New Chat
              </button>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                {documents.length} Document{documents.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                <span className="text-xs text-gray-500 max-w-[140px] truncate" title={user?.email}>
                  {user?.email}
                </span>
                <button
                  onClick={signOut}
                  className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Card */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Document</h3>

              <label className="block">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
                  ${uploading ? "border-gray-300 bg-gray-50" : "border-blue-300 hover:border-blue-500 hover:bg-blue-50"}`}
                >
                  <p className="text-sm text-gray-600 font-medium">
                    {uploading ? "Uploading..." : "Click to upload document"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOCX, HTML, or TXT</p>
                  <input
                    type="file"
                    accept=".pdf,.docx,.html,.htm,.txt"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
              </label>

              {uploadStatus && (
                <div
                  className={`mt-4 p-3 rounded-lg text-sm font-medium ${
                    uploadStatus.startsWith("✓")
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {uploadStatus}
                </div>
              )}
            </div>

            {/* Document Selector */}
            {documents.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents</h3>
                <select
                  value={selectedDocumentId}
                  onChange={(e) => setSelectedDocumentId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-medium mb-3"
                >
                  <option value="">🌐 All documents</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      📄 {doc.filename}
                    </option>
                  ))}
                </select>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 bg-white text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-gray-800 truncate">{doc.filename}</div>
                        <div className="text-gray-500">
                          {doc.file_type} • {doc.chunk_count} chunks
                        </div>
                      </div>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="ml-2 shrink-0 text-red-500 hover:text-red-700 font-medium"
                        title="Delete document"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History panel */}
            {showHistory && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Chat History</h3>
                {sessions.length === 0 ? (
                  <p className="text-sm text-gray-500">No previous conversations yet.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {sessions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => openSession(s)}
                        className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
                          s.id === sessionId
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="font-medium text-gray-800 truncate">{s.title}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(s.created_at).toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Workflow Log */}
            {workflowLog.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Agent Pipeline</h3>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  {workflowLog.map((log, idx) => (
                    <div key={idx} className="text-xs text-blue-700 py-1 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <div className="card h-[calc(100vh-120px)] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-16">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Start a Conversation</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Upload a document and ask questions to start chat
                    </p>
                  </div>
                )}

                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] ${
                        m.role === "user" ? "chat-message chat-message-user" : "chat-message chat-message-assistant"
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <span
                          className={`text-sm font-semibold ${m.role === "user" ? "text-white" : "text-gray-700"}`}
                        >
                          {m.role === "user" ? "You" : "AI Assistant"}
                        </span>
                      </div>
                      <div className={`text-sm leading-relaxed ${m.role === "user" ? "text-white" : "text-gray-800"}`}>
                        {m.content}
                      </div>
                    </div>
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 shadow-sm border border-orange-200 animate-pulse">
                      <div className="flex items-center mb-2">
                        <div className="flex space-x-1 mr-3">
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                        </div>
                        <span className="text-sm font-semibold text-orange-700">AI is thinking...</span>
                      </div>
                      <div className="text-xs text-orange-600 italic">{currentAgent || "Processing your request..."}</div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isProcessing) sendMessage();
                    }}
                    disabled={isProcessing}
                    placeholder={isProcessing ? "Processing..." : "Type your question..."}
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isProcessing || !input.trim()}
                    className="btn-primary"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

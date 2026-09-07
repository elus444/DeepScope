import Head from "next/head";
import Link from "next/link";

export default function HistoryPage() {
  return (
    <>
      <Head>
        <title>DeepScope - Conversation History</title>
      </Head>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Conversation History</h1>
          <p className="text-gray-600 mb-6">
            Session history is managed directly within the chat interface.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            ← Return to Chat
          </Link>
        </div>
      </div>
    </>
  );
}

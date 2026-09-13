import Head from "next/head";
import Link from "next/link";

export default function HistoryPage() {
  return (
    <>
      <Head>
        <title>DeepScope - Conversation History</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md glass-solid p-8 rounded-3xl">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">Conversation History</h1>
          <p className="text-slate-500 mb-6">
            Chat history lives in the sidebar of the main chat interface — open any past conversation from there.
          </p>
          <Link href="/" className="btn-primary inline-block">
            ← Return to Chat
          </Link>
        </div>
      </div>
    </>
  );
}

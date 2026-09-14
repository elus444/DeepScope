import ChatBox from "../components/ChatBox";
import LandingPage from "../components/LandingPage";
import Head from "next/head";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>DeepScope - Intelligent Document Q&A</title>
        <meta
          name="description"
          content="DeepScope reads your documents and answers questions with a multi-agent, cited, real-time research pipeline."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {session ? <ChatBox /> : <LandingPage />}
    </>
  );
}

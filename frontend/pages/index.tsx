import { useEffect } from "react";
import { useRouter } from "next/router";
import ChatBox from "../components/ChatBox";
import Head from "next/head";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  if (loading || !session) {
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
        <meta name="description" content="DeepScope - AI-powered research with multi-agent workflow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ChatBox />
    </>
  );
}

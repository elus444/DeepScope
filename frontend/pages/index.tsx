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

        {/* Open Graph / Twitter card -- so a link dropped into Slack,
            LinkedIn, or an email actually shows a real preview instead
            of a bare URL. */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="DeepScope" />
        <meta property="og:title" content="DeepScope - Ask your documents anything, and trust the answer." />
        <meta
          property="og:description"
          content="A multi-agent RAG research assistant: real-time streaming answers, every claim traced back to its source."
        />
        <meta property="og:url" content="https://deepscope-elham7.vercel.app" />
        <meta property="og:image" content="https://deepscope-elham7.vercel.app/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="DeepScope - Ask your documents anything, and trust the answer." />
        <meta
          name="twitter:description"
          content="A multi-agent RAG research assistant: real-time streaming answers, every claim traced back to its source."
        />
        <meta name="twitter:image" content="https://deepscope-elham7.vercel.app/og-image.png" />
      </Head>
      {session ? <ChatBox /> : <LandingPage />}
    </>
  );
}

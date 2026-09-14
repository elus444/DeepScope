import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

const FEATURES = [
  {
    title: "Multi-agent pipeline",
    desc: "A research agent retrieves, a summarizer drafts, a critic checks it against the source, and an editor polishes the final answer -- every step visible in real time.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
    ),
  },
  {
    title: "Inline citations",
    desc: "Every claim links back to the exact chunk it came from. Click a citation to see the source passage and match confidence side by side.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    ),
  },
  {
    title: "Streamed answers",
    desc: "Responses arrive token by token over a live SSE connection, with the pipeline stage lighting up as it works -- no spinner, no waiting in the dark.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
    ),
  },
  {
    title: "Private by design",
    desc: "Row-level security is the only authorization boundary -- every query runs under your own access token, so your documents are never visible to anyone else, including the server.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    ),
  },
];

const STEPS = [
  {
    n: "01",
    title: "Upload your documents",
    desc: "PDFs, Word docs, or plain text -- dropped in and chunked, embedded, and indexed with pgvector in seconds.",
  },
  {
    n: "02",
    title: "Ask anything",
    desc: "Question one document or all of them at once. Follow-up questions understand the conversation so far.",
  },
  {
    n: "03",
    title: "Get a cited, checked answer",
    desc: "Watch the agent pipeline research, draft, critique, and refine -- then read an answer with sources you can verify.",
  },
];

function GradientOrb({ className }: { className: string }) {
  return <div className={`rounded-full blur-3xl pointer-events-none ${className}`} />;
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const previewY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const previewOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);

  return (
    <div className="relative overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/60 border-b border-violet-100/70">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-[0_4px_14px_rgba(124,58,237,0.4)]">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-800">DeepScope</span>
          </div>
          <nav className="hidden sm:flex items-center gap-7 text-sm font-medium text-slate-500">
            <a href="#features" className="hover:text-violet-700 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-violet-700 transition-colors">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost text-sm">
              Sign in
            </Link>
            <Link href="/register" className="btn-primary text-sm !px-4 !py-2">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="relative max-w-6xl mx-auto px-6 pt-20 pb-28">
        <GradientOrb className="absolute -top-20 -left-32 w-80 h-80 bg-violet-300/40" />
        <GradientOrb className="absolute top-10 -right-24 w-72 h-72 bg-fuchsia-300/30" />

        <div className="relative text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 chip mb-6"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Multi-agent RAG, powered by Gemini
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
            className="text-4xl sm:text-6xl font-semibold tracking-tight text-slate-900 leading-[1.08]"
          >
            Ask your documents
            <br />
            <span className="shimmer-text">anything, and trust the answer.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.6, ease: "easeOut" }}
            className="mt-6 text-lg text-slate-500 max-w-xl mx-auto"
          >
            DeepScope reads your PDFs, docs, and notes, then researches, drafts, and fact-checks
            its own answer before showing it to you -- with every claim traced back to its source.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.6, ease: "easeOut" }}
            className="mt-9 flex items-center justify-center gap-3"
          >
            <Link href="/register">
              <motion.span
                whileHover={{ y: -2, boxShadow: "0 12px 32px rgba(124,58,237,0.4)" }}
                whileTap={{ y: 0, scale: 0.98 }}
                className="btn-primary inline-block text-[15px] !px-6 !py-3"
              >
                Get started free
              </motion.span>
            </Link>
            <Link href="/login">
              <motion.span
                whileHover={{ y: -2 }}
                whileTap={{ y: 0, scale: 0.98 }}
                className="btn-ghost inline-block text-[15px] !px-6 !py-3 glass"
              >
                Sign in
              </motion.span>
            </Link>
          </motion.div>
        </div>

        {/* Product preview */}
        <motion.div
          style={{ y: previewY, opacity: previewOpacity }}
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.45, duration: 0.7, ease: "easeOut" }}
          className="relative mt-16 max-w-3xl mx-auto"
        >
          <div className="glass rounded-3xl p-3 shadow-[0_30px_80px_rgba(124,58,237,0.22)]">
            <div className="glass-solid rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-1.5 mb-5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
              </div>

              {/* user bubble */}
              <div className="flex justify-end mb-4">
                <div className="max-w-[70%] rounded-2xl px-4 py-2.5 text-sm bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-[0_6px_18px_rgba(124,58,237,0.3)]">
                  What was our Q3 churn rate, and why?
                </div>
              </div>

              {/* pipeline row */}
              <div className="flex flex-wrap gap-2 mb-4">
                {["Research", "Summarize", "Critique", "Finalize"].map((s, i) => (
                  <motion.span
                    key={s}
                    initial={{ opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.12, duration: 0.35 }}
                    className="chip"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                    {s}
                  </motion.span>
                ))}
              </div>

              {/* assistant bubble */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.9, duration: 0.4 }}
                className="glass-solid rounded-2xl px-4 py-3 text-sm text-slate-700 leading-relaxed max-w-[85%]"
              >
                Q3 churn was 4.2%, up from 3.1% in Q2
                <span className="chip !px-1.5 !py-0 mx-0.5 text-[10px] align-middle">1</span>, driven mainly
                by pricing changes in the mid-market tier
                <span className="chip !px-1.5 !py-0 mx-0.5 text-[10px] align-middle">2</span>.
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-lg mx-auto mb-14"
        >
          <h2 className="text-3xl font-semibold text-slate-900">Built to be trusted, not just fast</h2>
          <p className="text-slate-500 mt-3">
            Every layer of DeepScope exists to make the answer verifiable, not just confident-sounding.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
              whileHover={{ y: -4, boxShadow: "0 16px 36px rgba(124,58,237,0.16)" }}
              className="glass-solid rounded-2xl p-6 transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {f.icon}
                </svg>
              </div>
              <h3 className="font-semibold text-slate-800 mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-lg mx-auto mb-16"
        >
          <h2 className="text-3xl font-semibold text-slate-900">Three steps, start to answer</h2>
        </motion.div>

        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div className="hidden sm:block absolute top-6 left-[16.5%] right-[16.5%] h-px bg-violet-200" />
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.15, duration: 0.5, ease: "easeOut" }}
              className="relative text-center sm:text-left"
            >
              <div className="relative z-10 w-12 h-12 mx-auto sm:mx-0 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white text-sm font-semibold flex items-center justify-center shadow-[0_6px_18px_rgba(124,58,237,0.35)] mb-4">
                {s.n}
              </div>
              <h3 className="font-semibold text-slate-800 mb-1.5">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 px-8 py-16 text-center shadow-[0_30px_70px_rgba(124,58,237,0.35)]"
        >
          <GradientOrb className="absolute -top-16 -left-16 w-64 h-64 bg-white/10" />
          <GradientOrb className="absolute -bottom-20 -right-10 w-72 h-72 bg-white/10" />
          <h2 className="relative text-3xl sm:text-4xl font-semibold text-white mb-4">
            See it work on your own documents
          </h2>
          <p className="relative text-violet-100 mb-8 max-w-md mx-auto">
            Free to try. Upload a document and ask your first question in under a minute.
          </p>
          <Link href="/register">
            <motion.span
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ y: 0, scale: 0.98 }}
              className="relative inline-block px-7 py-3 rounded-xl bg-white text-violet-700 font-medium shadow-lg"
            >
              Get started free
            </motion.span>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-violet-100/70 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-slate-500 font-medium">DeepScope</span>
          </div>
          <p>© {new Date().getFullYear()} DeepScope. Built with a multi-agent RAG pipeline.</p>
        </div>
      </footer>
    </div>
  );
}

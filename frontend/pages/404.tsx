import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Page not found - DeepScope</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-md glass-solid rounded-3xl p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 18 }}
            className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-[0_8px_24px_rgba(124,58,237,0.4)]"
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </motion.div>

          <p className="text-sm font-semibold uppercase tracking-wide text-violet-500 mb-2">404</p>
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">This page went missing</h1>
          <p className="text-sm text-slate-500 mb-8">
            The page you're looking for doesn't exist, or the link is out of date.
          </p>

          <Link href="/">
            <motion.span
              whileHover={{ y: -1 }}
              whileTap={{ y: 0, scale: 0.99 }}
              className="btn-primary inline-block"
            >
              Back to DeepScope
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { PipelineStageName } from "../lib/api";

export interface PipelineStage {
  name: PipelineStageName;
  status: "pending" | "active" | "done";
  detail?: string;
}

const STAGE_LABELS: Record<PipelineStageName, string> = {
  research: "Research",
  summarize: "Summarize",
  critique: "Critique",
  finalize: "Finalize",
};

export const INITIAL_PIPELINE_STAGES: PipelineStage[] = [
  { name: "research", status: "pending" },
  { name: "summarize", status: "pending" },
  { name: "critique", status: "pending" },
  { name: "finalize", status: "pending" },
];

/** Live view of the multi-agent pipeline, updated in real time from SSE stage events. */
export default function PipelineView({ stages }: { stages: PipelineStage[] }) {
  return (
    <div className="space-y-1">
      {stages.map((stage, idx) => (
        <div key={stage.name} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <motion.div
              animate={
                stage.status === "active"
                  ? { scale: [1, 1.15, 1] }
                  : { scale: 1 }
              }
              transition={{ repeat: stage.status === "active" ? Infinity : 0, duration: 1.1 }}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors duration-300 ${
                stage.status === "done"
                  ? "bg-gradient-to-br from-violet-500 to-violet-700 text-white"
                  : stage.status === "active"
                  ? "bg-violet-100 text-violet-600 ring-2 ring-violet-300"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {stage.status === "done" ? (
                  <motion.svg
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </motion.svg>
                ) : (
                  <motion.span key="num" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    {idx + 1}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
            {idx < stages.length - 1 && (
              <div className="w-px h-5 bg-slate-200 overflow-hidden">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: stage.status === "done" ? "100%" : "0%" }}
                  transition={{ duration: 0.4 }}
                  className="w-full bg-violet-400"
                />
              </div>
            )}
          </div>
          <div className="pt-0.5 pb-1">
            <div
              className={`text-sm font-medium transition-colors ${
                stage.status === "pending" ? "text-slate-400" : "text-slate-800"
              }`}
            >
              {STAGE_LABELS[stage.name]}
            </div>
            <AnimatePresence>
              {stage.detail && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-xs text-slate-500 overflow-hidden"
                >
                  {stage.detail}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}

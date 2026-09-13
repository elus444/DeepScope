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
    <div className="space-y-2">
      {stages.map((stage, idx) => (
        <div key={stage.name} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                stage.status === "done"
                  ? "bg-green-500 text-white"
                  : stage.status === "active"
                  ? "bg-blue-500 text-white animate-pulse"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {stage.status === "done" ? "✓" : idx + 1}
            </div>
            {idx < stages.length - 1 && (
              <div className={`w-px h-5 ${stage.status === "done" ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
          <div className="pt-0.5">
            <div
              className={`text-sm font-medium ${
                stage.status === "pending" ? "text-gray-400" : "text-gray-800"
              }`}
            >
              {STAGE_LABELS[stage.name]}
            </div>
            {stage.detail && <div className="text-xs text-gray-500">{stage.detail}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

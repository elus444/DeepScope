import { Fragment } from "react";
import { CitationOut } from "../lib/api";

/**
 * Renders assistant text, turning each "[N]" citation marker the LLM
 * wrote into a clickable button that opens that exact source chunk --
 * "click a claim, jump to its source" instead of a flat source list.
 */
export default function MessageContent({
  content,
  citations,
  onCiteClick,
}: {
  content: string;
  citations: CitationOut[];
  onCiteClick: (citation: CitationOut) => void;
}) {
  const parts = content.split(/(\[\d+\])/g);

  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (!match) return <Fragment key={i}>{part}</Fragment>;

        const citation = citations.find((c) => c.index === Number(match[1]));
        if (!citation) return <Fragment key={i}>{part}</Fragment>;

        return (
          <button
            key={i}
            onClick={() => onCiteClick(citation)}
            className="inline-flex items-center justify-center mx-0.5 px-1.5 h-4 align-super text-[10px] font-bold rounded bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
            title={`Jump to source: ${citation.filename}`}
          >
            {match[1]}
          </button>
        );
      })}
    </span>
  );
}

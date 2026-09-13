import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CitationOut } from "../lib/api";

/**
 * Renders assistant text as actual formatted markdown (Gemini routinely
 * answers with headers/bold/bullets for structured questions -- without
 * this it all prints as literal "**bold**"/"### Heading" characters,
 * which is what read as a "weird font").
 *
 * Citation markers like "[N]" are rewritten into markdown links pointing
 * at a fake "citation:" scheme *before* parsing, so remark treats them
 * as ordinary links -- then the custom `a` renderer below intercepts
 * that scheme and renders a clickable citation chip instead of an
 * anchor tag, while normal links still render normally.
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
  const withCitationLinks = content.replace(/\[(\d+)\]/g, (match, num) => {
    const citation = citations.find((c) => c.index === Number(num));
    return citation ? `[${num}](citation:${num})` : match;
  });

  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith("citation:")) {
              const num = href.replace("citation:", "");
              const citation = citations.find((c) => c.index === Number(num));
              return (
                <button
                  onClick={() => citation && onCiteClick(citation)}
                  className="inline-flex items-center justify-center mx-0.5 px-1.5 h-4 align-super text-[10px] font-bold rounded bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
                  title={citation ? `Jump to source: ${citation.filename}` : undefined}
                >
                  {num}
                </button>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-600 underline hover:text-violet-700">
                {children}
              </a>
            );
          },
        }}
      >
        {withCitationLinks}
      </ReactMarkdown>
    </div>
  );
}

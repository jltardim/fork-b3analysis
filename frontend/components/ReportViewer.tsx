"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Disclaimer from "./Disclaimer";

interface ReportViewerProps {
  content: string;
  showDisclaimer?: boolean;
}

export function ReportViewer({
  content,
  showDisclaimer = true,
}: ReportViewerProps) {
  return (
    <div className="mx-auto max-w-4xl">
      {showDisclaimer && <Disclaimer />}

      <article
        className="
          prose prose-invert prose-slate
          max-w-none
          prose-headings:text-white prose-headings:font-semibold
          prose-h1:text-2xl prose-h1:border-b prose-h1:border-slate-700 prose-h1:pb-3
          prose-h2:text-xl prose-h2:mt-8
          prose-h3:text-lg
          prose-p:text-slate-300 prose-p:leading-relaxed
          prose-strong:text-white
          prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
          prose-code:text-emerald-400 prose-code:bg-slate-800 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5
          prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700
          prose-table:text-sm
          prose-th:text-slate-300 prose-th:border-slate-600
          prose-td:border-slate-700 prose-td:text-slate-400
          prose-li:text-slate-300
          prose-blockquote:border-blue-500 prose-blockquote:text-slate-400
          print:text-black print:prose-headings:text-black print:prose-p:text-gray-800
        "
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  );
}

"use client";

import ReactMarkdown from "react-markdown";

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold text-heading">{children}</strong>
        ),
        ul: ({ children }) => (
          <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li className="marker:text-subtle">{children}</li>,
        h1: ({ children }) => (
          <p className="mb-1 font-semibold text-heading">{children}</p>
        ),
        h2: ({ children }) => (
          <p className="mb-1 font-semibold text-heading">{children}</p>
        ),
        h3: ({ children }) => (
          <p className="mb-1 font-semibold text-heading">{children}</p>
        ),
        code: ({ children }) => (
          <code className="rounded bg-background px-1 py-0.5 font-mono text-xs text-heading">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="mb-2 overflow-x-auto rounded-md bg-background p-2 text-xs last:mb-0">
            {children}
          </pre>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
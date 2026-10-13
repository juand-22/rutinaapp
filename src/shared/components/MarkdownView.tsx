import { useMemo } from "react";
import { parseMarkdown } from "./markdown";

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export default function MarkdownView({ content, className }: MarkdownViewProps) {
  const html = useMemo(() => parseMarkdown(content), [content]);

  if (!content.trim()) return null;

  return (
    <div
      className={`md-content ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

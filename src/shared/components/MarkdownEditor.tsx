import { useRef, type TextareaHTMLAttributes } from "react";
import {
  BoldIcon,
  CodeBlockIcon,
  CodeIcon,
  HeadingIcon,
  ItalicIcon,
  ListIconAlt,
  QuoteIcon,
} from "./Icons";

interface MarkdownEditorProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

type ToolKey =
  | "heading"
  | "bold"
  | "italic"
  | "code"
  | "codeblock"
  | "list"
  | "quote";

const TOOLS: { key: ToolKey; label: string; icon: typeof BoldIcon }[] = [
  { key: "heading", label: "Título", icon: HeadingIcon },
  { key: "bold", label: "Negrita", icon: BoldIcon },
  { key: "italic", label: "Cursiva", icon: ItalicIcon },
  { key: "code", label: "Código", icon: CodeIcon },
  { key: "codeblock", label: "Bloque de código", icon: CodeBlockIcon },
  { key: "list", label: "Lista", icon: ListIconAlt },
  { key: "quote", label: "Cita", icon: QuoteIcon },
];

export default function MarkdownEditor({
  value,
  onChange,
  ...props
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (
    before: string,
    after: string = "",
    placeholder: string = "",
  ) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const newValue =
      value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(newValue);
    requestAnimationFrame(() => {
      ta.focus();
      const selStart = start + before.length;
      ta.setSelectionRange(selStart, selStart + selected.length);
    });
  };

  const prefixLine = (prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", end);
    const realEnd = lineEnd === -1 ? value.length : lineEnd;
    const block = value.slice(lineStart, realEnd);
    const prefixed = block
      .split("\n")
      .map((l) => prefix + l)
      .join("\n");
    const newValue =
      value.slice(0, lineStart) + prefixed + value.slice(realEnd);
    onChange(newValue);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(
        lineStart + prefix.length,
        lineStart + prefix.length + prefixed.length,
      );
    });
  };

  const handleTool = (key: ToolKey) => {
    switch (key) {
      case "heading":
        prefixLine("## ");
        break;
      case "bold":
        insertAtCursor("**", "**", "negrita");
        break;
      case "italic":
        insertAtCursor("*", "*", "cursiva");
        break;
      case "code":
        insertAtCursor("`", "`", "código");
        break;
      case "codeblock":
        insertAtCursor("```\n", "\n```", "// tu código");
        break;
      case "list":
        prefixLine("- ");
        break;
      case "quote":
        prefixLine("> ");
        break;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50 dark:bg-white/5 focus-within:ring-2 focus-within:ring-primary-500 transition">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] overflow-x-auto no-scrollbar">
        {TOOLS.map((tool) => (
          <button
            key={tool.key}
            type="button"
            onClick={() => handleTool(tool.key)}
            title={tool.label}
            aria-label={tool.label}
            className="flex-shrink-0 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <tool.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="w-full px-4 py-3 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none font-mono text-sm leading-relaxed"
        {...props}
      />
    </div>
  );
}

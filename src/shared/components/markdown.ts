/**
 * Parser Markdown ligero y seguro.
 * Soporta: # encabezados, **negrita**, *cursiva*, `código inline`,
 * bloques de código ```, listas - y 1., citas > y párrafos.
 *
 * El HTML de entrada se escapa para evitar XSS; solo se generan las etiquetas
 * propias del Markdown.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(text: string): string {
  // Código inline: `code`
  text = text.replace(/`([^`]+)`/g, '<code class="md-code">$1</code>');
  // Negrita: **text**
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Cursiva: *text* (que no sea parte de negrita)
  text = text.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  // Enlaces [text](url)
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return text;
}

export function parseMarkdown(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Bloque de código ```
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1] ?? "";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].match(/^```\s*$/)) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // saltar el cierre ```
      const code = escapeHtml(codeLines.join("\n"));
      out.push(
        `<pre class="md-pre"><code class="md-codeblock language-${escapeHtml(
          lang,
        )}">${code}</code></pre>`,
      );
      continue;
    }

    // Encabezados
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const content = renderInline(escapeHtml(heading[2]));
      out.push(`<h${level} class="md-h${level}">${content}</h${level}>`);
      i++;
      continue;
    }

    // Cita
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      const content = renderInline(escapeHtml(quoteLines.join(" ")));
      out.push(`<blockquote class="md-quote">${content}</blockquote>`);
      continue;
    }

    // Lista desordenada
    if (line.match(/^[-*]\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
        items.push(renderInline(escapeHtml(lines[i].replace(/^[-*]\s+/, ""))));
        i++;
      }
      out.push(
        `<ul class="md-ul">${items.map((it) => `<li>${it}</li>`).join("")}</ul>`,
      );
      continue;
    }

    // Lista ordenada
    if (line.match(/^\d+\.\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        items.push(renderInline(escapeHtml(lines[i].replace(/^\d+\.\s+/, ""))));
        i++;
      }
      out.push(
        `<ol class="md-ol">${items.map((it) => `<li>${it}</li>`).join("")}</ol>`,
      );
      continue;
    }

    // Línea vacía
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Párrafo (agrupa líneas consecutivas no vacías)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].match(/^#{1,3}\s/) &&
      !lines[i].startsWith("> ") &&
      !lines[i].match(/^[-*]\s+/) &&
      !lines[i].match(/^\d+\.\s+/) &&
      !lines[i].match(/^```/)
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    const content = renderInline(escapeHtml(paraLines.join(" ")));
    out.push(`<p class="md-p">${content}</p>`);
  }

  return out.join("");
}

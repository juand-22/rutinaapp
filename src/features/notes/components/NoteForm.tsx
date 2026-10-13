import { useState } from "react";
import type { Note, NoteColor } from "../../../shared/db/database";
import { db } from "../../../shared/db/database";
import Modal from "../../../shared/components/Modal";
import MarkdownEditor from "../../../shared/components/MarkdownEditor";
import MarkdownView from "../../../shared/components/MarkdownView";
import { EyeIcon, PlusIcon } from "../../../shared/components/Icons";
import { NOTE_COLORS } from "../constants";

interface NoteFormProps {
  open: boolean;
  onClose: () => void;
  editing: Note | null;
}

export default function NoteForm({ open, onClose, editing }: NoteFormProps) {
  const [title, setTitle] = useState(() => editing?.title ?? "");
  const [content, setContent] = useState(() => editing?.content ?? "");
  const [color, setColor] = useState<NoteColor>(() => editing?.color ?? "yellow");
  const [preview, setPreview] = useState(true);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    const data = {
      title: title.trim(),
      content: content.trim(),
      color,
      updatedAt: now,
    };

    if (editing) {
      await db.notes.update(editing.id!, data);
    } else {
      await db.notes.add({ ...data, createdAt: now });
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar nota" : "Nueva nota"}
    >
      <form onSubmit={save} className="space-y-4">
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título (opcional)"
          maxLength={80}
          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
        />

        {/* Toggle edición / vista previa */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Contenido (Markdown)
          </span>
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              preview
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            <EyeIcon className="w-3.5 h-3.5" />
            {preview ? "Editar" : "Vista previa"}
          </button>
        </div>

        {preview ? (
          <div className="min-h-[320px] px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-y-auto max-h-[55vh]">
            {content.trim() ? (
              <MarkdownView content={content} />
            ) : (
              <p className="text-sm text-slate-400 italic">
                Escribe algo para ver la vista previa...
              </p>
            )}
          </div>
        ) : (
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Escribe tu nota... Puedes usar # títulos, **negrita**, `código`, etc."
            rows={14}
            maxLength={5000}
          />
        )}

        {/* Selector de color */}
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Color
          </p>
          <div className="flex gap-2 flex-wrap">
            {NOTE_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setColor(c.key)}
                aria-label={`Color ${c.key}`}
                className={`w-9 h-9 rounded-full ${c.swatch} transition-transform ${
                  color === c.key
                    ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110 ring-offset-white dark:ring-offset-[#1a1726]"
                    : "hover:scale-105"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 py-3 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/25 transition inline-flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-4 h-4" strokeWidth={2.5} />
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}

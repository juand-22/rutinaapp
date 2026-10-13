import { useState } from "react";
import type { Note } from "../../../shared/db/database";
import { db } from "../../../shared/db/database";
import { formatShortDate } from "../../../shared/utils/date";
import { NOTE_COLOR_MAP } from "../constants";
import { TrashIcon } from "../../../shared/components/Icons";
import MarkdownView from "../../../shared/components/MarkdownView";
import ConfirmDialog from "../../../shared/components/ConfirmDialog";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
}

export default function NoteCard({ note, onEdit }: NoteCardProps) {
  const color = NOTE_COLOR_MAP[note.color];
  const [confirmOpen, setConfirmOpen] = useState(false);

  const remove = async () => {
    await db.notes.delete(note.id!);
    setConfirmOpen(false);
  };

  return (
    <div
      className={`group relative text-left p-4 rounded-2xl ${color.bg} ring-1 ring-black/5 dark:ring-white/10 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col min-h-[110px] cursor-pointer`}
      onClick={() => onEdit(note)}
    >
      {note.title && (
        <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 mb-1 pr-6">
          {note.title}
        </h3>
      )}
      {note.content && (
        <div className="text-sm text-slate-700 dark:text-slate-300 flex-1 line-clamp-[8] break-words">
          <MarkdownView content={note.content} />
        </div>
      )}
      {!note.title && !note.content && (
        <p className="text-sm text-slate-400 italic">Nota vacía</p>
      )}

      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
        {formatShortDate(note.updatedAt)}
      </span>

      {/* Botón eliminar */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setConfirmOpen(true);
        }}
        aria-label="Eliminar nota"
        className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-500/0 group-hover:text-slate-600 group-hover:bg-black/5 dark:group-hover:text-slate-300 dark:group-hover:bg-white/10 transition-all"
      >
        <TrashIcon className="w-4 h-4" />
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar nota"
        message={
          <>
            ¿Seguro que quieres eliminar esta nota
            {note.title ? (
              <>
                {" "}
                <strong>{note.title}</strong>
              </>
            ) : null}
            ? Esta acción no se puede deshacer.
          </>
        }
        onConfirm={remove}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

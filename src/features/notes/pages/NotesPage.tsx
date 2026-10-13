import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Note } from "../../../shared/db/database";
import NoteCard from "../components/NoteCard";
import NoteForm from "../components/NoteForm";
import { NoteIcon, PlusIcon, SearchIcon } from "../../../shared/components/Icons";

export default function NotesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [query, setQuery] = useState("");

  const notes = useLiveQuery(
    () => db.notes.orderBy("updatedAt").reverse().toArray(),
    [],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
    );
  }, [notes, query]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (note: Note) => {
    setEditing(note);
    setFormOpen(true);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-5 pt-8 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Notas rápidas
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Tus ideas y apuntes al instante
        </p>

        {/* Buscador */}
        <div className="relative mt-5">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nota..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-[#1a1726] ring-1 ring-slate-900/5 dark:ring-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
          />
        </div>
      </header>

      {/* Grid de notas */}
      <div className="px-5">
        {filtered.length === 0 ? (
          <EmptyState hasQuery={!!query.trim()} onCreate={openNew} />
        ) : (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            {filtered.map((note) => (
              <NoteCard key={note.id} note={note} onEdit={openEdit} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openNew}
        aria-label="Nueva nota"
        className="fixed bottom-24 right-5 z-30 w-14 h-14 rounded-full bg-primary-600 text-white shadow-xl shadow-primary-600/40 flex items-center justify-center hover:bg-primary-700 hover:scale-105 active:scale-95 transition-all"
      >
        <PlusIcon className="w-7 h-7" strokeWidth={2.5} />
      </button>

      <NoteForm
        key={editing?.id ?? "new"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
      />
    </div>
  );
}

function EmptyState({
  hasQuery,
  onCreate,
}: {
  hasQuery: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
        <NoteIcon className="w-10 h-10 text-primary-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        {hasQuery ? "Sin resultados" : "Aún no hay notas"}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
        {hasQuery
          ? "No encontramos notas que coincidan con tu búsqueda."
          : "Crea tu primera nota rápida y nunca se te olvide nada."}
      </p>
      {!hasQuery && (
        <button
          onClick={onCreate}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-600 text-white font-medium hover:bg-primary-700 transition"
        >
          <PlusIcon className="w-4 h-4" />
          Crear nota
        </button>
      )}
    </div>
  );
}

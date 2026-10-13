import { useState } from "react";
import type { RepeatType, Task } from "../../../shared/db/database";
import { db } from "../../../shared/db/database";
import { computeRepeatEnd } from "../../../shared/utils/date";
import Modal from "../../../shared/components/Modal";

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  editing: Task | null;
}

const REPEAT_OPTIONS: { value: RepeatType; label: string }[] = [
  { value: "forever", label: "Siempre" },
  { value: "days", label: "Días" },
  { value: "weeks", label: "Semanas" },
  { value: "months", label: "Meses" },
];

export default function TaskForm({ open, onClose, editing }: TaskFormProps) {
  const [title, setTitle] = useState(() => editing?.title ?? "");
  const [time, setTime] = useState(() => editing?.time ?? "08:00");
  const [repeatType, setRepeatType] = useState<RepeatType>(
    () => editing?.repeatType ?? "forever",
  );
  const [repeatValue, setRepeatValue] = useState(() => editing?.repeatValue ?? 7);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !time) return;

    const now = Date.now();
    const createdAt = editing?.createdAt ?? now;
    const repeatEnd = computeRepeatEnd(createdAt, repeatType, repeatValue);

    const data = {
      title: trimmed,
      time,
      repeatType,
      repeatValue,
      repeatEnd,
    };

    if (editing) {
      await db.tasks.update(editing.id!, data);
    } else {
      await db.tasks.add({
        ...data,
        createdAt,
        completedDates: [],
      });
    }
    onClose();
  };

  const showValue = repeatType !== "forever";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar tarea" : "Nueva tarea"}
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            ¿Qué tienes que hacer?
          </label>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Tomar medicamento"
            maxLength={100}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Hora
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
          />
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Esta tarea se repetirá todos los días a esta hora.
          </p>
        </div>

        {/* Repetición */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            ¿Cuánto tiempo se repetirá?
          </label>
          <div className="grid grid-cols-4 gap-2">
            {REPEAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRepeatType(opt.value)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                  repeatType === opt.value
                    ? "bg-primary-600 text-white shadow-md shadow-primary-600/25"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {showValue && (
            <div className="mt-3 flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={365}
                value={repeatValue}
                onChange={(e) =>
                  setRepeatValue(Math.max(1, Number(e.target.value) || 1))
                }
                className="w-20 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {repeatType === "days"
                  ? "días"
                  : repeatType === "weeks"
                    ? "semanas"
                    : "meses"}
              </span>
            </div>
          )}
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
            disabled={!title.trim()}
            className="flex-1 py-3 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary-600/25 transition"
          >
            {editing ? "Guardar" : "Crear"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

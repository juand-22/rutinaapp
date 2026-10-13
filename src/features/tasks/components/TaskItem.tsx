import { useState } from "react";
import type { Task } from "../../../shared/db/database";
import { db } from "../../../shared/db/database";
import {
  formatKeyShort,
  formatTime,
  isExpired,
  todayKey,
} from "../../../shared/utils/date";
import {
  CheckIcon,
  ClockIcon,
  PowerOffIcon,
  RepeatIcon,
  TrashIcon,
} from "../../../shared/components/Icons";
import ConfirmDialog from "../../../shared/components/ConfirmDialog";

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export default function TaskItem({ task, onEdit }: TaskItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const today = todayKey();
  const done = task.completedDates.includes(today);
  const expired = isExpired(task);

  const toggle = async () => {
    if (expired) return;
    const dates = task.completedDates.includes(today)
      ? task.completedDates.filter((d) => d !== today)
      : [...task.completedDates, today];
    await db.tasks.update(task.id!, { completedDates: dates });
  };

  const remove = async () => {
    await db.tasks.delete(task.id!);
    setConfirmOpen(false);
  };

  const repeatLabel =
    task.repeatType === "forever"
      ? "Siempre"
      : `${task.repeatValue} ${
          task.repeatType === "days"
            ? "días"
            : task.repeatType === "weeks"
              ? "semanas"
              : "meses"
        }`;

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
        expired
          ? "bg-slate-100 dark:bg-white/[0.03] opacity-60"
          : done
            ? "bg-primary-50 dark:bg-primary-900/20"
            : "bg-white dark:bg-[#1a1726] hover:bg-slate-50 dark:hover:bg-white/5 ring-1 ring-slate-900/5 dark:ring-white/5"
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={toggle}
        disabled={expired}
        aria-label={done ? "Marcar como pendiente" : "Marcar como completada"}
        className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          expired
            ? "border-slate-300 dark:border-slate-700 cursor-not-allowed"
            : done
              ? "bg-primary-600 border-primary-600"
              : "border-slate-300 dark:border-slate-600 hover:border-primary-500"
        }`}
      >
        {done && !expired && (
          <CheckIcon
            className="w-4 h-4 text-white animate-check"
            strokeWidth={3}
          />
        )}
        {expired && <PowerOffIcon className="w-3.5 h-3.5 text-slate-400" />}
      </button>

      {/* Contenido */}
      <button
        onClick={() => !expired && onEdit(task)}
        disabled={expired}
        className="flex-1 text-left min-w-0"
      >
        <p
          className={`font-medium truncate transition-colors ${
            expired
              ? "text-slate-400 dark:text-slate-500"
              : done
                ? "text-slate-400 line-through dark:text-slate-500"
                : "text-slate-900 dark:text-white"
          }`}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <ClockIcon className="w-3 h-3" />
            {formatTime(task.time)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <RepeatIcon className="w-3 h-3" />
            {repeatLabel}
          </span>
          {expired && task.repeatEnd && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <PowerOffIcon className="w-3 h-3" />
              Finalizó {formatKeyShort(task.repeatEnd)}
            </span>
          )}
        </div>
      </button>

      {/* Eliminar */}
      <button
        onClick={() => setConfirmOpen(true)}
        aria-label="Eliminar tarea"
        className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-60 group-hover:opacity-100 transition-all"
      >
        <TrashIcon className="w-4 h-4" />
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar tarea"
        message={
          <>
            ¿Seguro que quieres eliminar <strong>{task.title}</strong>? Esta
            acción no se puede deshacer.
          </>
        }
        onConfirm={remove}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

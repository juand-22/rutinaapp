import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Task } from "../../../shared/db/database";
import {
  compareTime,
  formatLongDate,
  isExpired,
  todayKey,
} from "../../../shared/utils/date";
import TaskItem from "../components/TaskItem";
import TaskForm from "../components/TaskForm";
import {
  CheckCircleIcon,
  PlusIcon,
  PowerOffIcon,
} from "../../../shared/components/Icons";

export default function TaskPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const tasks = useLiveQuery(() => db.tasks.orderBy("time").toArray(), [], []);

  const { active, expired, stats } = useMemo(() => {
    const today = todayKey();
    const activeTasks: Task[] = [];
    const expiredTasks: Task[] = [];
    for (const t of tasks) {
      if (isExpired(t)) expiredTasks.push(t);
      else activeTasks.push(t);
    }
    const total = activeTasks.length;
    const done = activeTasks.filter((t) =>
      t.completedDates.includes(today),
    ).length;
    return {
      active: activeTasks,
      expired: expiredTasks,
      stats: {
        total,
        done,
        percent: total ? Math.round((done / total) * 100) : 0,
      },
    };
  }, [tasks]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setFormOpen(true);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-5 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Mis tareas
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 capitalize mt-0.5">
          {formatLongDate()}
        </p>

        {/* Barra de progreso */}
        {stats.total > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {stats.done} de {stats.total} completadas
              </span>
              <span className="font-semibold text-primary-600 dark:text-primary-400">
                {stats.percent}%
              </span>
            </div>
            <div className="h-2.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Lista de tareas activas */}
      <div className="px-5 space-y-2.5">
        {active.length === 0 && expired.length === 0 ? (
          <EmptyState onCreate={openNew} />
        ) : (
          active
            .slice()
            .sort((a, b) => compareTime(a.time, b.time))
            .map((task) => (
              <TaskItem key={task.id} task={task} onEdit={openEdit} />
            ))
        )}
      </div>

      {/* Sección de tareas finalizadas */}
      {expired.length > 0 && (
        <div className="px-5 mt-8">
          <div className="flex items-center gap-2 mb-3">
            <PowerOffIcon className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Finalizadas ({expired.length})
            </h2>
          </div>
          <div className="space-y-2.5">
            {expired
              .slice()
              .sort((a, b) => compareTime(a.time, b.time))
              .map((task) => (
                <TaskItem key={task.id} task={task} onEdit={openEdit} />
              ))}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={openNew}
        aria-label="Nueva tarea"
        className="fixed bottom-24 right-5 z-30 w-14 h-14 rounded-full bg-primary-600 text-white shadow-xl shadow-primary-600/40 flex items-center justify-center hover:bg-primary-700 hover:scale-105 active:scale-95 transition-all"
      >
        <PlusIcon className="w-7 h-7" strokeWidth={2.5} />
      </button>

      <TaskForm
        key={editing?.id ?? "new"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
      />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
        <CheckCircleIcon className="w-10 h-10 text-primary-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Aún no hay tareas
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
        Crea tu primera tarea diaria y empieza a construir tu rutina.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-600 text-white font-medium hover:bg-primary-700 transition"
      >
        <PlusIcon className="w-4 h-4" />
        Crear tarea
      </button>
    </div>
  );
}

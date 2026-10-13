import type { RepeatType, Task } from "../db/database";

/** Devuelve la clave YYYY-MM-DD de hoy (hora local) */
export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Convierte "YYYY-MM-DD" a Date (hora local, medianoche) */
export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Suma N días a una fecha */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Suma N semanas a una fecha */
export function addWeeks(date: Date, n: number): Date {
  return addDays(date, n * 7);
}

/** Suma N meses a una fecha */
export function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  const targetMonth = d.getMonth() + n;
  d.setMonth(targetMonth);
  // Si el día no existe en el mes destino (ej: 31 en feb), ajusta al último día
  if (d.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    d.setDate(0);
  }
  return d;
}

/**
 * Calcula la fecha de fin de repetición (YYYY-MM-DD) a partir de la fecha de
 * creación, el tipo y la cantidad. null si es para siempre.
 */
export function computeRepeatEnd(
  createdAt: number,
  type: RepeatType,
  value: number,
): string | null {
  if (type === "forever") return null;
  const start = new Date(createdAt);
  let end: Date;
  switch (type) {
    case "days":
      end = addDays(start, value - 1);
      break;
    case "weeks":
      end = addWeeks(start, value - 1);
      break;
    case "months":
      end = addMonths(start, value - 1);
      break;
  }
  return todayKey(end);
}

/** Indica si la tarea ya expiró (hoy > repeatEnd) */
export function isExpired(task: Task): boolean {
  if (!task.repeatEnd) return false;
  return todayKey() > task.repeatEnd;
}

/** Convierte "HH:MM" a formato legible en español, p. ej. "14:30" -> "2:30 PM" */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Formatea una fecha a "Lunes, 13 de octubre" */
export function formatLongDate(date: Date = new Date()): string {
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Formatea una clave YYYY-MM-DD a "13 oct" */
export function formatKeyShort(key: string): string {
  return parseKey(key).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

/** Formatea timestamp a "13 oct" */
export function formatShortDate(ts: number): string {
  return new Date(ts).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

/** Compara dos cadenas HH:MM y devuelve -1, 0, 1 */
export function compareTime(a: string, b: string): number {
  return a.localeCompare(b);
}

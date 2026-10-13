import Dexie, { type Table } from "dexie";

export type RepeatType = "forever" | "days" | "weeks" | "months";

export interface Task {
  id?: number;
  title: string;
  /** Hora en formato HH:MM (24h) a la que debe realizarse cada día */
  time: string;
  createdAt: number;
  /** Fechas (YYYY-MM-DD) en las que la tarea fue completada */
  completedDates: string[];
  /** Tipo de repetición: para siempre o por un periodo limitado */
  repeatType: RepeatType;
  /** Cantidad de días/semanas/meses que se repetirá (ignorado si repeatType es forever) */
  repeatValue: number;
  /** Última fecha (YYYY-MM-DD) en la que la tarea se repite. null = indefinido */
  repeatEnd: string | null;
}

export interface Note {
  id?: number;
  title: string;
  /** Contenido en formato Markdown */
  content: string;
  /** Clave de color para la tarjeta */
  color: NoteColor;
  createdAt: number;
  updatedAt: number;
}

export type NoteColor =
  | "yellow"
  | "pink"
  | "green"
  | "blue"
  | "purple"
  | "orange";

class RutinaDatabase extends Dexie {
  tasks!: Table<Task, number>;
  notes!: Table<Note, number>;

  constructor() {
    super("rutina-db");
    this.version(2).stores({
      tasks: "++id, title, time, createdAt, repeatEnd",
      notes: "++id, title, color, updatedAt",
    });
  }
}

export const db = new RutinaDatabase();

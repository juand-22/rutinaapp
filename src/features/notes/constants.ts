import type { NoteColor } from "../../shared/db/database";

interface NoteColorOption {
  key: NoteColor;
  /** Clases de Tailwind para el fondo de la tarjeta */
  bg: string;
  /** Color sólido para el selector (swatch) */
  swatch: string;
}

export const NOTE_COLORS: NoteColorOption[] = [
  { key: "yellow", bg: "bg-amber-100 dark:bg-amber-900/30", swatch: "bg-amber-400" },
  { key: "pink", bg: "bg-pink-100 dark:bg-pink-900/30", swatch: "bg-pink-400" },
  { key: "green", bg: "bg-green-100 dark:bg-green-900/30", swatch: "bg-green-400" },
  { key: "blue", bg: "bg-blue-100 dark:bg-blue-900/30", swatch: "bg-blue-400" },
  { key: "purple", bg: "bg-purple-100 dark:bg-purple-900/30", swatch: "bg-purple-400" },
  { key: "orange", bg: "bg-orange-100 dark:bg-orange-900/30", swatch: "bg-orange-400" },
];

export const NOTE_COLOR_MAP: Record<NoteColor, NoteColorOption> =
  NOTE_COLORS.reduce(
    (acc, c) => {
      acc[c.key] = c;
      return acc;
    },
    {} as Record<NoteColor, NoteColorOption>,
  );

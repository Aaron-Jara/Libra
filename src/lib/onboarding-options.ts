export const GENRE_OPTIONS = [
  "Sci-Fi",
  "Fantasy",
  "Thriller",
  "Mystery",
  "Literary Fiction",
  "Self-Improvement",
  "Philosophy",
  "Horror",
] as const;

export const READING_STYLE_OPTIONS = [
  "Fast-paced",
  "Emotional",
  "Character-focused",
  "Intellectual",
  "Deep worldbuilding",
  "Philosophical",
  "Plot twists",
  "Minimal filler",
] as const;

export type GenreOption = (typeof GENRE_OPTIONS)[number];
export type ReadingStyleOption = (typeof READING_STYLE_OPTIONS)[number];

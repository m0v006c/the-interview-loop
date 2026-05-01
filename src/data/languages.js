/**
 * Shared language registry.
 *
 * The Notepad component maps these ids to CodeMirror language extensions.
 * The scoring prompt uses the human-readable label so the reference-solution
 * code block is generated in whichever language the user was working in.
 */

export const LANGUAGES = [
  { id: "java",       label: "Java" },
  { id: "python",     label: "Python" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "cpp",        label: "C++" },
  { id: "go",         label: "Go" },
  { id: "plain",      label: "Plain text" },
];

export const DEFAULT_LANGUAGE_ID = "java";

export function getLanguageLabel(id) {
  const found = LANGUAGES.find((l) => l.id === id);
  if (!found) return "Java";
  // For "plain", fall back to Java for code generation in the reference solution.
  if (found.id === "plain") return "Java";
  return found.label;
}

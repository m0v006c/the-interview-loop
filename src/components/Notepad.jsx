import { useMemo, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { go } from "@codemirror/lang-go";
import { autocompletion } from "@codemirror/autocomplete";
import { EditorView, keymap } from "@codemirror/view";
import { indentMore, indentLess } from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { useInterviewStore } from "@/lib/store";
import { LANGUAGES } from "@/data/languages";

// Map language ids → CodeMirror extension builder. Order in UI follows LANGUAGES array.
const LANG_EXT = {
  python:     () => python(),
  javascript: () => javascript(),
  typescript: () => javascript({ typescript: true }),
  java:       () => java(),
  cpp:        () => cpp(),
  go:         () => go(),
  plain:      () => null,
};

// Keyword lists per language — seed the autocomplete cache.
// Buffer-word matching (see autocompleteSource below) adds user-typed identifiers on top.
const KEYWORDS = {
  python: [
    "def", "class", "if", "elif", "else", "for", "while", "return", "yield",
    "import", "from", "as", "try", "except", "finally", "raise", "with",
    "True", "False", "None", "and", "or", "not", "in", "is", "lambda",
    "pass", "break", "continue", "global", "nonlocal", "self", "print",
    "len", "range", "enumerate", "zip", "map", "filter", "sorted", "list",
    "dict", "set", "tuple", "str", "int", "float", "bool", "isinstance",
    "super", "async", "await",
  ],
  javascript: [
    "function", "const", "let", "var", "if", "else", "for", "while", "do",
    "return", "switch", "case", "break", "continue", "class", "extends",
    "import", "export", "from", "default", "new", "this", "super", "async",
    "await", "try", "catch", "finally", "throw", "typeof", "instanceof",
    "true", "false", "null", "undefined", "console", "log", "Array", "Object",
    "Map", "Set", "Promise", "JSON",
  ],
  typescript: [
    "function", "const", "let", "var", "if", "else", "for", "while", "do",
    "return", "switch", "case", "break", "continue", "class", "extends",
    "implements", "import", "export", "from", "default", "new", "this",
    "super", "async", "await", "try", "catch", "finally", "throw", "typeof",
    "instanceof", "interface", "type", "enum", "readonly", "public", "private",
    "protected", "abstract", "static", "string", "number", "boolean", "void",
    "any", "unknown", "never", "true", "false", "null", "undefined",
  ],
  java: [
    "public", "private", "protected", "class", "interface", "extends",
    "implements", "static", "final", "abstract", "void", "int", "long",
    "double", "float", "boolean", "char", "String", "if", "else", "for",
    "while", "do", "switch", "case", "break", "continue", "return", "new",
    "this", "super", "try", "catch", "finally", "throw", "throws", "package",
    "import", "null", "true", "false", "enum", "instanceof", "List", "Map",
    "Set", "ArrayList", "HashMap", "HashSet",
  ],
  cpp: [
    "int", "long", "double", "float", "char", "bool", "void", "auto",
    "const", "constexpr", "static", "class", "struct", "public", "private",
    "protected", "virtual", "override", "final", "if", "else", "for", "while",
    "do", "switch", "case", "break", "continue", "return", "new", "delete",
    "this", "nullptr", "true", "false", "namespace", "using", "template",
    "typename", "std", "string", "vector", "map", "unordered_map", "set",
    "unordered_set", "cout", "cin", "endl", "size_t",
  ],
  go: [
    "func", "package", "import", "var", "const", "type", "struct", "interface",
    "if", "else", "for", "range", "switch", "case", "break", "continue",
    "return", "go", "defer", "select", "chan", "map", "true", "false", "nil",
    "make", "new", "len", "cap", "append", "copy", "string", "int", "int64",
    "float64", "bool", "byte", "rune", "error",
  ],
};

// ─── Code formatting (simple language-aware indent) ────────────────
//
// Re-indents each line based on brace/paren depth (C-style) or colon-indent
// (Python). Not Prettier — just consistent indentation so messy code snaps
// to 2-space indents.
function formatByIndent(code, language) {
  const lines = code.split("\n");
  const INDENT = "  ";

  if (language === "python") {
    // Python: respect existing indent structure but normalize to 2 spaces.
    // Count leading whitespace in steps of 2 or 4 and rewrite as 2-space units.
    let prevIndent = 0;
    return lines
      .map((line) => {
        const trimmed = line.replace(/^\s+/, "");
        if (!trimmed) return "";
        const leadingSpaces = line.length - trimmed.length;
        const origTabs = (line.match(/^\t+/)?.[0]?.length) || 0;
        // Normalize: treat 4 spaces OR 1 tab as one indent level
        let level = origTabs + Math.floor(leadingSpaces / 4);
        // Fallback: if user was already using 2-space indents, respect that
        if (!origTabs && leadingSpaces > 0 && leadingSpaces % 4 !== 0 && leadingSpaces % 2 === 0) {
          level = leadingSpaces / 2;
        }
        // Don't let indent jump by more than 1 level compared to previous non-blank
        if (level > prevIndent + 1) level = prevIndent + 1;
        prevIndent = level;
        return INDENT.repeat(level) + trimmed;
      })
      .join("\n");
  }

  // C-style (JS/TS/Java/C++/Go): indent tracks brace/paren depth
  let depth = 0;
  return lines
    .map((raw) => {
      const line = raw.trim();
      if (!line) return "";
      // Close-bracket-first lines dedent before indentation is applied
      const startsWithClose = /^[}\])]/.test(line);
      const indent = Math.max(0, depth - (startsWithClose ? 1 : 0));
      // Update depth from the line's net bracket balance
      for (const ch of line) {
        if (ch === "{" || ch === "[" || ch === "(") depth += 1;
        else if (ch === "}" || ch === "]" || ch === ")") depth -= 1;
      }
      if (depth < 0) depth = 0;
      return INDENT.repeat(indent) + line;
    })
    .join("\n");
}

// ─── Autocomplete source ──────────────────────────────────────────
//
// Merges:
//   1. Language keywords (static, per-language)
//   2. Words already typed in the buffer (dynamic — the "cache" the user asked for)
//
// Triggers after 1 char, case-sensitive, boosts keyword matches above buffer words.
function buildAutocomplete(languageId) {
  const keywords = KEYWORDS[languageId] || [];

  return autocompletion({
    activateOnTyping: true,
    override: [
      (ctx) => {
        const word = ctx.matchBefore(/\w+/);
        if (!word || (word.from === word.to && !ctx.explicit)) return null;

        // Collect buffer words (length >= 3) to suggest based on what the user has typed
        const docText = ctx.state.doc.toString();
        const bufferWords = new Set();
        const m = docText.match(/[A-Za-z_][A-Za-z0-9_]{2,}/g);
        if (m) for (const w of m) bufferWords.add(w);

        // Merge: keywords first (higher boost), then buffer words
        const options = [
          ...keywords.map((k) => ({ label: k, type: "keyword", boost: 2 })),
          ...[...bufferWords]
            .filter((w) => !keywords.includes(w))
            .map((w) => ({ label: w, type: "variable", boost: 1 })),
        ];

        return { from: word.from, options };
      },
    ],
  });
}

// ─── Notepad component ────────────────────────────────────────────

export default function Notepad({ value, onChange, placeholder }) {
  const language = useInterviewStore((s) => s.notepadLanguage);
  const setLanguage = useInterviewStore((s) => s.setNotepadLanguage);
  const viewRef = useRef(null);

  const extensions = useMemo(() => {
    const buildExt = LANG_EXT[language] || LANG_EXT.java;
    const built = buildExt();
    const langExt = built ? [built] : [];
    return [
      ...langExt,
      indentUnit.of("  "),
      buildAutocomplete(language),
      keymap.of([
        { key: "Tab", run: indentMore, shift: indentLess },
        { key: "Mod-Shift-f", run: ({ state, dispatch }) => {
          // Ctrl/Cmd+Shift+F → Format
          const formatted = formatByIndent(state.doc.toString(), language);
          dispatch({ changes: { from: 0, to: state.doc.length, insert: formatted } });
          return true;
        }},
      ]),
      EditorView.lineWrapping,
    ];
  }, [language]);

  const handleFormat = () => {
    const view = viewRef.current?.view;
    if (!view) return;
    const current = view.state.doc.toString();
    const formatted = formatByIndent(current, language);
    if (formatted === current) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: formatted } });
    onChange(formatted);
  };

  const lineCount = value ? value.split("\n").length : 1;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-950">
      {/* Toolbar */}
      <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <span className="text-base">📝</span>
          <span className="font-semibold text-gray-600 dark:text-gray-400">Notepad</span>
          <span>·</span>
          <span className="hidden sm:inline">Tab · indent · Shift+Tab · outdent · ⌘⇧F · format</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-2 py-1 text-[11px] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
            title="Editor language"
          >
            {LANGUAGES.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={handleFormat}
            className="px-2 py-1 text-[11px] rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            title="Format (⌘⇧F)"
          >
            ↯ Format
          </button>
          <span className="text-[11px] text-gray-400 ml-1 whitespace-nowrap">
            {lineCount} line{lineCount !== 1 ? "s" : ""} · {value.length} chars
          </span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0 overflow-auto">
        <CodeMirror
          ref={viewRef}
          value={value}
          onChange={onChange}
          extensions={extensions}
          placeholder={placeholder}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: false, // we provide our own
            tabSize: 2,
          }}
          style={{ fontSize: 13, height: "100%" }}
        />
      </div>
    </div>
  );
}

import { EditorView } from "@codemirror/view";

export const customTheme = EditorView.theme(
  {
    "&": {
      outline: "none !important",
      height: "100%",
      backgroundColor: "var(--sidebar)",
      color: "var(--foreground)",
    },
    ".cm-content": {
      fontFamily: "var(--font-plex-mono), monospace",
      fontSize: "14px",
      caretColor: "var(--foreground)",
    },
    ".cm-scroller": {
      scrollbarWidth: "thin",
      scrollbarColor: "#3f3f46 transparent",
    },
    ".cm-gutters": {
      backgroundColor: "var(--sidebar)",
      color: "var(--accent-foreground)",
      border: "none",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "var(--sidebar)",
    },
    ".cm-activeLine": {
      backgroundColor: "transparent",
      borderLeft: "2px solid var(--border)",
    },
  },
  { dark: true },
);

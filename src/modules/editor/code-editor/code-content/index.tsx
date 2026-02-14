import { useEffect, useRef } from "react";
import { basicSetup, EditorView } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDarkHighlightStyle } from "@codemirror/theme-one-dark";
import { syntaxHighlighting } from "@codemirror/language";
import { customTheme } from "../extension/theme";

export const CodeContent = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const view = new EditorView({
      doc: "start coding",
      parent: editorRef.current,
      extensions: [
        customTheme,
        basicSetup,
        javascript({ typescript: true }),
        syntaxHighlighting(oneDarkHighlightStyle),
      ],
    });

    viewRef.current = view;

    return () => view.destroy();
  });
  return <div ref={editorRef} className="size-full" />;
};

import { useEffect, useMemo, useRef } from "react";
import { EditorView } from "codemirror";
import { oneDark, oneDarkHighlightStyle } from "@codemirror/theme-one-dark";
import { syntaxHighlighting } from "@codemirror/language";
import { customTheme } from "../extension/theme";
import { getLanguageExtension } from "../extension/language";
import { EditorState } from "@codemirror/state";
import { customSetup } from "../extension/custom-setup";
import { miniMap } from "../extension/minimap";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { suggestionExtension } from "../extension/suggestion";
import { quickEditExtension } from "../extension/quick-edit";

interface Props {
  fileName?: string;
  initialState?: string;
  onChange?: (value: string) => void;
}

export const CodeContent = ({ fileName, initialState, onChange }: Props) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const languageExtensions = useMemo(() => {
    return getLanguageExtension(fileName);
  }, [fileName]);

  useEffect(() => {
    if (!editorRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: initialState,
        extensions: [
          customTheme,
          customSetup,
          syntaxHighlighting(oneDarkHighlightStyle),
          languageExtensions,
          suggestionExtension(fileName),
          quickEditExtension(),
          oneDark,
          miniMap(),
          keymap.of([indentWithTab]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const value = update.state.doc.toString();
              onChange?.(value);
            }
          }),
        ],
      }),
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => view.destroy();
  }, [fileName]);
  return <div ref={editorRef} className="size-full" />;
};

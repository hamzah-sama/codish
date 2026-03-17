import { StateEffect, StateField } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  keymap,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { fetcher } from "./fetcher";

// stateEffect : a way to send 'messages' to update the state of the editor. In this case, we define a state effect that can carry a string (the suggestion) or null (to clear the suggestion).

const setSuggestionEffect = StateEffect.define<string | null>();

// stateField : hold our suggestion in the editor's state.
// create : initializes the state field with a default value (in this case, a dummy suggestion).
// update : listens for transactions that contain the setSuggestionEffect and updates the state accordingly. If the effect is present, it updates the state with the new suggestion; otherwise, it retains the existing value.
const suggestionState = StateField.define<string | null>({
  create() {
    return null; // no suggestion at initially
  },
  update(value, tr) {
    // check if the transaction contains the setSuggestionEffect and update the value accordingly
    // if the effect is present, it updates the state with the new suggestion; otherwise, it retains the existing value.
    for (const effect of tr.effects) {
      if (effect.is(setSuggestionEffect)) {
        return effect.value;
      }
    }
    return value;
  },
});

// widgetType: create custom DOM Element to display in the editor.
// toDOM : call by CodeMirror to create actual html element
class suggestionWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.textContent = this.text;
    span.style.opacity = "0.4"; // ghost text effect
    span.style.pointerEvents = "none"; // make it non-interactive
    span.style.fontStyle = "italic";
    return span;
  }
}

let debounceTimer: number | null = null;
let isWaitingForSuggestion = false;
const DEBOUNCE_DELAY = 300; // delay in ms before sending the request for a suggestion

let currentAbortController: AbortController | null = null;

const generatePayload = (view: EditorView, fileName: string) => {
  const code = view.state.doc.toString();
  if (!code || code.trim().length === 0) return null;
  const cursorPosition = view.state.selection.main.head;
  const currentLine = view.state.doc.lineAt(cursorPosition);
  const cursorInline = cursorPosition - currentLine.from;

  const previousLine: string[] = [];
  const previousLineToFetch = Math.min(5, currentLine.number - 1);
  for (let i = previousLineToFetch; i >= 1; i--) {
    previousLine.push(view.state.doc.line(currentLine.number - i).text);
  }

  const nextLine: string[] = [];
  const totalLines = view.state.doc.lines;
  const lineTOFetch = Math.min(5, totalLines - currentLine.number);
  for (let i = 1; i <= lineTOFetch; i++) {
    nextLine.push(view.state.doc.line(currentLine.number + i).text);
  }

  return {
    fileName,
    code,
    currentLine: currentLine.text,
    textBeforeCursor: currentLine.text.slice(0, cursorInline),
    textAfterCursor: currentLine.text.slice(cursorInline),
    previousLines: previousLine.join("\n"),
    nextLines: nextLine.join("\n"),
    lineNumber: currentLine.number,
  };
};

const createDebouncePluggin = (fileName: string | undefined) => {
  return ViewPlugin.fromClass(
    class {
      constructor(view: EditorView) {
        this.triggerSuggestion(view);
      }

      update(update: ViewUpdate) {
        if (update.selectionSet || update.docChanged) {
          this.triggerSuggestion(update.view);
        }
      }

      triggerSuggestion(view: EditorView) {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        if (currentAbortController) {
          currentAbortController.abort(); // cancel the previous request if it's still pending
        }

        isWaitingForSuggestion = true;
        debounceTimer = window.setTimeout(async () => {
          const payload = generatePayload(view, fileName || "");
          if (!payload) {
            isWaitingForSuggestion = false;
            view.dispatch({
              effects: setSuggestionEffect.of(null), // clear suggestion if payload is invalid
            });
            return;
          }

          currentAbortController = new AbortController();

          const suggestion = await fetcher(
            payload,
            currentAbortController.signal,
          );

          isWaitingForSuggestion = false;
          view.dispatch({
            effects: setSuggestionEffect.of(suggestion), // update the suggestion state with the new suggestion
          });
        }, DEBOUNCE_DELAY);
      }

      destroy() {
        if (debounceTimer !== null) {
          clearTimeout(debounceTimer);
        }

        if (currentAbortController) {
          currentAbortController.abort(); // cancel any pending request when the plugin is destroyed
        }
      }
    },
  );
};

const renderPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = this.build(view);
    }

    update(update: ViewUpdate) {
      // rebuild decorations if the suggestion state has changed, cursor has moved, or the document has changed
      const suggestionChange = update.transactions.some((tr) =>
        tr.effects.some((effect) => effect.is(setSuggestionEffect)),
      );

      const shouldRebuild =
        suggestionChange || update.selectionSet || update.docChanged;

      if (shouldRebuild) {
        this.decorations = this.build(update.view);
      }
    }
    build(view: EditorView) {
      if (isWaitingForSuggestion) {
        return Decoration.none; // don't show old suggestion while waiting for new one
      }
      //  get the current suggestion from the editor's state if there is no suggestion, return an empty decoration set
      const suggestion = view.state.field(suggestionState);
      if (!suggestion) {
        return Decoration.none;
      }

      // create a widget decoration from cursor position
      const cursor = view.state.selection.main.head;
      return Decoration.set([
        Decoration.widget({
          widget: new suggestionWidget(suggestion),
          side: 1, // position the widget after the cursor
        }).range(cursor),
      ]);
    }
  },

  { decorations: (plugin) => plugin.decorations }, // tell code mirror to use our decoration
);

const acceptSuggestion = keymap.of([
  {
    key: "Tab",
    run: (view) => {
      const suggestion = view.state.field(suggestionState);
      if (!suggestion) return false; // let tab do its normal behavior if there is no suggestion
      const cursor = view.state.selection.main.head;
      view.dispatch({
        changes: { from: cursor, insert: suggestion }, // insert the suggestion at the cursor position
        selection: { anchor: cursor + suggestion.length }, // move the cursor to the end of the inserted suggestion
        effects: setSuggestionEffect.of(null), // clear the suggestion after accepting it
      });
      return true; // prevent default tab behavior
    },
  },
]);

export const suggestionExtension = (fileName: string | undefined) => [
  suggestionState, //state storage
  renderPlugin, // render ghost text or suggestion
  createDebouncePluggin(fileName), // trigger suggestion while typing
  acceptSuggestion, // tab to accept or execute suggestion
];

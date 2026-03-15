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

// stateEffect : a way to send 'messages' to update the state of the editor. In this case, we define a state effect that can carry a string (the suggestion) or null (to clear the suggestion).

const setSuggestionEffect = StateEffect.define<string | null>();

// stateField : hold our suggestion in the editor's state.
// create : initializes the state field with a default value (in this case, a dummy suggestion).
// update : listens for transactions that contain the setSuggestionEffect and updates the state accordingly. If the effect is present, it updates the state with the new suggestion; otherwise, it retains the existing value.
const suggestionState = StateField.define<string | null>({
  create() {
    return "//dummy suggestion";
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
  suggestionState,
  renderPlugin,
  acceptSuggestion,
];

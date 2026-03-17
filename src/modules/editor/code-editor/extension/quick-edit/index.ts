import { EditorState, StateEffect, StateField } from "@codemirror/state";
import { EditorView, keymap, showTooltip, Tooltip } from "@codemirror/view";
import { fetcher } from "./fetcher";

export const showQuickEditEffect = StateEffect.define<boolean>();

let editorView: EditorView | null = null;
let currentAbortController: AbortController | null = null;

const quickEditState = StateField.define<boolean>({
  create() {
    return false;
  },

  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(showQuickEditEffect)) {
        return effect.value;
      }
    }

    if (tr.selection) {
      const selection = tr.state.selection.main;
      if (selection.empty) {
        return false;
      }
    }

    return value;
  },
});

const createQuickEditToolTip = (state: EditorState): readonly Tooltip[] => {
  const selection = state.selection.main;
  if (selection.empty) {
    return [];
  }

  const isQuickEditActive = state.field(quickEditState);
  if (!isQuickEditActive) {
    return [];
  }

  return [
    {
      pos: selection.to,
      above: false,
      strictSide: false,
      create() {
        const dom = document.createElement("div");
        dom.className =
          "bg-popover text-popover-foreground rounded-sm z-50 border border-input shadow-md flex flex-col gap-2 p-2 text-sm";

        const form = document.createElement("form");
        form.className = "flex flex-col gap-2";

        const input = document.createElement("input");
        input.className =
          "bg-transparent border-none outline-none px-2 py-1 text-sm w-100 font-sans";
        input.placeholder = "Edit selected code";
        input.type = "text";

        const buttonContainer = document.createElement("div");
        buttonContainer.className = "flex items-center justify-between gap-2";

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel";
        cancelButton.type = 'button';
        cancelButton.className =
          "bg-transparent border-none outline-none px-2 py-1 text-sm font-sans text-muted-foreground hover:text-foreground cursor-pointer rounded-sm";
        cancelButton.onclick = () => {
          if (currentAbortController) {
            currentAbortController.abort();
            currentAbortController = null;
          }

          if (editorView) {
            editorView.dispatch({
              effects: showQuickEditEffect.of(false),
            });
          }
        };

        const submitButton = document.createElement("button");
        submitButton.textContent = "Submit";
        submitButton.type = 'submit';
        submitButton.className =
          "bg-primary border-none outline-none px-2 py-1 text-sm font-sans text-primary-foreground hover:bg-primary/80 cursor-pointer rounded-sm";

        form.onsubmit = async (e) => {
          e.preventDefault();
          if (!editorView) return;
          const instruction = input.value.trim();
          if (!instruction) return;

          const selection = editorView.state.selection.main;
          const selectedCode = editorView.state.doc.sliceString(
            selection.from,
            selection.to,
          );

          const fullCode = editorView.state.doc.toString();

          submitButton.disabled = true;
          submitButton.textContent = "Editing...";

          currentAbortController = new AbortController();
          const editedCode = await fetcher(
            { selectedCode, fullCode, instruction },
            currentAbortController.signal,
          );

          if (editedCode) {
            editorView.dispatch({
              changes: {
                from: selection.from,
                to: selection.to,
                insert: editedCode,
              },

              selection: { anchor: selection.from + editedCode.length },
              effects: showQuickEditEffect.of(false),
            });
          } else {
            submitButton.disabled = false;
            submitButton.textContent = "Submit";
          }

          currentAbortController = null;
        };

        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(submitButton);

        form.appendChild(input);
        form.appendChild(buttonContainer);

        dom.appendChild(form);

        setTimeout(() => {
          input.focus();
        }, 0);

        return { dom };
      },
    },
  ];
};

const quickEditTooltipField = StateField.define<readonly Tooltip[]>({
  create(state) {
    return createQuickEditToolTip(state);
  },

  update(tooltips, tr) {
    if (tr.docChanged || tr.selection) {
      return createQuickEditToolTip(tr.state);
    }

    for (const effect of tr.effects) {
      if (effect.is(showQuickEditEffect)) {
        return createQuickEditToolTip(tr.state);
      }
    }
    return tooltips;
  },

  provide: (field) =>
    showTooltip.computeN([field], (state) => state.field(field)),
});

const quickeditKeyMap = keymap.of([
  {
    key: "Mod-k",
    run: (view) => {
      const selection = view.state.selection.main;
      if (selection.empty) {
        return false;
      }
      view.dispatch({
        effects: showQuickEditEffect.of(true),
      });

      return true;
    },
  },
]);

const captureViewExtension = EditorView.updateListener.of((update) => {
  editorView = update.view;
});

export const quickEditExtension = () => [
  quickEditState,
  quickEditTooltipField,
  quickeditKeyMap,
  captureViewExtension,
];

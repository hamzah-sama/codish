import { EditorView } from "codemirror";
import { EditorState, StateField } from "@codemirror/state";
import { showTooltip, Tooltip } from "@codemirror/view";
import { quickEditState, showQuickEditEffect } from "./quick-edit";

let editorView: EditorView | null = null;

const createTooltipForSelection = (state: EditorState): readonly Tooltip[] => {
  const selection = state.selection.main;
  if (selection.empty) {
    return [];
  }

  const isQuickeditActive = state.field(quickEditState);
  if (isQuickeditActive) {
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
          "bg-popover rounded-sm z-50 border border-input shadow-md flex items-center text-sm";

        const addTochatButton = document.createElement("button");
        addTochatButton.textContent = "Add to chat";
        addTochatButton.className =
          "p-1 px-2 font-sans text-sm  hover:text-foreground cursor-pointer rounded-sm pr-4 rounded-r-none border";

        const quickEditButton = document.createElement("button");
        quickEditButton.className =
          "p-1 px-2 font-sans text-sm  hover:text-foreground cursor-pointer pl-4 gap-1 flex items-center ";

        const quickEditButtonText = document.createElement("span");
        quickEditButtonText.textContent = "Quick edit";

        const quickEditButtonShortcut = document.createElement("span");
        quickEditButtonShortcut.textContent = "⌘k";
        quickEditButtonShortcut.className =
          "text-xs  opacity-60";

        quickEditButton.appendChild(quickEditButtonText);
        quickEditButton.appendChild(quickEditButtonShortcut);

        quickEditButton.onclick = () => {
          if (editorView) {
            editorView.dispatch({ effects: showQuickEditEffect.of(true) });
          }
        };

        dom.appendChild(addTochatButton);
        dom.appendChild(quickEditButton);

        return { dom };
      },
    },
  ];
};

const captureViewExtension = EditorView.updateListener.of((update) => {
  editorView = update.view;
});

const selectionTooltipField = StateField.define<readonly Tooltip[]>({
  create(state) {
    return createTooltipForSelection(state);
  },

  update(tooltips, tr) {
    if (tr.docChanged || tr.selection) {
      return createTooltipForSelection(tr.state);
    }
    for (const effect of tr.effects) {
      if (effect.is(showQuickEditEffect)) {
        return [];
      }
    }
    return tooltips;
  },

  provide: (field) =>
    showTooltip.computeN([field], (state) => state.field(field)),
});

export const selectionTooltip = () => [
  selectionTooltipField,
  captureViewExtension,
];

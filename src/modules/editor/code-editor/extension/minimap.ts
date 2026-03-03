import { showMinimap } from "@replit/codemirror-minimap";

const createMiniMap = () => {
  const dom = document.createElement("div");
  return { dom };
};

export const miniMap = () => [
  showMinimap.compute(["doc"], () => {
    return {
      create: createMiniMap,
    };
  }),
];

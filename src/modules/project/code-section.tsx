import { Allotment } from "allotment";
// import "allotment/dist/style.css";

export const CodeSection = () => {
  return (
    <Allotment defaultSizes={[400, 1000]}>
      <Allotment.Pane snap minSize={200} maxSize={800} preferredSize={400}>
        File explorer
      </Allotment.Pane>
      <Allotment.Pane>Code</Allotment.Pane>
    </Allotment>
  );
};

/*
what this component does : 

1. Creates a terminal using xterm.js
2. Mounts it inside a <div>
3. Streams output text into the terminal
4. Handles resizing automatically
5. Avoids re-rendering everything (only appends new output)

*/

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

interface Props {
  output: string;
}

export const PreviewTerminal = ({ output }: Props) => {
  // useing useRef because unlike usestate it doesn't trigger re-render
  const containerRef = useRef<HTMLDivElement>(null); // DOM element where terminal is mounted
  const terminalRef = useRef<Terminal | null>(null); // instance of xterm terminal
  const fitAddOnRef = useRef<FitAddon | null>(null); //used to auto resize terminal
  const lastLengthRef = useRef(0); // track how many output has already been written

  //   initialize terminal (run once)
  useEffect(() => {
    if (!containerRef.current || terminalRef.current) return;

    // tesminal setup
    const terminal = new Terminal({
      convertEol: true, // handle line breaks correctly
      // disableStdin: true, // read-only terminal (no typing allowed)
      fontSize: 12,
      fontFamily: "monospace",
      theme: {
        background: "#1f2228",
      },
    });

    const fitAddOn = new FitAddon();
    terminal.loadAddon(fitAddOn); // fit addon ensures terminal fill container size

    // whit these codes, now terminal is visible in DOM
    terminal.open(containerRef.current);
    terminalRef.current = terminal;
    fitAddOnRef.current = fitAddOn;

    // write existing output on mount
    if (output) {
      terminal.write(output);
      lastLengthRef.current = output.length;
    }

    // resize handling, wait for DOM before resizing
    requestAnimationFrame(() => {
      fitAddOn.fit();
    });

    // automatically refit when container size changes
    const resizeObserver = new ResizeObserver(() => fitAddOn.fit());
    resizeObserver.observe(containerRef.current);

    // cleanup, prevent memory leaks when commponents unmount
    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
      fitAddOnRef.current = null;
      terminalRef.current = null;
    };
  }, []);

  //   handle output updates, run everytime output changes
  useEffect(() => {
    if (!terminalRef.current) return;

    // output reset, reset when output is less
    if (output.length < lastLengthRef.current) {
      terminalRef.current.clear();
      lastLengthRef.current = 0;
    }

    // get only new data, avoid rewriting everything, only append new part
    const newData = output.slice(lastLengthRef.current, output.length);

    // write new data
    if (newData) {
      terminalRef.current.write(newData);
      lastLengthRef.current = output.length;
    }
  }, [output]);

  return (
    // render, terminal is injected in empty div right here, tailwind classes forces terminal to fill height
    <div
      ref={containerRef}
      className=" flex-1 min-h-0 p-3 [&_.xterm]:h-full! [&_.xterm-viewport]:h-full! [&_.xterm-screen]:h-full! bg-sidebar "
    />
  );
};

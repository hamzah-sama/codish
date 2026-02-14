import { Extension } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { cpp } from "@codemirror/lang-cpp";
import { css } from "@codemirror/lang-css";
import { go } from "@codemirror/lang-go";
import { html } from "@codemirror/lang-html";
import { java } from "@codemirror/lang-java";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { php } from "@codemirror/lang-php";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";

export const languageExtension = (fileName: string): Extension => {
  const ext = fileName.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "js":
      return javascript();
    case "ts":
      return javascript({ typescript: true });
    case "jsx":
      return javascript({ jsx: true });
    case "tsx":
      return javascript({ typescript: true, jsx: true });
    case "cpp":
      return cpp();
    case "css":
      return css();
    case "go":
      return go();
    case "html":
      return html();
    case "java":
      return java();
    case "json":
      return json();
    case "md":
      return markdown();
    case "php":
      return php();
    case "py":
      return python();
    case "rs":
      return rust();
    case "sql":
      return sql();
    case "xml":
      return xml();
    case "yaml":
      return yaml();
    default:
      return [];
  }
};

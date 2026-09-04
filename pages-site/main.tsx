import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import SpanishApp from "../src/SpanishApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SpanishApp />
  </StrictMode>,
);

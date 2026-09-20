import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { QFlowProvider } from "./context/QFlowContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QFlowProvider>
      <App />
    </QFlowProvider>
  </StrictMode>,
);

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

/**
 * Renders the root React application component into the DOM.
 * Encases the App component in React.StrictMode for additional checks during development.
 */
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

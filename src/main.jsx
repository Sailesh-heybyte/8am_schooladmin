import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/index.scss";

createRoot(document.getElementById("root")).render(
  <>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </>,
);

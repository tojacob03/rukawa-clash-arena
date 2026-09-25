import { createRoot } from "react-dom/client";
import "./styles/fonts.css";
import "./styles/arc.css";
import ArcApp from "./ArcApp.tsx";
import { bootCloud } from "./cloud/state.ts";

// Loads the account module only when there is a session or a sign-in redirect.
bootCloud();

createRoot(document.getElementById("arc-root")!).render(<ArcApp />);

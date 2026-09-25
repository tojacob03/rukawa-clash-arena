import { createRoot } from "react-dom/client";
import "./styles/fonts.css";
import "./styles/arc.css";
import ArcApp from "./ArcApp.tsx";
import { bootCloud } from "./cloud/state.ts";
import { registerServiceWorker, watchInstall } from "./push.ts";

// Loads the account module only when there is a session or a sign-in redirect.
bootCloud();
// Offline start, push reminders and the install prompt.
registerServiceWorker();
watchInstall();

createRoot(document.getElementById("arc-root")!).render(<ArcApp />);

import { createRoot } from "react-dom/client";
import "./styles/fonts.css";
import "./styles/arc.css";
import ArcApp from "./ArcApp.tsx";

createRoot(document.getElementById("arc-root")!).render(<ArcApp />);

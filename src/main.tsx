import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { installDevConsole } from './lib/devConsole'

installDevConsole();

createRoot(document.getElementById("root")!).render(<App />);

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
// Fonts are bundled locally (no request to Google Fonts -> no visitor IP
// leaves for a third party just to render text).
import '@fontsource/geist/400.css'
import '@fontsource/geist/500.css'
import '@fontsource/geist/600.css'
import '@fontsource/geist/700.css'
import '@fontsource/geist/800.css'
import '@fontsource/geist-mono/400.css'
import '@fontsource/geist-mono/500.css'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);

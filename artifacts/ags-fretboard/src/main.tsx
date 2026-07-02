import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installAudioUnlock } from "./lib/audio";

// Unlock audio on the first user gesture so sound works reliably on mobile.
installAudioUnlock();

createRoot(document.getElementById("root")!).render(<App />);

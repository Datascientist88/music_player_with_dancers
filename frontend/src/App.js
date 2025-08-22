// src/App.js
import React, { useState, useCallback } from "react";
import Stage from "./components/Stage";
import AudioStereoPlayer from "./components/AudioPlayer";

export default function App() {
  const [analyser, setAnalyser] = useState(null);
  const [dancer, setDancer] = useState("michelle"); // "michelle" | "tango"

  const handleAnalyserReady = useCallback((node) => {
    setAnalyser(node || null);
  }, []);

  return (
    <div className="app-root">
      {/* Optional dancer switcher (kept from earlier versions) */}
      <div className="top-controls">
        <div className="segmented">
          <button
            className={dancer === "michelle" ? "active" : ""}
            onClick={() => setDancer("michelle")}
            title="Michelle — Disco"
          >
            💃 Michelle (Disco)
          </button>
          <button
            className={dancer === "tango" ? "active" : ""}
            onClick={() => setDancer("tango")}
            title="Ready Player Me — Tango"
          >
            🕺 Jack (Tango)
          </button>
        </div>
      </div>

      {/* 3D Stage (WebGL) */}
      <Stage analyser={analyser} dancer={dancer} />

      {/* Fixed glassmorphic stereo player (visualizer stays in the same spot) */}
      <div className="fixed-player-square">
        <AudioStereoPlayer onAnalyserReady={handleAnalyserReady} />
      </div>
    </div>
  );
}

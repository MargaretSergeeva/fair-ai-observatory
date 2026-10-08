import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import ObservatoryDemo from "./ObservatoryDemo";
import ProcessCommandCenter from "./ProcessCommandCenter";
import ObservatorySchema from "./ObservatorySchema";
import ReferenceRun from "./ReferenceRun";
import "./styles.css";

const MONO = "'IBM Plex Mono', monospace";

const VIEWS = [
  { id: "product",  label: "Act 1 — Product Demo" },
  { id: "process",  label: "Act 2 — Process View" },
  { id: "schema",   label: "Pipeline Schema" },
  { id: "reference", label: "UCI Reference Run" },
];

function App() {
  const [view, setView] = useState("product");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#000" }}>
      {/* nav */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "0 20px",
        background: "#0C0C14",
        borderBottom: "1px solid #1E2030",
        flexShrink: 0,
        overflowX: "auto",
      }}>
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            style={{
              fontFamily: MONO,
              fontSize: "0.7rem",
              letterSpacing: "0.04em",
              color: view === v.id ? "#C99A53" : "#5A6080",
              background: "transparent",
              border: "none",
              borderBottom: view === v.id ? "2px solid #C99A53" : "2px solid transparent",
              padding: "12px 14px",
              cursor: "pointer",
              transition: "color 0.15s",
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* view */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {view === "product"  && <ObservatoryDemo />}
        {view === "process"  && <ProcessCommandCenter />}
        {view === "schema"   && <ObservatorySchema />}
        {view === "reference" && <ReferenceRun />}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

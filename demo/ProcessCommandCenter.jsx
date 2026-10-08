import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Code2,
  ClipboardList,
  Scale,
  User,
  ShieldCheck,
  Briefcase,
  PlayCircle,
} from "lucide-react";

const C = {
  bg: "#11131D",
  panel: "#1B1F2E",
  panelLight: "#232838",
  brass: "#C99A53",
  brassDim: "#8B713D",
  teal: "#4FA8A0",
  text: "#EDEAE0",
  dim: "#8993AC",
  sage: "#6FA888",
  rust: "#C25B45",
  hairline: "#2D3245",
};
const MONO = "'IBM Plex Mono', monospace";
const SANS = "'IBM Plex Sans', sans-serif";

function useGoogleFonts() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    return () => { if (link.parentNode) link.parentNode.removeChild(link); };
  }, []);
}

function Label({ children, color = C.dim }) {
  return <div style={{ fontFamily: MONO, color, fontSize: "0.62rem", letterSpacing: "0.08em" }}>{children}</div>;
}
function Card({ children, style }) {
  return <div className="rounded-lg p-4" style={{ background: C.panel, border: `1px solid ${C.hairline}`, ...style }}>{children}</div>;
}

/* ---------- header / tabs ---------- */
const TABS = [
  { id: "milestones", label: "Milestones" },
  { id: "agents", label: "Agent Team" },
  { id: "log", label: "Decision Log" },
  { id: "panel", label: "Stakeholder Panel" },
];

function Header({ tab, setTab }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.hairline}` }}>
      <div className="flex items-center justify-between px-5 py-3 sm:px-8">
        <div className="flex items-center gap-2">
          <div style={{ width: 8, height: 8, borderRadius: 9999, background: C.teal, boxShadow: `0 0 8px ${C.teal}` }} />
          <span style={{ fontFamily: MONO, color: C.text, fontSize: "0.78rem", letterSpacing: "0.14em", fontWeight: 600 }}>
            FAIR AI OBSERVATORY
          </span>
        </div>
        <span style={{ fontFamily: MONO, color: C.dim, fontSize: "0.62rem", letterSpacing: "0.08em" }}>
          PROCESS VIEW · HOW THIS IS RUN
        </span>
      </div>
      <div className="flex gap-1 overflow-x-auto px-5 sm:px-8">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="whitespace-nowrap px-3 py-2.5 transition-colors"
            style={{
              fontFamily: MONO,
              fontSize: "0.74rem",
              letterSpacing: "0.03em",
              color: tab === t.id ? C.brass : C.dim,
              borderBottom: tab === t.id ? `2px solid ${C.brass}` : "2px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- milestones ---------- */
const PHASES = [
  { phase: "Initiation", status: "done", items: ["Project charter written", "Stakeholder register defined"] },
  { phase: "Planning", status: "done", items: ["Six-module scope set", "German Credit dataset chosen", "HMDA deferred to v1.1"] },
  { phase: "Execution", status: "in_progress", items: ["6 bias modules built", "Setup agent shipped", "Dashboard + compliance docs shipped", "Robustness module shipped — 1 open finding"] },
  { phase: "Monitoring & Control", status: "starting", items: ["PM assistant running", "Jira sync designed"] },
  { phase: "Closure (v1.1)", status: "not_started", items: ["HMDA dataset support", "Boundary-sensitivity fix", "Full documentation set"] },
];

function StatusIcon({ status }) {
  if (status === "done") return <CheckCircle2 size={16} color={C.sage} />;
  if (status === "in_progress") return <div style={{ width: 16, height: 16, borderRadius: 9999, background: C.brass }} />;
  if (status === "starting") return <Clock size={16} color={C.teal} />;
  return <Circle size={16} color={C.hairline} />;
}

function MilestonesTab() {
  return (
    <div className="space-y-3">
      {PHASES.map((p, i) => (
        <Card key={p.phase}>
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center pt-0.5">
              <StatusIcon status={p.status} />
              {i < PHASES.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 24, background: C.hairline, marginTop: 4 }} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: MONO, color: C.text, fontSize: "0.88rem", fontWeight: 600 }}>{p.phase}</span>
                <span style={{ fontFamily: MONO, color: C.dim, fontSize: "0.6rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {p.status.replace("_", " ")}
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {p.items.map((it) => (
                  <li key={it} style={{ fontFamily: SANS, color: C.dim, fontSize: "0.78rem" }}>· {it}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ---------- agent team ---------- */
const AGENTS = [
  {
    name: "Developer Agent", icon: Code2, file: "observatory-developer/SKILL.md",
    role: "Implements, tests, flags PRs for review",
    authority: "None — never merges",
    recent: ["Implemented robustness.py against repo conventions", "Flagged PR for boundary-sensitivity fix — pending review"],
  },
  {
    name: "PM Assistant", icon: ClipboardList, file: "observatory-pm/SKILL.md",
    role: "Tracks status, logs decisions, syncs Jira, gatekeeps phase transitions",
    authority: "None — surfaces, doesn't decide",
    recent: ["Logged 7 decisions.log entries this run", "Flagged: module_status.yaml not yet wired to auto-update"],
  },
  {
    name: "Stakeholder Panel", icon: Scale, file: "observatory-stakeholders/SKILL.md",
    role: "Pressure-tests methodology decisions pre-commit",
    authority: "None — argues, doesn't decide",
    recent: ["Ran against the boundary-sensitivity finding — see Stakeholder Panel tab"],
  },
];

function AgentTeamTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {AGENTS.map((a) => {
        const Icon = a.icon;
        return (
          <Card key={a.name}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded" style={{ background: C.panelLight, border: `1px solid ${C.teal}` }}>
                <Icon size={15} color={C.teal} />
              </div>
              <div>
                <div style={{ fontFamily: MONO, color: C.text, fontSize: "0.82rem", fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontFamily: MONO, color: C.brassDim, fontSize: "0.58rem" }}>{a.file}</div>
              </div>
            </div>
            <div style={{ fontFamily: SANS, color: C.text, fontSize: "0.78rem" }} className="mb-2">{a.role}</div>
            <div className="mb-3 inline-block rounded px-2 py-1" style={{ border: `1px solid ${C.rust}` }}>
              <span style={{ fontFamily: MONO, color: C.rust, fontSize: "0.6rem" }}>AUTHORITY: {a.authority}</span>
            </div>
            <Label>RECENT ACTIVITY</Label>
            <ul className="mt-1.5 space-y-1">
              {a.recent.map((r) => (
                <li key={r} style={{ fontFamily: SANS, color: C.dim, fontSize: "0.74rem" }}>· {r}</li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------- decision log ---------- */
const MODULE_BOARD = {
  Done: ["Ingestion", "XGBoost baseline", "Disparate impact", "Counterfactual fairness", "Intersectional bias", "Fairlearn mitigation", "Setup agent", "Dashboard", "Annex IV doc", "Instructions for Use", "Robustness module"],
  "Needs Decision": ["Boundary-sensitivity fix"],
  "Not Started": ["HMDA support", "Art. 9 continuous monitoring", "Art. 14 oversight infrastructure", "Art. 12 log retention policy"],
};

const LOG = [
  ["14:02", "Detected compound field personal_status_and_sex; decomposed into gender + marital_status", "setup_agent"],
  ["14:03", "Classified as Annex III high-risk (credit scoring)", "setup_agent"],
  ["14:04", "Disparate impact threshold set to 0.80 (diagnostic default)", "setup_agent"],
  ["14:05", "Female · 18–25 cell excluded from intersectional analysis (n=24 < 30)", "pipeline"],
  ["14:11", "Disparate impact 0.70 below threshold; ThresholdOptimizer mitigation applied", "pipeline"],
  ["14:12", "Post-mitigation disparate impact 0.97; flagged for DPO review", "pm_assistant"],
  ["14:18", "Decision boundary sensitivity 27.6% flip rate exceeds 10% threshold; flagged for model review", "robustness_module"],
];

function DecisionLogTab() {
  return (
    <div className="space-y-6">
      <Card>
        <Label color={C.brass}>MODULE STATUS · MIRRORS THE JIRA BOARD</Label>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Object.entries(MODULE_BOARD).map(([col, items]) => (
            <div key={col}>
              <div style={{ fontFamily: MONO, color: col === "Needs Decision" ? C.rust : C.dim, fontSize: "0.66rem", letterSpacing: "0.06em" }} className="mb-2">
                {col.toUpperCase()} · {items.length}
              </div>
              <div className="space-y-1.5">
                {items.map((it) => (
                  <div key={it} className="rounded px-2.5 py-1.5" style={{ background: C.panelLight, border: `1px solid ${C.hairline}` }}>
                    <span style={{ fontFamily: SANS, color: C.text, fontSize: "0.74rem" }}>{it}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Label color={C.brass}>DECISIONS.LOG</Label>
        <div className="mt-3 space-y-2.5">
          {LOG.map(([time, text, source], i) => (
            <div key={i} className="flex gap-2">
              <span style={{ fontFamily: MONO, color: C.brassDim, fontSize: "0.65rem", whiteSpace: "nowrap" }}>{time}</span>
              <div>
                <span style={{ fontFamily: SANS, color: C.text, fontSize: "0.78rem", lineHeight: 1.4 }}>{text}</span>{" "}
                <span style={{ fontFamily: MONO, color: C.teal, fontSize: "0.6rem" }}>· {source}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------- stakeholder panel ---------- */
const PERSONAS = [
  {
    icon: User, name: "Applicant Advocate", color: C.rust,
    position: "A 27.6% flip rate means real applicants are getting inconsistent decisions on inputs that barely differ.",
    objection: "This should block production deployment, not just get logged as a finding.",
    wouldAccept: "Model recalibration or a tighter flip-rate threshold before shipping.",
  },
  {
    icon: ShieldCheck, name: "Regulator / DPO", color: C.brass,
    position: "Article 15 requires resilience against inconsistencies. An unresolved, undocumented finding is itself a compliance gap.",
    objection: "Needs either a fix or a documented remediation timeline before sign-off — silence isn't an option.",
    wouldAccept: "A dated remediation plan in the decision log, even if the fix isn't immediate.",
  },
  {
    icon: Briefcase, name: "Lender / Business", color: C.teal,
    position: "Need to know if this is a calibration problem or expected noise — borderline applicants may be inherently ambiguous.",
    objection: "Don't over-correct and reject good rule-based decisions to chase noise near the cutoff.",
    wouldAccept: "A clear diagnosis of cause before committing to a costly fix.",
  },
];

function StakeholderPanelTab() {
  const [ran, setRan] = useState(false);
  return (
    <div className="space-y-5">
      <Card>
        <Label color={C.brass}>DECISION UNDER REVIEW</Label>
        <p style={{ fontFamily: SANS, color: C.text, fontSize: "0.88rem" }} className="mt-2">
          How should we respond to the 27.6% decision-boundary flip rate found in Article 15 testing?
        </p>
        {!ran && (
          <button
            onClick={() => setRan(true)}
            className="mt-4 inline-flex items-center gap-2 rounded px-4 py-2.5"
            style={{ background: C.brass, color: "#1A140A", fontFamily: MONO, fontSize: "0.78rem" }}
          >
            <PlayCircle size={15} /> Run Stakeholder Panel
          </button>
        )}
      </Card>

      {ran && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {PERSONAS.map((per) => {
              const Icon = per.icon;
              return (
                <Card key={per.name}>
                  <div className="mb-3 flex items-center gap-2">
                    <Icon size={16} color={per.color} />
                    <span style={{ fontFamily: MONO, color: per.color, fontSize: "0.74rem", fontWeight: 600 }}>{per.name}</span>
                  </div>
                  <p style={{ fontFamily: SANS, color: C.text, fontSize: "0.78rem", lineHeight: 1.5 }} className="mb-3">{per.position}</p>
                  <div className="mb-2 rounded px-2.5 py-2" style={{ background: C.panelLight }}>
                    <span style={{ fontFamily: MONO, color: C.dim, fontSize: "0.58rem", letterSpacing: "0.05em" }}>OBJECTION</span>
                    <p style={{ fontFamily: SANS, color: C.text, fontSize: "0.72rem" }} className="mt-1">{per.objection}</p>
                  </div>
                  <div className="rounded px-2.5 py-2" style={{ background: C.panelLight }}>
                    <span style={{ fontFamily: MONO, color: C.dim, fontSize: "0.58rem", letterSpacing: "0.05em" }}>WOULD ACCEPT</span>
                    <p style={{ fontFamily: SANS, color: C.text, fontSize: "0.72rem" }} className="mt-1">{per.wouldAccept}</p>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card style={{ borderColor: C.brassDim }}>
            <Label color={C.sage}>AGREEMENT DESPITE OPPOSED INTERESTS</Label>
            <p style={{ fontFamily: SANS, color: C.text, fontSize: "0.8rem" }} className="mt-1.5 mb-4">
              All three agree this can't ship silently — even the lender wants a diagnosis before moving on, not just a logged note.
            </p>
            <Label color={C.rust}>IRREDUCIBLE TENSION</Label>
            <p style={{ fontFamily: SANS, color: C.text, fontSize: "0.8rem" }} className="mt-1.5 mb-4">
              Speed/cost (lender) vs. strict resolution before shipping (applicant advocate) — the DPO sits in the middle,
              requiring documentation either way.
            </p>
            <div style={{ borderTop: `1px solid ${C.hairline}` }} className="pt-3">
              <span style={{ fontFamily: MONO, color: C.dim, fontSize: "0.7rem", fontStyle: "italic" }}>
                This is not a recommendation — here's the tradeoff. The decision is logged as pending; you decide.
              </span>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/* ---------- root ---------- */
export default function ProcessCommandCenter() {
  useGoogleFonts();
  const [tab, setTab] = useState("milestones");

  return (
    <div className="flex h-full w-full flex-col" style={{ background: `radial-gradient(ellipse at top, ${C.panel} 0%, ${C.bg} 65%)`, fontFamily: SANS }}>
      <style>{`
        button:focus-visible { outline: 2px solid ${C.brass}; outline-offset: 2px; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: ${C.hairline}; border-radius: 4px; }
      `}</style>
      <Header tab={tab} setTab={setTab} />
      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
        {tab === "milestones" && <MilestonesTab />}
        {tab === "agents" && <AgentTeamTab />}
        {tab === "log" && <DecisionLogTab />}
        {tab === "panel" && <StakeholderPanelTab />}
      </div>
    </div>
  );
}

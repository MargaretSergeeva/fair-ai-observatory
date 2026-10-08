import React, { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  RotateCcw,
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
    link.href =
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, []);
}

/* ---------- gauge math ---------- */
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}
function gaugeArcPath(cx, cy, r, fromAngle, toAngle) {
  const p1 = polarToCartesian(cx, cy, r, fromAngle);
  const p2 = polarToCartesian(cx, cy, r, toAngle);
  const largeArcFlag = Math.abs(fromAngle - toAngle) > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y}`;
}

function Gauge({ label, value, min = 0, max, threshold, format, passWhen = "above" }) {
  const angleFor = (v) =>
    180 - (180 * (Math.max(min, Math.min(max, v)) - min)) / (max - min);
  const valueAngle = angleFor(value);
  const threshAngle = angleFor(threshold);
  const pass = passWhen === "above" ? value >= threshold : value <= threshold;
  const color = pass ? C.sage : C.rust;
  const cx = 90,
    cy = 92,
    r = 68;
  const bg = gaugeArcPath(cx, cy, r, 180, 0);
  const fill = gaugeArcPath(cx, cy, r, 180, valueAngle);
  const needleEnd = polarToCartesian(cx, cy, r - 16, valueAngle);
  const tick1 = polarToCartesian(cx, cy, r - 7, threshAngle);
  const tick2 = polarToCartesian(cx, cy, r + 7, threshAngle);

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="104" viewBox="0 0 180 104">
        <path d={bg} stroke={C.hairline} strokeWidth="10" fill="none" strokeLinecap="round" />
        <path
          d={fill}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          style={{ transition: "all 0.5s ease" }}
        />
        <line
          x1={tick1.x}
          y1={tick1.y}
          x2={tick2.x}
          y2={tick2.y}
          stroke={C.brass}
          strokeWidth="2.5"
        />
        <line
          x1={cx}
          y1={cy}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke={C.text}
          strokeWidth="2"
          style={{ transition: "all 0.5s ease" }}
        />
        <circle cx={cx} cy={cy} r="4" fill={C.text} />
      </svg>
      <div className="text-center -mt-1">
        <div style={{ color, fontFamily: MONO, fontSize: "1.7rem", fontWeight: 700 }}>
          {format(value)}
        </div>
        <div
          style={{
            color: C.dim,
            fontFamily: MONO,
            fontSize: "0.65rem",
            letterSpacing: "0.08em",
            marginTop: 2,
          }}
        >
          {label.toUpperCase()}
        </div>
        <div style={{ color: C.dim, fontFamily: MONO, fontSize: "0.58rem", marginTop: 1 }}>
          THRESHOLD {format(threshold)}
        </div>
      </div>
    </div>
  );
}

/* ---------- shared bits ---------- */
function Header({ screen, onRestart }) {
  return (
    <div
      className="flex items-center justify-between px-5 py-3 sm:px-8"
      style={{ borderBottom: `1px solid ${C.hairline}` }}
    >
      <div className="flex items-center gap-2">
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 9999,
            background: C.brass,
            boxShadow: `0 0 8px ${C.brass}`,
          }}
        />
        <span
          style={{
            fontFamily: MONO,
            color: C.text,
            fontSize: "0.78rem",
            letterSpacing: "0.14em",
            fontWeight: 600,
          }}
        >
          FAIR AI OBSERVATORY
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span style={{ fontFamily: MONO, color: C.dim, fontSize: "0.62rem", letterSpacing: "0.08em" }}>
          DEMO MODE · SYNTHETIC DATA
        </span>
        {screen !== "intro" && (
          <button
            onClick={onRestart}
            className="flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ color: C.dim, fontFamily: MONO, fontSize: "0.65rem" }}
          >
            <RotateCcw size={12} />
            RESTART
          </button>
        )}
      </div>
    </div>
  );
}

function Button({ children, onClick, variant = "primary" }) {
  const styles =
    variant === "primary"
      ? { background: C.brass, color: "#1A140A", border: "none" }
      : { background: "transparent", color: C.teal, border: `1px solid ${C.teal}` };
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded px-4 py-2.5 font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]"
      style={{ ...styles, fontFamily: MONO, fontSize: "0.78rem", letterSpacing: "0.03em" }}
    >
      {children}
    </button>
  );
}

/* ---------- intro ---------- */
function IntroScreen({ onStart }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div
        style={{ fontFamily: MONO, color: C.brass, fontSize: "0.72rem", letterSpacing: "0.18em" }}
        className="mb-6"
      >
        STATUS: AWAITING DATASET
      </div>
      <h1
        style={{ fontFamily: MONO, color: C.text, fontWeight: 700, letterSpacing: "-0.01em" }}
        className="mb-4 text-4xl sm:text-5xl"
      >
        Fair AI Observatory
      </h1>
      <p style={{ fontFamily: SANS, color: C.dim, maxWidth: 480 }} className="mb-10 text-base sm:text-lg">
        Point it at a dataset. It configures the compliance pipeline, runs the bias
        audit, and documents why every threshold was chosen.
      </p>
      <Button onClick={onStart}>
        Begin Setup <ArrowRight size={15} />
      </Button>

      <div
        className="mt-16 grid w-full max-w-2xl grid-cols-1 gap-px sm:grid-cols-3"
        style={{ background: C.hairline }}
      >
        {[
          ["EU AI ACT", "Annex III · High-Risk"],
          ["BIAS MODULES", "Disparate Impact → Mitigation"],
          ["AUDIT BASIS", "Article 10(2)(f)"],
        ].map(([k, v]) => (
          <div key={k} style={{ background: C.bg }} className="px-5 py-4">
            <div style={{ fontFamily: MONO, color: C.brassDim, fontSize: "0.6rem", letterSpacing: "0.1em" }}>
              {k}
            </div>
            <div style={{ fontFamily: MONO, color: C.text, fontSize: "0.78rem" }} className="mt-1">
              {v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- chat screen ---------- */
const PHASES = ["Schema", "Risk Tier", "Metrics", "Review"];

function phaseForStep(step) {
  if (step <= 2) return 0;
  if (step <= 4) return 1;
  if (step <= 6) return 2;
  return 3;
}

function AgentBubble({ children }) {
  return (
    <div className="flex gap-3">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
        style={{ background: C.panelLight, border: `1px solid ${C.teal}` }}
      >
        <div style={{ width: 6, height: 6, borderRadius: 9999, background: C.teal }} />
      </div>
      <div>
        <div style={{ fontFamily: MONO, color: C.teal, fontSize: "0.62rem", letterSpacing: "0.1em" }} className="mb-1">
          SETUP AGENT
        </div>
        <div
          className="max-w-md rounded-lg px-4 py-3"
          style={{ background: C.panel, color: C.text, fontFamily: SANS, fontSize: "0.92rem", lineHeight: 1.5 }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function UserBubble({ children }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-md rounded-lg px-4 py-3"
        style={{ background: C.panelLight, color: C.text, fontFamily: SANS, fontSize: "0.92rem", border: `1px solid ${C.hairline}` }}
      >
        {children}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="ml-10 max-w-md rounded-lg p-4" style={{ background: C.panelLight, border: `1px solid ${C.hairline}` }}>
      <div style={{ fontFamily: MONO, color: C.brass, fontSize: "0.62rem", letterSpacing: "0.1em" }} className="mb-3">
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, tag, tagColor }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderTop: `1px solid ${C.hairline}` }}>
      <span style={{ fontFamily: SANS, color: C.text, fontSize: "0.82rem" }}>{label}</span>
      {tag && (
        <span
          style={{
            fontFamily: MONO,
            fontSize: "0.6rem",
            color: tagColor || C.dim,
            border: `1px solid ${tagColor || C.dim}`,
            borderRadius: 4,
            padding: "1px 6px",
          }}
        >
          {tag}
        </span>
      )}
      {value && <span style={{ fontFamily: MONO, color: C.dim, fontSize: "0.72rem" }}>{value}</span>}
    </div>
  );
}

function ChatScreen({ onApprove }) {
  const [step, setStep] = useState(0);
  const phase = phaseForStep(step);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [step]);

  const blocks = [
    {
      render: () => (
        <AgentBubble>
          Dataset loaded: <code style={{ color: C.brass }}>german_credit_sample.csv</code> — 1,000
          records, 21 columns. Scanning schema…
        </AgentBubble>
      ),
      cta: "Continue",
    },
    {
      render: () => (
        <Card title="SCHEMA DETECTION">
          <Row label="Target" value="credit_risk (good / bad)" tag="HIGH" tagColor={C.sage} />
          <Row label="personal_status_and_sex" value="gender + marital_status" tag="COMPOUND" tagColor={C.brass} />
          <Row label="age" value="numeric, 19–75" tag="HIGH" tagColor={C.sage} />
          <Row label="foreign_worker" value="proxy for nationality" tag="MEDIUM" tagColor={C.dim} />
        </Card>
      ),
      cta: "Continue",
    },
    {
      render: () => (
        <AgentBubble>
          Found one compound field — <code style={{ color: C.brass }}>personal_status_and_sex</code>{" "}
          packs gender and marital status together. Recommend decomposing before running checks.
        </AgentBubble>
      ),
      cta: "Continue",
    },
    {
      render: () => (
        <AgentBubble>What does this model decide, and for whom?</AgentBubble>
      ),
      cta: "Approve or deny consumer credit applications →",
    },
    {
      render: () => (
        <>
          <UserBubble>Approve or deny consumer credit applications</UserBubble>
          <AgentBubble>
            Classified as <span style={{ color: C.brass }}>EU AI Act Annex III — high-risk</span> (credit
            scoring). Article 10(2)(f) requires bias testing for protected attributes, with a documented
            audit trail.
          </AgentBubble>
        </>
      ),
      cta: "Continue",
    },
    {
      render: () => (
        <Card title="RECOMMENDED METRICS">
          <Row label="Disparate Impact Ratio" value="threshold 0.80" />
          <Row label="Statistical Parity Difference" value="threshold 0.10" />
          <Row label="Intersectional Analysis" value="min n = 30" tag="GATED" tagColor={C.brass} />
          <Row label="Mitigation" value="Fairlearn ThresholdOptimizer" />
        </Card>
      ),
      cta: "Continue",
    },
    {
      render: () => (
        <AgentBubble>
          These thresholds are diagnostic defaults, not legal requirements — logging them as a
          documented methodology choice for DPO sign-off.
        </AgentBubble>
      ),
      cta: "Continue",
    },
    {
      render: () => (
        <Card title="CONFIG — REVIEW BEFORE RUN">
          <Row label="risk_tier" value="annex_iii_high_risk" />
          <Row label="decision_type" value="binary_allocative" />
          <Row label="protected_attrs" value="gender, marital_status, age" />
          <Row label="metrics" value="3 selected" />
          <Row label="mitigation_trigger" value="any_metric_violation" />
        </Card>
      ),
      cta: "Approve & Run Pipeline →",
    },
  ];

  const current = blocks[step];

  return (
    <div className="flex flex-1 overflow-hidden">
      <div
        className="hidden w-44 shrink-0 flex-col gap-1 px-5 py-6 sm:flex"
        style={{ borderRight: `1px solid ${C.hairline}` }}
      >
        {PHASES.map((p, i) => (
          <div key={p} className="flex items-center gap-2 py-2">
            {i < phase ? (
              <CheckCircle2 size={14} color={C.sage} />
            ) : i === phase ? (
              <div style={{ width: 14, height: 14, borderRadius: 9999, background: C.brass }} />
            ) : (
              <div style={{ width: 14, height: 14, borderRadius: 9999, border: `1px solid ${C.hairline}` }} />
            )}
            <span
              style={{
                fontFamily: MONO,
                fontSize: "0.7rem",
                color: i === phase ? C.text : C.dim,
                letterSpacing: "0.04em",
              }}
            >
              {p}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-1 flex-col">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-6 sm:px-8">
          {blocks.slice(0, step + 1).map((b, i) => (
            <div key={i}>{b.render()}</div>
          ))}
        </div>
        <div className="px-5 py-4 sm:px-8" style={{ borderTop: `1px solid ${C.hairline}` }}>
          <Button
            onClick={() => {
              if (step === blocks.length - 1) onApprove();
              else setStep(step + 1);
            }}
          >
            {current.cta} {step < blocks.length - 1 && <ArrowRight size={14} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- pipeline running ---------- */
const STAGES = [
  "Schema validation — Great Expectations",
  "Feature transforms — dbt",
  "Baseline model — XGBoost",
  "Bias audit — Fairlearn",
  "Mitigation — ThresholdOptimizer",
];

function PipelineScreen({ onDone }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (done >= STAGES.length) return;
    const t = setTimeout(() => setDone((d) => d + 1), 550);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-3">
        {STAGES.map((s, i) => (
          <div key={s} className="flex items-center gap-3 rounded px-4 py-3" style={{ background: C.panel }}>
            {i < done ? (
              <CheckCircle2 size={16} color={C.sage} />
            ) : i === done ? (
              <Loader2 size={16} color={C.brass} className="animate-spin" />
            ) : (
              <div style={{ width: 16, height: 16, borderRadius: 9999, border: `1px solid ${C.hairline}` }} />
            )}
            <span style={{ fontFamily: MONO, fontSize: "0.78rem", color: i <= done ? C.text : C.dim }}>{s}</span>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <Button onClick={onDone}>
          {done >= STAGES.length ? "View Results" : "Skip to Results"} <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
}

/* ---------- dashboard ---------- */
const BEFORE = { male: { total: 400, approved: 320 }, female: { total: 400, approved: 224 } };
const AFTER = { male: { total: 400, approved: 300 }, female: { total: 400, approved: 308 } };

const INTERSECTIONAL = [
  { group: "Male · 18–25", n: 142, rate: 0.71, ok: true },
  { group: "Male · 26+", n: 258, rate: 0.84, ok: true },
  { group: "Female · 18–25", n: 24, rate: null, ok: false },
  { group: "Female · 26+", n: 234, rate: 0.58, ok: true },
];

const AUDIT_LOG = [
  ["14:02", "Detected compound field `personal_status_and_sex`; decomposed into gender + marital_status", "setup_agent"],
  ["14:03", "Classified as Annex III high-risk (credit scoring)", "setup_agent"],
  ["14:04", "Disparate impact threshold set to 0.80 (diagnostic default)", "setup_agent"],
  ["14:05", "Female · 18–25 cell excluded from intersectional analysis (n=24 < 30)", "pipeline"],
  ["14:11", "Disparate impact 0.70 below threshold; ThresholdOptimizer mitigation applied", "pipeline"],
  ["14:12", "Post-mitigation disparate impact 0.97; flagged for DPO review", "pm_assistant"],
];

const DATA_QUALITY = [
  { check: "Schema match", detail: "21/21 expected columns present", status: "pass" },
  { check: "Null check — target", detail: "credit_risk: 0 nulls", status: "pass" },
  { check: "Range check — age", detail: "19–75, within expected bounds", status: "pass" },
  { check: "Duplicate rows", detail: "0 found", status: "pass" },
  { check: "Value set — personal_status_and_sex", detail: "4/4 expected categories", status: "pass" },
  { check: "Outlier check — credit_amount", detail: "3 values beyond 3× IQR", status: "warn" },
];

const PERFORMANCE = {
  before: { accuracy: 0.78, auc: 0.81, precision: 0.74, recall: 0.69 },
  after: { accuracy: 0.75, auc: 0.79, precision: 0.71, recall: 0.72 },
};

const ROBUSTNESS = [
  { check: "Distribution shift (15% credit_amount drift)", detail: "accuracy 0.59 → 0.61, degradation −0.02 (tolerance 0.05)", status: "pass" },
  { check: "Decision boundary sensitivity", detail: "27.6% flip rate on borderline cases (threshold 10%)", status: "fail" },
  { check: "Malformed input handling", detail: "4/4 test cases correctly rejected or accepted", status: "pass" },
  { check: "Out-of-distribution flagging", detail: "0/300 rows flagged beyond z=3.0 (informational)", status: "info" },
];

function StatTile({ label, value }) {
  return (
    <div className="rounded p-3" style={{ background: C.panelLight, border: `1px solid ${C.hairline}` }}>
      <div style={{ fontFamily: MONO, color: C.text, fontSize: "1.15rem", fontWeight: 700 }}>{value}</div>
      <div style={{ fontFamily: MONO, color: C.dim, fontSize: "0.58rem", letterSpacing: "0.06em" }} className="mt-1">
        {label.toUpperCase()}
      </div>
    </div>
  );
}

function DashboardScreen() {
  const [mitigated, setMitigated] = useState(false);
  const data = mitigated ? AFTER : BEFORE;
  const maleRate = data.male.approved / data.male.total;
  const femaleRate = data.female.approved / data.female.total;
  const disparateImpact = Math.min(maleRate, femaleRate) / Math.max(maleRate, femaleRate);
  const parityGap = Math.abs(maleRate - femaleRate);
  const perf = mitigated ? PERFORMANCE.after : PERFORMANCE.before;

  const barData = [
    { group: "Male", rate: Math.round(maleRate * 100), fill: C.brass },
    { group: "Female", rate: Math.round(femaleRate * 100), fill: C.teal },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div style={{ fontFamily: MONO, color: C.dim, fontSize: "0.65rem", letterSpacing: "0.08em" }}>
            RESULTS · german_credit_sample.csv · RUN #1
          </div>
          <div style={{ fontFamily: MONO, color: C.text, fontSize: "1.1rem", fontWeight: 600 }} className="mt-1">
            Credit Scoring — Bias Audit
          </div>
        </div>
        <div
          className="flex items-center gap-2 rounded px-3 py-2"
          style={{ background: C.panelLight, border: `1px solid ${C.brassDim}` }}
        >
          <ShieldCheck size={15} color={C.brass} />
          <span style={{ fontFamily: MONO, color: C.brass, fontSize: "0.65rem", letterSpacing: "0.04em" }}>
            EU AI ACT · ART. 10(2)(f) DOCUMENTED
          </span>
        </div>
      </div>

      <div className="mb-6 rounded-lg p-4" style={{ background: C.panel, border: `1px solid ${C.hairline}` }}>
        <div className="mb-3 flex items-center justify-between">
          <span style={{ fontFamily: MONO, color: C.dim, fontSize: "0.62rem", letterSpacing: "0.08em" }}>
            DATA QUALITY · GREAT EXPECTATIONS
          </span>
          <span style={{ fontFamily: MONO, color: C.sage, fontSize: "0.6rem" }}>5 PASS · 1 WARNING</span>
        </div>
        <div className="space-y-1">
          {DATA_QUALITY.map((c) => (
            <div
              key={c.check}
              className="flex items-center justify-between py-1.5"
              style={{ borderTop: `1px solid ${C.hairline}` }}
            >
              <div>
                <span style={{ fontFamily: SANS, color: C.text, fontSize: "0.8rem" }}>{c.check}</span>
                <span style={{ fontFamily: MONO, color: C.dim, fontSize: "0.66rem" }} className="ml-2">
                  {c.detail}
                </span>
              </div>
              {c.status === "pass" ? (
                <CheckCircle2 size={14} color={C.sage} />
              ) : (
                <AlertTriangle size={14} color={C.brass} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 flex items-center gap-2">
        {["Before mitigation", "After mitigation"].map((label, i) => {
          const active = mitigated === (i === 1);
          return (
            <button
              key={label}
              onClick={() => setMitigated(i === 1)}
              className="rounded px-3 py-1.5 transition-colors"
              style={{
                fontFamily: MONO,
                fontSize: "0.68rem",
                letterSpacing: "0.03em",
                background: active ? C.brass : "transparent",
                color: active ? "#1A140A" : C.dim,
                border: `1px solid ${active ? C.brass : C.hairline}`,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex justify-center rounded-lg py-5" style={{ background: C.panel, border: `1px solid ${C.hairline}` }}>
          <Gauge
            label="Disparate Impact"
            value={disparateImpact}
            max={1}
            threshold={0.8}
            format={(v) => v.toFixed(2)}
            passWhen="above"
          />
        </div>
        <div className="flex justify-center rounded-lg py-5" style={{ background: C.panel, border: `1px solid ${C.hairline}` }}>
          <Gauge
            label="Statistical Parity Gap"
            value={parityGap}
            max={0.3}
            threshold={0.1}
            format={(v) => v.toFixed(2)}
            passWhen="below"
          />
        </div>
      </div>

      <div className="mb-6 rounded-lg p-4" style={{ background: C.panel, border: `1px solid ${C.hairline}` }}>
        <div style={{ fontFamily: MONO, color: C.dim, fontSize: "0.62rem", letterSpacing: "0.08em" }} className="mb-3">
          MODEL PERFORMANCE · XGBOOST BASELINE
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Accuracy" value={`${Math.round(perf.accuracy * 100)}%`} />
          <StatTile label="AUC-ROC" value={perf.auc.toFixed(2)} />
          <StatTile label="Precision" value={perf.precision.toFixed(2)} />
          <StatTile label="Recall" value={perf.recall.toFixed(2)} />
        </div>
        <div style={{ fontFamily: SANS, color: C.dim, fontSize: "0.72rem" }} className="mt-3">
          Trade-off: mitigation costs ~3 points of accuracy (78% → 75%) for a parity gap improvement
          from 0.24 to 0.02.
        </div>
      </div>

      <div className="mb-6 rounded-lg p-4" style={{ background: C.panel, border: `1px solid ${C.hairline}` }}>
        <div className="mb-3 flex items-center justify-between">
          <span style={{ fontFamily: MONO, color: C.dim, fontSize: "0.62rem", letterSpacing: "0.08em" }}>
            ROBUSTNESS · ARTICLE 15
          </span>
          <span style={{ fontFamily: MONO, color: C.rust, fontSize: "0.6rem" }}>1 FAIL · 2 PASS · 1 INFO</span>
        </div>
        <div className="space-y-1">
          {ROBUSTNESS.map((c) => (
            <div
              key={c.check}
              className="flex items-center justify-between py-1.5"
              style={{ borderTop: `1px solid ${C.hairline}` }}
            >
              <div>
                <span style={{ fontFamily: SANS, color: C.text, fontSize: "0.8rem" }}>{c.check}</span>
                <div style={{ fontFamily: MONO, color: C.dim, fontSize: "0.64rem" }}>{c.detail}</div>
              </div>
              {c.status === "pass" ? (
                <CheckCircle2 size={14} color={C.sage} />
              ) : c.status === "fail" ? (
                <AlertTriangle size={14} color={C.rust} />
              ) : (
                <div style={{ width: 6, height: 6, borderRadius: 9999, background: C.dim }} />
              )}
            </div>
          ))}
        </div>
        <div style={{ fontFamily: SANS, color: C.dim, fontSize: "0.72rem" }} className="mt-3">
          The boundary-sensitivity failure means a meaningful share of borderline applicants would
          get a different decision under a small, plausible change to their inputs — flagged for
          model review, separate from the fairness findings above.
        </div>
      </div>

      <div className="mb-6 rounded-lg p-4" style={{ background: C.panel, border: `1px solid ${C.hairline}` }}>
        <div style={{ fontFamily: MONO, color: C.dim, fontSize: "0.62rem", letterSpacing: "0.08em" }} className="mb-3">
          APPROVAL RATE BY GROUP
        </div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.hairline} vertical={false} />
              <XAxis dataKey="group" tick={{ fill: C.dim, fontFamily: MONO, fontSize: 11 }} axisLine={{ stroke: C.hairline }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: C.dim, fontFamily: MONO, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ background: C.panelLight, border: `1px solid ${C.hairline}`, borderRadius: 6 }}
                labelStyle={{ color: C.text, fontFamily: MONO, fontSize: 11 }}
                itemStyle={{ color: C.text, fontFamily: MONO, fontSize: 11 }}
                formatter={(v) => [`${v}%`, "Approval rate"]}
              />
              <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                {barData.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg p-4" style={{ background: C.panel, border: `1px solid ${C.hairline}` }}>
          <div style={{ fontFamily: MONO, color: C.dim, fontSize: "0.62rem", letterSpacing: "0.08em" }} className="mb-3">
            INTERSECTIONAL BREAKDOWN
          </div>
          <div className="space-y-1">
            {INTERSECTIONAL.map((row) => (
              <div key={row.group} className="flex items-center justify-between py-1.5" style={{ borderTop: `1px solid ${C.hairline}` }}>
                <span style={{ fontFamily: SANS, color: C.text, fontSize: "0.82rem" }}>{row.group}</span>
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: MONO, color: C.dim, fontSize: "0.68rem" }}>n={row.n}</span>
                  {row.ok ? (
                    <span style={{ fontFamily: MONO, color: C.text, fontSize: "0.72rem" }}>{Math.round(row.rate * 100)}%</span>
                  ) : (
                    <span className="flex items-center gap-1" style={{ fontFamily: MONO, color: C.rust, fontSize: "0.62rem" }}>
                      <AlertTriangle size={11} /> INSUFFICIENT DATA
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg p-4" style={{ background: C.panel, border: `1px solid ${C.hairline}` }}>
          <div style={{ fontFamily: MONO, color: C.dim, fontSize: "0.62rem", letterSpacing: "0.08em" }} className="mb-3">
            AUDIT TRAIL
          </div>
          <div className="space-y-2.5">
            {AUDIT_LOG.map(([time, text, source], i) => (
              <div key={i} className="flex gap-2">
                <span style={{ fontFamily: MONO, color: C.brassDim, fontSize: "0.65rem", whiteSpace: "nowrap" }}>{time}</span>
                <div>
                  <span style={{ fontFamily: SANS, color: C.text, fontSize: "0.76rem", lineHeight: 1.4 }}>{text}</span>{" "}
                  <span style={{ fontFamily: MONO, color: C.teal, fontSize: "0.6rem" }}>· {source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- root ---------- */
export default function ObservatoryDemo() {
  useGoogleFonts();
  const [screen, setScreen] = useState("intro");

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{
        background: `radial-gradient(ellipse at top, ${C.panel} 0%, ${C.bg} 65%)`,
        fontFamily: SANS,
      }}
    >
      <style>{`
        button:focus-visible { outline: 2px solid ${C.brass}; outline-offset: 2px; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: ${C.hairline}; border-radius: 4px; }
      `}</style>
      <Header screen={screen} onRestart={() => setScreen("intro")} />
      {screen === "intro" && <IntroScreen onStart={() => setScreen("chat")} />}
      {screen === "chat" && <ChatScreen onApprove={() => setScreen("pipeline")} />}
      {screen === "pipeline" && <PipelineScreen onDone={() => setScreen("dashboard")} />}
      {screen === "dashboard" && <DashboardScreen />}
    </div>
  );
}

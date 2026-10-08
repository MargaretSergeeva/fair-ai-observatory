import { useEffect } from "react";

const BG   = "#000000";
const P1   = "#0C0C14";   // box fill
const P2   = "#121220";   // nested box fill
const BRASS  = "#C99A53";
const TEAL   = "#4FA8A0";
const SAGE   = "#6FA888";
const RUST   = "#C25B45";
const PURPLE = "#9B8FD4";
const DIM    = "#5A6080";
const TEXT   = "#E8E4DA";
const HAIR   = "#1E2030";

const MONO = "'IBM Plex Mono', monospace";
const SANS = "'IBM Plex Sans', sans-serif";

function useFont() {
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap";
    document.head.appendChild(l);
  }, []);
}

/* ───── primitives ───── */
function Dot({ c, glow }) {
  return (
    <div style={{
      width: 8, height: 8, borderRadius: "50%",
      background: c, flexShrink: 0,
      boxShadow: glow !== false ? `0 0 7px ${c}` : "none",
    }} />
  );
}

function Tag({ label, color }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center",
      border: `1px solid ${color}55`,
      borderRadius: 4, padding: "1px 6px",
      fontFamily: MONO, fontSize: "0.5rem",
      color, letterSpacing: "0.07em",
    }}>
      {label}
    </div>
  );
}

/* labeled section wrapper with top border tag */
function Section({ label, color, children, w, style }) {
  return (
    <div style={{
      position: "relative",
      border: `1px solid ${color}44`,
      borderRadius: 12,
      background: P1,
      padding: "18px 14px 14px",
      width: w, boxSizing: "border-box",
      ...style,
    }}>
      <div style={{
        position: "absolute", top: -10, left: 14,
        background: BG, padding: "0 8px",
        fontFamily: MONO, fontSize: "0.52rem",
        letterSpacing: "0.12em", color,
        textTransform: "uppercase",
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

/* plain node box */
function Box({ title, sub, icon, accent = TEAL, w, h, children, style }) {
  return (
    <div style={{
      background: P2,
      border: `1px solid ${accent}44`,
      borderRadius: 8,
      padding: "10px 12px",
      width: w, minHeight: h,
      boxSizing: "border-box",
      display: "flex", flexDirection: "column", gap: 5,
      ...style,
    }}>
      {(icon || title) && (
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {icon && <span style={{ fontSize: "1rem", flexShrink: 0 }}>{icon}</span>}
          {title && (
            <div style={{ fontFamily: MONO, color: TEXT, fontSize: "0.7rem", fontWeight: 600, lineHeight: 1.2 }}>
              {title}
            </div>
          )}
        </div>
      )}
      {sub && (
        <div style={{ fontFamily: SANS, color: DIM, fontSize: "0.62rem", lineHeight: 1.4 }}>
          {sub}
        </div>
      )}
      {children}
    </div>
  );
}

/* pipeline stage rack unit */
function Stage({ dot, label, sub, tag, open, w = 136 }) {
  const dc = dot === "sage" ? SAGE : dot === "rust" ? RUST : dot === "teal" ? TEAL : BRASS;
  return (
    <div style={{
      background: P2,
      border: `1px solid ${dc}44`,
      borderRadius: 8,
      padding: "10px 11px",
      width: w, flexShrink: 0,
      boxSizing: "border-box",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Dot c={dc} />
        <div style={{ fontFamily: MONO, color: TEXT, fontSize: "0.66rem", fontWeight: 600, lineHeight: 1.2 }}>
          {label}
        </div>
      </div>
      <div style={{ fontFamily: SANS, color: DIM, fontSize: "0.59rem", lineHeight: 1.4 }}>
        {sub}
      </div>
      {tag && <Tag label={tag} color={dc} />}
      {open && (
        <div style={{ fontFamily: MONO, color: RUST, fontSize: "0.53rem", display: "flex", alignItems: "center", gap: 4 }}>
          <Dot c={RUST} /> OPEN FINDING
        </div>
      )}
    </div>
  );
}

/* horizontal arrow */
function H({ color = HAIR, label, len = 28 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
      {label && (
        <div style={{ fontFamily: MONO, color: DIM, fontSize: "0.48rem", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
          {label}
        </div>
      )}
      <svg width={len} height={14} viewBox={`0 0 ${len} 14`} style={{ display: "block" }}>
        <line x1="0" y1="7" x2={len - 8} y2="7" stroke={color} strokeWidth="1.5" />
        <polygon points={`${len},7 ${len - 8},3 ${len - 8},11`} fill={color} />
      </svg>
    </div>
  );
}

/* vertical arrow */
function V({ color = HAIR, label, len = 32 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0, height: len + 20 }}>
      <svg width={16} height={len} viewBox={`0 0 16 ${len}`} style={{ display: "block" }}>
        <line x1="8" y1="0" x2="8" y2={len - 8} stroke={color} strokeWidth="1.5" />
        <polygon points={`8,${len} 4,${len - 8} 12,${len - 8}`} fill={color} />
      </svg>
      {label && (
        <div style={{ fontFamily: MONO, color: DIM, fontSize: "0.48rem", letterSpacing: "0.06em" }}>
          {label}
        </div>
      )}
    </div>
  );
}

/* human gate pill */
function Gate({ label, color = BRASS }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      background: `${color}14`,
      border: `1.5px solid ${color}88`,
      borderRadius: 24, padding: "8px 18px",
      flexShrink: 0,
    }}>
      <Dot c={color} />
      <div style={{ fontFamily: MONO, color, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.05em" }}>
        {label}
      </div>
    </div>
  );
}

/* output tile */
function Output({ icon, title, sub, color }) {
  return (
    <div style={{
      flex: 1, minWidth: 200,
      background: P2,
      border: `1px solid ${color}55`,
      borderRadius: 10,
      padding: "14px 14px",
      display: "flex", flexDirection: "column", gap: 7,
    }}>
      <div style={{ fontSize: "1.3rem" }}>{icon}</div>
      <div style={{ fontFamily: MONO, color, fontSize: "0.7rem", fontWeight: 600, lineHeight: 1.3 }}>
        {title}
      </div>
      <div style={{ fontFamily: SANS, color: DIM, fontSize: "0.62rem", lineHeight: 1.45, flex: 1 }}>
        {sub}
      </div>
    </div>
  );
}

/* agent row item */
function Agent({ icon, name, role, authority, color }) {
  return (
    <div style={{
      background: P2,
      border: `1px solid ${color}44`,
      borderRadius: 8,
      padding: "10px 12px",
      display: "flex", flexDirection: "column", gap: 5,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: "1rem" }}>{icon}</span>
        <div style={{ fontFamily: MONO, color, fontSize: "0.67rem", fontWeight: 600 }}>{name}</div>
      </div>
      <div style={{ fontFamily: SANS, color: TEXT, fontSize: "0.62rem", lineHeight: 1.35 }}>{role}</div>
      <div style={{
        background: BG, borderRadius: 5, padding: "4px 8px",
        fontFamily: MONO, color: RUST, fontSize: "0.53rem", letterSpacing: "0.04em",
      }}>
        AUTHORITY: {authority}
      </div>
    </div>
  );
}

/* ───── main ───── */
export default function ObservatorySchema() {
  useFont();

  return (
    <div style={{ background: BG, minHeight: "100%", padding: "28px 0 36px", overflowX: "auto" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        .live { animation: pulse 2.8s ease-in-out infinite; }
      `}</style>

      {/* ── canvas ── */}
      <div style={{ width: 1380, margin: "0 auto", display: "flex", flexDirection: "column", gap: 0 }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, padding: "0 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="live" style={{ width: 10, height: 10, borderRadius: "50%", background: BRASS, boxShadow: `0 0 14px ${BRASS}` }} />
            <span style={{ fontFamily: MONO, color: TEXT, fontSize: "1rem", fontWeight: 700, letterSpacing: "0.16em" }}>
              FAIR AI OBSERVATORY
            </span>
          </div>
          <div style={{ fontFamily: MONO, color: DIM, fontSize: "0.6rem", letterSpacing: "0.1em" }}>
            PIPELINE ARCHITECTURE · EU AI ACT ANNEX III HIGH-RISK
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            ROW 1 — INPUT → SETUP AGENT → GATE → APPROVED CONFIG
        ══════════════════════════════════════════════════════ */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>

          {/* Dataset */}
          <Box icon="📂" title="Dataset" sub="CSV / DB connection" accent={TEAL} w={130} h={80} />

          <H color={TEAL} label="ingest" len={32} />

          {/* Setup Agent */}
          <Section label="Setup Agent · Claude API" color={PURPLE} style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
              {[
                { n: "01", t: "Schema Detection", b: "Column scan · compound field decomposition · proxy attributes" },
                { n: "02", t: "Risk Classification", b: "EU AI Act risk tier · Annex III mapping · decision type" },
                { n: "03", t: "Metric Selection", b: "Fairness checks chosen by tier and decision type" },
                { n: "04", t: "Config Draft", b: "YAML — risk_tier · metrics · protected_attrs · thresholds" },
              ].map((s, i, arr) => (
                <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                  <div style={{
                    flex: 1, minWidth: 0,
                    background: P2,
                    border: `1px solid ${PURPLE}44`,
                    borderRadius: 8,
                    padding: "10px 12px",
                    boxSizing: "border-box",
                  }}>
                    <div style={{ fontFamily: MONO, color: PURPLE, fontSize: "0.5rem", opacity: 0.6, marginBottom: 4 }}>{s.n}</div>
                    <div style={{ fontFamily: MONO, color: TEXT, fontSize: "0.67rem", fontWeight: 600, marginBottom: 5, lineHeight: 1.2 }}>{s.t}</div>
                    <div style={{ fontFamily: SANS, color: DIM, fontSize: "0.6rem", lineHeight: 1.4 }}>{s.b}</div>
                  </div>
                  {i < arr.length - 1 && <H color={PURPLE} len={22} />}
                </div>
              ))}
            </div>
          </Section>

          <H color={BRASS} len={24} />
          <Gate label="HUMAN REVIEW" color={BRASS} />
          <H color={BRASS} label="approved" len={28} />

          {/* Approved config */}
          <div style={{
            background: `${BRASS}10`,
            border: `1.5px dashed ${BRASS}66`,
            borderRadius: 8,
            padding: "12px 16px",
            flexShrink: 0, width: 148,
            boxSizing: "border-box",
          }}>
            <div style={{ fontFamily: MONO, color: BRASS, fontSize: "0.68rem", fontWeight: 600, marginBottom: 5 }}>
              pipeline_config.yaml
            </div>
            <div style={{ fontFamily: SANS, color: DIM, fontSize: "0.6rem", lineHeight: 1.4 }}>
              risk_tier · metrics<br />protected_attrs<br />thresholds
            </div>
          </div>
        </div>

        {/* vertical connector */}
        <div style={{ display: "flex", justifyContent: "center", height: 36 }}>
          <V color={HAIR} len={36} />
        </div>

        {/* ══════════════════════════════════════════════════════
            ROW 2 — AIRFLOW PIPELINE RACK
        ══════════════════════════════════════════════════════ */}
        <Section label="Apache Airflow · Deterministic Pipeline" color={BRASS} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>

            <Stage dot="sage" w={148} label="Great Expectations"
              sub="Schema · nulls · ranges · value sets · outlier flags"
              tag="ART. 10(2)(e)" />
            <H color={HAIR} len={20} />

            <Stage dot="sage" w={140} label="dbt"
              sub="Feature transforms · compound field decomposition · train/test split"
              tag="ART. 10(2)(c)" />
            <H color={HAIR} len={20} />

            <Stage dot="sage" w={140} label="XGBoost Baseline"
              sub="Fairness-through-unawareness · binary credit risk classifier"
              tag="ART. 10(2)(a)" />
            <H color={HAIR} len={20} />

            {/* Bias battery group */}
            <Section label="Bias Battery · Art. 10(2)(f)" color={TEAL} style={{ padding: "14px 10px 10px", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 7 }}>
                {[
                  { label: "Disparate Impact", sub: "Ratio ≥ 0.80", color: TEAL },
                  { label: "Equalized Odds", sub: "Diff ≤ 0.10", color: TEAL },
                  { label: "Intersectional", sub: "Min n = 30 gated", color: TEAL },
                ].map(b => (
                  <div key={b.label} style={{
                    background: P1, border: `1px solid ${b.color}44`,
                    borderRadius: 7, padding: "9px 10px", width: 126,
                    boxSizing: "border-box",
                  }}>
                    <Dot c={b.color} />
                    <div style={{ fontFamily: MONO, color: TEXT, fontSize: "0.63rem", fontWeight: 600, marginTop: 6, lineHeight: 1.3 }}>{b.label}</div>
                    <div style={{ fontFamily: SANS, color: DIM, fontSize: "0.58rem", marginTop: 4, lineHeight: 1.3 }}>{b.sub}</div>
                  </div>
                ))}
              </div>
            </Section>
            <H color={HAIR} len={20} />

            <Stage dot="sage" w={140} label="Fairlearn Mitigation"
              sub="ThresholdOptimizer · any_metric_violation trigger · discloses accuracy cost"
              tag="ART. 10(2)(f)" />
            <H color={HAIR} len={20} />

            {/* Robustness battery group */}
            <Section label="Robustness Battery · Art. 15" color={RUST} style={{ padding: "14px 10px 10px", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 7 }}>
                {[
                  { label: "Distribution Shift", sub: "15% drift test", dot: "sage" },
                  { label: "Boundary Sensitivity", sub: "27.6% flip rate", dot: "rust", open: true },
                  { label: "Input Validation", sub: "Malformed reject", dot: "sage" },
                  { label: "OOD Flagging", sub: "Informational only", dot: "dim" },
                ].map(r => {
                  const dc = r.dot === "sage" ? SAGE : r.dot === "rust" ? RUST : DIM;
                  return (
                    <div key={r.label} style={{
                      background: P1, border: `1px solid ${dc}44`,
                      borderRadius: 7, padding: "9px 10px", width: 116,
                      boxSizing: "border-box",
                    }}>
                      <Dot c={dc} />
                      <div style={{ fontFamily: MONO, color: TEXT, fontSize: "0.63rem", fontWeight: 600, marginTop: 6, lineHeight: 1.3 }}>{r.label}</div>
                      <div style={{ fontFamily: SANS, color: DIM, fontSize: "0.58rem", marginTop: 4, lineHeight: 1.3 }}>{r.sub}</div>
                      {r.open && (
                        <div style={{ fontFamily: MONO, color: RUST, fontSize: "0.5rem", marginTop: 5, letterSpacing: "0.04em" }}>
                          ● OPEN
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>

          </div>
        </Section>

        {/* vertical connector */}
        <div style={{ display: "flex", justifyContent: "center", height: 36 }}>
          <V color={HAIR} len={36} />
        </div>

        {/* ══════════════════════════════════════════════════════
            ROW 3 — AUDIT TRAIL + AGENT TEAM
        ══════════════════════════════════════════════════════ */}
        <div style={{ display: "flex", gap: 14, marginBottom: 14, alignItems: "stretch" }}>

          {/* Audit trail flow */}
          <Section label="Audit Trail · State" color={BRASS} style={{ flex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Box title="decisions.log" accent={BRASS} w={200}
                sub={"Every threshold choice · mitigation trigger · open finding — append-only by timestamp + source"} />
              <H color={BRASS} len={22} />
              <Box title="module_status.yaml" accent={BRASS} w={186}
                sub="Current state per module: not_started · in_progress · blocked · done" />
              <H color={BRASS} label="n8n sync" len={32} />
              <Box title="Jira Board" accent={BRASS} w={170}
                sub="Bidirectional sync · one issue per module · decisions logged as comments" />
            </div>
          </Section>

          {/* Agent team */}
          <Section label="Agent Team · Claude Code Skills" color={PURPLE} style={{ flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Agent icon="⌨️" name="Developer Agent" color={TEAL}
                role="Implements · tests · flags PRs · writes to decisions.log"
                authority="None — never merges" />
              <Agent icon="📋" name="PM Assistant" color={BRASS}
                role="Status · phase gates · Jira sync · knowledge base from PM course"
                authority="None — surfaces, doesn't decide" />
              <Agent icon="⚖️" name="Stakeholder Panel" color={PURPLE}
                role="Applicant Advocate · Regulator/DPO · Lender — pre-commit pressure test"
                authority="None — argues, doesn't decide" />
            </div>
          </Section>

        </div>

        {/* vertical connector */}
        <div style={{ display: "flex", justifyContent: "center", height: 36 }}>
          <V color={HAIR} len={36} />
        </div>

        {/* ══════════════════════════════════════════════════════
            ROW 4 — OUTPUTS
        ══════════════════════════════════════════════════════ */}
        <Section label="Outputs" color={SAGE}>
          <div style={{ display: "flex", gap: 12 }}>
            <Output icon="📊" color={TEAL}
              title="Interactive Dashboard"
              sub="Data quality · Fairness gauges (before/after mitigation) · Model performance · Robustness — all toggleable in one view" />
            <Output icon="📄" color={BRASS}
              title="Annex IV Technical Documentation"
              sub="Articles 9 · 10 · 12 · 14 · 15 — scope table on page 1 states coverage level per article · 6 pages" />
            <Output icon="📋" color={SAGE}
              title="Article 13 Instructions for Use"
              sub="Deployer-facing · plain language · known limitations · oversight requirements · monitoring cadence" />
            <Output icon="🗂️" color={PURPLE}
              title="Audit Trail Export"
              sub="decisions.log — every threshold choice · mitigation trigger · finding · source agent — DPO-ready" />
          </div>
        </Section>

        {/* ── LEGEND ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 24,
          marginTop: 22, padding: "0 4px", flexWrap: "wrap",
        }}>
          {[
            [SAGE,   "PASS"],
            [RUST,   "OPEN FINDING"],
            [BRASS,  "HUMAN GATE / REVIEW"],
            [PURPLE, "AGENT / LLM LAYER"],
            [TEAL,   "DATA / FAIRNESS"],
          ].map(([c, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Dot c={c} />
              <span style={{ fontFamily: MONO, color: DIM, fontSize: "0.54rem", letterSpacing: "0.06em" }}>{l}</span>
            </div>
          ))}
          <div style={{ marginLeft: "auto", fontFamily: MONO, color: DIM, fontSize: "0.54rem", letterSpacing: "0.05em" }}>
            LLM LAYER IS SETUP + REVIEW ONLY · PIPELINE EXECUTION IS FULLY DETERMINISTIC
          </div>
        </div>

      </div>
    </div>
  );
}

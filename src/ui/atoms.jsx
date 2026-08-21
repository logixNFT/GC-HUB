import React from "react";
import { T } from "../theme.js";

/* ---------- tiny UI atoms ---------- */
export const Pill = ({ color, bg, children }) => (
  <span style={{
    fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 600,
    letterSpacing: 0.4, color, background: bg, padding: "3px 8px",
    borderRadius: 4, whiteSpace: "nowrap", textTransform: "uppercase",
  }}>{children}</span>
);

export const Mono = ({ children, dim, title }) => (
  <span title={title} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: dim ? T.inkFaint : T.inkSoft }}>{children}</span>
);

export const Field = ({ label, children, span }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: span ? "1 / -1" : undefined }}>
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", color: T.inkFaint }}>{label}</span>
    {children}
  </label>
);

export const inputStyle = {
  fontFamily: "'Inter', sans-serif", fontSize: 13, color: T.ink,
  border: `1px solid ${T.line}`, borderRadius: 6, padding: "8px 10px",
  background: "#FCFCFD", outline: "none", width: "100%", boxSizing: "border-box",
};

export const Btn = ({ onClick, children, kind = "solid", small, title }) => (
  <button onClick={onClick} title={title} style={{
    fontFamily: "'Inter', sans-serif", fontWeight: 600,
    fontSize: small ? 12 : 13, cursor: "pointer", borderRadius: 6,
    padding: small ? "6px 12px" : "9px 16px",
    border: kind === "ghost" ? `1px solid ${T.line}` : "1px solid transparent",
    background: kind === "solid" ? T.orange : kind === "navy" ? T.navy : "transparent",
    color: kind === "ghost" ? T.navy : "#fff",
  }}>{children}</button>
);

/* ---------- shared layout pieces ---------- */
export const rowStyle = {
  display: "flex", alignItems: "center", gap: 10,
  padding: "10px 0", borderBottom: `1px solid ${T.line}`,
};

export const formCard = {
  background: T.card, border: `1px solid ${T.orange}`, borderRadius: 8,
  padding: "18px 20px", marginBottom: 20,
};

export const grid3 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 };

export const Empty = ({ text }) => (
  <div style={{ padding: "18px 0", color: T.inkFaint, fontSize: 13 }}>{text}</div>
);

export const Panel = ({ title, children, action }) => (
  <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 8, padding: "16px 18px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, color: T.navy }}>{title}</div>
      {action && (
        <button onClick={action} style={{ background: "none", border: "none", color: T.orange, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Open →
        </button>
      )}
    </div>
    {children}
  </div>
);

export const ModuleHead = ({ title, sub, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: T.navy, margin: 0 }}>{title}</h2>
      <p style={{ fontSize: 13, color: T.inkSoft, margin: "6px 0 0", lineHeight: 1.55 }}>{sub}</p>
    </div>
    <div className="hub-modhead-actions">{action}</div>
  </div>
);

export function Table({ cols, rows }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 8, overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th key={i} style={{
                textAlign: "left", padding: "11px 14px",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
                letterSpacing: 1, textTransform: "uppercase", color: T.inkFaint,
                borderBottom: `2px solid ${T.navy}`, whiteSpace: "nowrap",
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={cols.length} style={{ padding: 24, color: T.inkFaint, fontSize: 13 }}>
              No records match. Add one to start building the dataset.
            </td></tr>
          )}
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${T.line}` }}>
              {r.map((cell, j) => <td key={j} style={{ padding: "11px 14px", verticalAlign: "top", color: T.ink }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

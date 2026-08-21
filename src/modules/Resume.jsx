import React from "react";
import { T, fmtMoney } from "../theme.js";
import { Btn, ModuleHead } from "../ui/atoms.jsx";

const ResumeSection = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
      letterSpacing: 1.6, textTransform: "uppercase", color: T.orange,
      borderBottom: `1px solid ${T.line}`, paddingBottom: 5, marginBottom: 10,
    }}>{title}</div>
    {children}
  </div>
);

export default function Resume({ data }) {
  const pf = data.profile;
  const shown = data.projects.filter(p => p.showOnResume);
  const totalValue = shown.reduce((s, p) => s + (p.value || 0), 0);
  const contact = [pf.location, pf.phone, pf.email, pf.linkedin].filter(Boolean).join(" · ");

  return (
    <div>
      <ModuleHead
        title="Resume & Portfolio"
        sub="Generated live from the project registry and profile. Toggle projects on the Projects tab, then print or save as PDF for prequalification packages."
        action={<Btn kind="navy" onClick={() => window.print()}>Print / Save PDF</Btn>}
      />
      <div id="resume-sheet" style={{
        background: "#fff", border: `1px solid ${T.line}`, borderRadius: 8,
        maxWidth: 820, margin: "0 auto", padding: "48px 56px",
      }}>
        <div style={{ borderBottom: `3px solid ${T.navy}`, paddingBottom: 18, marginBottom: 20 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 700, color: T.navy, letterSpacing: -0.5 }}>{pf.name}</div>
          {pf.titles.map((t, i) => (
            <div key={i} style={{ fontSize: 13.5, color: T.ink, fontWeight: 600, marginTop: i === 0 ? 8 : 2 }}>{t}</div>
          ))}
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.inkSoft, marginTop: 10 }}>
            {contact}
          </div>
        </div>

        <ResumeSection title="Profile">
          <p style={{ fontSize: 13, lineHeight: 1.7, color: T.ink, margin: 0 }}>{pf.summary}</p>
        </ResumeSection>

        <ResumeSection title="Licenses & Certifications">
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8, color: T.ink }}>
            {pf.licenses.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </ResumeSection>

        <ResumeSection title="Core Competencies">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "4px 24px" }}>
            {pf.coreCompetencies.map((c, i) => (
              <div key={i} style={{ fontSize: 12.5, color: T.ink, display: "flex", gap: 8 }}>
                <span style={{ color: T.orange, fontWeight: 700 }}>▪</span>{c}
              </div>
            ))}
          </div>
        </ResumeSection>

        <ResumeSection title={`Project Portfolio — ${shown.length} projects · ${fmtMoney(totalValue)}+ combined value`}>
          {shown.map(p => (
            <div key={p.id} style={{ marginBottom: 18, breakInside: "avoid" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{p.name}</div>
                {p.value > 0 && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: T.orange, fontWeight: 700, whiteSpace: "nowrap" }}>{fmtMoney(p.value)}</div>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 2 }}>
                {p.role} · {p.client} · {p.delivery} · {p.location} · {p.start}–{p.end}
              </div>
              <p style={{ fontSize: 12.5, lineHeight: 1.65, color: T.ink, margin: "6px 0 0" }}>{p.scope}</p>
              {p.highlights?.length > 0 && (
                <ul style={{ margin: "5px 0 0", paddingLeft: 18, fontSize: 12, lineHeight: 1.6, color: T.inkSoft }}>
                  {p.highlights.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              )}
            </div>
          ))}
        </ResumeSection>
      </div>
    </div>
  );
}

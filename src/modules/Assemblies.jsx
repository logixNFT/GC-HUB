import React, { useState } from "react";
import { T } from "../theme.js";
import { Pill, Mono, ModuleHead } from "../ui/atoms.jsx";

const label = {
  fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase",
  color: T.inkFaint, fontFamily: "'JetBrains Mono', monospace",
};

export default function Assemblies({ data, query }) {
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState(null);

  const cats = ["All", ...new Set(data.assemblies.map(a => a.category))];
  const list = data.assemblies
    .filter(a => cat === "All" || a.category === cat)
    .filter(a => !query || `${a.name} ${a.spec} ${a.notes}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <ModuleHead
        title="Assemblies & Standard Packages"
        sub="Reusable technical assemblies and permit packages — dewatering systems, MOT/TTC setups, FDOT and FDEP workflows with compliance requirements baked in."
      />
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, fontWeight: 600,
            padding: "6px 14px", borderRadius: 20, cursor: "pointer",
            border: `1px solid ${cat === c ? T.orange : T.line}`,
            background: cat === c ? T.orange : "#fff", color: cat === c ? "#fff" : T.inkSoft,
          }}>{c}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 14 }}>
        {list.map(a => {
          const isOpen = open === a.id;
          return (
            <div key={a.id} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.line}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600, color: T.navy }}>{a.name}</div>
                  <Mono dim>{a.id} · {a.spec}</Mono>
                </div>
                <Pill color={T.orange} bg={T.orangeSoft}>{a.category}</Pill>
              </div>
              <div style={{ padding: "12px 16px" }}>
                <div style={{ ...label, marginBottom: 6 }}>Components</div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, color: T.ink, lineHeight: 1.65 }}>
                  {(isOpen ? a.components : a.components.slice(0, 3)).map((c, i) => <li key={i}>{c}</li>)}
                </ul>
                {!isOpen && a.components.length > 3 && (
                  <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 4 }}>+{a.components.length - 3} more</div>
                )}
                {isOpen && (
                  <>
                    <div style={{ ...label, margin: "12px 0 6px" }}>Compliance</div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, color: T.ink, lineHeight: 1.65 }}>
                      {a.compliance.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                    {a.notes && <div style={{ marginTop: 10, fontSize: 12, color: T.inkSoft, fontStyle: "italic" }}>{a.notes}</div>}
                  </>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 12 }}>
                  <Mono>{a.typCost}</Mono>
                  <button onClick={() => setOpen(isOpen ? null : a.id)} style={{
                    background: "none", border: "none", color: T.orange,
                    fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap",
                  }}>
                    {isOpen ? "Collapse" : "Full assembly →"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

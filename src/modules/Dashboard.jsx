import React from "react";
import { T, STAGE_COLORS } from "../theme.js";
import { Pill, Mono, Panel, Empty, rowStyle } from "../ui/atoms.jsx";

/* Rolling COI horizon — 75 days from today, so the panel never goes stale. */
const horizon = () => {
  const d = new Date();
  d.setDate(d.getDate() + 75);
  return d.toISOString().slice(0, 10);
};

export default function Dashboard({ data, go }) {
  const cards = [
    { key: "vendors", label: "Vendors", count: data.vendors.length, sub: `${data.vendors.filter(v => v.status === "Active").length} active` },
    { key: "drawings", label: "Drawings", count: data.drawings.length, sub: `${data.drawings.filter(d => d.status === "Current").length} current rev` },
    { key: "assemblies", label: "Assemblies", count: data.assemblies.length, sub: "Dewatering · MOT · DOT · FDEP" },
    { key: "permits", label: "Permits & Compliance", count: data.permits.length, sub: `${data.permits.filter(p => ["Submitted", "Under Review"].includes(p.stage)).length} in agency review` },
    { key: "projects", label: "Projects", count: data.projects.length, sub: `${data.projects.filter(p => p.status === "Active").length} active` },
  ];
  const cut = horizon();
  const expiring = data.vendors
    .filter(v => v.coiExp && v.coiExp <= cut)
    .sort((a, b) => a.coiExp.localeCompare(b.coiExp));
  const openPermits = data.permits.filter(p => !["Issued", "Closed"].includes(p.stage));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 26 }}>
        {cards.map(c => (
          <div key={c.key} onClick={() => go(c.key)} style={{
            background: T.card, border: `1px solid ${T.line}`, borderTop: `3px solid ${T.orange}`,
            borderRadius: 8, padding: "16px 18px", cursor: "pointer",
          }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 600, color: T.navy, lineHeight: 1 }}>{c.count}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginTop: 6 }}>{c.label}</div>
            <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
        <Panel title="Open permit workflows" action={() => go("permits")}>
          {openPermits.length === 0 && <Empty text="No open workflows." />}
          {openPermits.map(p => {
            const [c, bg] = STAGE_COLORS[p.stage] || STAGE_COLORS.Identified;
            return (
              <div key={p.id} style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
                  <Mono dim>{p.id} · {p.agency} · {p.owner}</Mono>
                </div>
                <Pill color={c} bg={bg}>{p.stage}</Pill>
              </div>
            );
          })}
        </Panel>

        <Panel title="COI expirations — next 75 days" action={() => go("vendors")}>
          {expiring.length === 0 && <Empty text="No upcoming expirations." />}
          {expiring.map(v => (
            <div key={v.id} style={rowStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{v.company}</div>
                <Mono dim>{v.trade}</Mono>
              </div>
              <Pill color={T.red} bg={T.redSoft}>COI {v.coiExp}</Pill>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

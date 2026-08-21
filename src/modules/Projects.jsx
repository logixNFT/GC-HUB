import React, { useState } from "react";
import { T, fmtMoney, uid } from "../theme.js";
import { Pill, Mono, Field, Btn, ModuleHead, inputStyle, formCard, grid3 } from "../ui/atoms.jsx";

const BLANK = {
  name: "", role: "", client: "", value: "", start: "", end: "", status: "Active",
  sector: "", delivery: "", location: "", scope: "", highlights: "", showOnResume: true,
};

export default function Projects({ data, setData, query }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);

  const list = data.projects.filter(p =>
    !query || `${p.name} ${p.client} ${p.sector} ${p.scope}`.toLowerCase().includes(query.toLowerCase()));

  const toggleResume = (id) => setData(d => ({
    ...d,
    projects: d.projects.map(p => p.id === id ? { ...p, showOnResume: !p.showOnResume } : p),
  }));

  const save = () => {
    if (!form.name.trim()) return;
    setData(d => ({
      ...d,
      projects: [...d.projects, {
        ...form,
        id: uid("PRJ", d.projects),
        value: parseFloat(String(form.value).replace(/[^0-9.]/g, "")) || 0,
        highlights: form.highlights.split("\n").map(s => s.trim()).filter(Boolean),
      }],
    }));
    setForm(BLANK);
    setShowForm(false);
  };

  return (
    <div>
      <ModuleHead
        title="Project Registry"
        sub="Every project you touch, captured once — scope, value, role, and highlights. This registry feeds the resume and portfolio directly."
        action={<Btn onClick={() => setShowForm(s => !s)}>{showForm ? "Cancel" : "+ New project"}</Btn>}
      />
      {showForm && (
        <div style={formCard}>
          <div style={grid3}>
            <Field label="Project name" span><input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Your role"><input style={inputStyle} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></Field>
            <Field label="Client / Owner"><input style={inputStyle} value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} /></Field>
            <Field label="Contract value ($)"><input style={inputStyle} value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="34000000" /></Field>
            <Field label="Status">
              <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {["Active", "Preconstruction", "Closeout", "Complete", "On Hold"].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Sector"><input style={inputStyle} value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} placeholder="Healthcare / Civil / Solar…" /></Field>
            <Field label="Delivery method"><input style={inputStyle} value={form.delivery} onChange={e => setForm({ ...form, delivery: e.target.value })} placeholder="GMP / Design-Build…" /></Field>
            <Field label="Start"><input style={inputStyle} value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} placeholder="2026-01" /></Field>
            <Field label="End"><input style={inputStyle} value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} placeholder="Ongoing" /></Field>
            <Field label="Location"><input style={inputStyle} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></Field>
            <Field label="Scope summary" span><input style={inputStyle} value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} /></Field>
            <Field label="Highlights (one per line)" span>
              <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={form.highlights} onChange={e => setForm({ ...form, highlights: e.target.value })} />
            </Field>
          </div>
          <div style={{ marginTop: 14 }}><Btn onClick={save}>Save project</Btn></div>
        </div>
      )}
      <div style={{ display: "grid", gap: 14 }}>
        {list.map(p => (
          <div key={p.id} style={{
            background: T.card, border: `1px solid ${T.line}`,
            borderLeft: `4px solid ${p.status === "Active" ? T.orange : T.line}`,
            borderRadius: 8, padding: "16px 20px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                  <Mono dim>{p.id}</Mono>
                  <Pill color={T.navy} bg="#EAEEF4">{p.sector}</Pill>
                  <Pill color={p.status === "Active" ? T.green : T.inkSoft} bg={p.status === "Active" ? T.greenSoft : "#EEF1F5"}>{p.status}</Pill>
                </div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: T.navy, marginTop: 6 }}>{p.name}</div>
                <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{p.role} · {p.client} · {p.delivery} · {p.location}</div>
                <div style={{ fontSize: 13, color: T.ink, marginTop: 8, lineHeight: 1.55 }}>{p.scope}</div>
                {p.highlights?.length > 0 && (
                  <ul style={{ margin: "8px 0 0", paddingLeft: 16, fontSize: 12.5, color: T.inkSoft, lineHeight: 1.6 }}>
                    {p.highlights.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                )}
              </div>
              <div style={{ textAlign: "right", minWidth: 130 }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, color: T.orange }}>{fmtMoney(p.value)}</div>
                <Mono dim>{p.start} → {p.end}</Mono>
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 11.5, color: T.inkSoft, cursor: "pointer" }}>
                    <input type="checkbox" checked={!!p.showOnResume} onChange={() => toggleResume(p.id)} />
                    On resume
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

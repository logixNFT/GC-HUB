import React, { useState } from "react";
import { T, uid } from "../theme.js";
import { Pill, Mono, Field, Btn, Table, ModuleHead, inputStyle, formCard, grid3 } from "../ui/atoms.jsx";

export default function Drawings({ data, setData, query }) {
  const blank = {
    title: "", project: data.projects[0]?.id || "", discipline: "Civil / Utilities",
    type: "Plan", rev: "0", date: "", status: "Current", location: "", notes: "",
  };
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState(blank);

  const disciplines = ["All", ...new Set(data.drawings.map(d => d.discipline))];
  const list = data.drawings
    .filter(d => filter === "All" || d.discipline === filter)
    .filter(d => !query || `${d.title} ${d.discipline} ${d.notes}`.toLowerCase().includes(query.toLowerCase()));
  const projName = (id) => data.projects.find(p => p.id === id)?.name?.split("—")[0] || id;

  const save = () => {
    if (!form.title.trim()) return;
    setData(d => ({ ...d, drawings: [...d.drawings, { ...form, id: uid("DWG", d.drawings), format: "PDF" }] }));
    setForm(blank);
    setShowForm(false);
  };

  return (
    <div>
      <ModuleHead
        title="Drawing Library"
        sub="Plans, profiles, and details across project types — revision-controlled, keyed to projects."
        action={<Btn onClick={() => setShowForm(s => !s)}>{showForm ? "Cancel" : "+ Log drawing"}</Btn>}
      />
      {showForm && (
        <div style={formCard}>
          <div style={grid3}>
            <Field label="Title" span><input style={inputStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="Project">
              <select style={inputStyle} value={form.project} onChange={e => setForm({ ...form, project: e.target.value })}>
                {data.projects.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name.slice(0, 40)}</option>)}
              </select>
            </Field>
            <Field label="Discipline"><input style={inputStyle} value={form.discipline} onChange={e => setForm({ ...form, discipline: e.target.value })} /></Field>
            <Field label="Type">
              <select style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {["Plan", "Profile", "Detail", "Layout", "Section", "As-Built"].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Rev"><input style={inputStyle} value={form.rev} onChange={e => setForm({ ...form, rev: e.target.value })} /></Field>
            <Field label="Status">
              <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {["Current", "Superseded", "For Review", "Void"].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Date"><input type="date" style={inputStyle} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="Location / URL"><input style={inputStyle} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></Field>
            <Field label="Notes" span><input style={inputStyle} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
          </div>
          <div style={{ marginTop: 14 }}><Btn onClick={save}>Save drawing</Btn></div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {disciplines.map(d => (
          <button key={d} onClick={() => setFilter(d)} style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "5px 11px", borderRadius: 20, cursor: "pointer",
            border: `1px solid ${filter === d ? T.navy : T.line}`,
            background: filter === d ? T.navy : "#fff", color: filter === d ? "#fff" : T.inkSoft,
          }}>{d}</button>
        ))}
      </div>
      <Table
        cols={["ID", "Title", "Project", "Discipline", "Type", "Rev", "Status", "Date"]}
        rows={list.map(d => [
          <Mono key="i" nowrap>{d.id}</Mono>,
          <div key="t">
            <strong style={{ fontSize: 13 }}>{d.title}</strong>
            {d.notes && <div style={{ fontSize: 11.5, color: T.inkFaint }}>{d.notes}</div>}
          </div>,
          <span key="p" style={{ fontSize: 12 }}>{projName(d.project)}</span>,
          d.discipline,
          d.type,
          <Pill key="r" color={T.navy} bg="#EAEEF4">REV {d.rev}</Pill>,
          <Pill key="s" color={d.status === "Current" ? T.green : T.inkFaint} bg={d.status === "Current" ? T.greenSoft : "#EEF1F5"}>{d.status}</Pill>,
          <Mono key="d">{d.date}</Mono>,
        ])}
      />
    </div>
  );
}

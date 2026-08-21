import React, { useState } from "react";
import { T, STAGES, STAGE_COLORS, uid } from "../theme.js";
import { Pill, Mono, Field, Btn, Table, ModuleHead, inputStyle, formCard, grid3 } from "../ui/atoms.jsx";

/* ============================================================
   PERMIT HUB — agency workflows from identification to closeout.
   Each record links to a standard assembly (ASM-*) so the
   submittal package requirements travel with the workflow.
   ============================================================ */

const AGENCIES = ["FDEP", "FDOT", "SFWMD", "County", "Municipal", "AHCA", "Other"];

export default function Permits({ data, setData, query }) {
  const blank = {
    title: "", project: data.projects[0]?.id || "", agency: "FDEP", type: "",
    stage: "Identified", owner: "", assembly: "", notes: "",
    submitted: "", issued: "", expires: "",
  };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [stageFilter, setStageFilter] = useState(null);

  const list = data.permits
    .filter(p => !stageFilter || p.stage === stageFilter)
    .filter(p => !query || `${p.title} ${p.agency} ${p.type} ${p.owner} ${p.notes}`.toLowerCase().includes(query.toLowerCase()));

  /* Advance stamps the date that matters at that transition. */
  const advance = (id) => setData(d => ({
    ...d,
    permits: d.permits.map(p => {
      if (p.id !== id) return p;
      const next = STAGES[Math.min(STAGES.indexOf(p.stage) + 1, STAGES.length - 1)];
      const today = new Date().toISOString().slice(0, 10);
      return {
        ...p,
        stage: next,
        submitted: next === "Submitted" && !p.submitted ? today : p.submitted,
        issued: next === "Issued" && !p.issued ? today : p.issued,
      };
    }),
  }));

  const save = () => {
    if (!form.title.trim()) return;
    setData(d => ({ ...d, permits: [...d.permits, { ...form, id: uid("PMT", d.permits) }] }));
    setForm(blank);
    setShowForm(false);
  };

  const asmName = (id) => data.assemblies.find(a => a.id === id)?.name;

  return (
    <div>
      <ModuleHead
        title="Permits & Compliance Workflows"
        sub="Agency workflows from identification through closeout — FDEP, FDOT, county, and municipal. Each record links to its standard assembly."
        action={<Btn onClick={() => setShowForm(s => !s)}>{showForm ? "Cancel" : "+ New workflow"}</Btn>}
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
            <Field label="Agency">
              <select style={inputStyle} value={form.agency} onChange={e => setForm({ ...form, agency: e.target.value })}>
                {AGENCIES.map(a => <option key={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Permit type"><input style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} placeholder="NPDES / UIC Class V / Utility ROW…" /></Field>
            <Field label="Stage">
              <select style={inputStyle} value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Owner"><input style={inputStyle} value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} /></Field>
            <Field label="Linked assembly">
              <select style={inputStyle} value={form.assembly} onChange={e => setForm({ ...form, assembly: e.target.value })}>
                <option value="">— none —</option>
                {data.assemblies.map(a => <option key={a.id} value={a.id}>{a.id} — {a.name}</option>)}
              </select>
            </Field>
            <Field label="Submitted"><input type="date" style={inputStyle} value={form.submitted} onChange={e => setForm({ ...form, submitted: e.target.value })} /></Field>
            <Field label="Issued"><input type="date" style={inputStyle} value={form.issued} onChange={e => setForm({ ...form, issued: e.target.value })} /></Field>
            <Field label="Expires"><input type="date" style={inputStyle} value={form.expires} onChange={e => setForm({ ...form, expires: e.target.value })} /></Field>
            <Field label="Notes" span><input style={inputStyle} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
          </div>
          <div style={{ marginTop: 14 }}><Btn onClick={save}>Save workflow</Btn></div>
        </div>
      )}

      {/* pipeline strip — click a stage to filter the table */}
      <div style={{ display: "flex", marginBottom: 18, border: `1px solid ${T.line}`, borderRadius: 8, overflowX: "auto", background: "#fff" }}>
        {STAGES.map((s, i) => {
          const n = data.permits.filter(p => p.stage === s).length;
          const [c, bg] = STAGE_COLORS[s];
          const on = stageFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStageFilter(on ? null : s)}
              title={on ? "Clear filter" : `Show only ${s}`}
              style={{
                flex: "1 0 130px", padding: "10px 12px", textAlign: "left", cursor: "pointer",
                border: "none", borderRight: i < STAGES.length - 1 ? `1px solid ${T.line}` : "none",
                borderBottom: on ? `3px solid ${c}` : "3px solid transparent",
                background: n ? bg : "#fff",
              }}
            >
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: n ? c : T.line }}>{n}</div>
              <div style={{ fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: 0.5, color: T.inkFaint }}>{s}</div>
            </button>
          );
        })}
      </div>

      <Table
        cols={["ID", "Workflow", "Agency", "Stage", "Owner", "Assembly", "Dates", ""]}
        rows={list.map(p => {
          const [c, bg] = STAGE_COLORS[p.stage] || STAGE_COLORS.Identified;
          return [
            <Mono key="i">{p.id}</Mono>,
            <div key="t">
              <strong style={{ fontSize: 13 }}>{p.title}</strong>
              <div style={{ fontSize: 11.5, color: T.inkFaint, maxWidth: 340 }}>
                {p.type}{p.type && p.notes ? " · " : ""}{p.notes}
              </div>
            </div>,
            <Pill key="a" color={T.navy} bg="#EAEEF4">{p.agency}</Pill>,
            <Pill key="s" color={c} bg={bg}>{p.stage}</Pill>,
            <span key="o" style={{ fontSize: 12 }}>{p.owner}</span>,
            <Mono key="asm" title={asmName(p.assembly)}>{p.assembly || "—"}</Mono>,
            <Mono key="d" dim>
              {p.submitted && `sub ${p.submitted}`}
              {p.issued && ` · iss ${p.issued}`}
              {p.expires && ` · exp ${p.expires}`}
            </Mono>,
            !["Issued", "Closed"].includes(p.stage)
              ? <Btn key="b" small kind="navy" onClick={() => advance(p.id)}>Advance →</Btn>
              : <span key="b" />,
          ];
        })}
      />
    </div>
  );
}

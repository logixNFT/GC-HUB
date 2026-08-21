import React, { useState } from "react";
import { T, uid } from "../theme.js";
import { Pill, Mono, Field, Btn, Table, ModuleHead, inputStyle, formCard, grid3 } from "../ui/atoms.jsx";

const BLANK = {
  company: "", trade: "", contact: "", phone: "", email: "", coiExp: "",
  status: "Qualified", w9: false, msa: false, dbe: false, notes: "",
};

export default function Vendors({ data, setData, query }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);

  const list = data.vendors.filter(v =>
    !query || `${v.company} ${v.trade} ${v.contact} ${v.notes}`.toLowerCase().includes(query.toLowerCase()));

  const save = () => {
    if (!form.company.trim()) return;
    setData(d => ({
      ...d,
      vendors: [...d.vendors, { ...form, id: uid("VND", d.vendors), license: "Pending", rating: 0, projects: [] }],
    }));
    setForm(BLANK);
    setShowForm(false);
  };

  return (
    <div>
      <ModuleHead
        title="Vendor Registry"
        sub="Capture, qualify, and track subcontractors and suppliers — compliance docs, COI, MSA, and performance."
        action={<Btn onClick={() => setShowForm(s => !s)}>{showForm ? "Cancel" : "+ New vendor"}</Btn>}
      />
      {showForm && (
        <div style={formCard}>
          <div style={grid3}>
            <Field label="Company"><input style={inputStyle} value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></Field>
            <Field label="Trade / Scope"><input style={inputStyle} value={form.trade} onChange={e => setForm({ ...form, trade: e.target.value })} /></Field>
            <Field label="Status">
              <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {["Qualified", "Active", "On Hold", "Do Not Use"].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Contact"><input style={inputStyle} value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} /></Field>
            <Field label="Phone"><input style={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Email"><input style={inputStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="COI Expiration"><input type="date" style={inputStyle} value={form.coiExp} onChange={e => setForm({ ...form, coiExp: e.target.value })} /></Field>
            <Field label="Docs on file">
              <div style={{ display: "flex", gap: 14, paddingTop: 6 }}>
                {["w9", "msa", "dbe"].map(k => (
                  <label key={k} style={{ display: "flex", gap: 5, alignItems: "center", fontSize: 12.5, color: T.inkSoft }}>
                    <input type="checkbox" checked={form[k]} onChange={e => setForm({ ...form, [k]: e.target.checked })} />{k.toUpperCase()}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Notes" span><input style={inputStyle} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
          </div>
          <div style={{ marginTop: 14 }}><Btn onClick={save}>Save vendor</Btn></div>
        </div>
      )}
      <Table
        cols={["ID", "Company", "Trade", "Status", "Docs", "COI Exp", "Rating", "Notes"]}
        rows={list.map(v => {
          const r = v.rating || 0;
          return [
            <Mono key="i" nowrap>{v.id}</Mono>,
            <strong key="c" style={{ fontSize: 13 }}>{v.company}</strong>,
            v.trade,
            <Pill key="s"
              color={v.status === "Active" ? T.green : v.status === "Do Not Use" ? T.red : T.blue}
              bg={v.status === "Active" ? T.greenSoft : v.status === "Do Not Use" ? T.redSoft : T.blueSoft}>{v.status}</Pill>,
            <Mono key="d">{[v.w9 && "W9", v.msa && "MSA", v.dbe && "DBE"].filter(Boolean).join(" · ") || "—"}</Mono>,
            <Mono key="e">{v.coiExp || "—"}</Mono>,
            <span key="r" style={{ color: T.orange, letterSpacing: 1, whiteSpace: "nowrap" }}>
              {"★".repeat(r)}<span style={{ color: T.line }}>{"★".repeat(5 - r)}</span>
            </span>,
            <span key="n" style={{ fontSize: 12, color: T.inkSoft }}>{v.notes}</span>,
          ];
        })}
      />
    </div>
  );
}

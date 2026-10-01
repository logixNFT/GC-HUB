import React, { useEffect, useMemo, useRef, useState } from "react";
import { T } from "../theme.js";
import { ModuleHead, Btn, Pill } from "../ui/atoms.jsx";
import { AGENTS, areaRecords, overseerRules, sweepAll } from "../agents/sweeps.js";

/* ============================================================
   FACTORY — the GC HUB crew at work, on a 3D deck.
   Five agents sweep their areas of the local data continuously
   (free, in this browser). The Overseer stands at the centre and
   keeps each one on the most important thing in its area — by
   rule, or by Claude Fable 5.1 when the gc-hub project has its
   own ANTHROPIC_API_KEY. Drafting sends only the record you pick.
   ============================================================ */

const SEV = { act: [T.red, T.redSoft, "Fix now"], watch: [T.amber, T.amberSoft, "Watch"], ok: [T.green, T.greenSoft, "OK"] };
const ORDERS_KEY = "gc-hub:overseer:v1";
const TEN_MIN = 10 * 60_000;

/** What each agent may see when it drafts: the record and the records it relates to. */
function contextFor(data, agent, id) {
  const project = (pid) => data.projects.find((p) => p.id === pid);
  const asm = (aid) => data.assemblies.find((a) => a.id === aid);
  switch (agent) {
    case "documents": {
      const r = data.drawings.find((x) => x.id === id) ?? data.projects.find((x) => x.id === id);
      return { record: r, context: { project: project(r?.project), otherSheets: data.drawings.filter((g) => g.project === r?.project && g.id !== id) } };
    }
    case "regulation": {
      const r = data.permits.find((x) => x.id === id) ?? asm(id);
      return { record: r, context: { assembly: r?.assembly ? asm(r.assembly) : undefined } };
    }
    case "permitting": {
      const r = data.permits.find((x) => x.id === id);
      return { record: r, context: { assembly: asm(r?.assembly), project: project(r?.project), today: new Date().toISOString().slice(0, 10) } };
    }
    case "vendor":
      return { record: data.vendors.find((x) => x.id === id), context: { today: new Date().toISOString().slice(0, 10) } };
    case "scope": {
      const r = project(id);
      const permits = data.permits.filter((p) => p.project === id);
      return { record: r, context: { permits, assemblies: permits.map((p) => asm(p.assembly)).filter(Boolean), drawings: data.drawings.filter((g) => g.project === id), vendors: data.vendors.filter((v) => (v.projects || []).includes(id)) } };
    }
    default:
      return { record: null, context: {} };
  }
}

const label = (data, agent, id) => areaRecords(data, agent).find((r) => r.id === id)?.label ?? id;

export default function Factory({ data }) {
  const host = useRef(null);
  const floor = useRef(null);
  const [tick, setTick] = useState(0);
  const [orders, setOrders] = useState(null);
  const [fable, setFable] = useState("unknown"); // unknown | on | off
  const [modal, setModal] = useState(null);
  const [draft, setDraft] = useState(null);

  // Re-sweep on every edit, and once a minute so dates roll over.
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 60_000); return () => clearInterval(id); }, []);
  const sweep = useMemo(() => sweepAll(data), [data, tick]);
  const rules = useMemo(() => overseerRules(sweep), [sweep]);

  useEffect(() => {
    let gone = false;
    import("../factory/gc-floor.ts").then(({ GcFloor }) => {
      if (gone || !host.current) return;
      floor.current = new GcFloor(host.current, AGENTS, { pick: setModal });
      setTick((t) => t + 1);
    });
    return () => { gone = true; floor.current?.dispose(); floor.current = null; };
  }, []);

  useEffect(() => {
    const f = floor.current;
    if (!f) return;
    for (const a of AGENTS) f.setArea(a.id, areaRecords(data, a.id));
    f.setFindings(sweep.findings);
  }, [data, sweep]);

  const shown = orders && orders.source === "fable" && Date.now() - orders.at < TEN_MIN * 3 ? orders : rules;
  useEffect(() => { floor.current?.setOrders(shown); }, [shown]);

  async function askOverseer() {
    const compact = AGENTS.map((a) => ({ agent: a.id, open: sweep.by[a.id].filter((x) => x.severity !== "ok").map((x) => ({ severity: x.severity, title: x.title })) }));
    try {
      const r = await fetch("/api/agent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task: "overseer", sweep: compact }) });
      const j = await r.json();
      if (r.status === 503) { setFable("off"); return; }
      if (!r.ok) throw new Error(j.error);
      const o = { ...j, source: "fable", at: Date.now() };
      setFable("on");
      setOrders(o);
      try { localStorage.setItem(ORDERS_KEY, JSON.stringify(o)); } catch { /* storage unavailable */ }
    } catch {
      setFable((s) => (s === "on" ? "on" : "off"));
    }
  }

  // Fable's orders are reused for ten minutes across reloads; the rules carry on in between.
  useEffect(() => {
    try {
      const o = JSON.parse(localStorage.getItem(ORDERS_KEY) || "null");
      if (o && Date.now() - o.at < TEN_MIN) { setOrders(o); setFable("on"); return; }
    } catch { /* ignore */ }
    askOverseer();
    const id = setInterval(askOverseer, TEN_MIN);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function startDraft(agent, id) {
    const { record, context } = contextFor(data, agent, id);
    if (!record) return;
    setDraft({ agent, id, status: "working" });
    floor.current?.startDraft(agent, id);
    try {
      const r = await fetch("/api/agent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task: "draft", agent, record, findings: sweep.findings.filter((f) => f.agent === agent && f.record === id), context }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setDraft({ agent, id, status: "done", title: j.title, body: j.body, model: j.model });
      floor.current?.finishDraft(agent, true);
    } catch (e) {
      setDraft({ agent, id, status: "error", error: e instanceof Error ? e.message : String(e) });
      floor.current?.finishDraft(agent, false);
    }
  }

  const open = sweep.findings.filter((f) => f.severity !== "ok").sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "act" ? -1 : 1));
  const card = { background: T.card, border: `1px solid ${T.line}`, borderRadius: 10, padding: 14 };

  return (
    <div>
      <ModuleHead
        title="Factory"
        sub="The GC HUB crew at work. Five agents sweep their areas of your data continuously, in this browser; the Overseer at the centre keeps each one on the most important thing in its area. Drafts go to Claude Fable 5.1 only when you ask, and only with the record you pick."
        action={<Btn small onClick={askOverseer} title="Ask the Overseer for fresh orders">Ask the Overseer</Btn>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 14 }}>
        {AGENTS.map((a) => {
          const fs = sweep.by[a.id];
          const act = fs.filter((x) => x.severity === "act").length;
          const watch = fs.filter((x) => x.severity === "watch").length;
          return (
            <button key={a.id} onClick={() => setModal({ kind: "agent", id: a.id })} style={{ ...card, textAlign: "left", cursor: "pointer", borderColor: act ? T.red : T.line }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{a.name}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: act ? T.red : watch ? T.amber : T.green, fontFamily: "'JetBrains Mono', monospace" }}>{act || watch || "✓"}</div>
              <div style={{ fontSize: 11, color: T.inkFaint }}>{act ? `${act} to fix · ${watch} to watch` : watch ? `${watch} to watch` : `${fs.length} checked, clean`}</div>
            </button>
          );
        })}
      </div>

      <div className="gf-layout" style={{ display: "grid", gap: 14, gridTemplateColumns: "minmax(0, 1fr)" }}>
        <div style={{ position: "relative", height: "70vh", minHeight: 420, borderRadius: 12, overflow: "hidden", background: "#03040c", border: `1px solid ${T.navyMid}`, touchAction: "none" }}>
          <div ref={host} style={{ position: "absolute", inset: 0 }} />
          <div style={{ position: "absolute", left: 10, bottom: 10, zIndex: 4, display: "flex", flexWrap: "wrap", gap: "4px 12px", background: "rgba(4,8,20,.8)", border: "1px solid #1c2a48", borderRadius: 6, padding: "6px 9px", fontSize: 11, color: "#c9d6ea", fontFamily: "'JetBrains Mono', monospace", pointerEvents: "none", maxWidth: "calc(100% - 20px)" }}>
            <span><b style={{ color: "#ff4d5e" }}>■</b> fix now</span><span><b style={{ color: "#ffb547" }}>■</b> watch</span><span><b style={{ color: "#3ddc84" }}>■</b> clean</span><span><b style={{ color: "#ffd479" }}>◎</b> the Overseer</span><span style={{ color: "#6f86ab" }}>drag to orbit · pinch or scroll to zoom</span>
          </div>
        </div>

        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <strong style={{ color: T.navy }}>The Overseer</strong>
              <Pill color={shown.source === "fable" ? T.orange : T.inkSoft} bg={shown.source === "fable" ? T.orangeSoft : "#EEF1F5"}>{shown.source === "fable" ? "FABLE 5.1" : "RULES"}</Pill>
            </div>
            <p style={{ fontSize: 13, color: T.ink, margin: "8px 0" }}>{shown.summary}</p>
            {fable === "off" && <p style={{ fontSize: 12, color: T.inkFaint, margin: "0 0 8px" }}>Fable is not connected — add ANTHROPIC_API_KEY to the gc-hub Vercel project. Running on rules.</p>}
            {shown.directives.map((d, i) => (
              <div key={i} onClick={() => setModal({ kind: "agent", id: d.agent })} style={{ cursor: "pointer", borderLeft: `3px solid ${SEV[d.severity]?.[0] ?? T.line}`, padding: "6px 10px", marginBottom: 6, background: T.paper, borderRadius: "0 6px 6px 0" }}>
                <div style={{ fontSize: 13, color: T.ink }}>{d.directive}</div>
                <div style={{ fontSize: 11, color: T.inkFaint }}>{d.why}</div>
              </div>
            ))}
          </div>

          <div style={{ ...card, maxHeight: 420, overflowY: "auto" }}>
            <strong style={{ color: T.navy }}>Action board · {open.length} open</strong>
            {open.length === 0 && <p style={{ fontSize: 13, color: T.inkFaint }}>Nothing open. Every area is clean.</p>}
            {open.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 0", borderBottom: `1px solid ${T.line}` }}>
                <Pill color={SEV[f.severity][0]} bg={SEV[f.severity][1]}>{SEV[f.severity][2]}</Pill>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: T.ink }}>{f.title}</div>
                  <div style={{ fontSize: 11, color: T.inkFaint }}>{AGENTS.find((a) => a.id === f.agent)?.name} · {f.detail}</div>
                </div>
                <Btn small kind="ghost" onClick={() => startDraft(f.agent, f.record)} title="Draft with Claude Fable 5.1">Draft</Btn>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(modal || draft) && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setModal(null); if (draft?.status !== "working") setDraft(null); } }} style={{ position: "fixed", inset: 0, background: "rgba(8,26,51,.6)", display: "grid", placeItems: "center", padding: 16, zIndex: 50 }}>
          <div role="dialog" aria-modal="true" style={{ background: T.card, borderRadius: 12, width: "min(620px, 100%)", maxHeight: "82vh", overflowY: "auto", padding: 20, position: "relative" }}>
            <button onClick={() => { setModal(null); setDraft(null); }} aria-label="Close" style={{ position: "absolute", top: 10, right: 10, border: `1px solid ${T.line}`, background: "none", borderRadius: 6, width: 30, height: 30, cursor: "pointer", color: T.inkSoft }}>✕</button>
            {draft ? (
              <>
                <h3 style={{ margin: "0 36px 4px 0", color: T.navy }}>{draft.status === "done" ? draft.title : `Drafting · ${label(data, draft.agent, draft.id)}`}</h3>
                <div style={{ fontSize: 12, color: T.inkFaint, marginBottom: 12 }}>{AGENTS.find((a) => a.id === draft.agent)?.name}{draft.model ? ` · ${draft.model}` : ""}</div>
                {draft.status === "working" && <p style={{ fontSize: 13 }}>The agent is drafting with Claude Fable 5.1 — this can take a minute.</p>}
                {draft.status === "error" && <p style={{ fontSize: 13, color: T.red }}>{draft.error}</p>}
                {draft.status === "done" && (
                  <>
                    <div style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.55, color: T.ink, background: T.paper, borderRadius: 8, padding: 12 }}>{draft.body}</div>
                    <div style={{ marginTop: 10 }}><Btn small onClick={() => navigator.clipboard?.writeText(`${draft.title}\n\n${draft.body}`)}>Copy</Btn></div>
                    <p style={{ fontSize: 11, color: T.inkFaint, marginTop: 8 }}>A draft — check it before it goes anywhere.</p>
                  </>
                )}
              </>
            ) : modal.kind === "agent" ? (
              (() => {
                const a = AGENTS.find((x) => x.id === modal.id);
                const fs = sweep.by[modal.id] ?? [];
                return (
                  <>
                    <h3 style={{ margin: "0 36px 4px 0", color: T.navy }}>{a?.name}</h3>
                    <div style={{ fontSize: 12, color: T.inkFaint, marginBottom: 8 }}>{a?.bay} · {fs.length} findings on {areaRecords(data, modal.id).length} records</div>
                    <p style={{ fontSize: 13, color: T.ink }}>{a?.role}</p>
                    {fs.map((f, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.line}` }}>
                        <Pill color={SEV[f.severity][0]} bg={SEV[f.severity][1]}>{SEV[f.severity][2]}</Pill>
                        <div style={{ flex: 1, fontSize: 13 }}>{f.title}</div>
                        {f.severity !== "ok" && <Btn small kind="ghost" onClick={() => { setModal(null); startDraft(f.agent, f.record); }}>Draft</Btn>}
                      </div>
                    ))}
                  </>
                );
              })()
            ) : modal.kind === "record" ? (
              (() => {
                const fs = sweep.findings.filter((f) => f.agent === modal.agent && f.record === modal.id);
                return (
                  <>
                    <h3 style={{ margin: "0 36px 4px 0", color: T.navy }}>{label(data, modal.agent, modal.id)}</h3>
                    <div style={{ fontSize: 12, color: T.inkFaint, marginBottom: 8 }}>{modal.id} · {AGENTS.find((a) => a.id === modal.agent)?.name}</div>
                    {fs.map((f, i) => (
                      <div key={i} style={{ borderLeft: `3px solid ${SEV[f.severity][0]}`, padding: "6px 10px", marginBottom: 6, background: T.paper }}>
                        <div style={{ fontSize: 13 }}>{f.title}</div>
                        <div style={{ fontSize: 11, color: T.inkFaint }}>{f.detail}</div>
                      </div>
                    ))}
                    <Btn small onClick={() => { const m = modal; setModal(null); startDraft(m.agent, m.id); }}>Draft with Fable 5.1</Btn>
                  </>
                );
              })()
            ) : modal.kind === "overseer" ? (
              <>
                <h3 style={{ margin: "0 36px 4px 0", color: T.navy }}>The Overseer</h3>
                <div style={{ fontSize: 12, color: T.inkFaint, marginBottom: 8 }}>{shown.source === "fable" ? `Claude Fable 5.1 · ${shown.model ?? ""}` : "Rules — Fable not connected"}</div>
                <p style={{ fontSize: 13 }}>{shown.summary}</p>
                {shown.directives.map((d, i) => <div key={i} style={{ fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${T.line}` }}>{d.directive} <span style={{ color: T.inkFaint }}>({d.why})</span></div>)}
              </>
            ) : (
              <>
                <h3 style={{ margin: "0 36px 8px 0", color: T.navy }}>Action board</h3>
                {open.map((f, i) => <div key={i} style={{ fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${T.line}` }}><Pill color={SEV[f.severity][0]} bg={SEV[f.severity][1]}>{SEV[f.severity][2]}</Pill> {f.title}</div>)}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

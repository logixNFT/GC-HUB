import React, { useState, useMemo, useRef, useEffect } from "react";
import { T } from "./theme.js";
import { normalize } from "./data/seed.js";
import { MODULES } from "./modules/index.js";
import { inputStyle } from "./ui/atoms.jsx";
import { resolveInitial, saveDraft, clearDraft } from "./lib/store.js";

/* ============================================================
   GC HUB — app shell
   Schema-driven JSON framework · GitHub data-file workflow
   Data ops: Export JSON (commit to public/) / Import JSON
   ============================================================ */

const SOURCE_LABEL = {
  draft: "Local draft — unsaved to repo",
  published: "Published data file",
  seed: "Built-in demo data",
};

export default function App() {
  const [data, setData] = useState(null);
  const [source, setSource] = useState("seed");
  const [active, setActive] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    let alive = true;
    resolveInitial().then(({ data, source }) => {
      if (!alive) return;
      setData(data);
      setSource(source);
    });
    return () => { alive = false; };
  }, []);

  /* Autosave every edit as the local draft. */
  useEffect(() => {
    if (data) saveDraft(data);
  }, [data]);

  const update = (fn) => {
    setData(fn);
    setSource("draft");
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = data.meta.dataFile || "gc-hub-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        setData(normalize(JSON.parse(r.result)));
        setSource("draft");
        setActive("dashboard");
      } catch {
        alert("That file isn't valid JSON.");
      }
    };
    r.readAsText(f);
  };

  const revert = async () => {
    if (!confirm("Discard this browser's local edits and reload the published data?")) return;
    clearDraft();
    const next = await resolveInitial();
    setData(next.data);
    setSource(next.source);
  };

  const counts = useMemo(() => {
    if (!data) return {};
    const c = {};
    for (const m of MODULES) if (m.countKey) c[m.key] = data[m.countKey].length;
    c.resume = data.projects.filter(p => p.showOnResume).length;
    return c;
  }, [data]);

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: T.paper, display: "grid", placeItems: "center", fontFamily: "'Inter', sans-serif", color: T.inkFaint }}>
        Loading GC HUB…
      </div>
    );
  }

  const Active = MODULES.find(m => m.key === active)?.comp || MODULES[0].comp;

  const nav = (
    <>
      <div style={{ padding: "26px 22px 20px", borderBottom: `1px solid ${T.navyMid}` }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 21, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.15 }}>
          GC<span style={{ color: T.orange }}> HUB</span>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: 1, color: "#8FA3C0", marginTop: 6, textTransform: "uppercase" }}>
          {data.meta.org} · v{data.meta.version}
        </div>
      </div>
      <nav style={{ flex: 1, padding: "14px 12px", overflowY: "auto" }}>
        {MODULES.map(m => (
          <button key={m.key} onClick={() => { setActive(m.key); setNavOpen(false); }} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            width: "100%", padding: "10px 12px", marginBottom: 3, borderRadius: 6,
            border: "none", cursor: "pointer", textAlign: "left",
            fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
            background: active === m.key ? T.orange : "transparent",
            color: active === m.key ? "#fff" : "#C4D0E2",
          }}>
            <span>{m.label}</span>
            {counts[m.key] !== undefined && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5,
                background: active === m.key ? "rgba(255,255,255,0.25)" : T.navyMid,
                padding: "2px 7px", borderRadius: 10,
              }}>{counts[m.key]}</span>
            )}
          </button>
        ))}
      </nav>
      <div style={{ padding: "16px 18px", borderTop: `1px solid ${T.navyMid}` }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", color: "#8FA3C0", marginBottom: 4 }}>
          Data sync · {data.meta.repo}
        </div>
        <div style={{ fontSize: 10, color: source === "draft" ? T.orange : "#6E82A2", marginBottom: 10 }}>
          {SOURCE_LABEL[source]}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={exportJSON} style={syncBtn}>Export JSON</button>
          <button onClick={() => fileRef.current?.click()} style={{ ...syncBtn, background: "transparent", border: `1px solid ${T.navyMid}` }}>Import</button>
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={importJSON} style={{ display: "none" }} />
        </div>
        {source === "draft" && (
          <button onClick={revert} style={{ ...syncBtn, width: "100%", flex: "none", marginTop: 8, background: "transparent", border: `1px solid ${T.navyMid}`, color: "#8FA3C0" }}>
            Revert to published
          </button>
        )}
        <div style={{ fontSize: 10, color: "#6E82A2", marginTop: 10, lineHeight: 1.5 }}>
          Export → commit <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>public/{data.meta.dataFile}</span> → Vercel redeploys.
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.paper, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        input:focus, select:focus, textarea:focus { border-color: ${T.orange} !important; }
        button:focus-visible { outline: 2px solid ${T.orange}; outline-offset: 2px; }
        @media print {
          .hub-sidebar, .hub-topbar, .hub-modhead-actions, .hub-scrim, .no-print { display: none !important; }
          #resume-sheet { border: none !important; padding: 0 !important; max-width: 100% !important; }
          body { background: #fff !important; }
        }
        @media (max-width: 860px) {
          .hub-sidebar { display: none; }
          .hub-burger { display: inline-flex !important; }
        }
      `}</style>

      {/* sidebar ledger */}
      <aside className="hub-sidebar" style={{
        width: 232, background: T.navy, color: "#fff", flexShrink: 0,
        display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh",
      }}>
        {nav}
      </aside>

      {/* mobile drawer — centered scrim, slide-in panel */}
      {navOpen && (
        <>
          <div className="hub-scrim" onClick={() => setNavOpen(false)} style={{
            position: "fixed", inset: 0, background: "rgba(8,26,51,0.55)", zIndex: 40,
          }} />
          <aside style={{
            position: "fixed", top: 0, left: 0, bottom: 0, width: 260, zIndex: 41,
            background: T.navy, color: "#fff", display: "flex", flexDirection: "column",
          }}>
            {nav}
          </aside>
        </>
      )}

      {/* main */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <div className="hub-topbar" style={{
          background: "#fff", borderBottom: `1px solid ${T.line}`,
          padding: "14px 28px", display: "flex", gap: 12, alignItems: "center",
          position: "sticky", top: 0, zIndex: 5,
        }}>
          <button
            className="hub-burger"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            style={{
              display: "none", alignItems: "center", justifyContent: "center",
              width: 34, height: 34, flexShrink: 0, borderRadius: 6,
              border: `1px solid ${T.line}`, background: "#fff", color: T.navy,
              fontSize: 16, cursor: "pointer",
            }}
          >☰</button>
          <input
            placeholder="Search vendors, drawings, permits, projects…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ ...inputStyle, maxWidth: 420, background: T.paper }}
          />
          <div style={{ marginLeft: "auto", textAlign: "right", minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.navy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{data.profile.name}</div>
            <div style={{ fontSize: 10.5, color: T.inkFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{data.profile.titles?.[0]}</div>
          </div>
        </div>
        <div style={{ padding: "26px 28px 60px" }}>
          <Active data={data} setData={update} query={query} go={setActive} />
        </div>
      </main>
    </div>
  );
}

const syncBtn = {
  flex: 1, fontFamily: "'Inter', sans-serif", fontSize: 11.5, fontWeight: 600,
  color: "#fff", background: T.orange, border: "1px solid transparent",
  borderRadius: 5, padding: "7px 0", cursor: "pointer",
};

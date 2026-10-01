/* ============================================================
   GC HUB crew — five agents, each with its own area of the data.

   A sweep is pure: it reads the records in the agent's area and
   returns what it found, record by record. Nothing here calls a
   server — sweeps run in the browser, on the local data, as often
   as the factory floor likes. Drafting (the part that needs
   Claude) is separate and only happens when someone asks.
   ============================================================ */

export const AGENTS = [
  { id: "documents", name: "Documents agent", area: "drawings", bay: "Document control", role: "Keeps the drawing register clean: every sheet has a revision, a date and a file location, one current revision per sheet, and every project has its drawings." },
  { id: "regulation", name: "Regulation agent", area: "assemblies", bay: "Code library", role: "Ties every permit to the standard assembly and governing rule it is built on, and flags assemblies with no rule or agency cited." },
  { id: "permitting", name: "Permitting agent", area: "permits", bay: "Permit desk", role: "Walks the permit pipeline: what expires soon, what has sat under review too long, what is missing an owner or a date, and the next action on each." },
  { id: "vendor", name: "Vendor agent", area: "vendors", bay: "Vendor dock", role: "Keeps subcontractors compliant: COI current, W-9 and MSA on file, license on file — and drafts the request when something lapses." },
  { id: "scope", name: "Scope of work agent", area: "projects", bay: "Drafting table", role: "Makes sure every active project has a written scope and its permits tracked, and drafts a scope of work from the project and the assemblies it uses." },
];

const DAY = 86_400_000;
const daysTo = (iso, now) => (iso ? Math.round((Date.parse(iso) - now) / DAY) : null);
const daysSince = (iso, now) => (iso ? Math.round((now - Date.parse(iso)) / DAY) : null);

/** One finding about one record. severity: "act" (fix now), "watch", or "ok". */
const f = (agent, record, severity, title, detail) => ({ agent, record, severity, title, detail });

function documents(d, now) {
  void now;
  const out = [];
  const projects = new Set(d.projects.map((p) => p.id));
  const current = new Map();
  for (const g of d.drawings) {
    const issues = [];
    if (!projects.has(g.project)) out.push(f("documents", g.id, "act", `${g.title}: project ${g.project || "—"} does not exist`, "The sheet points at a project that is not in the register."));
    if (!g.rev) issues.push("no revision");
    if (!g.date) issues.push("no date");
    if (!g.location) issues.push("no file location");
    if (issues.length) out.push(f("documents", g.id, "watch", `${g.title}: ${issues.join(", ")}`, "A sheet without these cannot be issued or retrieved with confidence."));
    if ((g.status || "").toLowerCase() === "current") {
      const key = `${g.project}|${(g.title || "").split(" ")[0]}`;
      if (current.has(key)) out.push(f("documents", g.id, "act", `Two current revisions of ${(g.title || "").split(" ")[0]}`, `${current.get(key)} and ${g.id} are both marked Current for the same sheet number — supersede one.`));
      else current.set(key, g.id);
    }
    if (!issues.length && projects.has(g.project)) out.push(f("documents", g.id, "ok", `${g.title} · rev ${g.rev}`, "Register entry complete."));
  }
  for (const p of d.projects.filter((x) => x.status === "Active")) {
    if (!d.drawings.some((g) => g.project === p.id)) out.push(f("documents", p.id, "watch", `${p.name}: no drawings registered`, "An active project with an empty drawing register."));
  }
  return out;
}

function regulation(d) {
  const out = [];
  const asm = new Map(d.assemblies.map((a) => [a.id, a]));
  for (const a of d.assemblies) {
    if (!a.spec || !a.agency) out.push(f("regulation", a.id, "watch", `${a.name}: ${!a.spec ? "no governing rule cited" : "no agency"}`, "An assembly without its rule cannot carry the submittal requirements into a permit."));
    else out.push(f("regulation", a.id, "ok", `${a.name} · ${a.agency}`, a.spec));
  }
  for (const p of d.permits) {
    if (!p.assembly) out.push(f("regulation", p.id, "watch", `${p.title}: no standard assembly`, "Link it to an assembly so the governing rule and package requirements travel with the permit."));
    else if (!asm.has(p.assembly)) out.push(f("regulation", p.id, "act", `${p.title}: assembly ${p.assembly} does not exist`, "The permit cites an assembly that is not in the library."));
    else if (asm.get(p.assembly).agency && p.agency && asm.get(p.assembly).agency !== p.agency) out.push(f("regulation", p.id, "watch", `${p.title}: agency ${p.agency} vs assembly's ${asm.get(p.assembly).agency}`, "The permit and its assembly name different agencies — confirm which governs."));
  }
  return out;
}

function permitting(d, now) {
  const out = [];
  for (const p of d.permits) {
    const exp = daysTo(p.expires, now);
    const waiting = daysSince(p.submitted, now);
    if (p.stage !== "Closed" && exp !== null && exp < 0) out.push(f("permitting", p.id, "act", `${p.title}: expired ${-exp} day${-exp === 1 ? "" : "s"} ago`, "Renew or close it out — work under an expired permit is exposed."));
    else if (p.stage !== "Closed" && exp !== null && exp <= 30) out.push(f("permitting", p.id, "act", `${p.title}: expires in ${exp} days`, "Start the renewal now; agencies rarely turn one around in a month."));
    else if (p.stage !== "Closed" && exp !== null && exp <= 60) out.push(f("permitting", p.id, "watch", `${p.title}: expires in ${exp} days`, "Renewal window is open."));
    if ((p.stage === "Submitted" || p.stage === "Under Review") && waiting !== null && waiting > 30) out.push(f("permitting", p.id, "watch", `${p.title}: ${p.stage.toLowerCase()} for ${waiting} days`, "Call the reviewer for comments or a status."));
    if (p.stage === "Issued" && (!p.issued || !p.expires)) out.push(f("permitting", p.id, "watch", `${p.title}: issued without ${!p.issued ? "an issue date" : "an expiry"}`, "Record the dates off the permit card."));
    if ((p.stage === "Identified" || p.stage === "Application Prep") && !p.owner) out.push(f("permitting", p.id, "watch", `${p.title}: nobody owns it`, "Assign an owner before it stalls."));
    if (!out.some((x) => x.record === p.id && x.agent === "permitting")) out.push(f("permitting", p.id, "ok", `${p.title} · ${p.stage}`, exp !== null ? `expires in ${exp} days` : "no expiry on file"));
  }
  return out;
}

function vendor(d, now) {
  const out = [];
  for (const v of d.vendors.filter((x) => x.status !== "Inactive")) {
    const coi = daysTo(v.coiExp, now);
    const issues = [];
    if (coi === null) out.push(f("vendor", v.id, "act", `${v.company}: no COI on file`, "No certificate of insurance — they should not be on site."));
    else if (coi < 0) out.push(f("vendor", v.id, "act", `${v.company}: COI expired ${-coi} day${-coi === 1 ? "" : "s"} ago`, "Request a current certificate before their next day on site."));
    else if (coi <= 30) out.push(f("vendor", v.id, "watch", `${v.company}: COI expires in ${coi} days`, "Request the renewal certificate now."));
    if (!v.w9) issues.push("no W-9");
    if (!v.msa) issues.push("no MSA");
    if (v.license && !/on file/i.test(v.license)) issues.push(`license: ${v.license}`);
    if (!v.license) issues.push("no license on file");
    if (issues.length) out.push(f("vendor", v.id, "watch", `${v.company}: ${issues.join(", ")}`, "Paperwork to collect before the next payment application."));
    if (!out.some((x) => x.record === v.id)) out.push(f("vendor", v.id, "ok", `${v.company} · compliant`, `COI good for ${coi} days`));
  }
  return out;
}

function scope(d) {
  const out = [];
  for (const p of d.projects.filter((x) => x.status === "Active")) {
    const len = (p.scope || "").trim().length;
    if (len === 0) out.push(f("scope", p.id, "act", `${p.name}: no scope of work`, "An active project with nothing written down for scope — draft one."));
    else if (len < 80) out.push(f("scope", p.id, "watch", `${p.name}: scope is ${len} characters`, "Too thin to buy out or hold a change order against."));
    else out.push(f("scope", p.id, "ok", `${p.name} · scope on file`, `${len} characters`));
    if (!d.permits.some((x) => x.project === p.id)) out.push(f("scope", p.id, "watch", `${p.name}: no permits tracked`, "An active project with no permits in the hub — confirm none are needed."));
  }
  return out;
}

/** Every agent's sweep over the data, as of `now`. */
export function sweepAll(data, now = Date.now()) {
  const all = [...documents(data, now), ...regulation(data), ...permitting(data, now), ...vendor(data, now), ...scope(data)];
  const by = Object.fromEntries(AGENTS.map((a) => [a.id, all.filter((x) => x.agent === a.id)]));
  return { at: now, findings: all, by };
}

/** The records each agent walks, in its bay, in order. */
export function areaRecords(data, agentId) {
  switch (agentId) {
    case "documents": return data.drawings.map((r) => ({ id: r.id, label: (r.title || r.id).split(" ")[0] }));
    case "regulation": return data.assemblies.map((r) => ({ id: r.id, label: r.name }));
    case "permitting": return data.permits.map((r) => ({ id: r.id, label: r.title }));
    case "vendor": return data.vendors.filter((v) => v.status !== "Inactive").map((r) => ({ id: r.id, label: r.company }));
    case "scope": return data.projects.map((r) => ({ id: r.id, label: r.name }));
    default: return [];
  }
}

/** The Overseer's findings for GC HUB: who has work open, worst first. */
export function overseerRules(sweep) {
  const directives = [];
  for (const a of AGENTS) {
    const fs = sweep.by[a.id] ?? [];
    const act = fs.filter((x) => x.severity === "act");
    const watch = fs.filter((x) => x.severity === "watch");
    if (act.length) directives.push({ agent: a.id, severity: "act", directive: `${a.name}: ${act.length} item${act.length === 1 ? "" : "s"} to fix now — start with "${act[0].title}".`, why: `${act.length} act, ${watch.length} watch` });
    else if (watch.length) directives.push({ agent: a.id, severity: "watch", directive: `${a.name}: ${watch.length} item${watch.length === 1 ? "" : "s"} to tidy — "${watch[0].title}".`, why: `${watch.length} watch` });
  }
  const acts = directives.filter((x) => x.severity === "act").length;
  return {
    at: sweep.at,
    source: "rules",
    model: null,
    summary: acts ? `${acts} of ${AGENTS.length} areas have something to fix now.` : directives.length ? `Nothing urgent; ${directives.length} areas have tidying to do.` : "Every area is clean.",
    directives,
  };
}

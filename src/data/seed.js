/* ============================================================
   GC HUB — built-in demo dataset (fallback seed)
   ------------------------------------------------------------
   PUBLIC REPO. Nothing real lives in this file.
   Names, clients, and figures below are illustrative only.

   The assemblies are the exception and are intentionally real:
   they cite published FDEP/FDOT rules and standard indices,
   which is public reference material — and the reusable value
   of the tool.

   To work with your own data:
     1. Import your JSON in the app (sidebar → Import), or
     2. Commit it as public/gc-hub-data.json to publish it.
   ============================================================ */

export const SEED = {
  meta: {
    app: "GC HUB",
    org: "Contractor Operations",
    version: "1.0.0",
    dataFile: "gc-hub-data.json",
    repo: "logixNFT/GC-HUB",
    updated: "2026-08-21",
  },

  profile: {
    name: "Your Name",
    titles: [
      "Director of Operations — Civil Division",
      "Project Manager — General Contractor",
    ],
    location: "South Florida",
    phone: "",
    email: "",
    linkedin: "",
    licenses: [
      "Florida Certified General Contractor — CGC #0000000",
      "OSHA 30-Hour Construction",
      "SWPPP / Stormwater Compliance Certification",
    ],
    summary:
      "Construction executive with dual-track expertise in civil/utility contracting and regulated healthcare construction. Civil scope spans HDD/directional boring, underground utilities, stormwater, earthwork, paving, and municipal/FDOT permitting, alongside GC-side project management under AIA A133 GMP delivery.",
    coreCompetencies: [
      "HDD / Directional Boring & Underground Utilities",
      "Stormwater, Drainage & Dewatering (FDEP/NPDES)",
      "MOT / TTC per FDOT Standard Plans Index 102",
      "AHCA Healthcare Construction & Inspections",
      "GMP / AIA A133-2019 Contract Administration",
      "Differing Site Condition Claims (A201 §3.7.4)",
      "Municipal, County & FDOT Permitting",
      "Solar / Energy Storage Project Delivery",
    ],
  },

  vendors: [
    { id: "VND-001", company: "Demo Structural Concrete Co.", trade: "Structural Concrete", contact: "—", phone: "", email: "", status: "Active", license: "On file", coiExp: "2026-11-30", w9: true, msa: true, dbe: false, rating: 4, projects: ["PRJ-001"], notes: "Foundations & structural concrete." },
    { id: "VND-002", company: "Demo Demolition LLC", trade: "Demolition", contact: "—", phone: "", email: "", status: "Active", license: "On file", coiExp: "2026-09-15", w9: true, msa: true, dbe: false, rating: 4, projects: ["PRJ-001"], notes: "Selective + structural demo." },
    { id: "VND-003", company: "Demo Mechanical Group", trade: "Mechanical / HVAC", contact: "—", phone: "", email: "", status: "Active", license: "On file", coiExp: "2027-01-31", w9: true, msa: true, dbe: false, rating: 4, projects: ["PRJ-001"], notes: "Open allowance flagged for GMP reconciliation." },
    { id: "VND-004", company: "Demo Plumbing Inc.", trade: "Plumbing", contact: "—", phone: "", email: "", status: "Active", license: "On file", coiExp: "2026-10-01", w9: true, msa: false, dbe: false, rating: 3, projects: ["PRJ-001"], notes: "" },
    { id: "VND-005", company: "Demo Glazing Systems", trade: "Glazing / Curtain Wall", contact: "—", phone: "", email: "", status: "Active", license: "On file", coiExp: "2026-12-20", w9: true, msa: true, dbe: false, rating: 4, projects: ["PRJ-001"], notes: "Delegated design item — tracked in spec log." },
    { id: "VND-006", company: "Demo Power Systems", trade: "Generators / Power Systems", contact: "—", phone: "", email: "", status: "Qualified", license: "On file", coiExp: "2026-08-30", w9: true, msa: false, dbe: false, rating: 5, projects: ["PRJ-002"], notes: "Hard quote basis for standby generator package." },
    { id: "VND-007", company: "Demo Flooring Co.", trade: "Flooring", contact: "—", phone: "", email: "", status: "Active", license: "On file", coiExp: "2026-09-05", w9: true, msa: false, dbe: false, rating: 3, projects: ["PRJ-001"], notes: "" },
    { id: "VND-008", company: "Self-Perform Civil Division", trade: "Civil / Utilities / HDD", contact: "—", phone: "", email: "", status: "Active", license: "On file", coiExp: "2027-03-31", w9: true, msa: true, dbe: false, rating: 5, projects: ["PRJ-001", "PRJ-004"], notes: "Self-perform civil: HDD, underground utilities, stormwater, earthwork, paving." },
  ],

  drawings: [
    { id: "DWG-001", project: "PRJ-001", title: "C-502.7 Deep Well Assembly — Drainage", discipline: "Civil / Drainage", type: "Detail", rev: "2", date: "2026-05-12", status: "Current", format: "PDF", location: "", notes: "Upgraded deep-well assembly scope — basis of drainage change order." },
    { id: "DWG-002", project: "PRJ-001", title: "Site Utility Plan — Water / Sewer / Storm", discipline: "Civil / Utilities", type: "Plan", rev: "3", date: "2026-04-02", status: "Current", format: "PDF", location: "", notes: "" },
    { id: "DWG-003", project: "PRJ-001", title: "Structural Foundation Plan", discipline: "Structural", type: "Plan", rev: "1", date: "2026-03-10", status: "Current", format: "PDF", location: "", notes: "Layout/footings phase reference." },
    { id: "DWG-004", project: "PRJ-004", title: "HDD Bore Profile — Crossing Plan", discipline: "Civil / HDD", type: "Profile", rev: "0", date: "2026-06-01", status: "Current", format: "PDF", location: "", notes: "Statewide program typical." },
    { id: "DWG-005", project: "PRJ-003", title: "Earthwork & Drainage Plan", discipline: "Civil / Earthwork", type: "Plan", rev: "2", date: "2026-02-14", status: "Superseded", format: "PDF", location: "", notes: "" },
    { id: "DWG-006", project: "PRJ-002", title: "Generator Yard — Equipment Layout", discipline: "Electrical / MEP", type: "Layout", rev: "1", date: "2026-01-20", status: "Current", format: "PDF", location: "", notes: "Stage 3 CDs." },
  ],

  /* Real published reference material — FDEP/FDOT rules and standard indices. */
  assemblies: [
    {
      id: "ASM-001", name: "Wellpoint Dewatering System", category: "Dewatering",
      agency: "FDEP", spec: "FDEP Generic Permit 62-621.300(2) — Dewatering Discharge",
      components: ["Header pipe (6\"–8\") w/ swing joints", "Wellpoints @ 3'–6' spacing", "Vacuum pump station + standby", "Settling tank / weir box", "Discharge filtration (turbidity control)", "Flow meter + sampling port"],
      compliance: ["Generic permit notice to FDEP 3 days pre-discharge", "Turbidity ≤ 29 NTU above background", "Discharge log maintained daily", "SWPPP integration"],
      typCost: "$18–$35 / LF / month", notes: "Standard for open-cut utility trenches in high water table (South FL).",
    },
    {
      id: "ASM-002", name: "Sock / Sump Dewatering (Localized)", category: "Dewatering",
      agency: "FDEP", spec: "FDEP 62-621.300(2) generic permit",
      components: ["Perforated sock drain in bedding", "Sump pit w/ crushed stone", "2\"–4\" trash pump", "Dewatering bag / sediment filter"],
      compliance: ["Sediment control at discharge point", "No direct discharge to surface waters without treatment"],
      typCost: "$2,500–$6,000 / setup", notes: "Structure excavations, manhole/inlet installs.",
    },
    {
      id: "ASM-003", name: "TTC — Lane Closure, Multilane (Index 102-603)", category: "MOT",
      agency: "FDOT", spec: "FDOT Standard Plans Index 102-600 series; MUTCD Part 6",
      components: ["Advance warning signs (W20-1 series)", "Arrow board (Type C)", "Channelizing devices @ spec spacing", "Taper per posted speed", "TMA / shadow vehicle where required", "Certified TTC supervisor (intermediate)"],
      compliance: ["MOT plan signed by FDOT-certified designer (advanced)", "Daily MOT inspection log", "Nighttime ops: retroreflectivity + lighting per Index 102"],
      typCost: "$3,500–$9,000 / week", notes: "Attach approved MOT plan to lane closure request; permit condition on FDOT ROW.",
    },
    {
      id: "ASM-004", name: "TTC — Sidewalk / Pedestrian Detour (Index 102-660)", category: "MOT",
      agency: "FDOT", spec: "FDOT Index 102-660; ADA PROWAG",
      components: ["Pedestrian LCDs (detectable)", "Temporary ramps / surfaces (ADA)", "Advance ped signage", "Covered walkway where overhead work"],
      compliance: ["ADA-compliant continuous path", "Local jurisdiction ROW coordination"],
      typCost: "$1,200–$4,000 / setup", notes: "Municipal jobs — urban corridors.",
    },
    {
      id: "ASM-005", name: "FDOT Utility Permit Package", category: "DOT",
      agency: "FDOT", spec: "Rule 14-46, F.A.C.; Utility Accommodation Manual",
      components: ["UAM-compliant plan & profile", "MOT plan reference", "Bore logs / geotech (HDD crossings)", "Insurance & surety per district", "One-Call design ticket"],
      compliance: ["Permit via FDOT OneStop", "48-hr notice before work in ROW", "As-builts within 90 days of completion"],
      typCost: "40–80 PM hrs / package", notes: "Standard package — statewide districts.",
    },
    {
      id: "ASM-006", name: "Driveway / Connection Permit (State Road)", category: "DOT",
      agency: "FDOT", spec: "Rule 14-96, F.A.C. — Access Management",
      components: ["Connection application", "Turn lane warrant analysis (if triggered)", "Drainage impact statement", "MOT plan"],
      compliance: ["Access class verification", "Pre-con with district access mgmt office"],
      typCost: "20–40 PM hrs / package", notes: "",
    },
    {
      id: "ASM-007", name: "NPDES CGP — Stormwater (Construction)", category: "FDEP",
      agency: "FDEP", spec: "62-621.300(4)(a) — Construction Generic Permit",
      components: ["NOI filed ≥ 2 days pre-construction", "SWPPP (site-specific)", "Silt fence / inlet protection / tracking control", "Weekly + post-0.25\" rain inspections", "NOT at final stabilization"],
      compliance: ["Qualified inspector (FDEP Stormwater ES&PC cert)", "Records retained 3 yrs post-NOT"],
      typCost: "$8K–$25K / project lifecycle", notes: "Standing SOP across the civil portfolio.",
    },
    {
      id: "ASM-008", name: "Class V Injection Well — Plug & Abandonment", category: "FDEP",
      agency: "FDEP", spec: "62-528, F.A.C. — UIC Class V",
      components: ["Well construction records / video log", "P&A plan (grout from TD to surface)", "Licensed water well contractor", "P&A report to FDEP UIC within 30 days"],
      compliance: ["FDEP UIC notification pre-abandonment", "Facility ID cross-reference"],
      typCost: "$45K–$120K / well (depth dependent)", notes: "Common basis for an A201 §3.7.4 differing site condition claim when wells surface during demolition.",
    },
    {
      id: "ASM-009", name: "FDEP Dewatering Discharge — Permit Workflow", category: "FDEP",
      agency: "FDEP", spec: "62-621.300(2), F.A.C.",
      components: ["Discharge characterization (source, volume, duration)", "Receiving water / disposal path", "Treatment train selection", "Notice + monitoring plan"],
      compliance: ["No contaminated groundwater under generic permit — requires individual permit if impacted", "Coordination w/ SFWMD where applicable"],
      typCost: "10–25 PM hrs / workflow", notes: "Pairs with ASM-001 / ASM-002 field assemblies.",
    },
  ],

  permits: [
    { id: "PMT-001", project: "PRJ-001", title: "NPDES CGP — Demo FSED", agency: "FDEP", type: "NPDES / Stormwater", stage: "Issued", submitted: "2026-01-08", issued: "2026-01-15", expires: "2027-01-15", owner: "Permit Coordinator", assembly: "ASM-007", notes: "SWPPP active; weekly inspections logged." },
    { id: "PMT-002", project: "PRJ-001", title: "Class V Well P&A — Three Wells", agency: "FDEP", type: "UIC Class V", stage: "Under Review", submitted: "2026-06-10", issued: "", expires: "", owner: "Project Manager", assembly: "ASM-008", notes: "Runs parallel to the differing site condition claim." },
    { id: "PMT-003", project: "PRJ-004", title: "FDOT Utility Permit — District 4 Crossing", agency: "FDOT", type: "Utility / ROW", stage: "Submitted", submitted: "2026-07-22", issued: "", expires: "", owner: "Permit Coordinator", assembly: "ASM-005", notes: "MOT plan attached (Index 102-603)." },
    { id: "PMT-004", project: "PRJ-001", title: "Dewatering Discharge Notice — Foundation Phase", agency: "FDEP", type: "Dewatering", stage: "Issued", submitted: "2026-03-02", issued: "2026-03-05", expires: "2026-12-31", owner: "Superintendent", assembly: "ASM-009", notes: "Wellpoint system (ASM-001) at footing excavations." },
    { id: "PMT-005", project: "PRJ-003", title: "County ROW / Drainage Connection", agency: "County", type: "ROW / Drainage", stage: "Closed", submitted: "2025-11-10", issued: "2025-12-01", expires: "2026-06-01", owner: "Permit Coordinator", assembly: "ASM-006", notes: "Closed with as-builts accepted." },
  ],

  projects: [
    {
      id: "PRJ-001", name: "Demo Health Center & Emergency Care", role: "Project Manager", client: "Healthcare System (Demo)",
      value: 34000000, start: "2026-01", end: "Ongoing", status: "Active",
      sector: "Healthcare / AHCA", delivery: "AIA A133-2019 GMP", location: "Fort Lauderdale, FL",
      scope: "~$34M AHCA-regulated freestanding emergency department. GMP administration, AHCA inspection program (42 inspections / 6 phases), BIM coordination, pay application SOP against executed A133-2019.",
      highlights: [
        "Built and prosecuted an A201 §3.7.4 differing site condition claim for FDEP Class V injection wells discovered in demolition",
        "Structured a net drainage change order for upgraded deep-well assembly scope",
        "Authored the Pay Application SOP with binding contract clauses embedded",
      ],
      showOnResume: true,
    },
    {
      id: "PRJ-002", name: "Demo Central Energy Plant — Generator Replacement", role: "Project Manager / Preconstruction", client: "Healthcare System (Demo)",
      value: 13100000, start: "2025-10", end: "Precon", status: "Preconstruction",
      sector: "Healthcare / Energy", delivery: "GMP Budget Development", location: "Fort Lauderdale, FL",
      scope: "~$13.1M budget for replacement of three 2,500 kW standby generators, anchored to hard equipment quotes through Stage 3 CDs.",
      highlights: ["Three-version estimate workbook progression to Stage 3 CD alignment"],
      showOnResume: true,
    },
    {
      id: "PRJ-003", name: "Demo Avenue — Earthworks & Drainage", role: "Director of Operations", client: "Residential Developer (Demo)",
      value: 540356, start: "2025-11", end: "2026-06", status: "Closeout",
      sector: "Residential / Civil", delivery: "Subcontract", location: "South Florida",
      scope: "Earthworks and drainage subcontract with full PM controls: 14-section checklist, RACI matrix, notice log.",
      highlights: ["Zero notice defaults; closed with as-builts accepted"],
      showOnResume: true,
    },
    {
      id: "PRJ-004", name: "Statewide Civil Program (Multi-Site)", role: "Director of Operations", client: "Telecom Program (Demo)",
      value: 0, start: "2026-01", end: "Ongoing", status: "Active",
      sector: "Telecom / Civil Utilities", delivery: "Statewide Program", location: "Florida — Statewide",
      scope: "Statewide civil program: HDD/directional boring, underground utilities, FDOT district permitting, MOT execution across multiple sites.",
      highlights: ["Standardized the FDOT utility permit package and MOT assemblies across districts"],
      showOnResume: true,
    },
    {
      id: "PRJ-005", name: "Convention Center — 2.3 MW Solar Repower", role: "Project Manager", client: "Municipal Utility (Demo)",
      value: 0, start: "Legacy", end: "Complete", status: "Complete",
      sector: "Solar / Energy", delivery: "Design-Build", location: "Orlando, FL",
      scope: "2.3 MW rooftop solar repower on an operating convention facility.",
      highlights: ["Delivered on a live, high-traffic public facility"],
      showOnResume: true,
    },
    {
      id: "PRJ-006", name: "Waterfront Marina Reconstruction", role: "Project Manager", client: "Private",
      value: 3995495, start: "Legacy", end: "Complete", status: "Complete",
      sector: "Marine / Waterfront", delivery: "GMP", location: "South Florida",
      scope: "GMP marine/waterfront construction.",
      highlights: ["Full GMP delivery in a regulated waterfront environment"],
      showOnResume: true,
    },
    {
      id: "PRJ-007", name: "Water Reclamation Facility — Solar / Energy Storage", role: "Project Manager", client: "Municipality (Demo)",
      value: 0, start: "Legacy", end: "Complete", status: "Complete",
      sector: "Solar / Municipal", delivery: "Public Works", location: "South Florida",
      scope: "Solar and energy storage delivery at an operating water reclamation facility.",
      highlights: ["Municipal utility coordination on critical infrastructure"],
      showOnResume: true,
    },
    {
      id: "PRJ-008", name: "National Retail Program", role: "Project Manager", client: "National Retail (Demo)",
      value: 0, start: "Legacy", end: "Complete", status: "Complete",
      sector: "Commercial / Retail", delivery: "Multiple", location: "Multi-state",
      scope: "Buildouts and remodels inside 24-hour operating retail facilities.",
      highlights: ["Phased work in continuously operating environments"],
      showOnResume: false,
    },
  ],
};

/* Collections every module expects. Import/fetch is normalized against
   this so a partial or hand-edited JSON file can't blank the app. */
export const COLLECTIONS = ["vendors", "drawings", "assemblies", "permits", "projects"];

export function normalize(raw) {
  const d = raw && typeof raw === "object" ? raw : {};
  const out = {
    meta: { ...SEED.meta, ...(d.meta || {}) },
    profile: { ...SEED.profile, ...(d.profile || {}) },
  };
  for (const k of COLLECTIONS) out[k] = Array.isArray(d[k]) ? d[k] : [];
  return out;
}

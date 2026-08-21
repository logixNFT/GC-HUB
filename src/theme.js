/* ============================================================
   Design tokens — navy #0B2545 · orange #E8731C
   Type: Fraunces (display) · Inter (body) · JetBrains Mono (data)
   ============================================================ */
export const T = {
  navy: "#0B2545", navyDeep: "#081A33", navyMid: "#13315C",
  orange: "#E8731C", orangeSoft: "#FBE8D8",
  paper: "#F4F5F7", card: "#FFFFFF", line: "#E2E6EC",
  ink: "#1B2430", inkSoft: "#5A6675", inkFaint: "#8A94A3",
  green: "#1D7A4F", greenSoft: "#E2F3EA",
  red: "#B23A3A", redSoft: "#F8E5E5",
  amber: "#B07711", amberSoft: "#FAF0DA",
  blue: "#2A5FA8", blueSoft: "#E4EDF9",
};

/* Permit pipeline — order defines the Advance → progression */
export const STAGE_COLORS = {
  Identified: [T.inkFaint, "#EEF1F5"],
  "Application Prep": [T.blue, T.blueSoft],
  Submitted: [T.amber, T.amberSoft],
  "Under Review": [T.orange, T.orangeSoft],
  Issued: [T.green, T.greenSoft],
  Closed: [T.inkSoft, "#EAEDF1"],
};
export const STAGES = Object.keys(STAGE_COLORS);

export const fmtMoney = (n) =>
  !n ? "—" : n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : `$${n.toLocaleString()}`;

/* Next sequential id for a prefixed record list, e.g. uid("VND", vendors) -> "VND-009" */
export const uid = (prefix, list) => {
  const max = list.reduce(
    (m, r) => Math.max(m, parseInt((r.id || "").split("-")[1] || 0, 10) || 0),
    0
  );
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
};

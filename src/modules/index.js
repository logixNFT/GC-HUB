import Dashboard from "./Dashboard.jsx";
import Vendors from "./Vendors.jsx";
import Drawings from "./Drawings.jsx";
import Assemblies from "./Assemblies.jsx";
import Permits from "./Permits.jsx";
import Projects from "./Projects.jsx";
import Resume from "./Resume.jsx";
import Factory from "./Factory.jsx";

/* ---------- MODULES map (schema-driven) ----------
   Add a module: write the component, drop it in here.
   `countKey` names the SEED collection the sidebar badge counts. */
export const MODULES = [
  { key: "dashboard", label: "Dashboard", comp: Dashboard },
  { key: "vendors", label: "Vendors", comp: Vendors, countKey: "vendors" },
  { key: "drawings", label: "Drawings", comp: Drawings, countKey: "drawings" },
  { key: "assemblies", label: "Assemblies", comp: Assemblies, countKey: "assemblies" },
  { key: "permits", label: "Permits & Compliance", comp: Permits, countKey: "permits" },
  { key: "projects", label: "Projects", comp: Projects, countKey: "projects" },
  { key: "factory", label: "Factory", comp: Factory },
  { key: "resume", label: "Resume / Portfolio", comp: Resume },
];

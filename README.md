# GC HUB

Contractor operations hub — one place to capture vendors, drawings, standard
assemblies, permit workflows, and projects, with a resume/portfolio that
generates itself from the project registry.

React + Vite. No server, no database, no login. The whole dataset is one JSON
file, which is what makes it portable and what makes the repo the system of
record.

## Modules

| Module | What it holds |
| --- | --- |
| **Dashboard** | Counts across every collection, open permit workflows, and a rolling 75-day COI expiration watchlist |
| **Vendors** | Subcontractor and supplier registry — trade, status, W9/MSA/DBE, COI expiration, rating |
| **Drawings** | Plans, profiles, and details, revision-controlled and keyed to a project |
| **Assemblies** | Reusable technical and permit packages — dewatering, MOT/TTC, FDOT, FDEP — with components and compliance requirements |
| **Permits & Compliance** | The permit hub: agency workflows from Identified through Closed, each linked to its standard assembly |
| **Projects** | Project registry — scope, value, role, delivery method, highlights |
| **Resume / Portfolio** | Print-ready sheet generated live from the projects flagged *On resume* |

### The permit hub

`src/modules/Permits.jsx` runs a six-stage pipeline:

```
Identified → Application Prep → Submitted → Under Review → Issued → Closed
```

- Click any stage in the pipeline strip to filter the table to it.
- **Advance →** moves a workflow one stage and stamps the date that matters at
  that transition — `submitted` on entering *Submitted*, `issued` on entering
  *Issued* — without overwriting a date already set.
- Each workflow links to an assembly (`ASM-*`), so the submittal package
  requirements travel with the permit instead of living in someone's head.

## Data workflow

The app resolves its data in this order on load:

1. **Local draft** — your edits in this browser, autosaved to `localStorage`.
   A refresh never loses work.
2. **Published file** — `public/gc-hub-data.json`, if committed.
3. **Built-in demo seed** — `src/data/seed.js`.

The sidebar shows which of the three is live. Once you've edited anything you're
on a local draft, and **Revert to published** discards it and reloads (2) or (3).

To publish a dataset:

```
Export JSON  →  save as public/gc-hub-data.json  →  commit  →  Vercel redeploys
```

Anything imported or fetched is normalized against the seed's shape first, so a
partial or hand-edited file can't blank out a module.

### ⚠️ This is a public repo

Do **not** commit real operating data — vendor contacts, client names, claim
figures, or permit notes — to `public/gc-hub-data.json` while this repo is
public. GitHub keeps it in history even after a delete.

The shipped seed is illustrative demo data. Keep your real dataset local:
`*.local.json` is gitignored, so `gc-hub-data.local.json` sits next to the repo
and you load it through **Import**.

If you want the real data published, make the repo private first:

```bash
gh repo edit logixNFT/GC-HUB --visibility private
```

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

## Adding a module

The shell is schema-driven — the sidebar, routing, and badge counts all read
from one array.

1. Write the component in `src/modules/`. It receives
   `{ data, setData, query, go }`.
2. Register it in `src/modules/index.js`:

```js
{ key: "closeout", label: "Closeout", comp: Closeout, countKey: "closeout" }
```

`countKey` names the collection whose length shows in the sidebar badge. If the
module introduces a new collection, add it to `COLLECTIONS` in
`src/data/seed.js` so normalization guarantees the array exists.

## Layout

```
index.html               fonts, favicon, title
src/
  App.jsx                shell — sidebar, search, data sync, mobile drawer
  theme.js               design tokens, permit stages, fmtMoney, uid
  data/seed.js           demo dataset + normalize()
  lib/store.js           draft / published / seed resolution
  ui/atoms.jsx           Pill, Mono, Field, Btn, Table, Panel, ModuleHead
  modules/               one file per module + the MODULES map
public/
  gc-hub-data.json       optional published dataset (not committed by default)
```

Design tokens: navy `#0B2545`, orange `#E8731C`. Fraunces for display, Inter for
body, JetBrains Mono for data.

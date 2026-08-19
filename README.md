# Mw 7.4 Colombia earthquake — Cali situation dashboard

**Live:** [arikhp.github.io/colombia-quake-dashboard](https://arikhp.github.io/colombia-quake-dashboard/)

A React dashboard covering the **10 August 2026 Mw 7.4 earthquake** near San José del
Palmar, Chocó, Colombia, with the focus on the impact in **Cali and Pereira**.

The build produces **one self-contained `dist/index.html`** (about 400 kB). React, the
app code, the styles, the geography and roughly 100 kB of USGS scientific data are all
inlined, so it opens by double-clicking the file — no server, no CDN, no network. The
same file is what's deployed to GitHub Pages (via the `gh-pages` branch), so the live
site works identically offline once loaded.

```
open dist/index.html
```

## Sections

| # | Tab | Contents |
|---|-----|----------|
| 1 | Overview | Headline figures, event parameters, PAGER and ground-failure alerts, population exposed by intensity, how the death toll evolved |
| 2 | Map & shaking | Interactive map: 33 department boundaries, ShakeMap intensity contours, 118 populated places sized by population and coloured by modelled intensity, aftershocks, true-distance rings. Pan, zoom, layer toggles, view presets |
| 3 | Cali | Official report #016 figures, collapse-affected barrios, named damaged sites, the hospital system's response, reconstruction estimate |
| 4 | Pereira | The second-deadliest city: airport collapse, cable-car incident, health-system advisory, and how its death toll was first reported vs. settled |
| 5 | National impact | Deaths and injuries by department and city, damaged infrastructure, secondary hazards |
| 6 | Seismology | Focal mechanism computed from the moment tensor, nodal planes, finite-fault rupture model, depth cross-section, catalogued events with optional live refresh |
| 7 | Loss modelling | PAGER fatality and economic probability distributions against what actually happened, cost estimates from five sources, building-type vulnerability, historical comparison |
| 8 | Response & aid | Chronology, financial pledges, search-and-rescue teams and the aid controversy |
| 9 | Sources & method | Every source, the known conflicts in the reporting, and how they are handled |

Each tab is addressable: `dist/index.html#seismology`.

## Data

Two kinds of data, kept deliberately separate.

**Machine-read** — fetched from the USGS FDSN event service for event
[`us6000tjl2`](https://earthquake.usgs.gov/earthquakes/eventpage/us6000tjl2) and reduced
by `scripts/prep-data.mjs` into `src/data/usgs.generated.js`:

- origin, magnitude, depth, felt reports, significance
- ShakeMap v6: peak MMI, PGA, PGV, spectral accelerations, MMI contour geometry
- PAGER: population and capital exposure by intensity, empirical and semi-empirical loss
  estimates, alert probability bins, nearby historical earthquakes
- moment tensor, finite-fault rupture model, landslide and liquefaction models
- catalogued mainshock and aftershocks
- 33 Colombian department boundaries from a public GeoJSON file

**Official (Cali)** — the district administration's situation report #016,
*Actualización de cifras sismo Cali*, cut at 18 August 2026 18:30 COT (copied to
`data-raw/reporte-oficial-016.pdf`). This is the primary source for every Cali figure and
it is substantially higher than the press coverage: **141 dead and 1,569 injured**, against
95 and 949 in the first city update on 11 August. It also gives verified building
inspections, missing-person record reconciliation (56 down to 47) and the response effort.
`scripts/read-report-pdf.mjs` extracts it with text coordinates, because a flat text dump
interleaves the report's two columns and makes the label-to-number mapping ambiguous.

**Reported** — hand-curated in `src/data/impact.js` from news reporting and official
statements, with each figure attributed and dated. Casualty, damage and cost numbers
were still moving when this was built; where sources conflict, both values are shown.

The three tiers are not interchangeable and the dashboard says so. Departmental figures
date from 11–13 August and have not been restated, so **Cali's official 141 deaths now
exceeds the 133 last published for the whole of Valle del Cauca that contains it**. Rather
than quietly reconciling that, the affected rows are flagged "not restated", charts use the
higher of the city or department figure and label it as a floor, and the Sources tab
tabulates every conflict with how it is handled.

## Commands

```bash
npm install
npm run build     # regenerate data, then bundle to dist/index.html
npm run dev       # unminified build, rebuilds on change
npm run serve     # static server on :5173, if you prefer a URL
npm run check     # numerical checks on the derived seismology and geometry
npm run verify    # render every tab in headless Chrome, screenshot, assert content
npm test          # build + check + verify
```

`npm run verify` needs a Chromium-based browser; it looks in the usual locations or
uses `CHROME_PATH`.

## Deployment

The site is static and single-file, so deployment is just publishing `dist/index.html`.
It's served from GitHub Pages off the `gh-pages` branch (root path), which holds only
that built file plus `.nojekyll`. To redeploy after a change:

```bash
npm run build
git worktree add -b gh-pages-tmp ../pages-tmp origin/gh-pages
cp dist/index.html ../pages-tmp/index.html
cd ../pages-tmp && git add -A && git commit -m "Deploy" && git push origin HEAD:gh-pages
cd - && git worktree remove ../pages-tmp --force
```

`main` holds the source and raw data only; `dist/` is git-ignored there so build
artifacts never drift from what `npm run build` actually produces.

## Notable implementation details

- **The focal mechanism is computed, not an image.** `src/lib/beachball.js` shades the
  lower focal hemisphere by the sign of the radial P-wave amplitude `l·M·l` from the six
  published tensor components, on an equal-angle projection, then overlays the principal
  axes. `npm run check` asserts the tensor is deviatoric, that the T axis falls in a
  compressional quadrant and the P axis in a dilatational one, that both nodal-plane
  strike directions are near-nodal, and that Mw derived from the scalar moment matches
  the catalogue to within 0.06.
- **No charting library.** Every chart is hand-built SVG, so the whole bundle is React
  plus application code.
- **Geometry is simplified with Ramer–Douglas–Peucker** and rounded to three decimal
  degrees, which is what makes a full boundary and contour map fit in one offline file.
- **Distances are hypocentral as well as epicentral.** At 110 km depth the distance to
  the rupture is what explains the damage pattern, and both are shown.
- **Bad source data is dropped, not passed through.** The PAGER city table lists Timbío
  at 4,444,444 people; `prep-data.mjs` filters implausible populations and logs what it
  removed.
- **Events far from the rupture are flagged, not counted.** One catalogued M4.2 belongs
  to the persistent intermediate-depth source near Bucaramanga, 416 km away; it is shown
  for completeness but excluded from the aftershock count and cross-section.

## Caveats

Not an official source. Intensity values for towns are ShakeMap modelled values at the
town centroid, not measurements. Nothing here is a forecast. For assistance, contact the
UNGRD or the Colombian Red Cross.

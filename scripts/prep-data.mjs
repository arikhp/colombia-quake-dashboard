/**
 * Turns the raw payloads in data-raw/ (USGS ComCat event detail, ShakeMap,
 * PAGER, and a Colombia department boundary file) into one compact ES module
 * that gets bundled into the dashboard.
 *
 * Geometry is simplified with Ramer-Douglas-Peucker and rounded to 3 decimal
 * degrees (~110 m) to keep the single-file build small enough to open offline.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, 'data-raw');
const OUT = join(ROOT, 'src', 'data', 'usgs.generated.js');

// Some payloads were saved by PowerShell and carry a UTF-8 BOM.
const raw = (name) => JSON.parse(readFileSync(join(RAW, name), 'utf8').replace(/^\uFEFF/, ''));

const round = (n, p = 3) => Number(n.toFixed(p));

/** Perpendicular distance from p to the segment a-b, in degrees. */
function segDistance(p, a, b) {
  const [px, py] = p;
  let [ax, ay] = a;
  const [bx, by] = b;
  let dx = bx - ax;
  let dy = by - ay;
  if (dx !== 0 || dy !== 0) {
    const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      ax = bx;
      ay = by;
    } else if (t > 0) {
      ax += dx * t;
      ay += dy * t;
    }
  }
  dx = px - ax;
  dy = py - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

function simplify(points, tolerance) {
  if (points.length <= 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let index = -1;
    let maxDist = tolerance;
    for (let i = first + 1; i < last; i++) {
      const d = segDistance(points[i], points[first], points[last]);
      if (d > maxDist) {
        maxDist = d;
        index = i;
      }
    }
    if (index !== -1) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const dedupe = (pts) =>
  pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);

const prepRing = (ring, tolerance, minPoints) => {
  const out = dedupe(simplify(ring, tolerance).map(([x, y]) => [round(x), round(y)]));
  return out.length >= minPoints ? out : null;
};

// ---------------------------------------------------------------------------
// Department boundaries
// ---------------------------------------------------------------------------

/** Title-case the shouty department names in the source file. */
function prettyName(name) {
  const fixed = {
    'SANTAFE DE BOGOTA D.C': 'Bogotá D.C.',
    'ARCHIPIELAGO DE SAN ANDRES PROVIDENCIA Y SANTA CATALINA': 'San Andrés y Providencia',
    CHOCO: 'Chocó',
    BOLIVAR: 'Bolívar',
    BOYACA: 'Boyacá',
    CAQUETA: 'Caquetá',
    CORDOBA: 'Córdoba',
    'NARIÑO': 'Nariño',
    ATLANTICO: 'Atlántico',
    QUINDIO: 'Quindío',
    'LA GUAJIRA': 'La Guajira',
    GUAINIA: 'Guainía',
    VAUPES: 'Vaupés',
  };
  if (fixed[name]) return fixed[name];
  return name
    .toLowerCase()
    .split(' ')
    .map((w) => (w.length <= 2 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(' ')
    .replace(/^./, (c) => c.toUpperCase());
}

function prepDepartments() {
  const src = raw('colombia.geo.json');
  const features = [];
  for (const f of src.features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    const rings = [];
    for (const poly of polys) {
      // Outer ring only: interior holes are not meaningful at this zoom.
      const ring = prepRing(poly[0], 0.012, 5);
      if (ring) rings.push(ring);
    }
    if (!rings.length) continue;
    // Largest ring drives the label position.
    const main = rings.reduce((a, b) => (b.length > a.length ? b : a));
    let [sx, sy] = [0, 0];
    for (const [x, y] of main) {
      sx += x;
      sy += y;
    }
    features.push({
      id: f.properties.DPTO,
      name: prettyName(f.properties.NOMBRE_DPT),
      centroid: [round(sx / main.length), round(sy / main.length)],
      rings,
    });
  }
  return features.sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// ShakeMap MMI contours
// ---------------------------------------------------------------------------

function prepContours() {
  const src = raw('cont_mmi_sm.json');
  return src.features
    .map((f) => ({
      value: f.properties.value,
      lines: f.geometry.coordinates
        .map((line) => prepRing(line, 0.02, 4))
        .filter(Boolean)
        // Drop slivers that only add bytes.
        .filter((line) => line.length > 6),
    }))
    .filter((c) => c.lines.length)
    .sort((a, b) => a.value - b.value);
}

// ---------------------------------------------------------------------------
// Populated places with modelled shaking intensity
// ---------------------------------------------------------------------------

/**
 * The PAGER city table carries a few implausible population values (Timbío, a
 * town of about 30,000, is listed at 4,444,444 — a repdigit sentinel). Those are
 * dropped rather than trusted, because marker size is scaled by population and a
 * bad value would dominate the map.
 */
/**
 * The PAGER city list is ASCII-only. These are display spellings for the places
 * that actually get labelled or tabulated; anything not listed keeps its
 * catalogue spelling.
 */
const DISPLAY_NAMES = {
  Bogota: 'Bogotá',
  Medellin: 'Medellín',
  Quibdo: 'Quibdó',
  Ibague: 'Ibagué',
  Popayan: 'Popayán',
  Cucuta: 'Cúcuta',
  Monteria: 'Montería',
  Tulua: 'Tuluá',
  Calarca: 'Calarcá',
  Chinchina: 'Chinchiná',
  Villamaria: 'Villamaría',
  Alcala: 'Alcalá',
  Riofrio: 'Riofrío',
  Jamundi: 'Jamundí',
  Andalucia: 'Andalucía',
  'La Union': 'La Unión',
  'El Aguila': 'El Águila',
  Bolivar: 'Bolívar',
  Darien: 'Darién',
  Guacari: 'Guacarí',
  Suarez: 'Suárez',
  Piendamo: 'Piendamó',
  Cajibio: 'Cajibío',
  Timbio: 'Timbío',
  'San Jose del Palmar': 'San José del Palmar',
  Sipi: 'Sipí',
  Istmina: 'Istmina',
  Neiva: 'Neiva',
  Marsella: 'Marsella',
  Anserma: 'Anserma',
  Belalcazar: 'Belalcázar',
  Risaralda: 'Risaralda',
  Guatica: 'Guática',
  Quinchia: 'Quinchía',
  Balboa: 'Balboa',
  Apia: 'Apía',
  Mistrato: 'Mistrató',
};

function isPopulationPlausible(c) {
  if (/^(\d)\1{5,}$/.test(String(c.pop))) return false;
  // Bogotá, the largest city in the country, is under 8.1 million.
  return c.pop <= 8.1e6;
}

function prepCities() {
  const { all_cities: all } = raw('pager_cities.json');
  const dropped = all.filter((c) => !isPopulationPlausible(c));
  if (dropped.length) {
    console.log(`  dropped ${dropped.length} city rows with implausible population: ` +
      dropped.map((c) => `${c.name} (${c.pop})`).join(', '));
  }

  const selected = all.filter(
    (c) =>
      isPopulationPlausible(c) &&
      // Every major city, so the national picture is complete, plus anywhere that
      // was shaken hard, plus mid-size towns in the strongly-shaken area.
      (c.pop >= 100000 || c.mmi >= 6.5 || (c.pop >= 25000 && c.mmi >= 5.5))
  );

  return selected
    .map((c) => ({
      name: DISPLAY_NAMES[c.name] || c.name,
      lat: round(c.lat, 4),
      lon: round(c.lon, 4),
      pop: c.pop,
      mmi: round(c.mmi, 2),
      capital: Boolean(c.iscap),
    }))
    .sort((a, b) => b.mmi - a.mmi)
    .slice(0, 150);
}

// ---------------------------------------------------------------------------
// Mainshock + catalogued aftershocks
// ---------------------------------------------------------------------------

const R_EARTH = 6371;
const toRad = (d) => (d * Math.PI) / 180;

function haversine(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.sqrt(a));
}

/**
 * Events in the catalogue window that sit far from the rupture are not
 * aftershocks of it. Colombia has a persistent intermediate-depth source near
 * Bucaramanga that produces M4s independently, so anything beyond this radius is
 * flagged rather than counted as part of the sequence.
 */
const AFTERSHOCK_RADIUS_KM = 150;

function prepSequence(epi) {
  const src = raw('usgs_seq.json');
  return src.features
    .map((f) => {
      const [lon, lat, depth] = f.geometry.coordinates;
      const p = f.properties;
      const distance = Math.round(haversine(epi.lat, epi.lon, lat, lon));
      return {
        related: distance <= AFTERSHOCK_RADIUS_KM,
        id: f.id,
        mag: p.mag,
        magType: p.magType,
        lat: round(lat, 4),
        lon: round(lon, 4),
        depth: round(depth, 1),
        time: p.time,
        place: p.place,
        felt: p.felt ?? null,
        mmi: p.mmi ?? null,
        alert: p.alert ?? null,
        url: p.url,
        distanceFromMainshock: distance,
      };
    })
    .sort((a, b) => a.time - b.time);
}

// ---------------------------------------------------------------------------
// Assemble
// ---------------------------------------------------------------------------

const detail = raw('usgs_detail.json');
const products = detail.properties.products;
const num = (v) => (v === undefined || v === null ? null : Number(v));
const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, num(obj[k])]));

const [epiLon, epiLat, epiDepth] = detail.geometry.coordinates;
const p = detail.properties;

const event = {
  id: detail.id,
  magnitude: p.mag,
  magnitudeType: p.magType,
  place: p.place,
  originTimeUTC: p.time,
  lat: epiLat,
  lon: epiLon,
  depth: epiDepth,
  felt: p.felt,
  cdi: p.cdi,
  mmi: p.mmi,
  alert: p.alert,
  significance: p.sig,
  tsunami: Boolean(p.tsunami),
  reviewStatus: p.status,
  stationCount: p.nst,
  azimuthalGap: p.gap,
  rmsResidual: p.rms,
  url: p.url,
  updated: p.updated,
};

const smProps = products.shakemap[0].properties;
const shakemap = {
  version: smProps.version,
  maxMMI: num(smProps.maxmmi),
  maxPGA: num(smProps.maxpga),
  maxPGV: num(smProps.maxpgv),
  psa: {
    '0.3s': num(smProps.maxpsa03),
    '1.0s': num(smProps.maxpsa10),
    '3.0s': num(smProps.maxpsa30),
  },
  gmice: smProps.gmice,
  codeVersion: smProps['shakemap-code-version'],
  processed: smProps['process-timestamp'],
  bbox: [
    num(smProps['minimum-longitude']),
    num(smProps['minimum-latitude']),
    num(smProps['maximum-longitude']),
    num(smProps['maximum-latitude']),
  ],
};

const mtProps = products['moment-tensor'][0].properties;
const momentTensor = {
  scalarMoment: num(mtProps['scalar-moment']),
  derivedMagnitude: num(mtProps['derived-magnitude']),
  derivedDepth: num(mtProps['derived-depth']),
  percentDoubleCouple: num(mtProps['percent-double-couple']),
  duration: num(mtProps['sourcetime-duration']),
  tensor: pick(mtProps, [
    'tensor-mrr',
    'tensor-mtt',
    'tensor-mpp',
    'tensor-mrt',
    'tensor-mrp',
    'tensor-mtp',
  ]),
  nodalPlanes: [
    {
      strike: num(mtProps['nodal-plane-1-strike']),
      dip: num(mtProps['nodal-plane-1-dip']),
      rake: num(mtProps['nodal-plane-1-rake']),
    },
    {
      strike: num(mtProps['nodal-plane-2-strike']),
      dip: num(mtProps['nodal-plane-2-dip']),
      rake: num(mtProps['nodal-plane-2-rake']),
    },
  ],
  axes: {
    p: { azimuth: num(mtProps['p-axis-azimuth']), plunge: num(mtProps['p-axis-plunge']) },
    n: { azimuth: num(mtProps['n-axis-azimuth']), plunge: num(mtProps['n-axis-plunge']) },
    t: { azimuth: num(mtProps['t-axis-azimuth']), plunge: num(mtProps['t-axis-plunge']) },
  },
};

const ffProps = products['finite-fault'][0].properties;
const finiteFault = {
  ...pick(ffProps, [
    'model-length',
    'model-width',
    'model-top',
    'model-strike',
    'model-dip',
    'model-rake',
    'maximum-slip',
    'average-rise-time',
    'average-rupture-velocity',
    'derived-magnitude',
    'scalar-moment',
  ]),
  crustalModel: ffProps['crustal-model'],
  waveforms: {
    p: num(ffProps['number-pwaves']),
    sh: num(ffProps['number-shwaves']),
    long: num(ffProps['number-longwaves']),
  },
};

const gfProps = products['ground-failure'][0].properties;
const parseRange = (s) => (s ? s.split(',').map((v) => Number(v.trim())) : null);
const groundFailure = {
  landslide: {
    alert: gfProps['landslide-alert'],
    hazardValue: num(gfProps['landslide-hazard-alert-value']),
    populationExposed: num(gfProps['landslide-population-alert-value']),
    populationRange1std: parseRange(gfProps['landslide-population-1std']),
  },
  liquefaction: {
    alert: gfProps['liquefaction-alert'],
    hazardValue: num(gfProps['liquefaction-hazard-alert-value']),
    populationExposed: num(gfProps['liquefaction-population-alert-value']),
    populationRange1std: parseRange(gfProps['liquefaction-population-1std']),
  },
};

const exposures = raw('pager_exposures.json');
const losses = raw('pager_losses.json');
const alerts = raw('pager_alerts.json');
const comments = raw('pager_comments.json');
const historical = raw('pager_hist.json');

const pager = {
  alertLevel: products.losspager[0].properties.alertlevel,
  populationExposure: exposures.population_exposure.mmi.map((mmi, i) => ({
    mmi,
    population: exposures.population_exposure.aggregated_exposure[i],
    economic: exposures.economic_exposure.aggregated_exposure[i],
  })),
  countryExposure: exposures.population_exposure.country_exposures.map((c) => ({
    country: c.country_code,
    total: c.exposure.reduce((a, b) => a + b, 0),
    byMMI: c.exposure,
  })),
  estimates: {
    empiricalFatalities: losses.empirical_fatality.total_fatalities,
    semiEmpiricalFatalities: Math.round(losses.semi_empirical_fatalities.fatalities),
    empiricalEconomicUSD: losses.empirical_economic.total_dollars,
  },
  buildingTypeFatalities: Object.entries(losses.semi_empirical_fatalities.residental_fatalities.CO)
    .map(([code, value]) => ({ code, value: Math.round(value) }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value),
  alertBins: {
    fatality: { level: alerts.fatality.level, bins: alerts.fatality.bins },
    economic: { level: alerts.economic.level, bins: alerts.economic.bins },
  },
  comments,
  historical: historical
    .map((h) => ({
      name: h.Name.replace(/"/g, ''),
      time: h.Time,
      magnitude: h.Magnitude,
      depth: h.Depth,
      lat: h.Lat,
      lon: h.Lon,
      maxMMI: h.MaxMMI,
      deaths: h.TotalDeaths,
      shakingDeaths: h.ShakingDeaths,
      injured: h.Injured,
      distanceKm: Math.round(h.Distance),
    }))
    .sort((a, b) => b.magnitude - a.magnitude),
};

const data = {
  generatedAt: new Date().toISOString(),
  event,
  shakemap,
  momentTensor,
  finiteFault,
  groundFailure,
  pager,
  sequence: prepSequence(event),
  cities: prepCities(),
  mmiContours: prepContours(),
  departments: prepDepartments(),
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  `// GENERATED by scripts/prep-data.mjs -- do not edit by hand.\n` +
    `// Source: USGS ComCat event ${event.id} (ShakeMap v${shakemap.version}, PAGER, moment tensor,\n` +
    `// finite-fault, ground-failure products) and a Colombia department boundary file.\n` +
    `export default ${JSON.stringify(data)};\n`,
  'utf8'
);

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
console.log(`wrote ${OUT}`);
console.log(`  total                 ${kb(JSON.stringify(data).length)}`);
console.log(`  departments  ${data.departments.length} features  ${kb(JSON.stringify(data.departments).length)}`);
console.log(`  mmiContours  ${data.mmiContours.length} levels    ${kb(JSON.stringify(data.mmiContours).length)}`);
console.log(`  cities       ${data.cities.length} places    ${kb(JSON.stringify(data.cities).length)}`);
console.log(`  sequence     ${data.sequence.length} events`);

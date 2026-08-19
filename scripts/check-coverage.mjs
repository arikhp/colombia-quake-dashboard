/**
 * Checks that the simplified department polygons still cover the map area, so a
 * hole in the boundary data cannot be mistaken for sea.
 */
import data from '../src/data/usgs.generated.js';

const inRing = (lon, lat, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const findDepartment = (lon, lat) =>
  data.departments.find((d) => d.rings.some((r) => inRing(lon, lat, r)));

const probes = [
  ['NE corner of the map view', -73.8, 7.5],
  ['Cali', -76.52, 3.44],
  ['Epicentre (Chocó)', -76.24, 4.84],
  ['Bogotá', -74.08, 4.61],
  ['Pereira', -75.69, 4.81],
  ['Pacific ocean (should be empty)', -78.4, 3.5],
];

for (const [label, lon, lat] of probes) {
  const hit = findDepartment(lon, lat);
  console.log(`${label.padEnd(34)} ${hit ? hit.name : '(no department)'}`);
}

// Sample a grid over the map bbox and report the largest gap in coverage.
const BBOX = [-78.6, 1.9, -73.6, 7.9];
let land = 0;
let empty = 0;
const gaps = [];
for (let lon = BBOX[0]; lon <= BBOX[2]; lon += 0.1) {
  for (let lat = BBOX[1]; lat <= BBOX[3]; lat += 0.1) {
    if (findDepartment(lon, lat)) land++;
    else {
      empty++;
      gaps.push([Number(lon.toFixed(1)), Number(lat.toFixed(1))]);
    }
  }
}
console.log(`\ngrid samples inside a department: ${land}, outside: ${empty}`);
const eastGaps = gaps.filter(([lon]) => lon > -74.5);
console.log(`uncovered samples east of -74.5 (inland Colombia): ${eastGaps.length}`);
if (eastGaps.length) console.log('  e.g.', eastGaps.slice(0, 8).map((g) => g.join(',')).join(' | '));

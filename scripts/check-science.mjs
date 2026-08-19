/**
 * Numerical checks on the derived seismology, so the focal mechanism and the
 * distance arithmetic are verified rather than eyeballed.
 */
import { radialAmplitude, rayToSpherical } from '../src/lib/beachball.js';
import { haversineKm, hypocentralKm } from '../src/lib/geo.js';
import data from '../src/data/usgs.generated.js';

let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${detail ? `  ${detail}` : ''}`);
  if (!pass) failures++;
};

const { momentTensor: mt, event } = data;
const t = mt.tensor;

// A moment tensor for a shear dislocation has no volume change, so the trace
// should vanish relative to the size of the components.
const trace = t['tensor-mrr'] + t['tensor-mtt'] + t['tensor-mpp'];
const scale = Math.max(...Object.values(t).map(Math.abs));
check('tensor is deviatoric (trace ~ 0)', Math.abs(trace) / scale < 0.05, `|trace|/max = ${(Math.abs(trace) / scale).toExponential(2)}`);

// The T (tension) axis must sit in a compressional/dark quadrant and the P axis
// in a dilatational/white one. If these were swapped the beachball would be a
// photographic negative of the real mechanism.
const amp = (axis) => radialAmplitude(t, ...rayToSpherical(axis.azimuth, axis.plunge));
const uT = amp(mt.axes.t);
const uP = amp(mt.axes.p);
check('T axis lands in a compressional quadrant', uT > 0, `u(T) = ${uT.toExponential(2)}`);
check('P axis lands in a dilatational quadrant', uP < 0, `u(P) = ${uP.toExponential(2)}`);
check('P and T amplitudes are comparable in size', Math.abs(Math.abs(uT / uP) - 1) < 0.3, `|u(T)/u(P)| = ${Math.abs(uT / uP).toFixed(2)}`);

// The nodal planes are where the radial amplitude vanishes: sample along the
// strike direction of each plane, which lies on that plane.
for (const [i, np] of mt.nodalPlanes.entries()) {
  const u = radialAmplitude(t, ...rayToSpherical(np.strike, 0));
  check(`nodal plane ${i + 1} strike direction is near-nodal`, Math.abs(u) / scale < 0.15, `|u|/max = ${(Math.abs(u) / scale).toExponential(2)}`);
}

// Moment magnitude from the scalar moment: Mw = (2/3)(log10 M0 - 9.1), M0 in N.m.
const mw = (2 / 3) * (Math.log10(mt.scalarMoment) - 9.1);
check('Mw derived from scalar moment matches catalogue', Math.abs(mw - event.magnitude) < 0.06, `computed ${mw.toFixed(3)} vs catalogue ${event.magnitude}`);

// Geometry sanity: Cali is reported at roughly 160 km from the epicentre.
const caliKm = haversineKm(event.lat, event.lon, 3.4372, -76.5225);
const caliHypo = hypocentralKm(event.lat, event.lon, 3.4372, -76.5225, event.depth);
check('Cali epicentral distance is plausible', caliKm > 140 && caliKm < 180, `${caliKm.toFixed(0)} km`);
check('hypocentral distance exceeds epicentral', caliHypo > caliKm, `${caliHypo.toFixed(0)} km vs ${caliKm.toFixed(0)} km`);

// The ShakeMap peak intensity should match the maximum modelled city intensity
// within rounding, since the cities sit inside the ShakeMap grid.
const maxCityMmi = Math.max(...data.cities.map((c) => c.mmi));
check('peak city intensity does not exceed ShakeMap maximum', maxCityMmi <= data.shakemap.maxMMI + 0.01, `city ${maxCityMmi} vs grid ${data.shakemap.maxMMI}`);

// PAGER exposure should account for everyone in the country totals.
const aggregated = data.pager.populationExposure.reduce((a, d) => a + d.population, 0);
const byCountry = data.pager.countryExposure.reduce((a, c) => a + c.total, 0);
check('PAGER exposure totals reconcile', Math.abs(aggregated - byCountry) < 1, `${aggregated} vs ${byCountry}`);

console.log(failures ? `\n${failures} check(s) failed` : '\nall science checks passed');
process.exit(failures ? 1 : 0);

import { useCallback, useState } from 'react';
import { haversineKm } from './geo.js';

const FDSN =
  'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson' +
  '&starttime=2026-08-10&minlatitude=1&maxlatitude=9&minlongitude=-80&maxlongitude=-72&minmagnitude=1&orderby=time';

/**
 * The dashboard ships with a snapshot of the catalogue so it works offline.
 * This hook lets it top the snapshot up from the live USGS feed on demand,
 * which matters because the aftershock sequence is still being catalogued.
 */
export function useLiveSequence(snapshot, epicentre) {
  const [sequence, setSequence] = useState(snapshot);
  const [state, setState] = useState({ status: 'snapshot', message: 'Bundled catalogue snapshot' });

  const refresh = useCallback(async () => {
    setState({ status: 'loading', message: 'Querying USGS…' });
    try {
      const res = await fetch(FDSN, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const fetched = json.features.map((f) => {
        const [lon, lat, depth] = f.geometry.coordinates;
        const distance = Math.round(haversineKm(epicentre.lat, epicentre.lon, lat, lon));
        return {
          related: distance <= 150,
          id: f.id,
          mag: f.properties.mag,
          magType: f.properties.magType,
          lat,
          lon,
          depth,
          time: f.properties.time,
          place: f.properties.place,
          felt: f.properties.felt ?? null,
          mmi: f.properties.mmi ?? null,
          alert: f.properties.alert ?? null,
          url: f.properties.url,
          distanceFromMainshock: distance,
        };
      });

      const merged = new Map(sequence.map((e) => [e.id, e]));
      let added = 0;
      for (const e of fetched) {
        if (!merged.has(e.id)) added++;
        merged.set(e.id, e);
      }
      setSequence([...merged.values()].sort((a, b) => a.time - b.time));
      setState({
        status: 'live',
        message: added
          ? `Live: ${fetched.length} events, ${added} new`
          : `Live: ${fetched.length} events, no change`,
        at: Date.now(),
      });
    } catch (err) {
      setState({
        status: 'error',
        message: `Live query failed (${err.message}) — showing the bundled snapshot`,
      });
    }
  }, [sequence, epicentre]);

  return { sequence, state, refresh };
}

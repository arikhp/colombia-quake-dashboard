import React, { useEffect, useState } from 'react';
import usgs from './data/usgs.generated.js';
import * as impactData from './data/impact.js';
import { useLiveSequence } from './lib/live.js';
import { Pill } from './components/ui.jsx';
import { cot, int, dec, utc } from './lib/format.js';
import { haversineKm } from './lib/geo.js';
import OverviewView from './views/OverviewView.jsx';
import MapView from './views/MapView.jsx';
import CaliView from './views/CaliView.jsx';
import PereiraView from './views/PereiraView.jsx';
import ImpactView from './views/ImpactView.jsx';
import SeismologyView from './views/SeismologyView.jsx';
import LossView from './views/LossView.jsx';
import ResponseView from './views/ResponseView.jsx';
import SourcesView from './views/SourcesView.jsx';

const impact = {
  asOf: impactData.asOf,
  national: impactData.national,
  caliOfficial: impactData.caliOfficial,
  caliProgression: impactData.caliProgression,
  pereira: impactData.pereira,
  pereiraProgression: impactData.pereiraProgression,
  departmentFiguresBasis: impactData.departmentFiguresBasis,
  infrastructure: impactData.infrastructure,
  byDepartment: impactData.byDepartment,
  cali: impactData.cali,
  tollTimeline: impactData.tollTimeline,
  costEstimates: impactData.costEstimates,
  responseTimeline: impactData.responseTimeline,
  aid: impactData.aid,
  sarTeams: impactData.sarTeams,
  secondaryEffects: impactData.secondaryEffects,
  sources: impactData.sources,
};

const TABS = [
  { id: 'overview', label: 'Overview', render: (p) => <OverviewView {...p} /> },
  { id: 'map', label: 'Map & shaking', render: (p) => <MapView {...p} /> },
  { id: 'cali', label: 'Cali', render: (p) => <CaliView {...p} /> },
  { id: 'pereira', label: 'Pereira', render: (p) => <PereiraView {...p} /> },
  { id: 'impact', label: 'National impact', render: (p) => <ImpactView {...p} /> },
  { id: 'seismology', label: 'Seismology', render: (p) => <SeismologyView {...p} /> },
  { id: 'loss', label: 'Loss modelling', render: (p) => <LossView {...p} /> },
  { id: 'response', label: 'Response & aid', render: (p) => <ResponseView {...p} /> },
  { id: 'sources', label: 'Sources & method', render: (p) => <SourcesView {...p} /> },
];

const caliDistanceKm = Math.round(haversineKm(usgs.event.lat, usgs.event.lon, 3.4372, -76.5225));
const pereiraCityForMasthead = usgs.cities.find((c) => c.name === 'Pereira');
const pereiraDistanceKm = pereiraCityForMasthead
  ? Math.round(haversineKm(usgs.event.lat, usgs.event.lon, pereiraCityForMasthead.lat, pereiraCityForMasthead.lon))
  : null;

const tabFromHash = () => {
  const id = window.location.hash.replace('#', '');
  return TABS.some((t) => t.id === id) ? id : 'overview';
};

export default function App() {
  const [tab, setTab] = useState(tabFromHash);
  const { sequence, state: live, refresh } = useLiveSequence(usgs.sequence, {
    lat: usgs.event.lat,
    lon: usgs.event.lon,
  });

  // Deep links: each section is addressable, and the back button works.
  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const active = TABS.find((t) => t.id === tab) || TABS[0];
  const viewProps = { data: { ...usgs, sequence }, impact, sequence, live, onRefresh: refresh };

  return (
    <div className="shell">
      <header className="masthead">
        <div>
          <div className="kicker">
            <span>Situation dashboard</span>
            <Pill tone="red">Red alert</Pill>
          </div>
          <h1>
            Mw {dec(usgs.event.magnitude, 1)} Colombia earthquake — Chocó epicentre, Cali impact
          </h1>
          <p className="sub">
            10 August 2026, {cot(usgs.event.originTimeUTC, false)}. A {dec(usgs.event.depth, 0)} km deep rupture
            beneath Chocó that killed {int(impactData.national.deaths)} people across twelve departments, with the
            heaviest urban losses {caliDistanceKm} km away in Cali, plus Pereira{pereiraDistanceKm ? `, just ${pereiraDistanceKm} km from the epicentre,` : ''} among the hardest hit.
          </p>
        </div>
        <div className="masthead-right">
          <Pill tone="orange code">USGS {usgs.event.id}</Pill>
          <span style={{ fontSize: 11.5, color: 'var(--dim)', fontFamily: 'var(--mono)' }}>
            data snapshot {utc(new Date(usgs.generatedAt).getTime())}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--dim)' }}>reported figures as of {impactData.asOf}</span>
        </div>
      </header>

      <nav className="tabs" role="tablist" aria-label="Dashboard sections">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === tab}
            className="tab"
            onClick={() => {
              window.location.hash = t.id;
              setTab(t.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="tab-idx">{String(i + 1).padStart(2, '0')}</span>
            {t.label}
          </button>
        ))}
      </nav>

      <main role="tabpanel" aria-label={active.label}>
        {active.render(viewProps)}
      </main>

      <footer className="foot">
        <span>
          Built from USGS ComCat event <span className="mono">{usgs.event.id}</span> (ShakeMap, PAGER, moment
          tensor, finite-fault and ground-failure products) plus attributed news reporting.
        </span>
        <span>Not an official source. For assistance contact the UNGRD or the Colombian Red Cross.</span>
      </footer>
    </div>
  );
}

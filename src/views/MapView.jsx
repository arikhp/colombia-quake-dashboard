import React, { useMemo, useState } from 'react';
import QuakeMap from '../components/QuakeMap.jsx';
import { Card, Table, DefList, ToggleGroup } from '../components/ui.jsx';
import { int, dec, roman, mmiColor, MMI_LABELS, compact } from '../lib/format.js';
import { haversineKm, hypocentralKm } from '../lib/geo.js';

export default function MapView({ data, impact }) {
  const { event, cities, shakemap } = data;
  const [sort, setSort] = useState('mmi');

  const ranked = useMemo(() => {
    const withDistance = cities.map((c) => ({
      ...c,
      surfaceKm: Math.round(haversineKm(event.lat, event.lon, c.lat, c.lon)),
      hypoKm: Math.round(hypocentralKm(event.lat, event.lon, c.lat, c.lon, event.depth)),
    }));
    const cmp = {
      mmi: (a, b) => b.mmi - a.mmi,
      pop: (a, b) => b.pop - a.pop,
      distance: (a, b) => a.surfaceKm - b.surfaceKm,
    }[sort];
    return withDistance.sort(cmp).slice(0, 24);
  }, [cities, event, sort]);

  const contourValues = data.mmiContours.map((c) => c.value);
  const contourNote = `MMI ${contourValues[0]}–${contourValues[contourValues.length - 1]} in half steps`;

  return (
    <div className="view">
      <Card
        title="Shaking intensity and impact"
        hint={`ShakeMap v${shakemap.version} contours · ${data.departments.length} departments · ${cities.length} places`}
        bodyClass="flush"
      >
        <div style={{ padding: '4px 8px 8px' }}>
          <QuakeMap data={data} impact={impact} />
        </div>
      </Card>

      <div className="grid g-2-1">
        <Card title="Populated places by modelled intensity" hint="top 24">
          <div style={{ marginBottom: 10 }}>
            <ToggleGroup
              label="Sort"
              value={sort}
              onChange={setSort}
              options={[
                { value: 'mmi', label: 'Intensity' },
                { value: 'pop', label: 'Population' },
                { value: 'distance', label: 'Distance' },
              ]}
            />
          </div>
          <Table
            rows={ranked}
            rowKey={(r) => r.name}
            columns={[
              {
                key: 'name',
                label: 'Place',
                render: (r) => (
                  <span style={{ fontWeight: r.name === 'Cali' ? 700 : 500 }}>
                    {r.name}
                    {r.capital && <span style={{ color: 'var(--dim)', fontSize: 11 }}> · capital</span>}
                  </span>
                ),
              },
              { key: 'pop', label: 'Population', num: true, render: (r) => int(r.pop) },
              {
                key: 'mmi',
                label: 'Intensity',
                num: true,
                render: (r) => (
                  <span style={{ color: mmiColor(r.mmi), fontWeight: 700 }}>
                    {roman(r.mmi)} <span style={{ color: 'var(--dim)', fontWeight: 400 }}>{dec(r.mmi, 2)}</span>
                  </span>
                ),
              },
              {
                key: 'shaking',
                label: 'Shaking',
                render: (r) => (
                  <span style={{ color: 'var(--muted)', fontSize: 12.5 }}>{MMI_LABELS[Math.round(r.mmi)]}</span>
                ),
              },
              { key: 'surfaceKm', label: 'Epicentral', num: true, render: (r) => `${int(r.surfaceKm)} km` },
              { key: 'hypoKm', label: 'Hypocentral', num: true, render: (r) => `${int(r.hypoKm)} km` },
            ]}
          />
          <div className="note">
            Intensity is the ShakeMap modelled value at the town centre, not a measurement in every town. The two
            distance columns explain the damage pattern: because the rupture was {dec(event.depth, 0)} km down,
            somewhere 100 km away at the surface is still only{' '}
            {Math.round(Math.hypot(100, event.depth))} km from the rupture, so shaking falls off slowly with
            map distance.
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="Cali in context" hint="the focus of this dashboard">
            <DefList
              rows={[
                ['Distance from epicentre', `${Math.round(haversineKm(event.lat, event.lon, 3.4372, -76.5225))} km`],
                ['Distance from hypocentre', `${Math.round(hypocentralKm(event.lat, event.lon, 3.4372, -76.5225, event.depth))} km`],
                ['Modelled intensity', (() => { const c = cities.find((x) => x.name === 'Cali'); return c ? `${roman(c.mmi)} (${dec(c.mmi, 2)})` : '—'; })()],
                ['Population', int(impact.cali.population)],
                ['Deaths (official, 18 Aug)', int(impact.cali.deaths)],
                ['Verified total collapses', int(impact.cali.buildingsCollapsed)],
                ['Verified partial collapses', int(impact.cali.partialCollapse)],
              ]}
            />
            <div className="note">
              Cali is not the closest large city to the epicentre — Pereira and Quibdó are closer — but it is by
              far the largest, and its share of the national death toll ({Math.round((impact.cali.deaths / impact.national.deaths) * 100)}%)
              reflects population as much as shaking.
            </div>
          </Card>

          <Card title="Map contents" hint="what you are looking at">
            <DefList
              rows={[
                ['Intensity contours', `${contourValues.length} lines, ${contourNote}`],
                ['Peak modelled MMI', `${roman(shakemap.maxMMI)} (${dec(shakemap.maxMMI, 2)})`],
                ['ShakeMap footprint', `${dec(shakemap.bbox[1], 1)}°–${dec(shakemap.bbox[3], 1)}°N`],
                ['Ground-motion conversion', shakemap.gmice],
                ['ShakeMap code', `v${shakemap.codeVersion}`],
                ['Boundaries', `${data.departments.length} departments, simplified`],
              ]}
            />
            <div className="note">
              Contours are the published ShakeMap MMI lines, simplified to about 100 m precision so the whole
              map fits in a single offline file.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

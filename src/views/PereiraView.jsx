import React from 'react';
import { Card, Kpi, DefList, Callout, Pill } from '../components/ui.jsx';
import { BarList } from '../components/charts.jsx';
import { Table } from '../components/ui.jsx';
import { int, dec, roman } from '../lib/format.js';
import { haversineKm } from '../lib/geo.js';

export default function PereiraView({ data, impact }) {
  const { pereira, pereiraProgression, national } = impact;
  const { event, cities } = data;
  const pereiraCity = cities.find((c) => c.name === 'Pereira');
  const distance = pereiraCity ? Math.round(haversineKm(event.lat, event.lon, pereiraCity.lat, pereiraCity.lon)) : null;

  const shareOfDeaths = (pereira.deaths / national.deaths) * 100;
  const first = pereiraProgression[0];
  const latest = pereiraProgression[pereiraProgression.length - 1];

  return (
    <div className="view">
      <Callout title="Source" tone="amber">
        {pereira.sourceNote}
      </Callout>

      <div className="grid g4">
        <Kpi label="Deaths in Pereira" value={int(pereira.deaths)} foot={`${dec(shareOfDeaths, 0)}% of the national toll`} edge="var(--red)" tone="red" />
        <Kpi label="Buildings collapsed" value={int(pereira.buildingsCollapsed)} foot={`${pereira.buildingsWithPeopleTrapped} with people trapped inside`} edge="var(--amber)" tone="amber" />
        <Kpi label="Airport deaths" value={int(pereira.airportDeaths)} foot="Matecaña International Airport" edge="var(--muted)" />
        <Kpi label="Population" value={int(pereira.population)} foot={pereiraCity ? `${distance} km from the epicentre` : 'city of Pereira'} edge="var(--blue)" tone="blue" />
      </div>

      <div className="grid g-3-2">
        <Card title="What happened in Pereira" hint={distance ? `${distance} km from the epicentre` : undefined}>
          <div className="prose">
            <p>
              Pereira was the second-deadliest city in the disaster despite sitting closer to the epicentre than
              Cali. At least <strong>{int(pereira.deaths)} people died</strong> and{' '}
              <strong>{int(pereira.buildingsCollapsed)} buildings collapsed</strong>, {pereira.buildingsWithPeopleTrapped}{' '}
              of them with people trapped inside in the immediate aftermath.
            </p>
            <p>
              The single deadliest known site was <strong>Matecaña International Airport</strong>, where sections
              of the terminal ceiling and interior structure came down onto passenger and commercial areas,
              killing three people. Commercial flights were suspended by the Colombian Civil Aviation Authority
              pending a structural inspection, one of six airports grounded nationwide. Some residents were also
              left trapped inside the city's aerial cable cars when the shaking hit.
            </p>
            <p>
              Unlike Cali, Pereira's city government has not published a numbered situation report with
              building-by-building verification. The figures on this page are the settled totals from press and
              wire coverage, so they carry less certainty than the Cali tab's official figures.
            </p>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="What is known to be damaged" hint="from press reporting">
            <DefList
              rows={[
                ['Buildings collapsed', int(pereira.buildingsCollapsed)],
                ['Buildings with people trapped', int(pereira.buildingsWithPeopleTrapped)],
                ['Deaths at Matecaña airport', int(pereira.airportDeaths)],
                ['Aerial cable car', 'passengers trapped, suspended for inspection'],
              ]}
            />
            <div className="note">
              No formal building-inspection tally like Cali's has been published for Pereira, so there is no
              partial-collapse or structural-damage count to show here.
            </div>
          </Card>

          <Card title="Health system response">
            <Callout title="Advisory" tone="amber">
              {pereira.healthSystem.alert}
            </Callout>
            <div className="note">{pereira.healthSystem.note}</div>
          </Card>
        </div>
      </div>

      <Card title="How Pereira's death toll was first reported" hint="same-day report to settled figure">
        <Table
          rows={pereiraProgression}
          rowKey={(r) => r.asOf}
          columns={[
            { key: 'label', label: 'Cut-off' },
            { key: 'deaths', label: 'Deaths', num: true, render: (r) => int(r.deaths) },
            { key: 'source', label: 'Source', wrap: true },
          ]}
        />
        <div className="note">
          The mayor's first same-day figure of {first.deaths} was roughly a fifth of the eventual toll of{' '}
          {latest.deaths} — a wider first-day undercount than Cali saw. As in Cali, the gap reflects how long it
          takes to move from an early, partial count to a verified one, not a change in what happened.
        </div>
      </Card>

      <div className="grid g-1-2">
        <Card title="Named sites damaged" hint="most severe first">
          {pereira.landmarks.map((lm) => (
            <div className={`landmark ${lm.status}`} key={lm.name}>
              <div className="lm-bar" />
              <div>
                <div className="lm-name">
                  {lm.name}{' '}
                  <Pill tone={lm.status === 'critical' ? 'red' : 'amber'} dot={false}>
                    {lm.status}
                  </Pill>
                </div>
                <div className="lm-detail">{lm.detail}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card title="Response measures in Pereira">
          <ul className="checklist">
            {pereira.responseMeasures.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Pereira in context" hint="compared with Cali, the dashboard's other focus city">
        <BarList
          items={[
            { label: 'Pereira', value: pereira.deaths, note: `${int(pereira.deaths)} deaths` },
            { label: 'Cali', value: impact.cali.deaths, note: `${int(impact.cali.deaths)} deaths` },
          ]}
          color="var(--red)"
        />
        <div className="note">
          Pereira sits {distance ? `${distance} km` : 'a shorter distance'} from the epicentre —{' '}
          {pereiraCity ? `modelled intensity ${roman(pereiraCity.mmi)} (${dec(pereiraCity.mmi, 2)})` : 'severe shaking'}{' '}
          — noticeably closer than Cali, yet recorded fewer deaths and a smaller, less-verified damage count. That
          is consistent with Cali's larger population and older mid-rise building stock, but it is also partly an
          artefact of reporting depth: Pereira lacks an equivalent to Cali's official report #016, so its true
          figures may be underestimated here.
        </div>
      </Card>
    </div>
  );
}

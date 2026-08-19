import React from 'react';
import { Card, Kpi, DefList, Callout, Pill, Table } from '../components/ui.jsx';
import { BarList } from '../components/charts.jsx';
import { int, dec, usd, roman } from '../lib/format.js';
import { haversineKm } from '../lib/geo.js';

export default function CaliView({ data, impact }) {
  const { cali, caliOfficial, caliProgression, national } = impact;
  const { event, cities } = data;
  const caliCity = cities.find((c) => c.name === 'Cali');
  const distance = Math.round(haversineKm(event.lat, event.lon, 3.4372, -76.5225));

  const shareOfDeaths = (cali.deaths / national.deaths) * 100;
  const valle = impact.byDepartment.find((d) => d.department === 'Valle del Cauca');
  const first = caliProgression[0];
  const latest = caliProgression[caliProgression.length - 1];

  return (
    <div className="view">
      <Callout title="Source">
        Every figure on this page is from <strong>{caliOfficial.source}</strong>, cut at{' '}
        <strong>{caliOfficial.asOf}</strong>. It supersedes the earlier press figures, which were roughly a third
        of the eventual death toll.
      </Callout>

      <div className="grid g4">
        <Kpi label="Deaths in Cali" value={int(cali.deaths)} foot={`${dec(shareOfDeaths, 0)}% of the national toll`} edge="var(--red)" tone="red" />
        <Kpi label="Injured" value={int(cali.injured)} foot={`up from ${int(first.injured)} on 11 August`} edge="var(--accent)" tone="accent" />
        <Kpi label="Still missing" value={int(cali.missing)} foot={`down from ${int(first.missing)} after record checks`} edge="var(--amber)" tone="amber" />
        <Kpi label="Rescued alive" value={int(caliOfficial.people.rescued)} foot="pulled from the rubble" edge="var(--green)" tone="green" />
      </div>

      <div className="grid g-3-2">
        <Card title="What happened in Cali" hint={`${distance} km from the epicentre`}>
          <div className="prose">
            <p>
              Cali sits <strong>{distance} km south of the epicentre</strong> in the Cauca valley, and
              nonetheless became the deadliest single city in the disaster. Three things combined: the rupture was
              deep enough that distance offered little protection, the valley's soft sediments amplify
              long-period shaking, and the city holds 2.2 million people in a building stock that includes a lot
              of mid-rise reinforced concrete from before modern seismic codes.
            </p>
            <p>
              The collapses concentrated in a band of central and southern neighbourhoods — El Lido, Tequendama,
              El Refugio, El Limonar, Pampalinda and others. Of{' '}
              <strong>{int(caliOfficial.infrastructure.buildingsVerified)} buildings formally inspected</strong>,{' '}
              {caliOfficial.infrastructure.totalCollapseVerified} had collapsed completely,{' '}
              {caliOfficial.infrastructure.partialCollapseVerified} partially, and{' '}
              {caliOfficial.infrastructure.structuralDamageVerified} were left with structural damage. Rescuers
              pulled <strong>{caliOfficial.people.rescued} people out alive</strong>.
            </p>
            <p>
              The most consequential single failure was the <strong>University Hospital of Valle</strong>: part of
              its upper floors collapsed, 70% of its infrastructure was damaged, and 800 patients had to be
              evacuated and treated in the open. Six of them died. With four major hospitals and six clinics out
              of service and public hospitals at 100% capacity, the city declared a hospital red alert on day
              one.
            </p>
          </div>
          <div className="note">
            {int(caliOfficial.people.bodiesReturnedToFamilies)} of the {int(cali.deaths)} bodies had been
            identified and returned to families as of {caliOfficial.asOf}.
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="Verified building damage" hint="official inspections">
            <DefList
              rows={[
                ['Citizen reports processed', int(caliOfficial.infrastructure.citizenReportsProcessed)],
                ['Buildings formally verified', int(caliOfficial.infrastructure.buildingsVerified)],
                ['Total collapse', int(caliOfficial.infrastructure.totalCollapseVerified)],
                ['Partial collapse', int(caliOfficial.infrastructure.partialCollapseVerified)],
                ['Structural damage', int(caliOfficial.infrastructure.structuralDamageVerified)],
                ['Hospitals damaged', int(cali.hospitalsDamaged)],
              ]}
            />
            <div className="note">
              Only {dec((caliOfficial.infrastructure.buildingsVerified / caliOfficial.infrastructure.citizenReportsProcessed) * 100, 0)}%
              of the {int(caliOfficial.infrastructure.citizenReportsProcessed)} citizen damage reports had been
              converted into a completed inspection at the cut-off, so the verified counts are a floor, not a
              total.
            </div>
          </Card>

          <Card title="Response effort" hint="cumulative">
            <DefList
              rows={[
                ['Debris removed', `${int(caliOfficial.operations.debrisRemovedTonnes)} t`],
                ['Damage & needs assessments', int(caliOfficial.operations.damageNeedsAssessments)],
                ['Personnel active', int(caliOfficial.operations.activePersonnel)],
                ['Animals rescued', int(caliOfficial.operations.animalsRescued)],
              ]}
            />
            <div className="note">{caliOfficial.notes[1]}</div>
          </Card>
        </div>
      </div>

      <Card title="How Cali's own numbers changed" hint="first update to official report">
        <Table
          rows={caliProgression}
          rowKey={(r) => r.asOf}
          columns={[
            { key: 'label', label: 'Cut-off' },
            { key: 'deaths', label: 'Deaths', num: true, render: (r) => int(r.deaths) },
            { key: 'injured', label: 'Injured', num: true, render: (r) => int(r.injured) },
            { key: 'missing', label: 'Missing', num: true, render: (r) => int(r.missing) },
            { key: 'trapped', label: 'Trapped', num: true, render: (r) => (r.trapped == null ? '—' : int(r.trapped)) },
            { key: 'collapsed', label: 'Collapsed', num: true, render: (r) => int(r.collapsed) },
            { key: 'source', label: 'Source', wrap: true },
          ]}
        />
        <div className="note">
          Three different quantities moved in three different directions. Deaths and injuries rose as buildings
          were cleared — deaths by {dec(((latest.deaths - first.deaths) / first.deaths) * 100, 0)}% over seven
          days. The missing count fell from {first.missing} to {latest.missing}, not because people were found
          dead but because duplicate and unverified reports were removed: {caliOfficial.notes[0]} The collapsed
          building count fell from 45 to {latest.collapsed} because the later figure counts only{' '}
          <em>verified total</em> collapses, with partial collapses reported separately.
        </div>
      </Card>

      <div className="grid g-1-2">
        <Card title="Neighbourhoods with complete building collapse" hint={`${cali.neighbourhoodsWithCollapse.length} barrios`}>
          <div className="chips">
            {cali.neighbourhoodsWithCollapse.map((n) => (
              <span className="chip hot" key={n}>
                {n}
              </span>
            ))}
          </div>
          <div className="note">
            These are largely central and southern middle-class barrios with mid-rise apartment blocks, which is
            why the collapses produced so many trapped-person incidents relative to the number of buildings
            involved.
          </div>
        </Card>

        <Card title="Named sites damaged" hint="critical sites first">
          {cali.landmarks.map((lm) => (
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
      </div>

      <div className="grid g-1-2">
        <Card title="Health system response" hint="how the city avoided a second disaster">
          <Callout title="Red alert" tone="red">
            {cali.healthSystem.alert}
          </Callout>
          <p className="prose" style={{ marginTop: 12 }}>
            {cali.healthSystem.adaptation}
          </p>
          <div className="note">
            Cali's public health secretary described the approach as creating "expansion zones" around the
            institutions that survived, rather than trying to restore the damaged ones mid-emergency.
          </div>
        </Card>

        <Card title="Emergency measures taken in Cali">
          <ul className="checklist">
            {cali.responseMeasures.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid g-2-1">
        <Card title="Valle del Cauca beyond Cali" hint="mixed vintages — see note">
          <BarList
            items={valle.cities.map((c) => ({ label: c.city, value: c.deaths || 0, note: c.note }))}
            color="var(--red)"
          />
          <div className="note">
            The department-wide total of {int(valle.deaths)} deaths dates from mid-August reporting and is now{' '}
            <em>lower</em> than Cali's own official figure of {int(cali.deaths)} inside it, because the
            department number has not been restated. Treat {int(cali.deaths)} as the floor for the department. In
            Calima, four of the dead were children in the partially collapsed Gimnasio Calima school.
          </div>
        </Card>

        <Card title="Reconstruction" hint="city government, 16 Aug">
          <div className="grid g2" style={{ gap: 12 }}>
            <Kpi label="Estimated cost" value={usd(cali.rebuildCostUSD)} foot="Cali alone" edge="var(--blue)" tone="blue" />
            <Kpi label="Estimated time" value={int(cali.rebuildYears)} unit="years" foot="city estimate" edge="var(--blue)" tone="blue" />
          </div>
          <div className="note">
            Modelled shaking in the city was intensity{' '}
            {caliCity ? `${roman(caliCity.mmi)} (${dec(caliCity.mmi, 2)})` : '—'} — "very strong" — against a
            peak of VIII closer to the epicentre.
          </div>
        </Card>
      </div>
    </div>
  );
}

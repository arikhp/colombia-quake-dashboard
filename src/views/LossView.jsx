import React from 'react';
import { Card, Kpi, DefList, Callout, AlertPill, Table } from '../components/ui.jsx';
import { ProbabilityBins, CostRangeChart, HistoricalChart, BarList } from '../components/charts.jsx';
import { int, dec, usd, compact, pct, roman, mmiColor } from '../lib/format.js';

/** Human-readable names for the PAGER building-type codes. */
const BUILDING_TYPES = {
  M2: 'Adobe / mud wall with wood',
  C1: 'Concrete moment frame',
  C2: 'Concrete shear wall',
  C2M: 'Concrete shear wall, mid-rise',
  C3: 'Concrete frame with masonry infill',
  UFB3: 'Unreinforced brick masonry',
  UCB: 'Unreinforced concrete block',
  S5: 'Steel frame with masonry infill',
  UNK: 'Unknown / miscellaneous',
};

export default function LossView({ data, impact }) {
  const { pager, groundFailure, event } = data;
  const { costEstimates, national } = impact;

  const historical = pager.historical.map((h) => ({
    ...h,
    label: `${new Date(h.time).getUTCFullYear()} M${h.magnitude}`,
  }));
  const current = {
    label: '2026 (this event)',
    magnitude: event.magnitude,
    deaths: national.deaths,
    depth: event.depth,
  };

  const totalExposed = pager.populationExposure.reduce((a, d) => a + d.population, 0);

  return (
    <div className="view">
      <Callout title="What this section is" tone="">
        Everything here is <strong>model output produced within hours of the earthquake</strong>, before anyone
        had counted anything. It is shown next to the eventual reported figures so you can see how well the
        rapid estimates held up — which is the only honest way to read a loss model.
      </Callout>

      <div className="grid g4">
        <Kpi label="PAGER fatality estimate" value={int(pager.estimates.empiricalFatalities)} foot={`actual reported: ${int(national.deaths)}`} edge="var(--accent)" tone="accent" />
        <Kpi label="Semi-empirical estimate" value={int(pager.estimates.semiEmpiricalFatalities)} foot="building-inventory method" edge="var(--amber)" tone="amber" />
        <Kpi label="PAGER economic estimate" value={usd(pager.estimates.empiricalEconomicUSD)} foot={`official estimate: ${usd(9.6e9)}`} edge="var(--blue)" tone="blue" />
        <Kpi label="People who felt it" value={compact(totalExposed)} foot="intensity III or above" edge="var(--muted)" />
      </div>

      <div className="grid g2">
        <Card title="Probability of the fatality total" hint={`alert level: ${pager.alertBins.fatality.level}`}>
          <ProbabilityBins bins={pager.alertBins.fatality.bins} unitLabel="fatalities" />
          <div className="note">
            The model gave{' '}
            <strong>{pct(pager.alertBins.fatality.bins.find((b) => b.min === '100').probability, 0)}</strong> to the
            100–1,000 band and{' '}
            <strong>{pct(pager.alertBins.fatality.bins.find((b) => b.min === '1000').probability, 0)}</strong> to
            1,000–10,000. The reported total of {int(national.deaths)} landed in the most likely band — but note
            that the two bands were near enough to a coin flip, which is exactly the uncertainty an orange alert
            is meant to convey.
          </div>
        </Card>

        <Card title="Probability of the economic loss" hint={`alert level: ${pager.alertBins.economic.level}`}>
          <ProbabilityBins bins={pager.alertBins.economic.bins} unitLabel="losses (US$ millions)" />
          <div className="note">
            {pager.comments.impact1}
          </div>
        </Card>
      </div>

      <Card title="Damage estimates disagree by a factor of 40" hint="all published within 8 days">
        <CostRangeChart items={costEstimates} />
        <div className="note">
          These are not all measuring the same thing. Oxford Economics estimated <em>direct</em> damage;
          the government's 30-trillion-peso figure is a reconstruction programme; the USGS headline figure
          is a modelled total economic loss including indirect effects. When a single number is quoted for a
          disaster this size, the definition matters more than the digits.
        </div>
      </Card>

      <div className="grid g2">
        <Card title="Which buildings the model expected to kill people" hint="semi-empirical, residential, Colombia">
          <BarList
            items={pager.buildingTypeFatalities.map((d) => ({
              label: BUILDING_TYPES[d.code] || d.code,
              value: d.value,
              color: d.code === 'M2' ? 'var(--red)' : 'var(--accent)',
            }))}
          />
          <div className="note">{pager.comments.struct_comment}</div>
        </Card>

        <Card title="Compared with past earthquakes nearby" hint="USGS PAGER historical catalogue">
          <HistoricalChart events={historical} current={current} />
          <div className="note">{pager.comments.historical_comment}</div>
        </Card>
      </div>

      <div className="grid g2">
        <Card title="Secondary hazard models" hint="run on ShakeMap v6">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <HazardBlock
              name="Liquefaction"
              level={groundFailure.liquefaction.alert}
              exposed={groundFailure.liquefaction.populationExposed}
              range={groundFailure.liquefaction.populationRange1std}
              model="Zhu et al. (2017), general model"
            />
            <HazardBlock
              name="Landslide"
              level={groundFailure.landslide.alert}
              exposed={groundFailure.landslide.populationExposed}
              range={groundFailure.landslide.populationRange1std}
              model="Jessee et al. (2018)"
            />
          </div>
          <div className="note">{pager.comments.secondary_comment}</div>
        </Card>

        <Card title="Exposure by country" hint="people who felt intensity III or above">
          <Table
            rows={pager.countryExposure.filter((c) => c.total > 0)}
            rowKey={(r) => r.country}
            columns={[
              {
                key: 'country',
                label: 'Country',
                render: (r) => ({ CO: 'Colombia', EC: 'Ecuador', PA: 'Panama' }[r.country] || r.country),
              },
              { key: 'total', label: 'People', num: true, render: (r) => int(r.total) },
              {
                key: 'peak',
                label: 'Peak intensity',
                num: true,
                render: (r) => {
                  const peak = r.byMMI.reduce((acc, v, i) => (v > 0 ? i + 1 : acc), 0);
                  return <span style={{ color: mmiColor(peak), fontWeight: 700 }}>{roman(peak)}</span>;
                },
              },
            ]}
          />
          <div className="note">
            Shaking crossed both borders. Panama City suspended two metro lines for structural inspection and
            Ecuador reported damage to six homes — a reminder of how far a {dec(event.depth, 0)} km deep M
            {dec(event.magnitude, 1)} reaches.
          </div>
        </Card>
      </div>

      <Card title="Model versus outcome" hint="the scoreboard">
        <DefList
          rows={[
            ['PAGER empirical fatalities', `${int(pager.estimates.empiricalFatalities)} vs ${int(national.deaths)} reported`],
            ['PAGER semi-empirical fatalities', `${int(pager.estimates.semiEmpiricalFatalities)} vs ${int(national.deaths)} reported`],
            ['PAGER economic loss', `${usd(pager.estimates.empiricalEconomicUSD)} vs ${usd(9.6e9)} official`],
            ['Maximum modelled intensity', `${roman(data.shakemap.maxMMI)} — matched by observed damage`],
            ['Alert level issued', `${pager.alertLevel.toUpperCase()} (economic), ${pager.alertBins.fatality.level.toUpperCase()} (fatalities)`],
          ]}
        />
        <div className="note">
          The empirical fatality model overshot by roughly a factor of three and the semi-empirical model by
          eleven; the economic model landed within the spread of the published estimates. Both fatality models
          assume regional building vulnerability rather than local enforcement of the seismic code, which is the
          usual reason they run high in Colombian cities.
        </div>
      </Card>
    </div>
  );
}

function HazardBlock({ name, level, exposed, range, model }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
        <AlertPill level={level}>{level}</AlertPill>
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{name}</span>
      </div>
      <DefList
        rows={[
          ['Population in hazard area', compact(exposed)],
          range ? ['One-sigma range', `${compact(range[0])} – ${compact(range[1])}`] : null,
          ['Model', model],
        ]}
      />
    </div>
  );
}

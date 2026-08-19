import React, { useMemo, useState } from 'react';
import { Card, Kpi, Timeline, Table, ToggleGroup, Callout, Pill } from '../components/ui.jsx';
import { BarList } from '../components/charts.jsx';
import { usd, int, dayLabel } from '../lib/format.js';

export default function ResponseView({ impact }) {
  const { responseTimeline, aid, sarTeams, cali } = impact;
  const [origin, setOrigin] = useState('all');

  const filteredAid = useMemo(
    () => (origin === 'all' ? aid : aid.filter((a) => a.origin === origin)),
    [aid, origin]
  );

  const totals = useMemo(() => {
    const by = {};
    for (const a of aid) by[a.origin] = (by[a.origin] || 0) + a.amountUSD;
    return by;
  }, [aid]);

  const totalAid = aid.reduce((a, d) => a + d.amountUSD, 0);

  return (
    <div className="view">
      <div className="grid g4">
        <Kpi label="Pledged aid tracked" value={usd(totalAid)} foot={`${aid.length} named sources`} edge="var(--green)" tone="green" />
        <Kpi label="Multilateral" value={usd(totals.multilateral)} foot="World Bank, EU" edge="var(--blue)" tone="blue" />
        <Kpi label="Domestic private" value={usd(totals.domestic)} foot="ANDI, family groups, artists" edge="var(--accent)" tone="accent" />
        <Kpi label="SAR teams requested" value={int(sarTeams.filter((t) => t.status === 'requested').length)} foot="of many more offered" edge="var(--amber)" tone="amber" />
      </div>

      <div className="grid g-3-2">
        <Card title="Chronology of the response" hint="10–17 August 2026">
          <Timeline
            items={responseTimeline.map((t) => ({
              when: dayLabel(t.date),
              actor: t.actor,
              text: t.text,
            }))}
          />
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="Financial pledges" hint="US$ equivalent · log scale">
            <div style={{ marginBottom: 10 }}>
              <ToggleGroup
                label="Origin"
                value={origin}
                onChange={setOrigin}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'multilateral', label: 'Multilateral' },
                  { value: 'domestic', label: 'Domestic' },
                  { value: 'international', label: 'International' },
                  { value: 'individual', label: 'Individual' },
                ]}
              />
            </div>
            <BarList
              items={filteredAid.map((a) => ({
                label: a.donor,
                value: a.amountUSD,
                note: `${a.donor}: ${a.kind}`,
                color:
                  a.origin === 'multilateral'
                    ? 'var(--blue)'
                    : a.origin === 'domestic'
                    ? 'var(--accent)'
                    : a.origin === 'individual'
                    ? 'var(--violet)'
                    : 'var(--green)',
              }))}
              format={usd}
              scale="log"
            />
            <div className="note">
              Colombia's own private sector pledged more than every foreign government combined. Material aid —
              food, water, generators, construction equipment, mattresses — is not in this chart and was
              reportedly the binding constraint early on: food donations were abundant while mattresses,
              blankets and generators were short.
            </div>
          </Card>

          <Card title="Cali-specific measures">
            <ul className="checklist">
              {cali.responseMeasures.slice(0, 5).map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card title="Search and rescue teams" hint="who was let in, and who was not">
        <Table
          rows={sarTeams}
          rowKey={(r) => r.country}
          columns={[
            { key: 'country', label: 'Country', width: '140px' },
            {
              key: 'status',
              label: 'Status',
              render: (r) => (
                <Pill tone={r.status === 'requested' ? 'green' : r.status === 'disputed' ? 'red' : 'blue'}>
                  {r.status}
                </Pill>
              ),
            },
            { key: 'detail', label: 'Detail', wrap: true },
          ]}
        />
        <Callout title="The aid controversy" tone="red">
          Colombia formally requested search-and-rescue teams from only four countries. On 13 August a leaked
          letter showed that the outgoing head of the disaster management agency, UNGRD, had rejected
          international rescue offers; he was removed the next day and may face criminal investigation. Mexico
          publicly disputed the government's explanation, saying its Topos de Tlatelolco team was already
          certified and had deployed in 98 countries. The government's position was that foreign help should
          focus on logistics and materials while rescue stayed with domestic teams, and Cali's mayor said the
          city wanted to "maximise its rescue capabilities before requesting international support."
        </Callout>
      </Card>

      <div className="grid g2">
        <Card title="What the response got right">
          <ul className="checklist">
            <li>A Unified Command Post was stood up on day one to deconflict dozens of simultaneous collapse sites</li>
            <li>Cali's health system created "expansion zones" instead of trying to restore damaged hospitals mid-crisis, and was described as stable within 72 hours</li>
            <li>Rescue windows were formally extended past the conventional 72 hours to 15 August, and a survivor was pulled out alive at 36 hours</li>
            <li>Domestic capital mobilised fast and at scale, dwarfing foreign government pledges</li>
            <li>Free satellite internet restored communications across five departments</li>
          </ul>
        </Card>
        <Card title="What went wrong">
          <ul className="checklist">
            <li>International rescue teams were turned away during the survival window by an official who had not been replaced during a contested transfer of power</li>
            <li>Residents protested at Cali's city hall over the absence of authorities in affected barrios</li>
            <li>Equipment shortages meant volunteers in Pereira and Chocó searched rubble by hand</li>
            <li>Looting reports forced curfews and the deployment of 1,000+ soldiers, diverting effort from rescue</li>
            <li>The reported death toll swung by more than 100 in both directions in the first 48 hours</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

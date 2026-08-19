import React from 'react';
import { alertColor } from '../lib/format.js';

export function Card({ title, hint, children, className = '', bodyClass = '', style }) {
  return (
    <section className={`card ${className}`} style={style}>
      {(title || hint) && (
        <header className="card-head">
          {title && <h3>{title}</h3>}
          {hint && <span className="hint">{hint}</span>}
        </header>
      )}
      <div className={`card-body ${bodyClass}`}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, unit, foot, tone = '', small }) {
  return (
    <div className={`stat ${tone}`}>
      <span className="label">{label}</span>
      <span className={`value ${small ? 'sm' : ''}`}>
        {value}
        {unit && <span className="unit">{unit}</span>}
      </span>
      {foot && <span className="foot">{foot}</span>}
    </div>
  );
}

export function Kpi({ label, value, unit, foot, tone = '', edge }) {
  return (
    <div className="kpi" style={{ '--edge': edge }}>
      <Stat label={label} value={value} unit={unit} foot={foot} tone={tone} />
    </div>
  );
}

export function Pill({ tone = 'dim', children, dot = true }) {
  return (
    <span className={`pill ${tone}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

/** PAGER-style alert badge; colour comes from the USGS alert level. */
export function AlertPill({ level, children }) {
  return (
    <span className="pill" style={{ color: alertColor(level), background: `${alertColor(level)}22` }}>
      <span className="dot" />
      {children || `${level} alert`}
    </span>
  );
}

export function DefList({ rows }) {
  return (
    <dl className="dl">
      {rows
        .filter(Boolean)
        .map(([term, value], i) => (
          <div className="dl-row" key={i}>
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
    </dl>
  );
}

export function Table({ columns, rows, rowKey }) {
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.num ? 'num' : ''} style={c.width ? { width: c.width } : undefined}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey ? rowKey(row, i) : i} className={row.__rowClass || ''}>
              {columns.map((c) => (
                <td key={c.key} className={[c.num ? 'num' : '', c.wrap ? 'wrap' : ''].join(' ').trim()}>
                  {c.render ? c.render(row, i) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Callout({ title, tone = '', children }) {
  return (
    <div className={`callout ${tone}`}>
      {title && <div className="ct">{title}</div>}
      {children}
    </div>
  );
}

export function Timeline({ items }) {
  return (
    <div className="timeline">
      {items.map((it, i) => (
        <div className="tl-item" key={i}>
          <div className="tl-when">{it.when}</div>
          <div className="tl-body">
            {it.actor && <div className="tl-actor">{it.actor}</div>}
            <div className="tl-text">{it.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ToggleGroup({ label, options, value, onChange }) {
  return (
    <div className="toolbar">
      {label && <span className="lbl">{label}</span>}
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`btn sm ${value === o.value ? 'on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

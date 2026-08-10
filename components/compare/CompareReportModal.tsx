'use client';

import { SystemGears } from '@/lib/compareCalcState';

export interface CompareReportData {
  a: SystemGears;
  b: SystemGears | null;
  wheelLabelA: string;
  wheelLabelB: string;
  svgHtml: string;
}

function sysLabelHtml(sys: SystemGears, wheel: string) {
  return (
    <>
      <strong>{sys.name}</strong> &nbsp;&middot;&nbsp; {sys.crLabel || `${sys.crOuter}T`} chainring &nbsp;&middot;&nbsp; {sys.cassLabel} cassette
      {wheel ? <> &nbsp;&middot;&nbsp; {wheel}</> : null}
    </>
  );
}

function SysTable({ sys, accentColor, label }: { sys: SystemGears; accentColor: string; label: string }) {
  const bigRev = [...sys.bigG].reverse();
  const smlRev = sys.isSingle || !sys.smallG ? null : [...sys.smallG].reverse();
  return (
    <>
      <div className="rpt-sys-label" style={{ color: accentColor }}>
        {label}
      </div>
      <table className="rpt-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Ring</th>
            {bigRev.map((_, i) => (
              <th key={i}>G{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="rpt-ring-lbl" style={{ color: accentColor }}>
              Big Ring
              <br />
              <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>{sys.crOuter}T ring</span>
            </td>
            {bigRev.map((g, i) => (
              <td key={i} className={g.cross ? 'cross' : ''}>
                <div className="rpt-cog">{g.cog}T</div>
                <div className="rpt-dev">{g.dev.toFixed(2)}m</div>
              </td>
            ))}
          </tr>
          {smlRev && (
            <tr>
              <td className="rpt-ring-lbl" style={{ color: accentColor }}>
                Small Ring
                <br />
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>{sys.crInner}T ring</span>
              </td>
              {smlRev.map((g, i) => (
                <td key={i} className={g.cross ? 'cross' : ''}>
                  <div className="rpt-cog">{g.cog}T</div>
                  <div className="rpt-dev">{g.dev.toFixed(2)}m</div>
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}

const LOGO_SVG = (
  <svg className="rpt-logo-dot" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <mask id="rdotm-cmp">
        <rect width="32" height="32" fill="white" />
        <text x="16" y="21" textAnchor="middle" fontFamily="Inter,system-ui,sans-serif" fontSize="11" fontWeight="900" letterSpacing="1.5" fill="black">
          DOT
        </text>
      </mask>
    </defs>
    <circle cx="16" cy="16" r="15" fill="#ef4444" mask="url(#rdotm-cmp)" />
  </svg>
);

export default function CompareReportModal({ data, onClose }: { data: CompareReportData; onClose: () => void }) {
  return (
    <div id="print-overlay" style={{ display: 'flex' }}>
      <div id="print-modal">
        <div id="print-report">
          <div className="rpt-header">
            <div className="rpt-logo">
              Polka
              {LOGO_SVG}
              Bike
            </div>
            <div className="rpt-heading">Groupset Comparison Report</div>
          </div>
          <div className="rpt-meta">
            <strong>System A:</strong> {sysLabelHtml(data.a, data.wheelLabelA)}
            <br />
            {data.b ? (
              <>
                <strong>System B:</strong> {sysLabelHtml(data.b, data.wheelLabelB)}
              </>
            ) : (
              <em>System B not configured</em>
            )}
          </div>
          <div className="rpt-chart-bg" dangerouslySetInnerHTML={{ __html: data.svgHtml }} />
          <SysTable sys={data.a} accentColor="#3b82f6" label="System A" />
          {data.b && <SysTable sys={data.b} accentColor="#e2e8f0" label="System B" />}
          <div className="rpt-cross-note">Development shown in metres per crank revolution. Dimmed gears are cross-chain combinations.</div>
        </div>
        <div className="print-actions">
          <button className="print-close-btn" onClick={onClose}>
            ✕ Close
          </button>
          <button className="print-print-btn" onClick={() => window.print()}>
            ⎙ Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { GearPoint } from '@/lib/gearMath';

export interface PrintReportData {
  groupset: string;
  crLabel: string;
  csLabel: string;
  outer: number;
  inner: number | null;
  isSingle: boolean;
  bigGears: GearPoint[];
  smallGears: GearPoint[] | null;
  ul: string;
  cadence: number;
  wheelLabel: string;
}

function ReportRow({ gears, ringT, label, color, ul }: { gears: GearPoint[]; ringT: number; label: string; color: string; ul: string }) {
  return (
    <tr>
      <td className="rpt-ring-lbl" style={{ color }}>
        {label}
        <br />
        <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>{ringT}T ring</span>
      </td>
      {gears.map((g, i) => {
        const gin = (g.dev * 12.527).toFixed(1);
        return (
          <td key={i} className={g.cross ? 'cross' : ''}>
            <div className="rpt-cog">{g.cog}T</div>
            <div className="rpt-spd">
              {g.spd.toFixed(1)}&thinsp;{ul}
            </div>
            <div className="rpt-dev">{g.dev.toFixed(2)}m</div>
            <div className="rpt-gin">{gin}&quot;</div>
          </td>
        );
      })}
    </tr>
  );
}

const LOGO_SVG = (
  <svg className="rpt-logo-dot" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <mask id="rdotm">
        <rect width="32" height="32" fill="white" />
        <text x="16" y="21" textAnchor="middle" fontFamily="Inter,system-ui,sans-serif" fontSize="11" fontWeight="900" letterSpacing="1.5" fill="black">
          DOT
        </text>
      </mask>
    </defs>
    <circle cx="16" cy="16" r="15" fill="#ef4444" mask="url(#rdotm)" />
  </svg>
);

export default function PrintReportModal({ data, onClose }: { data: PrintReportData; onClose: () => void }) {
  const bigRev = [...data.bigGears].reverse();
  const smlRev = data.isSingle || !data.smallGears ? null : [...data.smallGears].reverse();
  const bigAccent = '#3b82f6';
  const smlAccent = '#6366f1';

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
            <div className="rpt-heading">Gear Report</div>
          </div>
          <div className="rpt-meta">
            <strong>{data.groupset}</strong> &nbsp;&middot;&nbsp; {data.crLabel} chainring &nbsp;&middot;&nbsp; {data.csLabel} cassette
            &nbsp;&middot;&nbsp; {data.wheelLabel} &nbsp;&middot;&nbsp; {data.cadence} rpm
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
              <ReportRow gears={bigRev} ringT={data.outer} label="Big Ring" color={bigAccent} ul={data.ul} />
              {smlRev && data.inner != null && (
                <ReportRow gears={smlRev} ringT={data.inner} label="Small Ring" color={smlAccent} ul={data.ul} />
              )}
            </tbody>
          </table>
          <div className="rpt-cross-note">Dimmed gears are cross-chain combinations — avoid for drivetrain longevity.</div>
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

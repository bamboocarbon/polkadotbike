'use client';

import { ClimbGearPoint } from './ClimbChart';
import { DistUnit } from '@/lib/climbCalcState';
import { kmToMi } from '@/lib/units';

export interface ClimbPrintReportData {
  groupset: string;
  crLabel: string;
  csLabel: string;
  outer: number;
  inner: number | null;
  isSingle: boolean;
  bigGears: ClimbGearPoint[];
  smallGears: ClimbGearPoint[] | null;
  userPwr: number;
  mass: number;
  grade: number;
  cadence: number;
  crankLen: number;
  climbDist: number; // km
  distUnit: DistUnit;
  vam: number | null;
  timeFmt: string | null;
  equivOuter: string;
  crr: number;
  surfaceLabel: string;
  wheelLabel: string;
  svgHtml: string;
}

const REF_CRANK = 172.5;

function ReportRow({ gears, ringT, label, color, userPwr }: { gears: ClimbGearPoint[]; ringT: number; label: string; color: string; userPwr: number }) {
  const rev = [...gears].reverse();
  return (
    <>
      <tr>
        <td className="rpt-ring-lbl" style={{ color }}>
          {label}
          <br />
          <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>{ringT}T ring</span>
        </td>
        {rev.map((g, i) => {
          const achievable = !g.cross && g.pwr <= userPwr;
          const pwrColor = achievable ? '#16a34a' : '#dc2626';
          return (
            <td key={i} className={g.cross ? 'cross' : ''}>
              <div className="rpt-cog">{g.cog}T</div>
              <div className="rpt-spd">{g.spd.toFixed(1)}&thinsp;km/h</div>
              <div className="rpt-pwr" style={{ color: pwrColor }}>
                {Math.round(g.pwr)}W
              </div>
            </td>
          );
        })}
      </tr>
    </>
  );
}

const LOGO_SVG = (
  <svg className="rpt-logo-dot" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <mask id="rdotm-climb">
        <rect width="32" height="32" fill="white" />
        <text x="16" y="21" textAnchor="middle" fontFamily="Inter,system-ui,sans-serif" fontSize="11" fontWeight="900" letterSpacing="1.5" fill="black">
          DOT
        </text>
      </mask>
    </defs>
    <circle cx="16" cy="16" r="15" fill="#ef4444" mask="url(#rdotm-climb)" />
  </svg>
);

export default function PrintReportModal({ data, onClose }: { data: ClimbPrintReportData; onClose: () => void }) {
  const bigRev = [...data.bigGears].reverse();
  const bigAccent = '#3b82f6', smlAccent = '#6366f1';

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
            <div className="rpt-heading">Climb Planner Report</div>
          </div>
          <div className="rpt-meta">
            <strong>{data.groupset}</strong> &nbsp;&middot;&nbsp; {data.crLabel} chainring &nbsp;&middot;&nbsp; {data.csLabel} cassette
            &nbsp;&middot;&nbsp; {data.wheelLabel} &nbsp;&middot;&nbsp; <strong>{data.crankLen}mm</strong> cranks
            {data.crankLen !== REF_CRANK ? ` (≈${data.equivOuter}T on 172.5mm ref)` : ''}
            <br />
            <strong>{data.userPwr}W</strong> rider power &nbsp;&middot;&nbsp; <strong>{data.mass}kg</strong> total weight &nbsp;&middot;&nbsp;{' '}
            <strong>
              {data.grade > 0 ? '+' : ''}
              {data.grade}%
            </strong>{' '}
            gradient &nbsp;&middot;&nbsp; {data.cadence} rpm
            {data.crr !== 0.004 ? (
              <>
                {' '}
                &nbsp;&middot;&nbsp; <strong>{data.surfaceLabel}</strong> surface (Crr {data.crr})
              </>
            ) : null}
            {data.grade > 0 && data.vam ? (
              <>
                {' '}
                &nbsp;&middot;&nbsp; VAM <strong>{data.vam.toLocaleString()}</strong> m/hr &nbsp;&middot;&nbsp;{' '}
                {data.distUnit === 'mi' ? `${kmToMi(data.climbDist).toFixed(1)}mi` : `${data.climbDist.toFixed(1)}km`} ≈{' '}
                <strong>{data.timeFmt}</strong>
              </>
            ) : null}
          </div>
          <div className="rpt-chart-bg" dangerouslySetInnerHTML={{ __html: data.svgHtml }} />
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
              <ReportRow gears={data.bigGears} ringT={data.outer} label="Big Ring" color={bigAccent} userPwr={data.userPwr} />
              {!data.isSingle && data.smallGears && data.inner != null && (
                <ReportRow gears={data.smallGears} ringT={data.inner} label="Small Ring" color={smlAccent} userPwr={data.userPwr} />
              )}
            </tbody>
          </table>
          <div className="rpt-cross-note">
            Power shown is required watts for that gear at {data.cadence} rpm on a {data.grade}% gradient. Green = achievable at{' '}
            {data.userPwr}W. Dimmed = cross-chain.
          </div>
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

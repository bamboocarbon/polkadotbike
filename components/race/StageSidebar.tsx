'use client';

import { TYPE_INFO, fmtDate, type Stage } from '@/lib/raceHelpers';

interface StageSidebarProps {
  stages: Stage[];
  selected: number;
  onSelect: (num: number) => void;
}

interface StageSidebarWithLabelProps extends StageSidebarProps {
  /** "Tour Stages" / "Giro Stages" / "Vuelta Stages" — genuinely differs
   *  per race, no sane shared default, so required rather than guessed at
   *  (same reasoning as Footer's attribution prop). */
  label: string;
}

export function StageSidebar({ stages, selected, onSelect, label }: StageSidebarWithLabelProps) {
  return (
    <div className="stage-sidebar glass" id="stage-sidebar">
      <div className="sidebar-head">{label}</div>
      {stages.map((s) => {
        const ti = TYPE_INFO[s.type] || TYPE_INFO['Sprint'];
        return (
          <button
            key={s.num}
            type="button"
            className={`stage-btn${s.num === selected ? ' active' : ''}`}
            data-num={s.num}
            onClick={() => onSelect(s.num)}
          >
            <div className={`s-badge ${ti.sidebarCls}`} style={{ marginTop: 2 }}>{s.num}</div>
            <div className="s-info">
              <div className="s-finish">{s.start} → {s.finish}</div>
              <div className="s-meta">{fmtDate(s.date).slice(4)}</div>
              <div className="s-stats">{s.dist} km &nbsp;·&nbsp; ▲ {s.vgain.toLocaleString()} m</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function StageMobileSelect({ stages, selected, onSelect }: StageSidebarProps) {
  return (
    <select
      className="stage-mobile-select"
      id="stage-select-mobile"
      value={selected}
      onChange={(e) => onSelect(parseInt(e.target.value, 10))}
    >
      {stages.map((s) => (
        <option key={s.num} value={s.num}>
          Stage {s.num} — {s.start} → {s.finish}
        </option>
      ))}
    </select>
  );
}

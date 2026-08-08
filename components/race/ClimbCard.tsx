'use client';

import ClimbProfile from './ClimbProfile';
import { CAT_CLS, buildPlanUrl, gradColor, type Climb } from '@/lib/raceHelpers';

export default function ClimbCard({ climb: c }: { climb: Climb }) {
  const isFinish = c.kbf === 0;
  const hasData = c.len !== null && c.grad !== null;
  const catCls = CAT_CLS[c.cat] || 'cat-tbc';
  const gCol = c.grad !== null ? gradColor(c.grad) : '';

  const lenStr = hasData ? (c.len! % 1 === 0 ? c.len : parseFloat(c.len!.toFixed(2))) : null;
  const gradStr = hasData ? (c.grad! % 1 === 0 ? c.grad : parseFloat(c.grad!.toFixed(2))) : null;

  const top = (
    <div className="cc-top">
      <span className={`cc-cat ${catCls}`}>{c.cat}</span>
      <div className="cc-name-block">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span className="cc-name">{c.name}</span>
          {isFinish && <span className="finish-tag">Stage Finish</span>}
        </div>
        <div className="cc-range">{c.range}</div>
      </div>
    </div>
  );

  const stats = hasData && (
    <div className="cc-stats">
      <div className="cs-item">
        <div className="cs-val">{lenStr}</div>
        <div className="cs-label">km</div>
      </div>
      <div className="cs-item">
        <div className="cs-val" style={{ color: gCol }}>{gradStr}%</div>
        <div className="cs-label">avg gradient</div>
      </div>
      {!!c.elev && (
        <div className="cs-item">
          <div className="cs-val sm">▲ {c.elev.toLocaleString()}m</div>
          <div className="cs-label">summit</div>
        </div>
      )}
      {!!c.kbf && c.kbf > 0 && (
        <div className="cs-item">
          <div className="cs-val sm">{c.kbf}km</div>
          <div className="cs-label">to finish</div>
        </div>
      )}
    </div>
  );

  const planBtn = hasData ? (
    <a className="plan-btn" href={buildPlanUrl(c)}>Plan this climb →</a>
  ) : (
    <div className="tbc-note">Length and gradient not yet confirmed — check back closer to race day.</div>
  );

  if (c.profile && c.profile.length) {
    return (
      <div className={`climb-card${isFinish ? ' is-finish' : ''}`}>
        {top}
        <div className="cc-body">
          <ClimbProfile climb={c} />
          <div className="cc-body-right">
            {stats}
            {c.notes && <div className="cc-notes">{c.notes}</div>}
            {planBtn}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`climb-card${isFinish ? ' is-finish' : ''}`}>
      {top}
      {stats}
      {c.notes && <div className="cc-notes">{c.notes}</div>}
      {planBtn}
    </div>
  );
}

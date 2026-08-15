import { CAT_CLS, buildStaticPlanUrl, fmtDate, stageClimbs, type RaceData, type Climb, type RaceIntro } from '@/lib/raceHelpers';

interface StaticIndexProps {
  race: RaceData;
  climbs: Climb[];
  intro: RaceIntro;
  h2Color: string;
}

// Server component — replaces gen_static_index.js (deleted). Same output,
// computed at request/build time from data/climbs.json instead of a
// generator script writing marker-delimited HTML into the page source.
export default function StaticIndex({ race, climbs, intro, h2Color }: StaticIndexProps) {
  return (
    <section className="static-index" id="all-stages" style={{ '--si-h2-color': h2Color } as React.CSSProperties}>
      <h2>Every stage and climb of the {race.name}</h2>
      <p className="si-intro">
        {intro.before}
        <a href="/climb" style={{ color: '#3b8ef0' }}>Climb Planner</a>
        {intro.after}
      </p>
      {race.stages.map((s) => {
        const stageClimbList = stageClimbs(climbs, s.num);
        const catClimbCount = stageClimbList.filter((c) => c.cat !== 'TBC').length;
        const allTBC = stageClimbList.length > 0 && catClimbCount === 0;

        return (
          <article className="si-stage glass" id={`stage-${s.num}`} key={s.num}>
            <h3>
              <a href={`?s=${s.num}`}>
                Stage {s.num} · {fmtDate(s.date)} · {s.start} → {s.finish}
              </a>
            </h3>
            <p className="si-meta">
              {s.type} · {s.dist}km · {s.vgain.toLocaleString()}m of climbing
            </p>
            <p className="si-notes">{s.notes}</p>
            {allTBC ? (
              <p className="si-notes">
                Rolling stage with {stageClimbList.length} uncategorised climb{stageClimbList.length !== 1 ? 's' : ''}.
              </p>
            ) : stageClimbList.length > 0 ? (
              <ul className="si-climbs">
                {stageClimbList.map((c, i) => {
                  const hasData = c.len !== null && c.grad !== null;
                  const stats = hasData
                    ? ` — ${c.len}km at ${c.grad}%${c.elev ? `, summit ${c.elev.toLocaleString()}m` : ''}${
                        c.kbf === 0 ? ', stage finish' : c.kbf && c.kbf > 0 ? `, ${c.kbf}km from the finish` : ''
                      }`
                    : ' — details to be confirmed';
                  return (
                    <li key={i}>
                      <span className={`cc-cat ${CAT_CLS[c.cat] || 'cat-tbc'}`}>{c.cat}</span>
                      {hasData ? (
                        <a href={buildStaticPlanUrl(c)}><strong>{c.name}</strong></a>
                      ) : (
                        <strong>{c.name}</strong>
                      )}
                      {stats}.{c.notes ? ` ${c.notes}` : ''}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

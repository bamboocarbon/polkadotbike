'use client';

import ClimbCard from './ClimbCard';
import Stay22Embed from '@/components/affiliate/Stay22Embed';
import BikesBookingCard from '@/components/affiliate/BikesBookingCard';
import KiwiCard from '@/components/affiliate/KiwiCard';
import { TYPE_INFO, fmtDate, stageClimbs, type RaceData, type Climb } from '@/lib/raceHelpers';

interface StageDetailProps {
  race: RaceData;
  climbs: Climb[];
  stageNum: number;
  stay22Links: Record<string, string>;
}

export default function StageDetail({ race, climbs, stageNum, stay22Links }: StageDetailProps) {
  const stage = race.stages.find((s) => s.num === stageNum);
  if (!stage) return null;

  const ti = TYPE_INFO[stage.type] || TYPE_INFO['Sprint'];
  const isQueen = stageNum === race.queenStage;
  const stageClimbList = stageClimbs(climbs, stageNum);
  const stay22Src = stay22Links[String(stageNum)];

  let climbsContent;
  if (stageClimbList.length === 0) {
    const msg =
      stage.type === 'TTT'
        ? 'Team Time Trial — no categorised climbs in the dataset.'
        : stage.type === 'ITT'
          ? 'Individual Time Trial — no categorised climbs in the dataset.'
          : stage.type === 'Sprint'
            ? 'Sprint stage — no categorised climbs.'
            : stage.type === 'Flat'
              ? 'Flat stage — no categorised climbs.'
              : 'Detailed climb data not yet available for this stage.';
    climbsContent = <div className="no-climbs">{msg}</div>;
  } else {
    climbsContent = (
      <div className="climbs-list">
        {stageClimbList.map((c, i) => (
          <ClimbCard key={`${c.stage}-${c.name}-${i}`} climb={c} />
        ))}
      </div>
    );
  }

  return (
    <div id="stage-detail">
      <div className="stage-header glass">
        <div className="sh-top">
          <span className={`type-badge ${ti.cls}`}>{ti.badge}</span>
          {isQueen && <span className="type-badge badge-queen">Queen Stage</span>}
          <span className="sh-date">{fmtDate(stage.date)} {stage.date.slice(0, 4)}</span>
        </div>
        <div className="sh-route">Stage {stage.num}: {stage.start} → {stage.finish}</div>
        <div className="sh-stats">
          <span><strong>{stage.dist}</strong> km</span>
          <span><strong>{stage.vgain.toLocaleString()}</strong> m elevation gain</span>
          {stageClimbList.length > 0 && (
            <span><strong>{stageClimbList.length}</strong> categorised climb{stageClimbList.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        {stage.notes && <div className="sh-notes">{stage.notes}</div>}
      </div>

      {stay22Src ? (
        <div className="stay-row">
          <div className="stay-col">
            <div className="stage-header glass stay-card">
              <div className="stay-card-title">🏨 Where to stay in {stage.finish}</div>
              <Stay22Embed src={stay22Src} />
            </div>
          </div>
          <div className="bike-hire-card">
            <BikesBookingCard />
            <KiwiCard />
          </div>
        </div>
      ) : (
        <>
          <BikesBookingCard />
          <KiwiCard />
        </>
      )}

      {climbsContent}
    </div>
  );
}

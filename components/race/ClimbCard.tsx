'use client';

import ClimbProfile from './ClimbProfile';
import { CAT_CLS, buildPlanUrl, gradColor, type Climb } from '@/lib/raceHelpers';
import { GPX_PARTIAL_CLIMB_SLUGS, GPX_PARTIAL_CLIMB_CAVEAT } from '@/lib/climbGpxCaveats';
import { trackGpxDownload } from '@/lib/trackGpxDownload';

// Climbs with real, built 3D route data (data/climbs/), keyed by name —
// gates the extra "Plan this climb in 3D" button, since /climbs/<slug>
// exists for every climb but only these have actual terrain to show.
// Extend as more climbs get their pipeline run.
const CLIMB_3D_SLUGS: Record<string, string> = {
  "Alpe d'Huez": 'alpe-dhuez',
  "Ballon d'Alsace": 'ballon-dalsace',
  'Col Bayard': 'col-bayard',
  "Col d'Aspin": 'col-daspin',
  "Col d'Ornon": 'col-dornon',
  'Côte de Bègues': 'cote-de-begues',
  'Col du Tourmalet': 'col-du-tourmalet',
  'Gavarnie-Gèdre': 'gavarnie-gedre',
  'Suc au May': 'suc-au-may',
  'Puy Mary – Pas de Peyrol': 'puy-mary-pas-de-peyrol',
  'Grand Ballon': 'grand-ballon',
  'Col du Page': 'col-du-page',
  'Col du Haag': 'col-du-haag',
  'Plateau de Solaison Brison': 'plateau-de-solaison-brison',
  'Le Salève – Col de la Croisette': 'le-saleve-col-de-la-croisette',
  'Côte de Larringes': 'cote-de-larringes',
  'Orcières-Merlette': 'orcieres-merlette',
  'Côte de Monteynard': 'cote-de-monteynard',
  "Côte d'Engins": 'cote-dengins',
  'Col du Télégraphe': 'col-du-telegraphe',
  'Col du Galibier': 'col-du-galibier',
  'Col du Noyer': 'col-du-noyer',
  'Col de Coudons': 'col-de-coudons',
  'Col de la Croix de Fer': 'col-de-la-croix-de-fer',
  'Col de la Griffoul': 'col-de-la-griffoul',
  'Col de Montségur': 'col-de-montsegur',
  'Col de Pertus': 'col-de-pertus',
  'Col de Sarenne': 'col-de-sarenne',
  'Col de Toses (Collada de Toses)': 'col-de-toses-collada-de-toses',
  'Alto de Velefique': 'alto-de-velefique',
  'Alto de Aitana': 'alto-de-aitana',
  'Alto del Desierto de las Palmas': 'alto-del-desierto-de-las-palmas',
  'Alto del Legionario': 'alto-del-legionario',
  'Aramón Valdelinares': 'aramon-valdelinares',
  'Calar Alto': 'calar-alto',
  'Col de Mont-Louis': 'col-de-mont-louis',
  "Coll d'Ordino": 'coll-dordino',
  'Collada de Beixalís': 'collada-de-beixalis',
  'Collado del Alguacil': 'collado-del-alguacil',
  'Font Romeu': 'font-romeu',
  'Collado García': 'collado-garcia',
  "Port d'Envalira": 'port-denvalira',
  'Peñas Blancas': 'penas-blancas',
  'Puerto de El Miserat': 'puerto-de-el-miserat',
  'Puerto de El Duque': 'puerto-de-el-duque',
  'Puerto de Barx': 'puerto-de-barx',
  'Puerto de El Purche (1st ascent)': 'puerto-de-el-purche',
  'Puerto de El Purche (2nd ascent)': 'puerto-de-el-purche',
  'Puerto de la Serratella': 'puerto-de-la-serratella',
  'Puerto de Granada': 'puerto-de-granada',
  'Puerto de Locubín': 'puerto-de-locubin',
  'Puerto de Las Abejas': 'puerto-de-las-abejas',
  'Puerto del Viento': 'puerto-del-viento',
  'Puerto de Tudons': 'puerto-de-tudons',
  'Puerto de Tárbena': 'puerto-de-tarbena',
  'Puerto de San Rafael': 'puerto-de-san-rafael',
  'Puerto de Los Villares': 'puerto-de-los-villares',
  'Puerto El Bartolo': 'puerto-el-bartolo',
  'Puerto El Remolcador': 'puerto-el-remolcador',
  'Sierra de la Pandera': 'sierra-de-la-pandera',
  'Venta de la Cebada': 'venta-de-la-cebada',
};

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

  const climb3dSlug = CLIMB_3D_SLUGS[c.name];

  const planBtn = hasData ? (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <a className="plan-btn" href={buildPlanUrl(c)}>Plan this climb →</a>
      {climb3dSlug && (
        <>
          <a className="plan-btn" href={`/climbs/${climb3dSlug}`} style={{ background: '#12b05f' }}>
            Plan this climb in 3D →
          </a>
          <a
            className="gpx-btn"
            href={`/api/gpx/${climb3dSlug}`}
            download
            onClick={() => trackGpxDownload(climb3dSlug)}
            title={GPX_PARTIAL_CLIMB_SLUGS.has(climb3dSlug) ? GPX_PARTIAL_CLIMB_CAVEAT : undefined}
          >
            Download GPX
          </a>
        </>
      )}
    </div>
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

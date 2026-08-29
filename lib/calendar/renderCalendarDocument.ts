import type { CalendarStoreData } from './types';

/**
 * Renders the full standalone calendar page — used both for the live
 * /admin/calendar route (injected into an iframe once the admin session is
 * authed) and for `npm run calendar:export`'s dist/calendar.html. Same
 * function, same markup, same filter logic in both places; only `editable`
 * differs. Ported from the polkadotbike-content-calendar.html prototype —
 * layout and filter behaviour kept as-is, data model swapped for the full
 * event schema.
 */
export function renderCalendarDocument(
  data: CalendarStoreData,
  opts: { editable?: boolean } = {}
): string {
  const editable = !!opts.editable;
  const eventsJson = JSON.stringify(data.events);
  const categoriesJson = JSON.stringify(data.categories);
  const audiencesJson = JSON.stringify(data.audiences);
  const reviewRunsJson = JSON.stringify(data.reviewRuns);
  const generatedAt = data.generatedAt;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>polkadotbike — season content calendar</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Karla:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{
  --ink:#14161a;--slate:#5c6472;--line:#d6dae1;--paper:#e7eaee;--card:#fff;
  --road:#d8232a;--mtb:#1b6b45;--gravel:#a9762a;--cx:#5b3fbf;
  --indoor:#b0246e;--show:#8a6d00;--moment:#454b58;--focus:#0b7285;--tbc:#b45309;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font-family:'Karla',system-ui,sans-serif;font-size:15px;line-height:1.5}
.wrap{max-width:940px;margin:0 auto;padding:0 16px 72px}

header.top{padding:28px 0 18px;border-bottom:2px solid var(--ink)}
.kicker{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--slate);margin:0 0 8px}
h1{font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;font-size:clamp(34px,9vw,62px);line-height:.92;margin:0 0 10px}
h1 .dot{color:var(--road)}
.standfirst{margin:0;max-width:58ch;color:var(--slate)}

.banner{margin:16px 0 0;padding:12px 14px;background:#fff;border:1.5px solid var(--ink);border-radius:6px;font-size:13.5px}
.banner .bt{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--slate);margin-bottom:4px}
.banner.empty{color:var(--slate);font-style:italic}
.runhistory{margin:10px 0 0;border-collapse:collapse;width:100%;font-family:'IBM Plex Mono',monospace;font-size:11.5px}
.runhistory th,.runhistory td{text-align:left;padding:5px 8px;border-bottom:1px solid var(--line)}
.runhistory th{color:var(--slate);font-weight:500;text-transform:uppercase;letter-spacing:.06em;font-size:10px}
details.runs{margin-top:10px}
details.runs summary{cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--slate);letter-spacing:.06em;text-transform:uppercase}

.strip{margin:20px 0 4px;padding:14px 0 6px;border-bottom:1px solid var(--line)}
.strip-label{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--slate);margin-bottom:12px}
.weeks{display:flex;align-items:flex-end;gap:3px;height:62px;overflow-x:auto;padding-bottom:4px}
.week{flex:1 0 14px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px;background:none;border:0;padding:0 0 4px;cursor:pointer;border-bottom:2px solid transparent}
.week:hover,.week:focus-visible{border-bottom-color:var(--ink);outline:none}
.week .pip{width:7px;height:7px;border-radius:50%;background:var(--ink);opacity:.85}
.week .pip.q{background:var(--road)}
.week .mo{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--slate);margin-top:2px}

.controls{position:sticky;top:0;z-index:20;background:var(--paper);padding:12px 0 10px;border-bottom:1px solid var(--line)}
.row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;align-items:center}
.row:last-child{margin-bottom:0}
.rowlabel{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--slate);width:100%;margin-bottom:1px}
.chip{font-family:'Barlow Condensed',sans-serif;font-weight:600;text-transform:uppercase;letter-spacing:.05em;font-size:14px;line-height:1;padding:8px 11px 7px;border:1.5px solid var(--ink);background:transparent;color:var(--ink);border-radius:999px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.chip .swatch{width:9px;height:9px;border-radius:50%;background:currentColor;flex:none}
.chip[aria-pressed="true"]{background:var(--ink);color:#fff}
.chip:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.chip.mono{font-family:'IBM Plex Mono',monospace;font-weight:500;font-size:12px;letter-spacing:.06em}
.search{flex:1 1 180px;min-width:150px;font-family:'Karla',sans-serif;font-size:14px;padding:8px 12px;border:1.5px solid var(--line);border-radius:999px;background:#fff;color:var(--ink)}
.search:focus{outline:2px solid var(--focus);outline-offset:1px;border-color:var(--ink)}
.count{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--slate);letter-spacing:.06em}

h2.month{font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;font-size:26px;letter-spacing:.03em;margin:34px 0 12px;padding-bottom:6px;border-bottom:2px solid var(--ink);display:flex;justify-content:space-between;align-items:baseline}
h2.month span{font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:400;color:var(--slate);letter-spacing:.08em}
.card{background:var(--card);border:1px solid var(--line);border-left:5px solid var(--c);padding:14px 16px;margin-bottom:8px}
.card.done{opacity:.55}
.card.cancelled{opacity:.6;border-left-color:var(--slate)}
.card-head{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
.date{font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:12px;color:var(--c);white-space:nowrap;flex:none}
.name{font-family:'Barlow Condensed',sans-serif;font-weight:600;text-transform:uppercase;font-size:21px;line-height:1.05;margin:0;flex:1 1 55%}
.badge{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;border:1px solid var(--c);color:var(--c);padding:2px 6px;border-radius:3px;flex:none}
.badge.live{background:var(--road);border-color:var(--road);color:#fff}
.badge.tbc{background:var(--tbc);border-color:var(--tbc);color:#fff}
.badge.cancelled{background:var(--slate);border-color:var(--slate);color:#fff}
.badge.priority{background:none}
.aud{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;padding:2px 6px;border-radius:3px;flex:none;background:var(--ink);color:#fff}
.aud.ride{background:#0b7285}
.aud.visit{background:#8a6d00}
.flag{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;color:var(--slate);flex:none}
.place{margin:6px 0 0;color:var(--slate);font-size:13.5px}
.angle{margin:10px 0 0;font-size:14px}
.angle b{font-family:'Barlow Condensed',sans-serif;text-transform:uppercase;letter-spacing:.06em;font-size:13px;color:var(--slate);font-weight:600}
.post{margin:8px 0 0;font-family:'IBM Plex Mono',monospace;font-size:11.5px;background:#f2f4f7;border-left:2px solid var(--c);padding:6px 9px}
.meta{display:flex;flex-wrap:wrap;gap:8px 14px;margin-top:10px;align-items:center}
.meta a{color:var(--ink);font-size:13px;text-decoration:none;border-bottom:1.5px solid var(--c);padding-bottom:1px}
.meta a:hover{background:#f2f4f7}
.handle{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--slate)}
.tags{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--road);word-break:break-word}
.pinned{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--focus)}
.empty{padding:40px 0;text-align:center;color:var(--slate)}
footer{margin-top:40px;padding-top:16px;border-top:1px solid var(--line);font-size:12.5px;color:var(--slate)}
footer p{margin:0 0 8px}
.edit-btn{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;background:none;border:1px solid var(--slate);color:var(--slate);border-radius:3px;padding:3px 8px;cursor:pointer;margin-left:auto}
.edit-form{margin-top:10px;padding:10px;background:#f2f4f7;border:1px dashed var(--slate);display:none;font-size:13px}
.edit-form.open{display:block}
.edit-form label{display:block;margin:6px 0 2px;font-family:'IBM Plex Mono',monospace;font-size:10px;text-transform:uppercase;color:var(--slate)}
.edit-form input,.edit-form select,.edit-form textarea{width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:4px;font-family:inherit;font-size:13px}
.edit-form textarea{min-height:50px}
.edit-form .save{margin-top:8px;font-family:'Barlow Condensed',sans-serif;font-weight:600;text-transform:uppercase;background:var(--ink);color:#fff;border:0;border-radius:4px;padding:7px 14px;cursor:pointer}
.edit-status{font-size:12px;margin-left:8px}
@media (max-width:520px){.name{font-size:19px;flex-basis:100%}.card{padding:12px 13px}}
</style>
</head>
<body>
<div class="wrap">

<header class="top">
  <p class="kicker">polkadotbike.com · publishing calendar</p>
  <h1>The rest of the<br>season<span class="dot">.</span></h1>
  <p class="standfirst">Every race worth watching, every event worth entering and every show worth visiting — with the angle and the window to post it in. Generated ${generatedAt}.</p>
  <div id="banner"></div>
</header>

<section class="strip" aria-label="Season density by week">
  <div class="strip-label">Week by week — taller stacks are clash weeks. Tap to jump.</div>
  <div class="weeks" id="weeks"></div>
</section>

<div class="controls">
  <div class="row" id="audRow"><span class="rowlabel">Audience</span></div>
  <div class="row" id="catRow"><span class="rowlabel">Discipline</span></div>
  <div class="row" id="whenRow">
    <span class="rowlabel">When</span>
    <button class="chip mono" data-month="all" aria-pressed="true">All months</button>
    <button class="chip mono" id="usOnly" aria-pressed="false">US only</button>
    <button class="chip mono" id="hidePast" aria-pressed="false">Hide finished</button>
    <input class="search" id="q" type="search" placeholder="Search event, place, angle…" aria-label="Search events">
  </div>
  <div class="count" id="count"></div>
</div>

<main id="list"></main>

<footer>
  <p><strong>Watch</strong> = spectator or broadcast. <strong>Ride</strong> = open to enter, including age-group and virtual racing. <strong>Visit</strong> = show, festival or expo.</p>
  <p><strong>Hashtags:</strong> five per event, ordered most specific first. Instagram now caps posts at five and treats tags as topic labels, not a reach lever — put them in the caption, after keyword-rich opening words. On X, use one or two at most; three or more reads as spam there. Same tags work on both, just fewer on X.</p>
  <p><strong>°</strong> after a handle or date means it hasn't been confirmed from a primary source. <strong>TBC</strong> means the organiser hasn't fixed the date yet.</p>
</footer>

</div>

<script>
const EDITABLE = ${editable ? 'true' : 'false'};
const CATS = ${categoriesJson};
const CAT_COLORS = {road:'#d8232a',mtb:'#1b6b45',gravel:'#a9762a',cx:'#5b3fbf',indoor:'#b0246e',show:'#8a6d00',moment:'#454b58'};
const AUDS = ${audiencesJson};
const EVENTS = ${eventsJson};
const REVIEW_RUNS = ${reviewRunsJson};

const state={cats:new Set(Object.keys(CATS)),auds:new Set(Object.keys(AUDS)),month:'all',q:'',hidePast:false,us:false};
const TODAY=new Date(); TODAY.setHours(0,0,0,0);
const parse=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);};
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONFULL=['January','February','March','April','May','June','July','August','September','October','November','December'];

function fmt(ev){
  const s=parse(ev.start),e=ev.end?parse(ev.end):null;
  let txt;
  if(!e||ev.start===ev.end) txt=\`\${s.getDate()} \${MON[s.getMonth()]}\`;
  else if(s.getMonth()===e.getMonth()) txt=\`\${s.getDate()}–\${e.getDate()} \${MON[s.getMonth()]}\`;
  else txt=\`\${s.getDate()} \${MON[s.getMonth()]} – \${e.getDate()} \${MON[e.getMonth()]}\`;
  if(ev.dateConfidence==='unverified') txt+=' °';
  return txt;
}
function status(ev){
  if(ev.status==='cancelled') return 'cancelled';
  const s=parse(ev.start),e=ev.end?parse(ev.end):s;
  if(TODAY>e) return 'done';
  if(TODAY>=s&&TODAY<=e) return 'live';
  return 'next';
}

function renderBanner(){
  const el=document.getElementById('banner');
  if(!REVIEW_RUNS.length){
    el.innerHTML='<div class="banner empty">No review runs yet. The 1st-of-month check will populate this.</div>';
    return;
  }
  const last=REVIEW_RUNS[REVIEW_RUNS.length-1];
  const inconclusive=EVENTS.reduce((n,ev)=>n+(ev.reviewLog||[]).filter(l=>l.runId===last.runId&&l.outcome==='inconclusive').length,0);
  let rowsHtml='';
  REVIEW_RUNS.slice().reverse().forEach(r=>{
    rowsHtml+=\`<tr><td>\${r.runId}</td><td>\${r.ranAt}</td><td>\${r.horizon}</td><td>\${r.eventsChecked}</td><td>\${r.changesFound}</td><td>\${r.errors}</td></tr>\`;
  });
  el.innerHTML=\`<div class="banner">
    <div class="bt">Last run — \${last.ranAt}</div>
    \${last.changesFound} change\${last.changesFound===1?'':'s'} found, \${inconclusive} inconclusive check\${inconclusive===1?'':'s'} needing manual attention.
    <details class="runs"><summary>Run history (\${REVIEW_RUNS.length})</summary>
      <table class="runhistory"><thead><tr><th>Run</th><th>When</th><th>Horizon</th><th>Checked</th><th>Changed</th><th>Errors</th></tr></thead>
      <tbody>\${rowsHtml}</tbody></table>
    </details>
  </div>\`;
}

const audRow=document.getElementById('audRow');
Object.entries(AUDS).forEach(([k,label])=>{
  const b=document.createElement('button');
  b.className='chip';b.setAttribute('aria-pressed','true');b.textContent=label;
  b.addEventListener('click',()=>{
    if(state.auds.has(k)){state.auds.delete(k);b.setAttribute('aria-pressed','false');}
    else{state.auds.add(k);b.setAttribute('aria-pressed','true');}
    render();
  });
  audRow.appendChild(b);
});

const catRow=document.getElementById('catRow');
Object.entries(CATS).forEach(([k,label])=>{
  const b=document.createElement('button');
  b.className='chip';b.setAttribute('aria-pressed','true');b.dataset.cat=k;
  b.innerHTML=\`<span class="swatch" style="background:\${CAT_COLORS[k]||'#000'}"></span>\${label}\`;
  b.addEventListener('click',()=>{
    if(state.cats.has(k)){state.cats.delete(k);b.setAttribute('aria-pressed','false');}
    else{state.cats.add(k);b.setAttribute('aria-pressed','true');}
    render();
  });
  catRow.appendChild(b);
});
const reset=document.createElement('button');
reset.className='chip mono';reset.textContent='Reset';
reset.addEventListener('click',()=>{
  state.cats=new Set(Object.keys(CATS));
  state.auds=new Set(Object.keys(AUDS));
  state.us=false;
  document.getElementById('usOnly').setAttribute('aria-pressed','false');
  catRow.querySelectorAll('[data-cat]').forEach(b=>b.setAttribute('aria-pressed','true'));
  audRow.querySelectorAll('.chip').forEach(b=>b.setAttribute('aria-pressed','true'));
  render();
});
catRow.appendChild(reset);

const monthSet=new Set();
EVENTS.forEach(ev=>monthSet.add(parse(ev.start).getMonth()));
const whenRow=document.getElementById('whenRow');
const usBtn=document.getElementById('usOnly');
Array.from(monthSet).sort((a,b)=>a-b).forEach(m=>{
  const b=document.createElement('button');
  b.className='chip mono';b.dataset.month=String(m);b.setAttribute('aria-pressed','false');b.textContent=MON[m];
  whenRow.insertBefore(b, usBtn);
});
whenRow.querySelectorAll('[data-month]').forEach(b=>{
  b.addEventListener('click',()=>{
    state.month=b.dataset.month;
    whenRow.querySelectorAll('[data-month]').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));
    render();
  });
});
document.getElementById('hidePast').addEventListener('click',function(){
  state.hidePast=!state.hidePast;this.setAttribute('aria-pressed',String(state.hidePast));render();
});
usBtn.addEventListener('click',function(){
  state.us=!state.us;this.setAttribute('aria-pressed',String(state.us));render();
});
document.getElementById('q').addEventListener('input',e=>{state.q=e.target.value.toLowerCase();render();});

function buildStrip(){
  const wrap=document.getElementById('weeks');
  if(!EVENTS.length) return;
  const allStarts=EVENTS.map(ev=>parse(ev.start));
  let cur=new Date(Math.min(...allStarts.map(d=>d.getTime())));
  cur.setDate(cur.getDate()-cur.getDay());
  const lastEnd=Math.max(...EVENTS.map(ev=>parse(ev.end||ev.start).getTime()));
  const end=new Date(lastEnd);end.setDate(end.getDate()+7);
  while(cur<end){
    const wEnd=new Date(cur);wEnd.setDate(wEnd.getDate()+6);
    const hits=EVENTS.filter(ev=>{
      const s=parse(ev.start),e=ev.end?parse(ev.end):s;
      if((e-s)/86400000>40) return false;
      return s<=wEnd&&e>=cur;
    });
    const btn=document.createElement('button');
    btn.className='week';
    btn.title=\`\${cur.getDate()} \${MON[cur.getMonth()]} — \${hits.length} event\${hits.length===1?'':'s'}\`;
    btn.setAttribute('aria-label',btn.title);
    for(let i=0;i<Math.min(hits.length,5);i++){
      const p=document.createElement('span');
      p.className='pip'+(hits.length>=4?' q':'');
      btn.appendChild(p);
    }
    const mo=document.createElement('span');mo.className='mo';
    mo.textContent=cur.getDate()<=7?MON[cur.getMonth()]:'';
    btn.appendChild(mo);
    const first=hits.length?hits.slice().sort((a,b)=>a.start.localeCompare(b.start))[0]:null;
    if(first) btn.addEventListener('click',()=>{
      const el=document.getElementById('ev-'+first.id);
      if(el) el.scrollIntoView({behavior:'smooth',block:'center'});
    });
    wrap.appendChild(btn);
    cur.setDate(cur.getDate()+7);
  }
}

function fieldRow(label,name,value,type){
  type=type||'text';
  return \`<label>\${label}</label><input name="\${name}" type="\${type}" value="\${(value||'').toString().replace(/"/g,'&quot;')}">\`;
}

function attachEditForm(ev,article){
  const form=document.createElement('form');
  form.className='edit-form';
  form.id='edit-'+ev.id;
  form.innerHTML=\`
    \${fieldRow('Start (YYYY-MM-DD)','start',ev.start)}
    \${fieldRow('End (YYYY-MM-DD)','end',ev.end)}
    <label>Date confidence</label>
    <select name="dateConfidence">
      \${['confirmed','unverified','tbc'].map(v=>\`<option value="\${v}" \${ev.dateConfidence===v?'selected':''}>\${v}</option>\`).join('')}
    </select>
    <label>Priority</label>
    <select name="priority">
      \${[1,2,3].map(v=>\`<option value="\${v}" \${ev.priority===v?'selected':''}>\${v}</option>\`).join('')}
    </select>
    \${fieldRow('Official URL','officialUrl',ev.officialUrl)}
    <label>Angle</label>
    <textarea name="angle">\${(ev.angle||'').replace(/</g,'&lt;')}</textarea>
    <label>Post window</label>
    <textarea name="postWindow">\${(ev.postWindow||'').replace(/</g,'&lt;')}</textarea>
    <button type="submit" class="save">Save (marks as manually verified)</button>
    <span class="edit-status"></span>
  \`;
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const statusEl=form.querySelector('.edit-status');
    statusEl.textContent='Saving…';
    const fd=new FormData(form);
    const patch={
      start:fd.get('start'), end:fd.get('end'), dateConfidence:fd.get('dateConfidence'),
      priority:Number(fd.get('priority')), officialUrl:fd.get('officialUrl')||null,
      angle:fd.get('angle'), postWindow:fd.get('postWindow'),
    };
    try{
      const pw=sessionStorage.getItem('pdb_admin_pw')||'';
      const res=await fetch('/api/admin/calendar/'+encodeURIComponent(ev.id),{
        method:'PATCH',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+pw},
        body:JSON.stringify(patch),
      });
      if(!res.ok){ statusEl.textContent='Failed ('+res.status+')'; return; }
      const updated=await res.json();
      Object.assign(ev,updated);
      statusEl.textContent='Saved — committed, live in about a minute after redeploy.';
      render();
    }catch(err){ statusEl.textContent='Failed.'; }
  });
  article.appendChild(form);
  return form;
}

function render(){
  const list=document.getElementById('list');
  const rows=EVENTS
    .filter(ev=>ev.audience.some(a=>state.auds.has(a)))
    .filter(ev=>state.cats.has(ev.category))
    .filter(ev=>!state.us||ev.country==='US')
    .filter(ev=>state.month==='all'||parse(ev.start).getMonth()===Number(state.month))
    .filter(ev=>!state.hidePast||status(ev)!=='done')
    .filter(ev=>!state.q||(ev.name+' '+ev.place+' '+ev.angle+' '+(ev.hashtags||[]).join(' ')).toLowerCase().includes(state.q))
    .sort((a,b)=>a.start.localeCompare(b.start));

  document.getElementById('count').textContent=\`\${rows.length} of \${EVENTS.length} entries shown\`;

  if(!rows.length){
    list.innerHTML='<p class="empty">Nothing matches. Widen the filters or clear the search.</p>';
    return;
  }

  list.innerHTML='';
  let lastMonth=-1;
  rows.forEach(ev=>{
    const m=parse(ev.start).getMonth();
    if(m!==lastMonth){
      const n=rows.filter(r=>parse(r.start).getMonth()===m).length;
      const h2=document.createElement('h2');h2.className='month';
      h2.innerHTML=\`\${MONFULL[m]}<span>\${n} entries</span>\`;
      list.appendChild(h2);
      lastMonth=m;
    }
    const c=CAT_COLORS[ev.category]||'#000',st=status(ev);
    const id='ev-'+ev.id;
    const stBadge=st==='live'?'<span class="badge live">Live now</span>':st==='cancelled'?'<span class="badge cancelled">Cancelled</span>':st==='done'?'<span class="badge">Finished</span>':'';
    const tbcBadge=ev.dateConfidence==='tbc'?'<span class="badge tbc">TBC</span>':'';
    const audBadges=ev.audience.map(a=>\`<span class="aud \${a}">\${(AUDS[a]||a).replace('To ','')}</span>\`).join('');
    const usFlag=ev.country==='US'?'<span class="flag">USA</span>':'';
    const site=ev.officialUrl?\`<a href="\${ev.officialUrl}" target="_blank" rel="noopener">Official site</a>\`:'';
    let handle='';
    if(ev.handles&&ev.handles.instagram){
      handle=\`<span class="handle">\${ev.handles.instagram}\${ev.handleConfidence!=='verified'?' °':''}</span>\`;
    }
    const pinned=ev.pinnedFields&&ev.pinnedFields.length?\`<span class="pinned">Manually pinned: \${ev.pinnedFields.join(', ')}</span>\`:'';
    const editBtn=EDITABLE?'<button type="button" class="edit-btn">Edit</button>':'';
    const prioTitle=(ev.priorityRationale||'').replace(/"/g,'&quot;');
    const prioBadge=\`<span class="badge priority" title="\${prioTitle}">P\${ev.priority}</span>\`;

    const article=document.createElement('article');
    article.className='card'+(st==='done'?' done':'')+(st==='cancelled'?' cancelled':'');
    article.id=id;
    article.style.setProperty('--c',c);
    article.innerHTML=\`
      <div class="card-head">
        <span class="date">\${fmt(ev)}</span>
        <h3 class="name">\${ev.name}</h3>
        <span class="badge">\${CATS[ev.category]||ev.category}</span>
        \${prioBadge}
        \${audBadges}\${usFlag}\${tbcBadge}\${stBadge}
        \${editBtn}
      </div>
      <p class="place">\${ev.place}</p>
      <p class="angle"><b>Angle · </b>\${ev.angle}</p>
      <p class="post">\${ev.postWindow}</p>
      <div class="meta">\${site}\${handle}<span class="tags">\${(ev.hashtags||[]).join(' ')}</span>\${pinned}</div>
    \`;
    list.appendChild(article);
    if(EDITABLE){
      const form=attachEditForm(ev,article);
      article.querySelector('.edit-btn').addEventListener('click',()=>form.classList.toggle('open'));
    }
  });
}

renderBanner();
buildStrip();
render();
</script>
</body>
</html>
`;
}

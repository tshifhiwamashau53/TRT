(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const savedKey = 'trt-saved-routes';
  const state = { route:'ALL', query:'', direction:'', order:'time', shown:30 };
  let trips = [];

  async function loadTrips(){
    try{
      const source = await fetch('assets/js/app.js',{cache:'no-store'}).then(r=>r.text());
      const start = source.indexOf('const trips=[') + 'const trips='.length;
      const endMarker = '].map(([route,time,from,to])=>({route,time,from,to}));';
      const end = source.indexOf(endMarker);
      if(start < 0 || end < 0) throw new Error('Timetable data not found');
      const raw = Function('return ' + source.slice(start,end+1))();
      trips = raw.map(([route,time,from,to]) => ({route,time,from,to}));
    }catch(e){
      trips = [];
      console.error('TRT timetable load failed',e);
    }
    render();
    renderPlannerMessage();
  }

  function saved(){try{return JSON.parse(localStorage.getItem(savedKey)||'[]')}catch{return []}}
  function setSaved(list){localStorage.setItem(savedKey,JSON.stringify([...new Set(list)]));updateStars()}
  function isSaved(route){return saved().includes(route)}
  function updateStars(){
    $$('.star-route').forEach(b=>{const on=isSaved(b.dataset.save);b.classList.toggle('saved',on);b.textContent=on?'★':'☆'});
    const r=state.route==='ALL'?'':state.route;
    const b=$('#saveCurrentRoute'); if(b){b.textContent=r?(isSaved(r)?'★ Saved '+r:'☆ Save '+r):'☆ Select a route to save';b.disabled=!r}
  }
  function esc(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function filtered(){
    const q=state.query.trim().toLowerCase();
    let list=trips.filter(t=>{
      if(state.route!=='ALL'&&t.route!==state.route)return false;
      const field=state.direction==='from'?t.from:state.direction==='to'?t.to:`${t.route} ${t.time} ${t.from} ${t.to}`;
      return !q || field.toLowerCase().includes(q);
    });
    list.sort((a,b)=>state.order==='route'?a.route.localeCompare(b.route)||a.time.localeCompare(b.time):a.time.localeCompare(b.time));
    return list;
  }
  function render(){
    const list=filtered(), shown=list.slice(0,state.shown), box=$('#timetableList');
    if(!box)return;
    $('#resultCount').textContent=`${list.length} result${list.length===1?'':'s'}`;
    box.innerHTML=shown.length?shown.map((t,i)=>`<article class="trip-row"><div class="trip-time">${esc(t.time)}</div><div class="trip-route">${esc(t.route)}</div><div class="trip-direction">${esc(t.from)}<span>to ${esc(t.to)}</span></div><div class="trip-arrow">→</div><button class="star-trip ${isSaved(t.route)?'saved':''}" data-trip-route="${esc(t.route)}" title="Save route">${isSaved(t.route)?'★':'☆'}</button></article>`).join(''):'<div class="empty-state">No timetable entries match your search. Try another place, route or time.</div>';
    const load=$('#loadMore'); if(load)load.style.display=list.length>state.shown?'block':'none';
    const next=list[0]||trips[0];
    if(next){$('#nextDepartureTime').textContent=next.time;$('#nextDepartureText').textContent=`${next.route} · ${next.from} → ${next.to}`}
    $$('.star-trip').forEach(b=>b.addEventListener('click',()=>{const r=b.dataset.tripRoute;const s=saved();setSaved(s.includes(r)?s.filter(x=>x!==r):[...s,r]);render()}));
    updateStars();
  }
  function renderPlannerMessage(){
    const r=$('#plannerResult');if(!r)return;
    r.innerHTML='<div class="result-card">Enter an origin and destination, then select <b>Find trips</b>.</div>';
  }
  function plan(){
    const route=$('#plannerRoute').value, from=$('#plannerFrom').value.trim().toLowerCase(), to=$('#plannerTo').value.trim().toLowerCase();
    let found=trips.filter(t=>(!route||t.route===route)&&(!from||t.from.toLowerCase().includes(from))&&(!to||t.to.toLowerCase().includes(to)));
    if($('#favoritesOnly').checked)found=found.filter(t=>isSaved(t.route));
    found.sort((a,b)=>a.time.localeCompare(b.time));
    const r=$('#plannerResult');
    if(!found.length){r.innerHTML='<div class="result-card"><b>No direct match found.</b><br>Try a shorter place name, remove one field, or choose another route.</div>';return}
    r.innerHTML=`<div class="result-card"><b>${found.length} matching scheduled departure${found.length===1?'':'s'}.</b><div class="planner-result-list">${found.slice(0,15).map(t=>`<div class="planner-trip"><strong>${esc(t.time)}</strong><span class="route-pill">${esc(t.route)}</span><p>${esc(t.from)} → ${esc(t.to)}</p><small>Reference schedule</small></div>`).join('')}</div>${found.length>15?'<p><small>Showing the first 15 matches.</small></p>':''}</div>`;
  }
  function siteSearch(){
    const q=$('#siteSearch').value.trim().toLowerCase(), box=$('#searchResults');
    if(!q){box.hidden=true;return}
    const routes=['D23','D24','D25','D26'];
    const results=[];
    routes.filter(r=>r.toLowerCase().includes(q)).forEach(r=>results.push([`Route ${r}`,'#timetables',r]));
    const matches=trips.filter(t=>`${t.route} ${t.from} ${t.to}`.toLowerCase().includes(q)).slice(0,5);
    matches.forEach(t=>results.push([`${t.route} · ${t.time} · ${t.from} → ${t.to}`,'#timetables',t.route]));
    if(/contact|phone|email|office/.test(q))results.push(['Contact TRT','#contact','Contact']);
    if(/notice|suspend|mamelodi/.test(q))results.push(['Mamelodi service notice','#notices','Notice']);
    box.innerHTML=results.length?results.slice(0,8).map(x=>`<a class="search-result" href="${x[1]}" data-search-route="${x[2]}">${esc(x[0])}</a>`).join(''):'<div class="search-result">No result found. Try a route or place name.</div>';
    box.hidden=false;
    $$('.search-result[data-search-route]').forEach(a=>a.addEventListener('click',()=>{const r=a.dataset.searchRoute;if(/^D2[3-6]$/.test(r)){state.route=r;state.shown=30;activateRoute(r);render()}}));
  }
  function activateRoute(route){
    $$('#routeTabs button').forEach(b=>b.classList.toggle('active',b.dataset.route===route));
    document.querySelector('#timetables')?.scrollIntoView({behavior:'smooth'});
  }

  $$('#routeTabs button').forEach(b=>b.addEventListener('click',()=>{state.route=b.dataset.route;state.shown=30;activateRoute(state.route);render()}));
  $('#timeSearch').addEventListener('input',e=>{state.query=e.target.value;state.shown=30;render()});
  $('#direction').addEventListener('change',e=>{state.direction=e.target.value;state.shown=30;render()});
  $('#timeOrder').addEventListener('change',e=>{state.order=e.target.value;render()});
  $('#loadMore').addEventListener('click',()=>{state.shown+=30;render()});
  $('#plannerBtn').addEventListener('click',plan);
  $('#favoritesOnly').addEventListener('change',plan);
  $('#clearPlanner').addEventListener('click',()=>{$('#plannerRoute').value='';$('#plannerFrom').value='';$('#plannerTo').value='';$('#favoritesOnly').checked=false;renderPlannerMessage()});
  $('#swapPlanner').addEventListener('click',()=>{const a=$('#plannerFrom'),b=$('#plannerTo');[a.value,b.value]=[b.value,a.value];plan()});
  $$('.route-link').forEach(b=>b.addEventListener('click',()=>{state.route=b.dataset.open;state.query='';$('#timeSearch').value='';state.shown=30;activateRoute(state.route);render()}));
  $$('.star-route').forEach(b=>b.addEventListener('click',()=>{const r=b.dataset.save,s=saved();setSaved(s.includes(r)?s.filter(x=>x!==r):[...s,r])}));
  $('#saveCurrentRoute').addEventListener('click',()=>{if(state.route!=='ALL'){const s=saved();setSaved(s.includes(state.route)?s.filter(x=>x!==state.route):[...s,state.route])}});
  $('#showSaved').addEventListener('click',()=>{const s=saved();if(!s.length){alert('No routes saved on this device yet.');return}state.route=s[0];activateRoute(state.route);render()});
  $('#shareTimetable').addEventListener('click',async()=>{const url=location.href.split('#')[0]+'#timetables';const text=`TRT timetable search: ${state.route==='ALL'?'All routes':state.route}`;try{if(navigator.share)await navigator.share({title:'TRT timetable',text,url});else await navigator.clipboard.writeText(url),alert('Timetable link copied.')}catch{}});
  $('#printTimetable').addEventListener('click',()=>window.print());
  $('#largeText').addEventListener('click',()=>document.body.classList.toggle('large-text'));
  $('#siteSearch').addEventListener('input',siteSearch);$('#siteSearchBtn').addEventListener('click',siteSearch);
  $('.menu-toggle').addEventListener('click',e=>{const n=$('.nav');n.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',n.classList.contains('open'))});
  $$('.nav a').forEach(a=>a.addEventListener('click',()=>$('.nav').classList.remove('open')));
  $('#year').textContent=new Date().getFullYear();
  loadTrips();
})();

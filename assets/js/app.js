const routes=[
 {number:'T1',name:'Central Connector',from:'CBD',to:'Midrand',time:'Every 15 min',stops:['CBD','Park Station','Sandton','Midrand']},
 {number:'T2',name:'North Link',from:'Pretoria',to:'Soshanguve',time:'Every 20 min',stops:['Pretoria','Wonderboom','Mabopane','Soshanguve']},
 {number:'T3',name:'East Express',from:'Kempton Park',to:'Sandton',time:'Every 20 min',stops:['Kempton Park','Edenvale','Greenstone','Sandton']},
 {number:'T4',name:'South Line',from:'CBD',to:'Soweto',time:'Every 15 min',stops:['CBD','Booysens','Dobsonville','Soweto']},
 {number:'T5',name:'Airport Link',from:'OR Tambo',to:'CBD',time:'Every 30 min',stops:['OR Tambo','Germiston','Jeppe','CBD']},
 {number:'T6',name:'West Connector',from:'Roodepoort',to:'CBD',time:'Every 20 min',stops:['Roodepoort','Florida','Brixton','CBD']}
];
const stops=[...new Set(routes.flatMap(r=>r.stops))].sort();
const routeGrid=document.querySelector('#routeGrid');
const stopList=document.querySelector('#stopList');
const from=document.querySelector('#from'); const to=document.querySelector('#to');
function routeCard(r){return `<article class="route-card"><div class="route-top"><span class="route-number">${r.number}</span><span class="badge">Active</span></div><h3>${r.name}</h3><p>${r.from} → ${r.to}</p><div class="route-meta"><span>⏱ ${r.time}</span><span>● ${r.stops.length} stops</span></div></article>`}
function renderRoutes(filter=''){const q=filter.toLowerCase();routeGrid.innerHTML=routes.filter(r=>(r.number+' '+r.name+' '+r.from+' '+r.to+' '+r.stops.join(' ')).toLowerCase().includes(q)).map(routeCard).join('')||'<p>No matching routes found.</p>'}
function renderStops(filter=''){const q=filter.toLowerCase();stopList.innerHTML=stops.filter(s=>s.toLowerCase().includes(q)).map(s=>{const served=routes.filter(r=>r.stops.includes(s)).map(r=>r.number).join(', ');return `<article class="stop-card"><strong>${s}</strong><span>Routes: ${served}</span></article>`}).join('')||'<p>No matching stops found.</p>'}
function fillSelects(){[from,to].forEach(sel=>stops.forEach(s=>{const o=document.createElement('option');o.value=s;o.textContent=s;sel.appendChild(o)}))}
document.querySelector('#tripForm').addEventListener('submit',e=>{e.preventDefault();const a=from.value,b=to.value,res=document.querySelector('#plannerResult');if(!a||!b){res.innerHTML='<div class="result-card">Please select both your starting point and destination.</div>';return}if(a===b){res.innerHTML='<div class="result-card">Your starting point and destination are the same.</div>';return}const matches=routes.filter(r=>r.stops.includes(a)&&r.stops.includes(b));if(matches.length){res.innerHTML=`<div class="result-card"><strong>${matches.length} route${matches.length>1?'s':''} found.</strong> ${matches.map(r=>`${r.number} — ${r.name} (${r.time})`).join(' · ')}</div>`}else{res.innerHTML='<div class="result-card"><strong>No direct route found.</strong> Try another stop or check the route list above.</div>'}});
document.querySelector('#swapBtn').addEventListener('click',()=>{const x=from.value;from.value=to.value;to.value=x});
document.querySelector('#routeSearch').addEventListener('input',e=>renderRoutes(e.target.value));
document.querySelector('#stopSearch').addEventListener('input',e=>renderStops(e.target.value));
document.querySelector('.menu-toggle').addEventListener('click',e=>{const nav=document.querySelector('.nav');nav.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',nav.classList.contains('open'))});
document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>document.querySelector('.nav').classList.remove('open')));
document.querySelector('#year').textContent=new Date().getFullYear();
fillSelects();renderRoutes();renderStops();

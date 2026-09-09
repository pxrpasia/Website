const config=window.PRIME_X_CONFIG||{};
const $=s=>document.querySelector(s);

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();

function init(){
  const year=$("#year"); if(year) year.textContent=new Date().getFullYear();
  const loader=$("#loader"), bar=$("#loadBar");

  // Fail-safe loader: it can never trap the visitor on the loading screen.
  if(loader){
    let progress=0, finished=false;
    const finish=()=>{
      if(finished) return;
      finished=true;
      if(bar) bar.style.width='100%';
      loader.classList.add('hide');
      setTimeout(()=>{loader.remove();},900);
    };
    const start=performance.now();
    const tick=now=>{
      if(finished) return;
      const elapsed=now-start;
      progress=Math.min(100, Math.round((elapsed/3200)*100));
      // Ease-out progress so the final part feels smooth.
      const eased=1-Math.pow(1-progress/100,2);
      if(bar) bar.style.width=(eased*100)+'%';
      if(progress>=100) finish();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // Extra safety for slow devices / blocked animation frames.
    window.setTimeout(finish,4500);
    window.addEventListener('load',()=>window.setTimeout(finish,250),{once:true});
  }

  const menu=$("#menuBtn"), nav=$("#navLinks");
  menu?.addEventListener('click',()=>nav?.classList.toggle('open'));
  document.querySelectorAll('#navLinks a').forEach(a=>a.addEventListener('click',()=>nav?.classList.remove('open')));

  const top=$("#scrollTop");
  window.addEventListener('scroll',()=>{if(top) top.classList.toggle('show',window.scrollY>500)},{passive:true});
  top?.addEventListener('click',e=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});});

  const page=document.body.dataset.page;
  document.querySelectorAll('[data-page]').forEach(a=>a.classList.toggle('active',a.dataset.page===page));
}

// Live FiveM player counter for Prime X Roleplay.
const PRIME_X_CFX_CODE='89e8ov';
let primeXLiveTimer=null;

function setPrimeXLiveState(online,count,max){
  const countEl=document.querySelector('#livePlayers');
  const maxEl=document.querySelector('#maxPlayers');
  const statusEl=document.querySelector('#serverStatus');
  const dot=document.querySelector('#serverDot');
  if(!countEl || !maxEl || !statusEl) return;
  const n=Number(count), m=Number(max);
  countEl.textContent=Number.isFinite(n) && n>=0 ? String(Math.floor(n)) : '--';
  maxEl.textContent=Number.isFinite(m) && m>0 ? String(Math.floor(m)) : '64';
  statusEl.textContent=online?'ONLINE':'OFFLINE';
  if(dot){
    dot.classList.toggle('server-offline',!online);
    dot.classList.toggle('server-online',!!online);
  }
}

async function fetchPrimeXLiveOnce(){
  try{
    const r=await fetch(`https://cfxr.cc/api/resolve/${PRIME_X_CFX_CODE}?fields=name,players,maxPlayers`,{cache:'no-store'});
    if(!r.ok) throw new Error('CFXR '+r.status);
    const d=await r.json();
    const n=Number(d?.players), m=Number(d?.maxPlayers);
    if(!Number.isFinite(n) || n<0) throw new Error('No player count');
    setPrimeXLiveState(d?.online!==false,n,Number.isFinite(m)&&m>0?m:64);
    return true;
  }catch(e){ return false; }
}

function startPrimeXLivePlayers(){
  if(!document.querySelector('#livePlayers')) return;
  fetchPrimeXLiveOnce();
  if(primeXLiveTimer) clearInterval(primeXLiveTimer);
  primeXLiveTimer=setInterval(fetchPrimeXLiveOnce,30000);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',startPrimeXLivePlayers,{once:true});
else startPrimeXLivePlayers();

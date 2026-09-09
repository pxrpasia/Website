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
// Uses CFXR's CFX-re.livedata resolver with CORS support.
// Join code: cfx.re/join/89e8ov
const SERVER_JOIN_CODE='89e8ov';
const SERVER_MAX_FALLBACK=64;
let liveStream;

function renderLive(online,count,max){
  const countEl=document.querySelector('#livePlayers');
  const maxEl=document.querySelector('#maxPlayers');
  const statusEl=document.querySelector('#serverStatus');
  const dot=document.querySelector('#serverDot');
  if(!countEl || !maxEl || !statusEl) return;

  countEl.textContent=Number.isFinite(count)?String(count):'--';
  maxEl.textContent=Number.isFinite(max)&&max>0?String(max):String(SERVER_MAX_FALLBACK);
  statusEl.textContent=online?'ONLINE':'OFFLINE';
  if(dot){
    dot.classList.toggle('server-offline',!online);
    dot.classList.toggle('server-online',online);
  }
}

async function fetchLivePlayers(){
  try{
    const url=`https://cfxr.cc/api/resolve/${SERVER_JOIN_CODE}?fields=name,players,maxPlayers`;
    const response=await fetch(url,{headers:{Accept:'application/json'},cache:'no-store'});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const data=await response.json();
    const count=Number(data?.players);
    const max=Number(data?.maxPlayers);
    if(!Number.isFinite(count)) throw new Error('Player count unavailable');
    renderLive(true,count,Number.isFinite(max)?max:SERVER_MAX_FALLBACK);
    return true;
  }catch(error){
    renderLive(false,NaN,SERVER_MAX_FALLBACK);
    return false;
  }
}

function startLivePlayerStream(){
  if(!document.querySelector('#livePlayers')) return;
  fetchLivePlayers();

  // CFXR sends a live update roughly every 30 seconds.
  try{
    liveStream=new EventSource(`https://cfxr.cc/api/servers/${SERVER_JOIN_CODE}/live`);
    liveStream.addEventListener('update',event=>{
      try{
        const data=JSON.parse(event.data);
        renderLive(Boolean(data?.online),Number(data?.players),Number(data?.maxPlayers)||SERVER_MAX_FALLBACK);
      }catch(_){}
    });
    liveStream.onerror=()=>{
      // EventSource may reconnect automatically; fetch keeps the card useful meanwhile.
      fetchLivePlayers();
    };
  }catch(_){
    // Fallback polling if EventSource is unavailable.
    window.setInterval(fetchLivePlayers,30000);
  }
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',startLivePlayerStream,{once:true});
}else{
  startLivePlayerStream();
}

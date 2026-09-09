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
// Uses CFXR's live SSE stream (updates every ~30s) with a JSON fallback.
const PRIME_X_CFX_CODE='89e8ov';
let primeXLiveStream=null;
let primeXLiveFallbackTimer=null;

function setPrimeXLiveState(online,count,max){
  const countEl=document.querySelector('#livePlayers');
  const maxEl=document.querySelector('#maxPlayers');
  const statusEl=document.querySelector('#serverStatus');
  const dot=document.querySelector('#serverDot');
  if(!countEl || !maxEl || !statusEl) return;

  // Do not turn a valid zero into OFFLINE; 0 is a real player count.
  const validCount=Number.isFinite(Number(count));
  const validMax=Number.isFinite(Number(max)) && Number(max)>0;
  countEl.textContent=validCount?String(Number(count)):'--';
  maxEl.textContent=validMax?String(Number(max)):'--';
  statusEl.textContent=online?'ONLINE':'OFFLINE';
  if(dot){
    dot.classList.toggle('server-offline',!online);
    dot.classList.toggle('server-online',!!online);
  }
}

async function fetchPrimeXLiveOnce(){
  try{
    const response=await fetch(`https://cfxr.cc/api/resolve/${PRIME_X_CFX_CODE}?fields=name,players,maxPlayers`,{cache:'no-store'});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const data=await response.json();
    const count=Number(data?.players);
    const max=Number(data?.maxPlayers);
    const online=(data?.online===true) || (Number.isFinite(count) && count>=0 && Number.isFinite(max) && max>0);
    if(!Number.isFinite(count) || !Number.isFinite(max) || max<=0) throw new Error('incomplete player data');
    setPrimeXLiveState(online,count,max);
    return true;
  }catch(e){
    return false;
  }
}

function startPrimeXLivePlayers(){
  const countEl=document.querySelector('#livePlayers');
  const maxEl=document.querySelector('#maxPlayers');
  const statusEl=document.querySelector('#serverStatus');
  if(!countEl || !maxEl || !statusEl) return;

  // First request gives an immediate value while the live stream connects.
  fetchPrimeXLiveOnce();

  if(typeof EventSource!=='undefined'){
    try{
      primeXLiveStream?.close();
      primeXLiveStream=new EventSource(`https://cfxr.cc/api/servers/${PRIME_X_CFX_CODE}/live`);
      primeXLiveStream.addEventListener('update',event=>{
        try{
          const data=JSON.parse(event.data||'{}');
          const count=Number(data.players);
          const max=Number(data.maxPlayers);
          if(Number.isFinite(count) && Number.isFinite(max) && max>0){
            setPrimeXLiveState(data.online!==false,count,max);
          }
        }catch(e){}
      });
      primeXLiveStream.onerror=()=>{
        // CFXR closes the stream after a few minutes; EventSource reconnects automatically.
        // Keep a normal poll running as a backup in case the browser blocks SSE.
        if(!primeXLiveFallbackTimer){
          primeXLiveFallbackTimer=window.setInterval(fetchPrimeXLiveOnce,30000);
        }
      };
    }catch(e){
      window.setInterval(fetchPrimeXLiveOnce,30000);
    }
  }else{
    window.setInterval(fetchPrimeXLiveOnce,30000);
  }
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',startPrimeXLivePlayers,{once:true});
}else{
  startPrimeXLivePlayers();
}

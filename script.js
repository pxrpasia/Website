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
// The public CFX join code is used through a read-only server lookup API.
async function updateLivePlayers(){
  const countEl=document.querySelector('#livePlayers');
  const maxEl=document.querySelector('#maxPlayers');
  const statusEl=document.querySelector('#serverStatus');
  const dot=document.querySelector('#serverDot');
  if(!countEl || !maxEl || !statusEl) return;

  const setState=(online,count,max)=>{
    countEl.textContent=Number.isFinite(count)?count:'--';
    maxEl.textContent=Number.isFinite(max)?max:'--';
    statusEl.textContent=online?'ONLINE':'OFFLINE';
    if(dot){
      dot.classList.toggle('server-offline',!online);
      dot.classList.toggle('server-online',online);
    }
  };

  try{
    const response=await fetch('https://api.cfxfind.com/v1/servers/89e8ov',{headers:{Accept:'application/json'},cache:'no-store'});
    if(!response.ok) throw new Error('lookup failed');
    const snapshot=await response.json();
    const players=snapshot?.data?.players;
    const count=Number(players?.count);
    const max=Number(players?.max);
    if(!Number.isFinite(count)) throw new Error('player count unavailable');
    setState(true,count,Number.isFinite(max)?max:0);
  }catch(error){
    setState(false,NaN,NaN);
  }
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>{
    updateLivePlayers();
    window.setInterval(updateLivePlayers,60000);
  },{once:true});
}else{
  updateLivePlayers();
  window.setInterval(updateLivePlayers,60000);
}


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

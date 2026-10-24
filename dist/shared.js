'use strict';
(() => {
  const backTop=document.querySelector('#back-top');
  if(!backTop)return;
  let returning=false,scrollFrame=0;
  function update(){
    scrollFrame=0;
    const y=window.scrollY;
    if(y<5)returning=false;
    const remaining=document.documentElement.scrollHeight-window.innerHeight-y;
    const show=y>180&&remaining<Math.min(140,window.innerHeight*.18)&&!returning;
    backTop.classList.toggle('is-visible',show);
    backTop.setAttribute('aria-hidden',String(!show));backTop.tabIndex=show?0:-1;
  }
  function schedule(){if(!scrollFrame)scrollFrame=requestAnimationFrame(update);}
  function localize(){
    const chinese=document.documentElement.lang.startsWith('zh');
    backTop.setAttribute('aria-label',chinese?'返回顶部':'Back to top');
  }
  backTop.addEventListener('click',()=>{returning=true;update();window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('portfolio:language-change',localize);localize();update();
})();

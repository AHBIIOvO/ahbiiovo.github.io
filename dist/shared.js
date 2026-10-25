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

// One scale for the paired navigation, bounded by the 74px dividers.
(() => {
  const nav=document.querySelector('.project-next');
  const divider=nav?.querySelector('.project-nav-divider');
  if(!nav||!divider)return;
  const items=[...nav.children].filter(e=>e!==divider);
  const probe=document.createElement('span');
  probe.setAttribute('aria-hidden','true');
  probe.style.cssText='position:fixed;left:-10000px;top:0;visibility:hidden;white-space:nowrap;pointer-events:none';
  document.body.append(probe);
  let frame=0,lastWidth=-1;
  const words=text=>text.match(/[A-Za-z0-9]+(?:[-’'][A-Za-z0-9]+)*/g)||[];
  function texts(item){
    return item.matches('.project-nav-end')?[item.firstElementChild]
      :[...item.querySelectorAll('.small-label,strong,.jump-content>span')];
  }
  function fits(){
    const bar=items[0].getBoundingClientRect();
    return items.every(item=>{
      const column=item.getBoundingClientRect();
      const inside=rect=>rect.top>=bar.top+6&&rect.bottom<=bar.bottom-6
        &&rect.left>=column.left-.25&&rect.right<=column.right+.25;
      const elements=[...texts(item),...item.querySelectorAll('.detail-icon')];
      if(elements.some(e=>!inside(e.getBoundingClientRect())))return false;
      return texts(item).every(element=>{
        const range=document.createRange();range.selectNodeContents(element);
        const bounds=element.getBoundingClientRect();
        if([...range.getClientRects()].some(rect=>!inside(rect)||rect.left<bounds.left-.25||rect.right>bounds.right+.25))return false;
        const style=getComputedStyle(element);
        probe.style.font=style.font;probe.style.letterSpacing=style.letterSpacing;
        return words(element.textContent).every(word=>{
          probe.textContent=word;
          return probe.getBoundingClientRect().width<=element.getBoundingClientRect().width+.25;
        });
      });
    });
  }
  function fit(){
    frame=0;
    nav.style.removeProperty('--project-nav-scale');
    if(nav.clientWidth<1)return;
    // Measure layout without an in-flight hover/focus transform influencing the fit.
    nav.classList.add('is-fitting');
    if(!fits()){
      let low=.1,high=1;
      for(let i=0;i<14;i++){
        const scale=(low+high)/2;
        nav.style.setProperty('--project-nav-scale',String(scale));
        if(fits())low=scale;else high=scale;
      }
      nav.style.setProperty('--project-nav-scale',String(Math.floor(low*10000)/10000));
    }
    probe.textContent='';
    nav.classList.remove('is-fitting');
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(fit);}
  new ResizeObserver(entries=>{
    const width=entries[0].contentRect.width;
    if(Math.abs(width-lastWidth)>.5){lastWidth=width;schedule();}
  }).observe(nav);
  window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('portfolio:language-change',schedule);
  document.fonts.ready.then(schedule);
  schedule();
})();

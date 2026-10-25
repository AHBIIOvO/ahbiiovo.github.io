'use strict';
const languageButton = document.querySelector('#language');
let language = 'en';
const detailIconPaths = {
  '↗':'M7 17 17 7M7 7h10v10', '↖':'M17 17 7 7m0 10V7h10',
  '←':'M19 12H5m6-6-6 6 6 6', '↑':'M12 20V4m-6 6 6-6 6 6',
  '→':'M5 12h14m-6-6 6 6-6 6', '▶':'m9 5 11 7-11 7Z',
  '×':'m6 6 12 12M6 18 18 6',
  globe:'M3.5 12h17M12 3.5c-4.5 4.8-4.5 12.2 0 17 4.5-4.8 4.5-12.2 0-17Z'
};
function detailIcon(symbol) {
  return `<svg class="detail-icon" viewBox="0 0 24 24" aria-hidden="true">${symbol==='globe'?'<circle cx="12" cy="12" r="8.5"/>':''}<path d="${detailIconPaths[symbol]}"/></svg>`;
}
function decorateSymbols() {
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const nodes=[];while(walker.nextNode())if(!['SCRIPT','STYLE'].includes(walker.currentNode.parentElement.tagName)&&/[↗↖←↑→▶×]/.test(walker.currentNode.textContent))nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    const fragment=document.createDocumentFragment();
    node.textContent.split(/([↗↖←↑→▶×])/).forEach(part=>{
      if(detailIconPaths[part]){const template=document.createElement('template');template.innerHTML=detailIcon(part);fragment.append(template.content);}
      else fragment.append(document.createTextNode(part));
    });node.replaceWith(fragment);
  });
}
try { language = localStorage.getItem('portfolio-language') === 'zh' ? 'zh' : 'en'; } catch {}
function setLanguage(value) {
  language = value;
  document.documentElement.lang = value === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-en][data-zh]').forEach(element => {
    element.textContent = element.dataset[value];
  });
  languageButton.innerHTML = `${detailIcon('globe')}<span>${value === 'en' ? '中文' : 'English'}</span>`;
  languageButton.setAttribute('aria-label', value === 'en' ? '切换到中文' : 'Switch to English');
  const closeButton = document.querySelector('.close-dialog');
  if (closeButton) closeButton.innerHTML = `<span>${value === 'en' ? 'Close' : '关闭'}</span>${detailIcon('×')}`;
  document.title = value === 'en' ? (document.body.dataset.titleEn || 'AHBIIOvO — Game & Interactive Experiences') : (document.body.dataset.titleZh || 'AHBIIOvO — 游戏开发与交互作品集');
  try { localStorage.setItem('portfolio-language', value); } catch {}
  decorateSymbols();
  document.dispatchEvent(new CustomEvent('portfolio:language-change'));
}
setLanguage(language);
languageButton.addEventListener('click', () => setLanguage(language === 'en' ? 'zh' : 'en'));

// Only an explicit visitor action creates the third-party player.
const player = document.querySelector('#demo-player');
const videoButtons = [...document.querySelectorAll('[data-video]')];
const allowedVideos = new Set(videoButtons.map(button => button.dataset.video));
let selectedVideo = 'BV1oBssenEVH';
function loadVideo(id) {
  if (!allowedVideos.has(id)) return;
  selectedVideo = id;
  const frame = document.createElement('iframe');
  // Official external player endpoint; HTTPS also works in local file previews.
  frame.src = `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(id)}&autoplay=0`;
  frame.title = id === 'BV1oBssenEVH' ? 'FPS prototype — full demo (Bilibili)' : 'Magazine inspection and emergency reload animations (Bilibili)';
  frame.scrolling = 'no';
  frame.allow = 'fullscreen; picture-in-picture';
  frame.allowFullscreen = true;
  player.replaceChildren(frame);
  document.querySelector('#bilibili-link').href = `https://www.bilibili.com/video/${id}/`;
  videoButtons.forEach(button => {
    const active = button.dataset.video === id;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}
document.querySelector('#load-video')?.addEventListener('click', () => loadVideo(selectedVideo));
videoButtons.forEach(button => button.addEventListener('click', () => loadVideo(button.dataset.video)));

const imageDialog = document.querySelector('#image-dialog');
document.querySelectorAll('[data-image]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelector('#dialog-image').src = button.dataset.image;
    document.querySelector('#dialog-image').alt = button.querySelector('img').alt;
    document.querySelector('#dialog-caption').textContent = (language === 'zh' ? button.dataset.captionZh : button.dataset.captionEn) || button.dataset.caption;
    imageDialog.showModal();
  });
});
imageDialog?.addEventListener('click', event => {
  if (event.target === imageDialog) {
    const box = imageDialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) imageDialog.close();
  }
});
document.querySelector('#year').textContent = new Date().getFullYear();

// Keep the horizontal loop only while every label fits on one line.
// The compact class is present in HTML as a no-script fallback.
(() => {
  const flow = document.querySelector('.interaction-loop');
  if (!flow) return;
  const steps = [...flow.querySelectorAll('.flow-step')];
  let frame = 0, lastWidth = -1;
  function fit() {
    frame = 0;
    if (!flow.clientWidth) return;
    flow.classList.remove('is-compact');
    const tooNarrow = steps.some(step => step.scrollWidth > step.clientWidth + .5);
    flow.classList.toggle('is-compact', tooNarrow);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(fit); }
  new ResizeObserver(entries => {
    const width = entries[0].contentRect.width;
    if (Math.abs(width - lastWidth) > .5) { lastWidth = width; schedule(); }
  }).observe(flow);
  window.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('portfolio:language-change', schedule);
  document.fonts.ready.then(schedule);
  schedule();
})();

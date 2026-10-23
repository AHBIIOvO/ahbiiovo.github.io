'use strict';
const languageButton = document.querySelector('#language');
let language = 'en';
try { language = localStorage.getItem('portfolio-language') === 'zh' ? 'zh' : 'en'; } catch {}
function setLanguage(value) {
  language = value;
  document.documentElement.lang = value === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-en][data-zh]').forEach(element => {
    element.textContent = element.dataset[value];
  });
  languageButton.innerHTML = value === 'en' ? '中文 <span>↗</span>' : 'EN <span>↗</span>';
  languageButton.setAttribute('aria-label', value === 'en' ? '切换到中文' : 'Switch to English');
  const closeButton = document.querySelector('.close-dialog');
  if (closeButton) closeButton.textContent = value === 'en' ? 'Close ×' : '关闭 ×';
  document.title = value === 'en' ? (document.body.dataset.titleEn || 'AHBIIOvO — Game & Interactive Experiences') : (document.body.dataset.titleZh || 'AHBIIOvO — 游戏开发与交互作品集');
  try { localStorage.setItem('portfolio-language', value); } catch {}
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
  frame.src = `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(id)}&p=1&autoplay=0&danmaku=0&poster=1`;
  frame.title = id === 'BV1oBssenEVH' ? 'FPS prototype — full demo (Bilibili)' : 'Magazine inspection and emergency reload animations (Bilibili)';
  frame.allow = 'fullscreen; picture-in-picture; encrypted-media';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
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
    document.querySelector('#dialog-caption').textContent = button.dataset.caption;
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

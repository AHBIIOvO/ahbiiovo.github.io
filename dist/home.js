'use strict';

(() => {
  const projects = window.portfolioProjects || [];
  const projectList = document.querySelector('#project-list');
  const arrow = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
  const localized = (tag, className, copy) => {
    const element = document.createElement(tag);
    element.className = className;
    element.dataset.en = copy.en;
    element.dataset.zh = copy.zh;
    element.textContent = copy.en;
    return element;
  };

  const fragment = document.createDocumentFragment();
  projects.forEach((project, index) => {
    const card = document.createElement('a');
    card.className = 'project-card';
    card.href = project.href;
    card.dataset.project = project.id;
    card.dataset.enLabel = `${project.title} — view project`;
    card.dataset.zhLabel = `${project.title} — 查看项目`;

    const media = document.createElement('div');
    media.className = 'card-media';
    const crop = project.image.crop;
    const ns = 'http://www.w3.org/2000/svg';
    const image = crop ? document.createElementNS(ns, 'svg') : document.createElement('img');
    if (crop) {
      // Crop only the homepage viewport; retain the source capture on the detail
      // page. The edge extensions use the same game-only rectangle.
      image.classList.add('card-crop');
      image.setAttribute('viewBox', `${crop.x} ${crop.y} ${crop.width} ${crop.height}`);
      image.setAttribute('role', 'img');
      image.setAttribute('aria-label', project.image.alt);
      const source = document.createElementNS(ns, 'image');
      source.setAttribute('href', project.image.src);
      source.setAttribute('width', project.image.width);
      source.setAttribute('height', project.image.height);
      const clip = document.createElementNS(ns, 'clipPath');
      clip.id = `card-crop-${project.id}`;
      clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
      const rect = document.createElementNS(ns, 'rect');
      Object.entries(crop).forEach(([key, value]) => rect.setAttribute(key, value));
      clip.append(rect);
      source.setAttribute('clip-path', `url(#${clip.id})`);
      image.append(clip, source);
    } else {
      Object.assign(image, { src: project.image.src, alt: project.image.alt, width: project.image.width, height: project.image.height, loading: 'lazy', decoding: 'async' });
    }
    const region = crop || { x: 0, y: 0, width: project.image.width, height: project.image.height };
    const edgeSlices = {
      left: [region.x, region.y, 1, region.height],
      right: [region.x + region.width - 1, region.y, 1, region.height],
      top: [region.x, region.y, region.width, 1],
      bottom: [region.x, region.y + region.height - 1, region.width, 1]
    };
    Object.entries(edgeSlices).forEach(([side, rectangle]) => {
      const edge = document.createElement('span');
      edge.className = `media-edge media-edge-${side}`;
      edge.setAttribute('aria-hidden', 'true');
      const slice = document.createElementNS(ns, 'svg');
      slice.setAttribute('viewBox', rectangle.join(' '));
      slice.setAttribute('preserveAspectRatio', 'none');
      const pixels = document.createElementNS(ns, 'image');
      pixels.setAttribute('href', project.image.src);
      pixels.setAttribute('width', project.image.width);
      pixels.setAttribute('height', project.image.height);
      slice.append(pixels);
      edge.append(slice);
      media.append(edge);
    });
    media.append(image);

    const content = document.createElement('div');
    content.className = 'card-content';
    const kicker = document.createElement('p');
    kicker.className = 'card-kicker';
    const number = document.createElement('span');
    number.className = 'card-index';
    number.textContent = String(index + 1).padStart(2, '0');
    const separator = document.createElement('span');
    separator.className = 'card-kicker-separator';
    separator.setAttribute('aria-hidden', 'true');
    const type = document.createElement('span');
    type.textContent = project.type;
    kicker.append(number, separator, type);
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = project.title;
    const description = localized('p', 'card-description', project.description);
    const tools = document.createElement('p');
    tools.className = 'card-tools';
    project.tools.forEach(tool => {
      const label = document.createElement('span');
      label.textContent = tool;
      tools.append(label);
    });
    const bottom = document.createElement('div');
    bottom.className = 'card-bottom';
    const role = localized('span', 'card-role', project.role);
    const next = document.createElement('span');
    next.className = 'card-arrow';
    next.setAttribute('aria-hidden', 'true');
    next.innerHTML = arrow;
    bottom.append(role);
    content.append(kicker, title, description, tools, bottom);
    card.append(media, content, next);
    function measureImage() {
      const scale = Math.min(media.clientWidth / region.width, media.clientHeight / region.height);
      const gapX = Math.max(0, (media.clientWidth - region.width * scale) / 2);
      const gapY = Math.max(0, (media.clientHeight - region.height * scale) / 2);
      media.style.setProperty('--image-gap-x', `${gapX}px`);
      media.style.setProperty('--image-gap-y', `${gapY}px`);
      media.dataset.fill = gapX > .5 ? 'horizontal' : gapY > .5 ? 'vertical' : 'none';
    }
    new ResizeObserver(measureImage).observe(media);
    fragment.append(card);
  });
  projectList.replaceChildren(fragment);

  let language = 'en';
  try { language = localStorage.getItem('portfolio-language') === 'zh' ? 'zh' : 'en'; } catch {}
  const languageButton = document.querySelector('#language');
  function setLanguage(value) {
    language = value;
    document.documentElement.lang = value === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-en][data-zh]').forEach(element => { element.textContent = element.dataset[value]; });
    document.querySelectorAll('[data-en-label][data-zh-label]').forEach(element => { element.setAttribute('aria-label', value === 'zh' ? element.dataset.zhLabel : element.dataset.enLabel); });
    document.querySelector('#language-label').textContent = value === 'en' ? '中文' : 'English';
    languageButton.setAttribute('aria-label', value === 'en' ? '切换到中文' : 'Switch to English');
    document.querySelector('#project-count').textContent = value === 'en' ? `${projects.length}projects` : `${projects.length} 个项目`;
    document.title = value === 'en' ? 'AHBIIOvO — Games & Interactive Experiences' : 'AHBIIOvO — 游戏开发与交互作品集';
    try { localStorage.setItem('portfolio-language', value); } catch {}
    document.dispatchEvent(new CustomEvent('portfolio:language-change'));
  }
  setLanguage(language);
  languageButton.addEventListener('click', () => setLanguage(language === 'en' ? 'zh' : 'en'));
  document.querySelector('#year').textContent = new Date().getFullYear();

})();

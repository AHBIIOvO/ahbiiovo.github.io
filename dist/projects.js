'use strict';

// Add a project here; the homepage handles numbering, alternating layout and language.
window.portfolioProjects = Object.freeze([
  {
    id: 'museum',
    title: 'AI-Driven VR Museum',
    type: 'VR & AI',
    href: 'museum.html',
    image: { src: 'assets/museum-bells.webp', width: 702, height: 701, alt: 'Virtual Bianzhong bells in the AI-driven VR museum' },
    description: {
      en: 'Talk to an AI guide. Play ancient chime bells. A virtual exhibition connecting cultural heritage, speech and interaction.',
      zh: '与 AI 导览员对话，用虚拟钟槌敲响编钟。在 VR 展览中体验文化遗产、语音对话与互动。'
    },
    role: { en: 'Core developer · IEEE VRW 2026', zh: '核心开发者 · IEEE VRW 2026' },
    tools: ['UE5', 'Convai', 'VR']
  },
  {
    id: 'fps',
    title: 'First-Person Shooter',
    type: 'GAMEPLAY',
    href: 'fps.html',
    image: { src: 'assets/fps-animation.webp', width: 743, height: 384, alt: 'First-person weapon animation from an independently developed FPS prototype' },
    description: {
      en: 'An independent FPS prototype, from Blender firearm animation to physical projectiles, destructible targets and hit reactions.',
      zh: '独立开发的 FPS 原型，涵盖 Blender 枪械动画、实体弹丸、靶块破碎与不同身体部位的命中反馈。'
    },
    role: { en: 'Independent developer · Video demo', zh: '独立开发 · 视频演示' },
    tools: ['Blender', 'UE5']
  },
  {
    id: 'outrun',
    title: 'OutRun',
    type: 'PUZZLE GAME',
    href: 'outrun.html',
    image: { src: 'assets/outrun-monitor.webp', width: 1237, height: 674, alt: 'Surveillance monitor with multiple camera views in OutRun' },
    description: {
      en: 'A surveillance-based puzzle prototype. Observe multiple camera feeds and use what you see to navigate a third-person character.',
      zh: '以监控视角为核心的解谜原型。观察多个摄像头画面，利用不同视角的信息操控第三人称角色。'
    },
    role: { en: 'Lead programmer · Multi-camera', zh: '主程序 · 多摄像头交互' },
    tools: ['UE5', 'Multi-camera']
  },
  {
    id: 'campus',
    title: 'BNBU Campus',
    type: 'WEB 3D',
    href: 'campus.html',
    image: { src: 'assets/campus-overview.webp', width: 1600, height: 840, alt: 'BNBU campus scan with library and gymnasium reconstructions' },
    description: {
      en: 'An interactive Three.js campus viewer, combining an optimized aerial scan with locally reconstructed buildings and reversible comparisons.',
      zh: '基于 Three.js 的校园三维浏览页面，将优化后的航拍扫描与局部建筑重建整合，并提供可逆的模型对比。'
    },
    role: { en: 'Web development · Model optimization', zh: '网页开发 · 模型优化' },
    tools: ['Three.js', 'Web 3D']
  }
]);

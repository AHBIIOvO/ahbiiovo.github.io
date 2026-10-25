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
    image: { src: 'assets/fps-animation.webp', width: 743, height: 384, crop: { x: 3, y: 31, width: 580, height: 264 }, alt: 'First-person weapon animation in the FPS prototype' },
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
    title: 'BNBU 3D Campus',
    type: 'WEB 3D',
    href: 'campus.html',
    image: { src: 'assets/campus-overview.webp?v=20261026', width: 1590, height: 875, alt: 'BNBU campus scan with library and gymnasium reconstructions' },
    description: {
      en: 'From drone photogrammetry to a Three.js campus viewer: mesh optimization, selected building reconstruction and scan/model comparisons.',
      zh: '从无人机摄影测量到 Three.js 校园浏览：网格优化、局部建筑重建，以及扫描与重建模型的对比。'
    },
    role: { en: 'Web development · Model optimization', zh: '网页开发 · 模型优化' },
    tools: ['Three.js', 'Web 3D']
  }
]);

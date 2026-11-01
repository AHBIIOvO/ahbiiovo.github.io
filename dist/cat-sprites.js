'use strict';

// Sprite windows keep the reference artwork; transitions share a fixed paw baseline.
(() => {
  const art = document.querySelector('#cat-art');
  if (!art) return;
  const ns = 'http://www.w3.org/2000/svg';
  const source = 'assets/cat-clean.png';
  const frames = {
    front: [28, 24, 184, 212, 52],
    sleep: [730, 691, 257, 132],
    stretch: [28, 524, 196, 138],
    groom: [899, 861, 134, 181],
    jump: [715, 466, 166, 192],
    land: [508, 495, 182, 163],
    reach: [1090, 466, 162, 201],
    run0: [25, 274, 158, 172], run1: [193, 274, 165, 173],
    run2: [365, 271, 166, 176], run3: [537, 273, 173, 174],
    run4: [726, 272, 174, 175], run5: [906, 267, 177, 180],
    run6: [1086, 271, 170, 176]
  };
  const create = (name, attrs = {}) => {
    const e = document.createElementNS(ns, name);
    Object.entries(attrs).forEach(([key, value]) => e.setAttribute(key, value));
    return e;
  };
  const image = (x = 0, y = 0) => create('image', { href: source, x, y, width: 1448, height: 1086, preserveAspectRatio: 'none', class: 'cat-frame-image' });
  const defs = create('defs');
  art.append(defs);
  // Antialias the assembled silhouette, including independent body/limb joins.
  // Keep its final alpha rather than stacking two semitransparent edge layers.
  const finish=create('filter',{id:'cat-silhouette-finish',filterUnits:'userSpaceOnUse',x:-300,y:-300,width:860,height:820,'color-interpolation-filters':'sRGB'});
  finish.append(create('feGaussianBlur',{in:'SourceAlpha',stdDeviation:.55,result:'finishedAlpha'}),create('feFlood',{'flood-color':'#08090a',result:'flatInk'}),create('feComposite',{in:'flatInk',in2:'finishedAlpha',operator:'in',result:'finishedBody'}),create('feComposite',{in:'SourceGraphic',in2:'finishedBody',operator:'atop'}));
  defs.append(finish);art.setAttribute('filter','url(#cat-silhouette-finish)');
  function artworkEdgeFilter(id,x,y,width,height,face=null){
    return inkArtworkFilter(id,x,y,width,height,face);
  }
  // Preserve the supplied silhouette, blue eyes and white structural details.
  // No limb is lightened to imply depth, and the alpha is never expanded.
  function inkArtworkFilter(id,x,y,width,height,face=null){
    const filter=create('filter',{id,filterUnits:'userSpaceOnUse',x:x-2,y:y-2,width:width+4,height:height+4,'color-interpolation-filters':'sRGB'});
    const alphaMatrix=coefficients=>'0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  '+coefficients;
    filter.append(create('feColorMatrix',{in:'SourceGraphic',type:'matrix',values:alphaMatrix('2 2 2 -1.6 0'),result:'whiteDetails'}));
    filter.append(create('feColorMatrix',{in:'SourceGraphic',type:'matrix',values:alphaMatrix('-4 0 4 0 -.05'),result:'blueDetails'}));
    filter.append(create('feFlood',{'flood-color':'#08090a',result:'ink'}));
    filter.append(create('feComposite',{in:'ink',in2:'SourceAlpha',operator:'in',result:'blackBody'}));
    filter.append(create('feMorphology',{in:'SourceAlpha',operator:'erode',radius:2.5,result:'inside'}));
    filter.append(create('feComposite',{in:'whiteDetails',in2:'inside',operator:'in',result:'innerWhite'}));
    filter.append(create('feFlood',{'flood-color':'#f4f4f0',result:'white'}));
    const movingInk=/cat-(walk-edge|run-edge|flight-ink)/.test(id);
    // Raster highlights on the torso are not structural lines. Keep eye/ear
    // whites, but remove all threshold-generated body/limb fragments.
    const whites=movingInk?{x,y,width,height:Math.max(1,(face?.[1]??216.33)-y+22)}:{};
    if(movingInk&&face){
      // Preserve only the actual eye and inner-ear regions. Neck/belly glare
      // must not become isolated white pixels when the source frame changes.
      filter.append(create('feComposite',{in:'white',in2:'innerWhite',operator:'in',x:face[0]-48,y:face[1]-36,width:96,height:72,result:'eyeWhite'}));
      filter.append(create('feComposite',{in:'white',in2:'innerWhite',operator:'in',x,y,width:Math.max(1,face[0]-65-x),height:Math.max(1,face[1]-35-y),result:'earWhite'}));
      const merged=create('feMerge',{result:'whiteLines'});merged.append(create('feMergeNode',{in:'earWhite'}),create('feMergeNode',{in:'eyeWhite'}));filter.append(merged);
    }else{
      // Preserve only the painted inner ears. Source-sheet body highlights,
      // paw separators and shoulder outlines are not part of the flat style.
      const earWindows={
        front:'M44 64L71 91L46 115Z M155 83L171 63L173 116Z',
        sleep:'M853 714L882 738L855 760Z M947 749L972 735L966 779Z',
        stretch:'M87 568L115 589L90 612Z M184 573L198 556L200 594Z',
        groom:'M920 889L950 916L921 935Z M1000 903L1021 891L1024 929Z',
        jump:'M759 488L785 512L760 532Z M832 500L842 489L849 516Z',
        land:'M545 524L570 547L547 571Z M639 538L656 518L660 568Z',
        reach:'M1105 512L1136 522L1115 550Z M1182 478L1198 475L1210 499Z',
        belly:'M1353 716L1369 724L1343 738Z M1390 766L1419 768L1392 795Z'
      };
      const pose=id.replace('cat-edge-','');
      const shape=earWindows[pose]||`M${x+30} ${y+12}h45v60h-45Z`;
      const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${width} ${height}" width="${width}" height="${height}"><path d="${shape}" fill="white"/></svg>`;
      filter.append(create('feImage',{href:'data:image/svg+xml,'+encodeURIComponent(svg),x,y,width,height,preserveAspectRatio:'none',result:'earWindows'}));
      filter.append(create('feComposite',{in:'innerWhite',in2:'earWindows',operator:'in',result:'earDetails'}));
      filter.append(create('feComposite',{in:'white',in2:'earDetails',operator:'in',result:'whiteLines'}));
    }
    filter.append(create('feGaussianBlur',{in:'whiteLines',stdDeviation:.7,result:'smoothWhiteDetails'}));
    filter.append(create('feComposite',{in:'smoothWhiteDetails',in2:'blackBody',operator:'atop',result:'inkAndWhite'}));
    filter.append(create('feComposite',{in:'blueDetails',in2:'inside',operator:'in',result:'innerBlue'}));
    filter.append(create('feComposite',{in:'SourceGraphic',in2:'innerBlue',operator:'in',result:'iris'}));
    filter.append(create('feComposite',{in:'iris',in2:'inkAndWhite',operator:'atop'}));
    defs.append(filter);return 'url(#'+id+')';

  }
  // Fade a small contour correction into the original alpha. A single image
  // stays connected: no separately transformed limb patch or rectangular seam.
  function distalLegFilter(id,box,startY,radius,startX=null){
    const [x,y,r,b]=box,w=r-x,h=b-y,top=startY-y;
    const side=startX===null?'':`<linearGradient id="side"><stop offset="0" stop-color="white" stop-opacity="0"/><stop offset="1" stop-color="white"/></linearGradient><mask id="fore"><rect x="${startX-x}" width="12" height="${h}" fill="url(#side)"/><rect x="${startX-x+12}" width="${r-startX}" height="${h}" fill="white"/></mask>`;
    const map=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="down" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="white" stop-opacity="0"/><stop offset="1" stop-color="white"/></linearGradient>${side}</defs><g ${startX===null?'':'mask="url(#fore)"'}><rect y="${top}" width="${w}" height="12" fill="url(#down)"/><rect y="${top+12}" width="${w}" height="${h-top-12}" fill="white"/></g></svg>`;
    const filter=create('filter',{id,filterUnits:'userSpaceOnUse',x:x-2,y:y-2,width:w+4,height:h+4,'color-interpolation-filters':'sRGB'});
    filter.append(create('feImage',{href:'data:image/svg+xml,'+encodeURIComponent(map),x,y,width:w,height:h,preserveAspectRatio:'none',result:'region'}));
    filter.append(create('feMorphology',{in:'SourceAlpha',operator:'erode',radius:`${radius} 0`,result:'slim'}));
    filter.append(create('feComposite',{in:'SourceGraphic',in2:'region',operator:'out',result:'keep'}));
    filter.append(create('feComposite',{in:'SourceGraphic',in2:'slim',operator:'in',result:'slimPaint'}));
    filter.append(create('feComposite',{in:'slimPaint',in2:'region',operator:'in',result:'trim'}));
    filter.append(create('feComposite',{in:'keep',in2:'trim',operator:'arithmetic',k2:1,k3:1}));
    defs.append(filter);return `url(#${id})`;
  }
  // Source-space tail windows remove the old tails, leaving the supplied bodies.
  // Follow the front tail all the way to its root so diagonal remnants cannot
  // show beside the cheek or torso (the grooming pose reuses this same mask).
  const tails = {
    front: [163, 192, 1, '178,24 212,24 212,236 139,236 139,204 141,200 146,195 152,190 158,184 164,177 170,169 175,160 178,151'],
    sleep: [68, 196, -1, ''],
    stretch: [69, 169, -1, '28,524 72,524 72,575 66,598 55,604 28,596'],
    groom: [148, 193, 1, '987,1006 1033,1006 1033,1042 983,1042 983,1026'],
    jump: [94, 151, -1, '715,550 745,550 745,575 766,590 755,607 715,607'],
    land: [74, 174, -1, '508,572 531,572 531,596 549,616 536,633 508,633'],
    reach: [112, 177, -1, '1090,607 1139,607 1139,625 1155,635 1147,652 1090,652'],
    run0: [92, 160, -1, '25,355 54,355 54,382 77,394 66,411 25,411'],
    run1: [81, 161, -1, '193,363 214,363 214,381 236,392 227,411 193,411'],
    run2: [90, 161, -1, '365,366 388,366 388,386 419,392 409,413 365,413'],
    run3: [93, 163, -1, '537,371 572,371 596,390 589,415 537,415'],
    run4: [83, 160, -1, '726,373 756,373 776,390 770,414 726,414'],
    run5: [86, 162, -1, '906,377 933,377 958,390 953,416 906,416'],
    run6: [89, 170, -1, '1086,377 1117,377 1141,397 1132,420 1086,420']
  };
  const groups = {};
  const crops = {}, bodyMasks = {};
  Object.entries(frames).forEach(([name, [x, y, w, h, anchor]]) => {
    const group = create('g', { class: 'cat-frame', 'data-pose': name });
    const bodyMask = create('mask', { id: `cat-body-${name}`, maskUnits: 'userSpaceOnUse', x, y, width: w, height: h });
    bodyMask.append(create('rect', { x, y, width: w, height: h, fill: 'white' }));
    if (tails[name][3]) bodyMask.append(create('polygon', { points: tails[name][3], fill: 'black' }));
    defs.append(bodyMask);
    const crop = create('svg', { x: anchor ?? (260 - w) / 2, y: 206 - h, width: w, height: h, viewBox: `${x} ${y} ${w} ${h}`, overflow: 'hidden' });
    const body = create('g', { mask: `url(#cat-body-${name})` });
    const artwork=image();artwork.setAttribute('filter',artworkEdgeFilter('cat-edge-'+name,x,y,w,h));body.append(artwork);
    crop.append(body);
    crops[name] = crop;
    bodyMasks[name] = bodyMask;
    group.append(crop);
    art.append(group);
    groups[name] = group;
  });

  // Keep the ears from the Git reference artwork. The shared ink filter
  // applies the current fur/inner-ear colors and smooths their raster edges.

  // One painted iris and one oval design across poses; far eyes keep perspective.
  const irisClip = create('clipPath', { id: 'cat-iris-source' });
  irisClip.append(create('circle', { cx: 83, cy: 145, r: 11.5 }));
  defs.append(irisClip);
  // [old center x/y, old white radius x/y, new center x/y, perspective width, tilt]
  const eyeDesigns = {
    front: [[76,148,22,22,85,148,20.5,0],[142,148,22,22,134,148,20.5,0]],
    stretch: [[141,633,20,19,141,629,20.5,-8],[194,629,14,18,190,626,13,-8]],
    groom: [[945,966,20,20,945,965,20.5,0],[1001,968,17,19,997,966,17,0]],
    jump: [[814,562,21,21,814,560,20.5,-10],[856,557,10,18,853,555,9,-10]],
    land: [[591,610,20,20,591,608,20.5,-10],[645,604,14,18,641,603,13,-10]],
    reach: [[1174,535,22,21,1174,534,20.5,-20],[1219,522,13,17,1216,520,12,-20]],
    run0: [[132,361,22,22,132,359,20.5,0]],
    run1: [[309,371,21,21,309,369,20.5,0]],
    run2: [[483,360,22,22,483,358,20.5,0]],
    run3: [[667,367,21,21,667,365,20.5,0]],
    run4: [[854,366,21,20,854,364,20.5,0]],
    run5: [[1031,356,21,21,1031,354,20.5,0]],
    run6: [[1213,367,20,20,1213,365,20.5,0]]
  };
  Object.entries(eyeDesigns).forEach(([name, designs]) => {
    const [x,y,w,h] = frames[name];
    const alpha = create('mask', { id: `cat-eye-alpha-${name}`, maskUnits: 'userSpaceOnUse', x,y,width:w,height:h,style:'mask-type:alpha' });
    alpha.append(image());
    const clip = create('clipPath', { id: `cat-eye-windows-${name}` });
    defs.append(alpha, clip);
    const fur = create('g');
    const eyes = create('g', { class:'cat-eyes',style:`transform-origin:${designs[0][4]}px ${designs[0][5]}px` });
    const whites = create('g');
    const pupils = create('g', { class:'cat-pupils' });
    designs.forEach(([oldX,oldY,oldRX,oldRY,cx,cy,rx,tilt]) => {
      const old = { cx:oldX,cy:oldY,rx:oldRX,ry:oldRY };
      bodyMasks[name].append(create('ellipse',{...old,fill:'black'}));
      fur.append(create('ellipse',{...old,fill:'#08090a'}));
      const ry = rx < 15 ? 22 : 25.5;
      const attrs = { cx,cy,rx,ry,transform:`rotate(${tilt} ${cx} ${cy})` };
      whites.append(create('ellipse',{...attrs,fill:'#e8fbff'}));
      clip.append(create('ellipse',attrs));
      const iris = create('g',{transform:`translate(${cx} ${cy}) rotate(${tilt}) scale(${rx / 20.5 * 1.3} ${ry / 25.5 * 1.65}) translate(-83 -145)`});
      const irisWindow=create('g',{'clip-path':'url(#cat-iris-source)'});
      irisWindow.append(image());iris.append(irisWindow);pupils.append(iris);
    });
    const windowClip=create('g',{'clip-path':`url(#cat-eye-windows-${name})`});
    windowClip.append(pupils);eyes.append(whites,windowClip);
    const clipped=create('g',{mask:`url(#cat-eye-alpha-${name})`});
    clipped.append(fur,eyes);crops[name].append(clipped);
  });
  const standing = create('g', { class: 'cat-standing-art' });
  // Two small unoutlined paws remain part of the original sitting artwork.
  crops.front.append(create('ellipse',{cx:100,cy:228.5,rx:6,ry:4.5,fill:'#08090a'}),create('ellipse',{cx:114,cy:228.5,rx:6,ry:4.5,fill:'#08090a'}));
  standing.append(groups.front.firstChild);
  groups.front.append(standing);
  // Sleeping head remains full-size; only the rear torso is compressed.
  const sleepBodyClip=create('clipPath',{id:'cat-sleep-torso-window'});
  sleepBodyClip.append(create('rect',{x:730,y:691,width:120,height:132}));
  const sleepHeadClip=create('clipPath',{id:'cat-sleep-head-window'});
  sleepHeadClip.append(create('path',{d:'M847 691H987V823H844V780Q846 758 847 736Z'}));
  defs.append(sleepBodyClip,sleepHeadClip);
  const sleepingBody=create('g',{class:'cat-sleep-body',transform:'translate(850 821) scale(.5) translate(-850 -821)'});
  const sleepingBodyWindow=create('g',{'clip-path':'url(#cat-sleep-torso-window)'});
  const sleepTorsoArt=image();sleepTorsoArt.setAttribute('filter','url(#cat-edge-sleep)');sleepingBodyWindow.append(sleepTorsoArt);sleepingBody.append(sleepingBodyWindow);
  const sleepingHead=create('g',{class:'cat-sleep-head','clip-path':'url(#cat-sleep-head-window)',transform:'translate(-28 0)'});
  const sleepHeadArt=image();sleepHeadArt.setAttribute('filter','url(#cat-edge-sleep)');sleepingHead.append(sleepHeadArt);
  crops.sleep.replaceChildren(sleepingBody,sleepingHead);
  crops.sleep.setAttribute('x',-50);
  crops.sleep.setAttribute('overflow','visible');
  // Exact hand-drawn Z silhouettes from the user's annotated screenshot.
  const sleepZ=create('g',{'data-sleep-feedback':'zzz',fill:'#ffffff',stroke:'none'});
  sleepZ.append(create('path',{d:"M165.512 69.008L176.511 69.041L176.508 70.041L165.508 70.008ZM165.508 70.008L177.508 70.044L177.504 71.044L165.505 71.008ZM174.505 71.035L177.504 71.044L177.501 72.044L174.502 72.035ZM175.502 72.038L177.501 72.044L177.498 73.044L175.498 73.038ZM174.499 73.035L177.498 73.044L177.495 74.044L174.496 74.035ZM174.496 74.035L177.495 74.044L177.492 75.044L174.492 75.035ZM173.493 75.032L177.492 75.044L177.489 76.044L173.489 76.032ZM173.489 76.032L176.489 76.041L176.486 77.041L173.486 77.032ZM172.486 77.029L175.486 77.038L175.483 78.038L172.483 78.028ZM172.483 78.028L175.483 78.038L175.480 79.038L172.480 79.028ZM172.480 79.028L178.480 79.047L178.477 80.047L172.477 80.028ZM172.477 80.028L186.476 80.071L186.473 81.071L172.474 81.028ZM174.474 81.034L186.473 81.071L186.470 82.071L174.471 82.034ZM179.471 82.050L180.471 82.053L180.467 83.053L179.468 83.050ZM155.469 82.976L162.469 82.997L162.466 83.997L155.466 83.976ZM155.466 83.976L163.466 84.000L163.463 85.000L155.463 84.976ZM159.463 84.988L163.463 85.000L163.460 86.000L159.460 85.988ZM158.460 85.985L162.460 85.997L162.457 86.997L158.457 86.985ZM158.457 86.985L166.456 87.009L166.453 88.009L158.454 87.985ZM158.454 87.985L166.453 88.009L166.450 89.009L158.451 88.985ZM140.446 90.929L147.446 90.951L147.443 91.951L140.443 91.929ZM140.443 91.929L148.442 91.954L148.439 92.954L140.440 92.929ZM145.440 92.945L148.439 92.954L148.436 93.954L145.437 93.945ZM145.437 93.945L148.436 93.954L148.433 94.954L145.433 94.944ZM145.433 94.944L151.433 94.963L151.430 95.963L145.430 95.944ZM145.430 95.944L151.430 95.963L151.427 96.963L145.427 96.944ZM147.427 96.950L149.427 96.957L149.424 97.956L147.424 97.950ZM135.410 102.913L137.410 102.919L137.407 103.919L135.407 103.913ZM132.407 103.904L137.407 103.919L137.404 104.919L132.404 104.904ZM132.404 104.904L137.404 104.919L137.400 105.919L132.401 105.904ZM132.401 105.904L136.401 105.916L136.397 106.916L132.398 106.904ZM133.398 106.907L135.398 106.913L135.394 107.913L133.395 107.907Z"}));
  groups.sleep.append(sleepZ);

  // The lick begins from the exact default artwork, without swapping proportions.
  const groomingArt=create('g',{class:'cat-groom-art'});
  groomingArt.append(crops.front.cloneNode(true));
  groups.groom.replaceChildren(groomingArt);
  const groomingPaw=create('path',{class:'cat-groom-paw',fill:'none',stroke:'#08090a','stroke-width':14,'stroke-linecap':'round'});
  const groomingToes=create('path',{fill:'none',stroke:'#08090a','stroke-width':1.5,'stroke-linecap':'round'});
  groomingArt.append(groomingPaw,groomingToes);
  let groomingAngle=0,standingAngle=0;

  // Keep the existing jump scale; the walk uses its own complete drawings.
  const poseScale={jump:1.08};
  Object.entries(poseScale).forEach(([name,scale])=>{
    const wrapper=create('g',{'data-head-scale':scale,transform:`translate(130 206) scale(${scale}) translate(-130 -206)`});
    wrapper.append(crops[name]);groups[name].append(wrapper);
  });

  // Original head art on an independently articulated quadruped, rather than a
  // whole-sprite squash. Paws, hips, chest and head have separate trajectories.
  groups.stretch.replaceChildren();
  const stretchRig=create('g',{class:'cat-stretch-rig'});
  const limb=(width,color='#08090a')=>create('path',{fill:'none',stroke:color,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round'});
  const farBack=limb(12,'#08090a'),farFront=limb(11,'#08090a');
  const stretchTorso=create('path',{fill:'#08090a'});
  const nearBack=limb(14),nearFront=limb(13);
  [farBack,farFront,nearBack,nearFront].forEach(node=>{node.setAttribute('fill','#08090a');node.setAttribute('stroke','none');});
  const stretchNeck=create('path',{fill:'#08090a'});
  const stretchToes=create('path',{fill:'none',stroke:'#08090a','stroke-width':1.5});
  const stretchHead=create('g',{class:'cat-stretch-head'});
  const headWindow=create('svg',{x:-60,y:-118,width:121,height:121,viewBox:'54 281 121 121',overflow:'hidden'});
  // The rectangle also contains the source body's shoulder. Keep only the
  // head silhouette, including the chin, before rotating this patch.
  const stretchHeadClip=create('clipPath',{id:'cat-stretch-head-outline',clipPathUnits:'userSpaceOnUse'});
  stretchHeadClip.append(create('path',{d:'M54 281H175V397H128Q93 398 73 386L54 378Z'}));
  defs.append(stretchHeadClip);
  const stretchHeadOnly=create('g',{'clip-path':'url(#cat-stretch-head-outline)'});
  [...crops.run0.children].forEach(child=>stretchHeadOnly.append(child.cloneNode(true)));
  headWindow.append(stretchHeadOnly);
  stretchHead.append(headWindow);
  stretchRig.append(farBack,farFront,stretchTorso,stretchNeck,nearBack,nearFront,stretchHead,stretchToes);
  groups.stretch.append(stretchRig);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const smooth=n=>{n=clamp(n,0,1);return n*n*(3-2*n);};
  const mix=(a,b,t)=>a+(b-a)*t;
  const stretchKeys=[
    [0,[73,173,123,165,174,188,175,163]],
    [.20,[69,158,124,173,178,199,198,183]],
    [.42,[64,146,123,181,181,203,213,200]],
    [.67,[64,146,123,181,181,203,213,200]],
    [.84,[69,157,125,174,175,195,199,186]],
    [1,[80,171,127,160,143,164,177,166]]
  ];
  let stretchHip={x:73,y:173};
  function animateStretch(elapsed){
    const phase=clamp(elapsed/1.2,0,1);
    let k=0;while(k<stretchKeys.length-2&&phase>stretchKeys[k+1][0])k++;
    const [a,av]=stretchKeys[k],[b,bv]=stretchKeys[k+1];
    const u=smooth((phase-a)/(b-a));
    const [hx,hy,cx,cy,rawHeadX,rawHeadY,rawPawNear,rawPawFar]=av.map((v,i)=>mix(v,bv[i],u));
    const headX=Math.min(rawHeadX,cx+34),headY=Math.min(rawHeadY,cy+13);
    const pawNear=clamp(rawPawNear,cx+20,cx+55),pawFar=clamp(rawPawFar,cx+12,cx+43);
    stretchHip={x:hx+1,y:hy+8};
    const plantNear=206-Math.sin(Math.PI*smooth((phase-.05)/.22))*6;
    const plantFar=206-Math.sin(Math.PI*smooth((phase-.18)/.22))*6;
    farBack.setAttribute('d',walkingLimbContour([hx+4,hy+8],[hx+18,184],[70,187],[76,197.5]));
    nearBack.setAttribute('d',walkingLimbContour([hx+1,hy+14],[hx+3,183],[50,188],[58,197.5]));
    farFront.setAttribute('d',walkingLimbContour([cx,cy+5],[(cx+pawFar)/2,193],null,[pawFar,plantFar-8.5]));
    nearFront.setAttribute('d',walkingLimbContour([cx+6,cy+8],[(cx+pawNear)/2,193],null,[pawNear,plantNear-8.5]));
    stretchNeck.setAttribute('d',`M${cx-5} ${cy-12} Q${cx+12} ${cy-19} ${headX-16} ${headY-29} L${headX+3} ${headY-8} Q${cx+22} ${cy+17} ${cx-3} ${cy+13}Z`);
    stretchTorso.setAttribute('d',`M${hx-16} ${hy+7} C${hx-9} ${hy-20} ${hx+22} ${hy-24} ${cx+2} ${cy-7} Q${cx+18} ${cy+2} ${cx+6} ${cy+18} C${cx-15} ${cy+23} ${hx+7} ${hy+30} ${hx-14} ${hy+25} Z`);
    const dip=smooth(phase/.42)*(1-smooth((phase-.67)/.33));
    stretchHead.setAttribute('transform',`translate(${headX} ${headY}) rotate(${dip*7}) scale(1.08)`);
    stretchToes.setAttribute('d','');
    stretchRig.dataset.phase=phase.toFixed(3);
  }

  // Complete user-approved drawings, with the six-pose timing from the local preview.
  // Only the painted tail is masked; head, body and four paws remain together.
  const runSheet='assets/cat-run-approved.png';
  const runPoses=[{"source":0,"eye":[315,244],"box":[19,137,351,352],"root":[135,276],"ms":75,"tailCutX":134,"tailCutY":286},{"source":1,"eye":[680,241],"box":[373,139,714,345],"root":[500,279.5],"ms":95,"tailCutX":499,"tailCutY":290},{"source":8,"eye":[332,866],"box":[19,764,367,971],"root":[156,886.5],"ms":55,"tailCutX":155,"tailCutY":897},{"source":4,"eye":[326,561],"box":[36,459,361,668],"root":[146,579.5],"ms":80,"tailCutX":145,"tailCutY":589},{"source":6,"eye":[1050,561],"box":[795,459,1085,672],"root":[897,576.5],"ms":65,"tailCutX":896,"tailCutY":583},{"source":10,"eye":[1035,873],"box":[747,768,1070,983],"root":[865,903.5],"ms":50,"tailCutX":864,"tailCutY":922}];
  const runScaleFor=pose=>.78*104/(pose.eye[1]-pose.box[1]);
  groups.gallop=create('g',{class:'cat-frame','data-pose':'gallop'});
  const fullRunFrames=runPoses.map((pose,i)=>{
    const [x,y,r,b]=pose.box,scale=runScaleFor(pose);
    const clip=create('clipPath',{id:`cat-full-run-${i}`,clipPathUnits:'userSpaceOnUse'});
    clip.append(create('rect',{x:x-2,y:y-2,width:r-x+4,height:b-y+4}));defs.append(clip);
    const mask=create('mask',{id:`cat-run-tail-${i}`,maskUnits:'userSpaceOnUse',x:x-2,y:y-2,width:r-x+4,height:b-y+4});
    mask.append(create('rect',{x:x-2,y:y-2,width:r-x+4,height:b-y+4,fill:'white'}));
    mask.append(create('rect',{x:x-3,y:y-3,width:pose.tailCutX-x+3,height:pose.tailCutY-y+3,fill:'black'}));defs.append(mask);
    // Restore the original hip alpha where the rectangular tail removal
    // overlaps it. This reveals artwork, rather than painting an invented rump.
    const hipWindow=create('clipPath',{id:`cat-run-hip-${i}`,clipPathUnits:'userSpaceOnUse'});
    hipWindow.append(create('rect',{x:pose.root[0]-15,y:pose.root[1]+4,width:85,height:70}));defs.append(hipWindow);
    mask.append(create('ellipse',{cx:pose.root[0]+26,cy:pose.root[1]+20,rx:37,ry:35,fill:'white','clip-path':`url(#cat-run-hip-${i})`}));
    const crop=create('g',{'clip-path':`url(#cat-full-run-${i})`});
    const edgeFilter=artworkEdgeFilter('cat-run-edge-'+i,x,y,r-x,b-y,pose.eye);
    crop.append(create('image',{href:runSheet,width:1448,height:1086,mask:`url(#cat-run-tail-${i})`,filter:edgeFilter}));
    const placed=create('g',{'data-run-frame':i,'data-source-frame':pose.source,transform:`translate(164 120) scale(${scale}) translate(${-pose.eye[0]} ${-pose.eye[1]})`});
    placed.style.display=i===0?'':'none';placed.append(crop);groups.gallop.append(placed);return placed;
  });
  art.append(groups.gallop);tails.gallop=[36,155,-1,''];
  const gallopClipSeconds=.56;
  let runCycle=0,gallopPhase=0,gallopHip={x:36,y:155},shownRunFrame=-1;
  const runDuration=runPoses.reduce((sum,p)=>sum+p.ms,0);
  function animateGallop(dt,speed){
    // Keep the approved drawings, but let acceleration drive their cadence.
    runCycle=(runCycle+dt/gallopClipSeconds*clamp(speed/320,.55,1.75))%1;gallopPhase=runCycle;
    let age=runCycle*runDuration,index=0;
    while(index<runPoses.length-1&&age>=runPoses[index].ms){age-=runPoses[index].ms;index++;}
    const pose=runPoses[index],scale=runScaleFor(pose);
    if(index!==shownRunFrame){
      fullRunFrames.forEach((frame,i)=>frame.style.display=i===index?'':'none');shownRunFrame=index;
    }
    gallopHip={x:164+(pose.root[0]-pose.eye[0])*scale,y:120+(pose.root[1]-pose.eye[1])*scale};
    groups.gallop.dataset.frame=String(index);groups.gallop.dataset.sourceFrame=String(pose.source);groups.gallop.dataset.phase=runCycle.toFixed(5);
  }

  // Keep the established head/torso drawings; four matched limb contours
  // run on independent phase clocks, not on retargeted copies of one frame.
  const walkSheet='assets/cat-walk-v23.png';
  const walkPoses=[{"eye":[355.73,216.33],"box":[101,61,399,398],"root":[116.0,289.0]},{"eye":[785.39,216.05],"box":[526,61,829,398],"root":[547.0,289.0]},{"eye":[1230.92,216.32],"box":[958,59,1274,399],"root":[991.0,290.0]},{"eye":[1693.85,217.02],"box":[1421,61,1737,400],"root":[1452.0,290.0]},{"eye":[355.95,651.23],"box":[100,495,399,834],"root":[112.0,725.0]},{"eye":[785.57,651.01],"box":[534,495,829,831],"root":[546.0,724.0]},{"eye":[1230.81,651.08],"box":[961,494,1274,828],"root":[990.0,725.0]},{"eye":[1677.74,651.21],"box":[1406,493,1721,831],"root":[1435.0,726.0]}];
  const walkScale=81.12/156.125;
  groups.walk=create('g',{class:'cat-frame','data-pose':'walk'});
  const walkFarRig=create('g',{'data-walk-rig':'far'}),walkNearRig=create('g',{'data-walk-rig':'near'});
  const walkingLegs=[
    {pair:'hind',side:'far',phase:.5,root:[56,150],rig:walkFarRig},
    {pair:'fore',side:'far',phase:.5,root:[121,149],rig:walkFarRig},
    {pair:'hind',side:'near',phase:0,root:[53,150],rig:walkNearRig},
    {pair:'fore',side:'near',phase:0,root:[119,149],rig:walkNearRig}
  ].map(leg=>{
    const path=create('g',{'data-walk-leg':leg.pair+'-'+leg.side});
    const bone=width=>create('path',{fill:'none',stroke:'#08090a','stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round'});
    const upper=bone(18),lower=bone(18),ankle=bone(18);
    upper.setAttribute('fill','#08090a');upper.setAttribute('stroke','none');
    const paw=create('path',{fill:'#08090a',d:'M-7 3C-8 -2 -3 -3 2 -2C7 -2 11 1 11 4Q11 8 5 8H-2Q-8 8 -7 3Z'});
    path.append(upper,lower,ankle,paw);leg.rig.append(path);return {...leg,path,upper,lower,ankle,paw};
  });
  groups.walk.append(walkFarRig);
  const fullWalkFrames=walkPoses.map((pose,i)=>{
    const [x,y,r,b]=pose.box;
    const clip=create('clipPath',{id:`cat-full-walk-${i}`,clipPathUnits:'userSpaceOnUse'});
    clip.append(create('rect',{x:x-2,y:y-2,width:r-x+4,height:b-y+4}));defs.append(clip);
    const bodyMask=create('mask',{id:`cat-walk-body-${i}`,maskUnits:'userSpaceOnUse',x:x-2,y:y-2,width:r-x+4,height:b-y+4});
    // A curved under-chin boundary removes the rectangular source neck tab.
    // This also removes all four old painted legs before the new ones are drawn.
    bodyMask.append(create('path',{d:'M-150 -100H300V140H200L145 146Q133 148 127 153Q123 160 117 166Q81 179 42 170H-150Z',transform:`translate(${pose.eye[0]} ${b-1}) scale(${1/walkScale}) translate(-164 -206)`,fill:'white'}));defs.append(bodyMask);
    const crop=create('g',{'clip-path':`url(#cat-full-walk-${i})`});
    const edgeFilter=artworkEdgeFilter('cat-walk-edge-'+i,x,y,r-x,b-y,pose.eye);
    crop.append(create('image',{href:walkSheet,width:1774,height:887,filter:edgeFilter,mask:`url(#cat-walk-body-${i})`}));
    const placed=create('g',{'data-walk-frame':i,transform:`translate(164 206) scale(${walkScale}) translate(${-pose.eye[0]} ${-(b-1)})`});
    placed.style.display=i===0?'':'none';placed.append(crop);groups.walk.append(placed);return placed;
  });
  groups.walk.append(walkNearRig);art.append(groups.walk);tails.walk=[39,150,-1,''];
  let walkHip={x:39,y:150},shownWalkFrame=-1;
  // Motion study: BV116DoYzEqa, shoulder/hip pivots and wrist/paw articulation.
  // Fixed-length segments replace the old whole-contour shear.
  function walkFootTrack(phase,pair){
    const duty=.625,amplitude=26;
    if(phase<duty){const u=phase/duty;return {x:mix(amplitude,-amplitude,u),lift:0,angle:0,contact:true};}
    const u=(phase-duty)/(1-duty),keys=[[0,0],[.22,32],[.55,-14],[.86,-5],[1,0]];
    let k=0;while(k<keys.length-2&&u>keys[k+1][0])k++;
    const angle=mix(keys[k][1],keys[k+1][1],smooth((u-keys[k][0])/(keys[k+1][0]-keys[k][0])));
    const tangent=-2*amplitude*(1-duty)/duty;
    const x=mix(-amplitude,amplitude,smooth(u))+tangent*(2*u*u*u-3*u*u+u);
    return {x,lift:Math.sin(Math.PI*u)**2*(pair==='fore'?13:11),angle,contact:false};
  }
  function walkJoint(root,end,a,b,side){
    const dx=end[0]-root[0],dy=end[1]-root[1],distance=Math.hypot(dx,dy)||1;
    const d=clamp(distance,Math.abs(a-b)+.001,a+b-.001),ux=dx/distance,uy=dy/distance;
    const along=(a*a-b*b+d*d)/(2*d),height=Math.sqrt(Math.max(0,a*a-along*along));
    return [root[0]+ux*along-uy*height*side,root[1]+uy*along+ux*height*side];
  }
  // The four legs use the same soft, filled silhouette and width profile.
  // A single contour avoids stacked stroke caps at knees and ankles.
  function walkingLimbContour(root,joint,hock,wrist){
    const controlA=joint,controlB=hock||joint,left=[],right=[];
    for(let i=0;i<=20;i++){
      const t=i/20,u=1-t;
      const x=u*u*u*root[0]+3*u*u*t*controlA[0]+3*u*t*t*controlB[0]+t*t*t*wrist[0];
      const y=u*u*u*root[1]+3*u*u*t*controlA[1]+3*u*t*t*controlB[1]+t*t*t*wrist[1];
      const dx=3*u*u*(controlA[0]-root[0])+6*u*t*(controlB[0]-controlA[0])+3*t*t*(wrist[0]-controlB[0]);
      const dy=3*u*u*(controlA[1]-root[1])+6*u*t*(controlB[1]-controlA[1])+3*t*t*(wrist[1]-controlB[1]);
      const length=Math.hypot(dx,dy)||1,radius=mix(13,8.5,smooth(t));
      left.push([x-dy/length*radius,y+dx/length*radius]);
      right.push([x+dy/length*radius,y-dx/length*radius]);
    }
    const points=[...left,...right.reverse()],p=point=>point.map(v=>v.toFixed(4)).join(' ');
    // Rounded end is part of the same silhouette, like the approved run art.
    const [wx,wy]=wrist;
    return 'M'+points.map(p).join('L')+'Z'+`M${wx-8.5} ${wy}a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0Z`;
  }
  function animateWalk(){
    const index=Math.min(walkPoses.length-1,Math.floor(walkCycle*walkPoses.length)),pose=walkPoses[index];
    if(index!==shownWalkFrame){fullWalkFrames.forEach((frame,i)=>frame.style.display=i===index?'':'none');shownWalkFrame=index;}
    walkHip={x:164+(pose.root[0]-pose.eye[0])*walkScale,y:206+(pose.root[1]-(pose.box[3]-1))*walkScale};
    const point=p=>p.map(n=>n.toFixed(4)).join(' '),segment=(node,a,b)=>node.setAttribute('d',`M${point(a)}L${point(b)}`);
    walkingLegs.forEach(leg=>{
      const phase=(walkCycle+leg.phase+(leg.pair==='fore'?.4375:.1875))%1,foot=walkFootTrack(phase,leg.pair);
      const angle=foot.angle*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
      // Account for the rotating paw's lowest point, keeping the sole above ground.
      const pawSamples=[[-7,3],[-7,-2],[2,-2],[8,0],[11,4],[8,8],[-2,8],[-7,6]];
      const sole=1.15*Math.max(...pawSamples.map(([x,y])=>x*sin+y*cos));
      const wrist=[leg.root[0]+foot.x-3,206-sole-foot.lift];
      let joint,hock;
      if(leg.pair==='fore'){
        joint=walkJoint(leg.root,wrist,25,31,1);
        segment(leg.upper,leg.root,joint);segment(leg.lower,joint,wrist);leg.ankle.setAttribute('d','');
      }else{
        hock=[wrist[0]-6,wrist[1]-14];joint=walkJoint(leg.root,hock,24,27,-1);
        segment(leg.upper,leg.root,joint);segment(leg.lower,joint,hock);segment(leg.ankle,hock,wrist);
      }
      leg.upper.setAttribute('d',walkingLimbContour(leg.root,joint,hock,wrist));
      leg.lower.setAttribute('d','');leg.ankle.setAttribute('d','');
      leg.paw.style.display='none';
      leg.paw.setAttribute('transform',`translate(${point(wrist)}) rotate(${foot.angle.toFixed(4)}) scale(1.15)`);
      leg.path.dataset.phase=phase.toFixed(6);leg.path.dataset.contact=String(foot.contact);leg.path.dataset.footX=(leg.root[0]+foot.x).toFixed(4);leg.path.dataset.lift=foot.lift.toFixed(4);
      leg.path.dataset.root=JSON.stringify(leg.root);leg.path.dataset.joint=JSON.stringify(joint);leg.path.dataset.wrist=JSON.stringify(wrist);leg.path.dataset.hock=JSON.stringify(hock||null);leg.path.dataset.angle=foot.angle.toFixed(4);
    });
    groups.walk.dataset.frame=String(index);groups.walk.dataset.phase=walkCycle.toFixed(5);
  }

  // The same supplied head/eyes ride a four-legged flight rig. The chest and
  // forepaws lead the descent; the hips stay high instead of rotating a sprite.
  const flightLimb=(width,color='#08090a')=>create('path',{fill:'none',stroke:color,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round'});
  const flightHeadClip=create('clipPath',{id:'cat-flight-head-outline',clipPathUnits:'userSpaceOnUse'});
  flightHeadClip.append(create('path',{d:'M749 466H881V592H810Q782 590 760 580L749 576Z'}));
  defs.append(flightHeadClip);
  // Recolor only the leftover source-sheet shoulder seam. Restrict the
  // patch to the original alpha so the head silhouette and eyes stay intact.
  const flightNeckClean=create('filter',{id:'cat-flight-neck-clean',filterUnits:'userSpaceOnUse',x:749,y:466,width:132,height:132,'color-interpolation-filters':'sRGB'});
  flightNeckClean.append(create('feFlood',{'flood-color':'#08090a',x:749,y:575,width:43,height:19,result:'neckInk'}));
  flightNeckClean.append(create('feComposite',{in:'neckInk',in2:'SourceAlpha',operator:'in',x:749,y:575,width:43,height:19,result:'neckPatch'}));
  const flightNeckMerge=create('feMerge');
  flightNeckMerge.append(create('feMergeNode',{in:'SourceGraphic'}),create('feMergeNode',{in:'neckPatch'}));
  flightNeckClean.append(flightNeckMerge);defs.append(flightNeckClean);
  const flightRigs=['jump','land'].map(name=>{
    const rig=create('g',{class:'cat-flight-rig'});
    const backFar=flightLimb(10,'#08090a'),frontFar=flightLimb(9.5,'#08090a');
    const torso=create('path',{fill:'#08090a'}),backNear=flightLimb(11.5),frontNear=flightLimb(11.5);
    // The filled contours include the actual red pixel footprint from both
    // reference images, including the thicker overlapping pen strokes.
    [backFar,backNear,frontFar,frontNear].forEach(leg=>{
      leg.setAttribute('stroke','#08090a');leg.setAttribute('fill','#08090a');leg.setAttribute('stroke-width',2/1.125);
      leg.setAttribute('stroke-linejoin','round');
    });
    const head=create('g',{class:'cat-flight-head','data-head-scale':1.08});
    const window=create('svg',{x:-66,y:-128,width:132,height:132,viewBox:'749 466 132 132',overflow:'hidden'});
    const headOnly=create('g',{'clip-path':'url(#cat-flight-head-outline)'});
    [...crops.jump.children].forEach(child=>headOnly.append(child.cloneNode(true)));
    headOnly.querySelectorAll('image').forEach(node=>node.removeAttribute('filter'));
    // Iris samples live at the front pose's source coordinates. Only the
    // underlying head bitmap uses the jump window; leave iris crops intact.
    headOnly.firstChild.firstChild.setAttribute('filter','url(#cat-edge-jump)');
    headOnly.querySelectorAll('ellipse').forEach(node=>{if(node.getAttribute('fill')==='#08090a')node.setAttribute('fill','#08090a');});
    window.append(headOnly);
    head.append(window);
    const neck=create('path',{fill:'#08090a','data-flight-neck':'connected'});
    rig.append(backFar,frontFar,torso,neck,backNear,frontNear,head);
    groups[name].replaceChildren(rig);
    return {rig,backFar,frontFar,torso,neck,backNear,frontNear,head};
  });
  // Filled contours traced from the user's red-line attachments, in their
  // original pixel coordinates. The two reference silhouettes are not restyled.
  const flightTracedLegs={"backNear":{"up":[[-17.0841,-9.45],[-17.5702,-9.45],[-17.973,-9.3667],[-17.973,-8.8806],[-17.973,-8.3945],[-17.973,-7.9083],[-17.973,-7.4222],[-17.973,-6.9361],[-17.973,-6.45],[-17.973,-5.9639],[-17.973,-5.4778],[-17.9869,-5.0056],[-18.473,-5.0056],[-18.8619,-4.9083],[-18.8619,-4.4222],[-18.8619,-3.9361],[-18.8619,-3.45],[-18.8619,-2.9639],[-18.8619,-2.4778],[-18.8619,-1.9917],[-18.8619,-1.5056],[-18.8619,-1.0195],[-18.8897,-0.5611],[-19.3758,-0.5611],[-19.7508,-0.45],[-19.7508,0.0361],[-19.7508,0.5222],[-19.7508,1.0083],[-19.7508,1.4944],[-19.7508,1.9805],[-19.7508,2.4667],[-19.7508,2.9528],[-19.7508,3.4389],[-19.7508,3.925],[-19.7508,4.4111],[-19.7508,4.8972],[-19.7508,5.3833],[-19.7508,5.8694],[-19.7508,6.3555],[-19.7508,6.8417],[-19.7508,7.3278],[-19.7508,7.8139],[-19.7508,8.3],[-19.2925,8.3278],[-18.8619,8.3833],[-18.8619,8.8694],[-18.8619,9.3555],[-18.8619,9.8417],[-18.6397,10.1055],[-18.1536,10.1055],[-17.973,10.4111],[-17.973,10.8972],[-17.973,11.3833],[-17.973,11.8694],[-18.4452,11.8833],[-18.8619,11.9528],[-18.8619,12.4389],[-19.0147,12.7722],[-19.5008,12.7722],[-19.9869,12.7722],[-20.473,12.7722],[-20.9591,12.7722],[-21.4452,12.7722],[-21.5286,13.175],[-21.5286,13.6611],[-22.0147,13.6611],[-22.5008,13.6611],[-22.9869,13.6611],[-23.473,13.6611],[-23.9591,13.6611],[-24.4452,13.6611],[-24.9314,13.6611],[-25.4175,13.6611],[-25.9036,13.6611],[-25.973,13.2444],[-25.9869,12.7722],[-26.473,12.7722],[-26.9591,12.7722],[-27.4452,12.7722],[-27.9314,12.7722],[-28.4175,12.7722],[-28.9036,12.7722],[-29.3897,12.7722],[-29.5286,12.425],[-29.5286,11.9389],[-29.9591,11.8833],[-30.4452,11.8833],[-30.9314,11.8833],[-31.4175,11.8833],[-31.9036,11.8833],[-32.3897,11.8833],[-32.8758,11.8833],[-33.0841,12.1611],[-33.0841,12.6472],[-33.4452,12.7722],[-33.9314,12.7722],[-33.973,13.2167],[-34.0147,13.6611],[-34.5008,13.6611],[-34.8619,13.7861],[-34.8619,14.2722],[-34.8619,14.7583],[-34.8619,15.2444],[-34.5702,15.4389],[-34.0841,15.4389],[-33.973,15.8139],[-33.973,16.3],[-33.973,16.7861],[-33.9175,17.2167],[-33.4314,17.2167],[-33.0841,17.3555],[-33.0841,17.8417],[-33.0841,18.3278],[-33.0841,18.8139],[-32.7786,18.9944],[-32.2925,18.9944],[-32.1952,19.3833],[-32.1952,19.8694],[-32.1952,20.3555],[-32.1952,20.8417],[-32.1952,21.3278],[-32.1952,21.8139],[-32.1952,22.3],[-32.1952,22.7861],[-32.1952,23.2722],[-32.1952,23.7583],[-32.1952,24.2444],[-32.1952,24.7305],[-32.1952,25.2167],[-32.1952,25.7028],[-32.1952,26.1889],[-32.1952,26.675],[-32.1952,27.1611],[-32.1952,27.6472],[-32.4452,27.8833],[-32.9314,27.8833],[-33.0841,28.2167],[-33.0841,28.7028],[-33.0841,29.1889],[-33.0841,29.675],[-33.0841,30.1611],[-33.0841,30.6472],[-33.0841,31.1333],[-33.0841,31.6194],[-33.0841,32.1055],[-32.8202,32.3278],[-32.3341,32.3278],[-32.1952,32.675],[-32.1952,33.1611],[-32.1952,33.6472],[-32.1675,34.1055],[-31.6814,34.1055],[-31.3064,34.2167],[-31.3064,34.7028],[-31.1119,34.9944],[-30.6258,34.9944],[-30.4175,35.2722],[-30.4175,35.7583],[-30.0564,35.8833],[-29.5702,35.8833],[-29.5286,36.3278],[-29.4869,36.7722],[-29.0008,36.7722],[-28.5147,36.7722],[-28.0286,36.7722],[-27.5425,36.7722],[-27.0564,36.7722],[-26.8619,37.0639],[-26.8619,37.55],[-26.4869,37.6611],[-26.0008,37.6611],[-25.5147,37.6611],[-25.0286,37.6611],[-24.5425,37.6611],[-24.0564,37.6611],[-23.5702,37.6611],[-23.3064,37.4389],[-23.3064,36.9528],[-23.0008,36.7722],[-22.5147,36.7722],[-22.4175,36.3833],[-22.4175,35.8972],[-22.4175,35.4111],[-22.4175,34.925],[-22.4175,34.4389],[-22.4175,33.9528],[-22.4175,33.4667],[-22.6536,33.2167],[-23.1397,33.2167],[-23.3064,32.8972],[-23.3064,32.4111],[-23.3064,31.925],[-23.3064,31.4389],[-23.3064,30.9528],[-23.3064,30.4667],[-23.3064,29.9805],[-23.1397,29.6611],[-22.6536,29.6611],[-22.4175,29.4111],[-22.4175,28.925],[-22.4175,28.4389],[-22.4175,27.9528],[-22.0008,27.8833],[-21.5286,27.8694],[-21.5286,27.3833],[-21.4314,26.9944],[-20.9452,26.9944],[-20.6397,26.8139],[-20.6397,26.3278],[-20.6397,25.8417],[-20.6397,25.3555],[-20.2925,25.2167],[-19.8064,25.2167],[-19.3202,25.2167],[-18.8341,25.2167],[-18.348,25.2167],[-17.973,25.1055],[-17.973,24.6194],[-17.7786,24.3278],[-17.2925,24.3278],[-16.8064,24.3278],[-16.3202,24.3278],[-15.8341,24.3278],[-15.348,24.3278],[-14.8619,24.3278],[-14.3758,24.3278],[-13.8897,24.3278],[-13.4036,24.3278],[-12.9175,24.3278],[-12.6397,24.1194],[-12.6397,23.6333],[-12.348,23.4389],[-11.8619,23.4389],[-11.3758,23.4389],[-10.8897,23.4389],[-10.8619,23.8972],[-10.8619,24.3833],[-10.8619,24.8694],[-10.723,25.2167],[-10.2369,25.2167],[-9.7508,25.2167],[-9.2647,25.2167],[-9.0841,25.5222],[-9.0841,26.0083],[-8.6952,26.1055],[-8.2091,26.1055],[-7.723,26.1055],[-7.2369,26.1055],[-6.7508,26.1055],[-6.2647,26.1055],[-5.7786,26.1055],[-5.5286,25.8694],[-5.5286,25.3833],[-5.2091,25.2167],[-4.723,25.2167],[-4.2369,25.2167],[-3.7508,25.2167],[-3.7508,24.7305],[-3.6675,24.3278],[-3.1814,24.3278],[-2.8619,24.1611],[-2.8619,23.675],[-2.6119,23.4389],[-2.1258,23.4389],[-1.973,23.1055],[-1.973,22.6194],[-1.5564,22.55],[-1.0841,22.5361],[-1.0841,22.05],[-1.0841,21.5639],[-1.0841,21.0778],[-0.9036,20.7722],[-0.4175,20.7722],[-0.1952,20.5083],[-0.1952,20.0222],[0.152,19.8833],[0.6381,19.8833],[0.6936,19.4528],[0.6936,18.9667],[0.6936,18.4805],[0.6936,17.9944],[0.6936,17.5083],[0.4992,17.2167],[0.0131,17.2167],[-0.1952,16.9389],[-0.1952,16.4528],[-0.5564,16.3278],[-1.0425,16.3278],[-1.0841,15.8833],[-1.1258,15.4389],[-1.6119,15.4389],[-1.973,15.3139],[-1.973,14.8278],[-1.973,14.3417],[-1.973,13.8555],[-2.2647,13.6611],[-2.7508,13.6611],[-2.8619,13.2861],[-2.8619,12.8],[-3.3202,12.7722],[-3.7508,12.7167],[-3.7508,12.2305],[-3.7508,11.7444],[-3.7508,11.2583],[-3.973,10.9944],[-4.4591,10.9944],[-4.6397,10.6889],[-4.6397,10.2028],[-4.6397,9.7167],[-4.6397,9.2305],[-5.1119,9.2167],[-5.5286,9.1472],[-5.5286,8.6611],[-5.6814,8.3278],[-6.1675,8.3278],[-6.4175,8.0917],[-6.4175,7.6055],[-6.4175,7.1194],[-6.4175,6.6333],[-6.8202,6.55],[-7.3064,6.55],[-7.3064,6.0639],[-7.3064,5.5778],[-7.3064,5.0917],[-7.473,4.7722],[-7.9591,4.7722],[-8.1952,4.5222],[-8.1952,4.0361],[-8.5286,3.8833],[-9.0147,3.8833],[-9.0841,3.4667],[-9.0841,2.9805],[-9.0841,2.4944],[-9.1814,2.1055],[-9.6675,2.1055],[-9.973,1.925],[-9.973,1.4389],[-9.973,0.9528],[-9.973,0.4667],[-10.3202,0.3278],[-10.8064,0.3278],[-10.8619,-0.1028],[-10.8897,-0.5611],[-11.3758,-0.5611],[-11.7508,-0.6722],[-11.7508,-1.1583],[-11.7508,-1.6445],[-11.7508,-2.1306],[-12.0286,-2.3389],[-12.5147,-2.3389],[-12.6397,-2.7],[-12.6397,-3.1861],[-12.6397,-3.6722],[-12.6814,-4.1167],[-13.1675,-4.1167],[-13.5286,-4.2417],[-13.5286,-4.7278],[-13.7369,-5.0056],[-14.223,-5.0056],[-14.4175,-5.2972],[-14.4175,-5.7833],[-14.4175,-6.2695],[-14.4175,-6.7556],[-14.4175,-7.2417],[-14.4175,-7.7278],[-14.4175,-8.2139],[-14.2786,-8.5611],[-13.7925,-8.5611],[-13.5286,-8.7833],[-13.5286,-9.2695],[-13.5286,-9.7556],[-13.5286,-10.2417],[-13.9175,-10.3389],[-14.4036,-10.3389],[-14.4175,-10.8111],[-14.4869,-11.2278],[-14.973,-11.2278],[-15.4591,-11.2278],[-15.9452,-11.2278],[-16.1952,-10.9917],[-16.1952,-10.5056],[-16.5147,-10.3389],[-17.0008,-10.3389],[-17.0841,-9.9361]],"down":[[-8.6197,-8.4136],[-8.1567,-8.4136],[-7.7308,-8.4507],[-7.7308,-8.9136],[-7.6567,-9.3025],[-7.1937,-9.3025],[-6.8419,-9.4136],[-6.8419,-9.8766],[-6.8419,-10.3395],[-6.8419,-10.8025],[-7.0271,-11.0803],[-7.49,-11.0803],[-7.7308,-11.3025],[-7.7308,-11.7655],[-7.99,-11.9692],[-8.453,-11.9692],[-8.916,-11.9692],[-9.3789,-11.9692],[-9.8419,-11.9692],[-10.3049,-11.9692],[-10.3975,-11.5988],[-10.3975,-11.1358],[-10.8049,-11.0803],[-11.2678,-11.0803],[-11.2863,-10.6358],[-11.3049,-10.1914],[-11.7678,-10.1914],[-12.1752,-10.1358],[-12.1752,-9.6729],[-12.2678,-9.3025],[-12.7308,-9.3025],[-13.0641,-9.1729],[-13.0641,-8.7099],[-13.0641,-8.247],[-13.0641,-7.784],[-13.2678,-7.5247],[-13.7308,-7.5247],[-13.953,-7.284],[-13.953,-6.821],[-14.2308,-6.6358],[-14.6937,-6.6358],[-14.8419,-6.321],[-14.8419,-5.8581],[-14.8419,-5.3951],[-14.8419,-4.9321],[-14.8419,-4.4692],[-14.8419,-4.0062],[-14.8419,-3.5432],[-14.8419,-3.0803],[-15.3049,-3.0803],[-15.7308,-3.0432],[-15.7308,-2.5803],[-15.7308,-2.1173],[-15.7308,-1.6544],[-15.7308,-1.1914],[-15.7308,-0.7284],[-15.7308,-0.2655],[-15.7308,0.1975],[-15.7308,0.6605],[-15.7308,1.1234],[-15.7308,1.5864],[-15.7308,2.0493],[-15.7308,2.5123],[-15.7308,2.9753],[-15.7308,3.4382],[-15.7308,3.9012],[-15.7308,4.3642],[-15.7308,4.8271],[-15.7308,5.2901],[-15.7308,5.753],[-16.1382,5.8086],[-16.6012,5.8086],[-16.6197,6.253],[-16.6197,6.716],[-16.6197,7.179],[-16.6752,7.5864],[-17.1382,7.5864],[-17.5086,7.679],[-17.5086,8.1419],[-17.6382,8.4753],[-18.1012,8.4753],[-18.5641,8.4753],[-19.0271,8.4753],[-19.2863,8.679],[-19.2863,9.1419],[-19.5271,9.3642],[-19.99,9.3642],[-20.453,9.3642],[-20.916,9.3642],[-21.3789,9.3642],[-21.8419,9.3642],[-21.953,9.716],[-21.953,10.179],[-22.3419,10.253],[-22.8049,10.253],[-23.2678,10.253],[-23.7308,10.253],[-24.1937,10.253],[-24.6567,10.253],[-25.1197,10.253],[-25.5086,10.3271],[-25.5086,10.7901],[-25.6197,11.1419],[-26.0826,11.1419],[-26.5456,11.1419],[-27.0086,11.1419],[-27.2863,11.3271],[-27.2863,11.7901],[-27.5086,12.0308],[-27.9715,12.0308],[-28.4345,12.0308],[-28.8975,12.0308],[-29.0641,12.3271],[-29.0641,12.7901],[-29.3975,12.9197],[-29.8604,12.9197],[-30.3234,12.9197],[-30.7863,12.9197],[-30.8419,13.3271],[-30.8419,13.7901],[-31.2863,13.8086],[-31.7308,13.8271],[-31.7308,14.2901],[-31.7308,14.753],[-31.7308,15.216],[-31.8234,15.5864],[-32.2863,15.5864],[-32.6197,15.716],[-32.6197,16.179],[-32.6197,16.6419],[-32.6197,17.1049],[-32.8234,17.3642],[-33.2863,17.3642],[-33.5086,17.6049],[-33.5086,18.0679],[-33.5086,18.5308],[-33.5086,18.9938],[-33.5086,19.4568],[-33.5086,19.9197],[-33.5086,20.3827],[-33.5086,20.8456],[-33.8975,20.9197],[-34.3604,20.9197],[-34.3975,21.3456],[-34.3975,21.8086],[-34.3975,22.2716],[-34.3975,22.7345],[-34.3975,23.1975],[-34.3975,23.6605],[-34.3975,24.1234],[-34.3975,24.5864],[-34.3975,25.0493],[-34.5456,25.3642],[-35.0086,25.3642],[-35.2863,25.5493],[-35.2863,26.0123],[-35.2863,26.4753],[-35.2863,26.9382],[-35.2863,27.4012],[-35.2863,27.8642],[-35.2863,28.3271],[-35.2863,28.7901],[-35.2863,29.253],[-35.2863,29.716],[-35.6567,29.8086],[-36.1197,29.8086],[-36.1752,30.216],[-36.1752,30.679],[-36.1752,31.1419],[-36.1752,31.6049],[-36.1752,32.0679],[-36.1752,32.5308],[-36.1752,32.9938],[-36.1752,33.4568],[-36.1752,33.9197],[-36.1752,34.3827],[-36.1752,34.8456],[-36.1752,35.3086],[-36.1752,35.7716],[-36.1752,36.2345],[-36.1752,36.6975],[-35.9345,36.9197],[-35.4715,36.9197],[-35.2863,37.1975],[-35.2863,37.6605],[-35.2863,38.1234],[-35.2863,38.5864],[-34.9345,38.6975],[-34.4715,38.6975],[-34.3975,39.0864],[-34.3975,39.5493],[-33.9715,39.5864],[-33.5086,39.5864],[-33.0456,39.5864],[-32.6197,39.6234],[-32.6197,40.0864],[-32.5456,40.4753],[-32.0826,40.4753],[-31.6197,40.4753],[-31.1567,40.4753],[-30.6937,40.4753],[-30.2308,40.4753],[-29.7678,40.4753],[-29.3049,40.4753],[-29.0641,40.6975],[-29.0641,41.1605],[-28.8049,41.3642],[-28.3419,41.3642],[-27.8789,41.3642],[-27.416,41.3642],[-27.2863,41.0308],[-27.2863,40.5679],[-26.916,40.4753],[-26.453,40.4753],[-25.99,40.4753],[-25.5271,40.4753],[-25.5086,40.0308],[-25.49,39.5864],[-25.0271,39.5864],[-24.6197,39.5308],[-24.6197,39.0679],[-24.5271,38.6975],[-24.0641,38.6975],[-23.7308,38.5679],[-23.7308,38.1049],[-23.7308,37.6419],[-23.7308,37.179],[-23.5271,36.9197],[-23.0641,36.9197],[-22.8419,36.679],[-22.8419,36.216],[-22.8419,35.753],[-22.8419,35.2901],[-22.8419,34.8271],[-22.8419,34.3642],[-22.49,34.253],[-22.0271,34.253],[-21.953,33.8642],[-21.953,33.4012],[-21.953,32.9382],[-21.953,32.4753],[-21.49,32.4753],[-21.0641,32.4382],[-21.0641,31.9753],[-21.0641,31.5123],[-21.0641,31.0493],[-20.953,30.6975],[-20.49,30.6975],[-20.1752,30.5493],[-20.1752,30.0864],[-19.99,29.8086],[-19.5271,29.8086],[-19.2863,29.5864],[-19.2863,29.1234],[-19.0271,28.9197],[-18.5641,28.9197],[-18.3975,28.6234],[-18.3975,28.1605],[-18.0641,28.0308],[-17.6012,28.0308],[-17.5086,27.6605],[-17.5086,27.1975],[-17.1012,27.1419],[-16.6382,27.1419],[-16.1752,27.1419],[-15.7308,27.1234],[-15.7308,26.6605],[-15.6752,26.253],[-15.2123,26.253],[-14.8419,26.1605],[-14.8419,25.6975],[-14.8419,25.2345],[-14.8419,24.7716],[-14.6752,24.4753],[-14.2123,24.4753],[-13.7493,24.4753],[-13.2863,24.4753],[-13.0641,24.2345],[-13.0641,23.7716],[-12.7863,23.5864],[-12.3234,23.5864],[-11.8604,23.5864],[-11.3975,23.5864],[-11.2863,23.2345],[-11.2863,22.7716],[-10.8975,22.6975],[-10.4345,22.6975],[-10.3975,22.2716],[-10.3975,21.8086],[-9.9345,21.8086],[-9.5086,21.7716],[-9.5086,21.3086],[-9.5086,20.8456],[-9.5086,20.3827],[-9.3975,20.0308],[-8.9345,20.0308],[-8.6197,19.8827],[-8.6197,19.4197],[-8.4345,19.1419],[-7.9715,19.1419],[-7.7308,18.9197],[-7.7308,18.4568],[-7.4715,18.253],[-7.0086,18.253],[-6.8419,17.9568],[-6.8419,17.4938],[-6.5086,17.3642],[-6.0456,17.3642],[-5.953,16.9938],[-5.953,16.5308],[-6.3604,16.4753],[-6.8234,16.4753],[-7.2863,16.4753],[-7.7308,16.4938],[-7.7308,16.9568],[-7.7863,17.3642],[-8.2493,17.3642],[-8.7123,17.3642],[-9.1752,17.3642],[-9.5086,17.4938],[-9.5086,17.9568],[-9.6752,18.253],[-10.1382,18.253],[-10.3975,18.0493],[-10.3975,17.5864],[-10.3975,17.1234],[-10.3975,16.6605],[-10.3975,16.1975],[-10.3975,15.7345],[-10.3975,15.2716],[-10.3975,14.8086],[-10.3975,14.3456],[-10.3975,13.8827],[-10.0086,13.8086],[-9.5456,13.8086],[-9.5086,13.3827],[-9.5086,12.9197],[-9.5086,12.4568],[-9.5086,11.9938],[-9.5086,11.5308],[-9.5086,11.0679],[-9.5086,10.6049],[-9.5086,10.1419],[-9.5086,9.679],[-9.5086,9.216],[-9.5086,8.753],[-9.5086,8.2901],[-9.5086,7.8271],[-9.5086,7.3642],[-9.5086,6.9012],[-9.5086,6.4382],[-9.5086,5.9753],[-9.5086,5.5123],[-9.5086,5.0493],[-9.5086,4.5864],[-9.5086,4.1234],[-9.5086,3.6605],[-9.5086,3.1975],[-9.5086,2.7345],[-9.5086,2.2716],[-9.5086,1.8086],[-9.5086,1.3456],[-9.5086,0.8827],[-9.5086,0.4197],[-9.5086,-0.0432],[-9.5086,-0.5062],[-9.5086,-0.9692],[-9.5086,-1.4321],[-9.5086,-1.8951],[-9.3419,-2.1914],[-8.8789,-2.1914],[-8.6197,-2.3951],[-8.6197,-2.8581],[-8.6197,-3.321],[-8.6197,-3.784],[-8.6197,-4.247],[-8.6197,-4.7099],[-8.6197,-5.1729],[-8.6197,-5.6358],[-8.6197,-6.0988],[-8.6197,-6.5618],[-8.6197,-7.0247],[-8.6197,-7.4877],[-8.6197,-7.9507]],"land":[[-14.4302,6.1092],[-14.5164,6.3569],[-14.6027,6.6047],[-14.6889,6.8524],[-14.7752,7.1001],[-14.8615,7.3478],[-14.9478,7.5955],[-15.0334,7.8435],[-15.119,8.0915],[-15.2045,8.3394],[-15.29,8.5874],[-15.3754,8.8355],[-15.4608,9.0835],[-15.5456,9.3317],[-15.6304,9.5799],[-15.7152,9.8282],[-15.7997,10.0765],[-15.8842,10.3248],[-15.9687,10.5732],[-16.0527,10.8217],[-16.1365,11.0702],[-16.2203,11.3188],[-16.3039,11.5674],[-16.3874,11.8161],[-16.4709,12.0648],[-16.5538,12.3136],[-16.6365,12.5626],[-16.7192,12.8115],[-16.8017,13.0606],[-16.884,13.3096],[-16.9664,13.5586],[-17.0482,13.8079],[-17.1296,14.0573],[-17.2109,14.3066],[-17.2921,14.5561],[-17.3731,14.8056],[-17.4541,15.0551],[-17.5346,15.3047],[-17.6145,15.5546],[-17.6943,15.8044],[-17.7739,16.0544],[-17.8532,16.3044],[-17.9325,16.5545],[-18.0113,16.8047],[-18.0897,17.055],[-18.1681,17.3053],[-18.246,17.5558],[-18.323,17.8066],[-18.4001,18.0573],[-18.4769,18.3081],[-18.5532,18.5591],[-18.6295,18.8101],[-18.7053,19.0612],[-18.7802,19.3126],[-18.855,19.564],[-18.9295,19.8155],[-19.0027,20.0674],[-19.0759,20.3193],[-19.1488,20.5713],[-19.2206,20.8236],[-19.2924,21.0759],[-19.3639,21.3283],[-19.434,21.581],[-19.5041,21.8338],[-19.574,22.0867],[-19.6415,22.3401],[-19.7091,22.5936],[-19.7765,22.8471],[-19.8413,23.1013],[-19.9061,23.3554],[-19.9709,23.6096],[-20.0326,23.8646],[-20.0944,24.1195],[-20.1561,24.3745],[-20.214,24.6303],[-20.2719,24.8862],[-20.3298,25.142],[-20.3831,25.3989],[-20.436,25.6558],[-20.489,25.9127],[-20.5363,26.1707],[-20.583,26.4288],[-20.6296,26.687],[-20.6691,26.9463],[-20.7074,27.2058],[-20.7457,27.4653],[-20.7748,27.7259],[-20.8019,27.9869],[-20.829,28.2478],[-20.8442,28.5096],[-20.856,28.7716],[-20.8679,29.0337],[-20.8644,29.2958],[-20.8555,29.558],[-20.8465,29.8201],[-20.819,30.0807],[-20.7832,30.3405],[-20.7474,30.6004],[-20.6599,30.8446],[-20.5452,31.0805],[-20.4306,31.3165],[-20.2461,31.4976],[-20.0441,31.6649],[-19.8421,31.8323],[-19.6401,31.9996],[-19.4381,32.167],[-19.2361,32.3343],[-19.0341,32.5017],[-18.8321,32.669],[-18.6301,32.8363],[-18.4281,33.0037],[-18.2261,33.171],[-18.0241,33.3384],[-17.8221,33.5057],[-17.6201,33.6731],[-17.4181,33.8404],[-17.2161,34.0078],[-17.0141,34.1751],[-16.8121,34.3424],[-16.6101,34.5098],[-16.4081,34.6771],[-16.2061,34.8445],[-16.0041,35.0118],[-15.8021,35.1792],[-15.6001,35.3465],[-15.3795,35.4831],[-15.1374,35.5839],[-14.8952,35.6847],[-14.6409,35.7066],[-14.3796,35.6833],[-14.1183,35.66],[-13.857,35.6367],[-13.5957,35.6134],[-13.3345,35.5901],[-13.0734,35.565],[-12.8124,35.5385],[-12.5514,35.5121],[-12.2906,35.4843],[-12.0299,35.4554],[-11.7691,35.4264],[-11.5084,35.3974],[-11.2477,35.3685],[-10.987,35.3395],[-10.7263,35.3105],[-10.4656,35.2815],[-10.2049,35.2526],[-9.9442,35.2236],[-9.6835,35.1946],[-9.4227,35.1657],[-9.162,35.1367],[-8.9013,35.1078],[-8.6406,35.0788],[-8.3799,35.0498],[-8.1192,35.0209],[-7.8585,34.9919],[-7.5978,34.9629],[-7.3371,34.9339],[-7.0764,34.905],[-6.8156,34.876],[-6.5549,34.847],[-6.2942,34.8181],[-6.0343,34.7842],[-5.7785,34.7264],[-5.5226,34.6686],[-5.386,34.5258],[-5.415,34.2651],[-5.444,34.0044],[-5.4729,33.7437],[-5.5019,33.483],[-5.5308,33.2222],[-5.5598,32.9615],[-5.5888,32.7008],[-5.6178,32.4401],[-5.6468,32.1794],[-5.6757,31.9187],[-5.7047,31.658],[-5.7336,31.3973],[-5.7626,31.1366],[-5.7916,30.8759],[-5.8205,30.6151],[-5.8495,30.3544],[-5.8784,30.0937],[-5.9074,29.833],[-5.9364,29.5723],[-5.9654,29.3116],[-5.9944,29.0509],[-6.0233,28.7902],[-6.0523,28.5295],[-6.0812,28.2687],[-6.1102,28.008],[-6.1392,27.7473],[-6.1681,27.4866],[-6.1971,27.2259],[-6.2261,26.9652],[-6.2551,26.7045],[-6.2841,26.4438],[-6.313,26.1831],[-6.342,25.9224],[-6.3709,25.6616],[-6.3999,25.4009],[-6.4289,25.1402],[-6.4578,24.8795],[-6.4868,24.6188],[-6.5157,24.3581],[-6.5447,24.0974],[-6.5737,23.8367],[-6.6027,23.576],[-6.8144,23.4645],[-7.0641,23.3841],[-7.3196,23.3613],[-7.5803,23.3902],[-7.841,23.4192],[-8.1017,23.4481],[-8.3624,23.4771],[-8.6231,23.5061],[-8.8838,23.535],[-9.1446,23.564],[-9.4053,23.593],[-9.666,23.622],[-9.9267,23.6509],[-10.1874,23.6799],[-10.4481,23.7089],[-10.7088,23.7378],[-10.9695,23.7668],[-11.2302,23.7957],[-11.491,23.8247],[-11.7517,23.8537],[-12.0124,23.8826],[-12.2731,23.9116],[-12.5338,23.9406],[-12.7945,23.9696],[-13.0552,23.9986],[-13.3159,24.0275],[-13.5765,24.0572],[-13.8368,24.0901],[-14.097,24.123],[-14.352,24.1711],[-14.5764,24.3069],[-14.6258,24.4529],[-14.4186,24.6137],[-14.2114,24.7746],[-14.0042,24.9355],[-13.797,25.0964],[-13.5898,25.2572],[-13.3826,25.4181],[-13.1754,25.579],[-12.9682,25.7399],[-12.761,25.9008],[-12.5538,26.0616],[-12.3467,26.2225],[-12.1395,26.3834],[-11.9323,26.5443],[-11.7251,26.7051],[-11.5179,26.866],[-11.3107,27.0269],[-11.1035,27.1878],[-10.8963,27.3486],[-10.6891,27.5095],[-10.482,27.6704],[-10.2748,27.8313],[-10.0676,27.9922],[-9.8604,28.1531],[-9.6607,28.3196],[-9.5629,28.563],[-9.4652,28.8064],[-9.3744,28.9517],[-9.312,28.697],[-9.2608,28.4397],[-9.2127,28.1819],[-9.1646,27.924],[-9.1099,27.6675],[-9.0529,27.4114],[-8.9959,27.1554],[-8.9355,26.9002],[-8.8735,26.6453],[-8.8116,26.3904],[-8.7472,26.1361],[-8.6815,25.8821],[-8.6159,25.6281],[-8.5485,25.3746],[-8.48,25.1214],[-8.4115,24.8682],[-8.3417,24.6154],[-8.2709,24.3628],[-8.2001,24.1102],[-8.1283,23.8579],[-8.0556,23.6059],[-7.9828,23.3538],[-7.9091,23.1021],[-7.8344,22.8506],[-7.7597,22.5992],[-7.6845,22.3479],[-7.6086,22.0968],[-7.5327,21.8457],[-7.4564,21.5947],[-7.3795,21.3439],[-7.3026,21.0932],[-7.2251,20.8425],[-7.1468,20.5922],[-7.0684,20.3419],[-6.9897,20.0916],[-6.9105,19.8416],[-6.8312,19.5915],[-6.7518,19.3415],[-6.6719,19.0916],[-6.5921,18.8418],[-6.5119,18.592],[-6.4307,18.3426],[-6.3496,18.0931],[-6.2683,17.8437],[-6.1868,17.5944],[-6.1053,17.3451],[-6.0236,17.0958],[-5.9413,16.8467],[-5.8589,16.5977],[-5.7765,16.3487],[-5.6935,16.0998],[-5.6106,15.8509],[-5.5276,15.6021],[-5.4441,15.3534],[-5.3606,15.1048],[-5.2771,14.8561],[-5.193,14.6076],[-5.109,14.3591],[-5.0249,14.1107],[-4.9404,13.8623],[-4.8559,13.614],[-4.7714,13.3656],[-4.6864,13.1175],[-4.6013,12.8694],[-4.5163,12.6212],[-4.4309,12.3732],[-4.3454,12.1252],[-4.26,11.8772],[-4.1742,11.6293],[-4.0883,11.3814],[-4.0024,11.1336],[-3.9162,10.8858],[-3.83,10.6381],[-3.7437,10.3904],[-3.7794,10.1389],[-3.8503,9.8863],[-4.0257,9.732],[-4.2734,9.6458],[-4.5211,9.5595],[-4.7688,9.4733],[-5.0166,9.387],[-5.2643,9.3007],[-5.512,9.2145],[-5.7598,9.1283],[-6.0075,9.042],[-6.2552,8.9558],[-6.5029,8.8695],[-6.7507,8.7832],[-6.9984,8.697],[-7.2461,8.6107],[-7.4938,8.5244],[-7.7416,8.4381],[-7.9893,8.3519],[-8.237,8.2656],[-8.4847,8.1794],[-8.7325,8.0931],[-8.9802,8.0069],[-9.2279,7.9206],[-9.4757,7.8344],[-9.7234,7.7481],[-9.9711,7.6619],[-10.2188,7.5756],[-10.4666,7.4893],[-10.7143,7.4031],[-10.962,7.3168],[-11.2098,7.2306],[-11.4575,7.1443],[-11.7052,7.0581],[-11.9529,6.9718],[-12.2007,6.8856],[-12.4484,6.7993],[-12.6961,6.713],[-12.9438,6.6267],[-13.1916,6.5405],[-13.4393,6.4542],[-13.687,6.368],[-13.9347,6.2817],[-14.1825,6.1955]]},"backFar":{"up":[[5.1381,15.4389],[5.1381,15.1333],[5.1381,14.8278],[5.1381,14.5222],[5.1381,14.2167],[5.1381,13.9111],[5.1936,13.6611],[5.4992,13.6611],[5.8048,13.6611],[6.027,13.5778],[6.027,13.2722],[6.027,12.9667],[6.1381,12.7722],[6.4436,12.7722],[6.7492,12.7722],[7.0548,12.7722],[7.3603,12.7722],[7.6659,12.7722],[7.8048,12.9389],[7.8048,13.2444],[7.8048,13.55],[7.9992,13.6611],[8.3048,13.6611],[8.6103,13.6611],[8.6936,13.8833],[8.6936,14.1889],[8.6936,14.4944],[8.6936,14.8],[8.6936,15.1055],[8.6936,15.4111],[8.6936,15.7167],[8.6936,16.0222],[8.6936,16.3278],[8.6936,16.6333],[8.6936,16.9389],[8.6659,17.2167],[8.3603,17.2167],[8.0548,17.2167],[7.8048,17.2722],[7.8048,17.5778],[7.8048,17.8833],[7.8048,18.1889],[7.8048,18.4944],[7.8048,18.8],[7.6936,18.9944],[7.3881,18.9944],[7.0825,18.9944],[6.9159,19.1333],[6.9159,19.4389],[6.9159,19.7444],[6.7492,19.8833],[6.4436,19.8833],[6.1381,19.8833],[6.027,20.0778],[6.027,20.3833],[6.027,20.6889],[6.027,20.9944],[6.027,21.3],[6.027,21.6055],[5.777,21.6611],[5.4714,21.6611],[5.1659,21.6611],[5.1381,21.9389],[5.1381,22.2444],[5.1381,22.55],[4.8325,22.55],[4.527,22.55],[4.2492,22.5778],[4.2492,22.8833],[4.2492,23.1889],[4.1936,23.4389],[3.8881,23.4389],[3.5825,23.4389],[3.3603,23.5222],[3.3603,23.8278],[3.3603,24.1333],[3.2492,24.3278],[2.9436,24.3278],[2.6381,24.3278],[2.4714,24.4667],[2.4714,24.7722],[2.4714,25.0778],[2.3048,25.2167],[1.9992,25.2167],[1.6936,25.2167],[1.5825,25.4111],[1.5825,25.7167],[1.5825,26.0222],[1.3603,26.1055],[1.0548,26.1055],[0.7492,26.1055],[0.6936,26.3555],[0.6936,26.6611],[0.6936,26.9667],[0.4159,26.9944],[0.1103,26.9944],[-0.1952,26.9944],[-0.1952,27.3],[-0.1952,27.6055],[-0.223,27.8833],[-0.5286,27.8833],[-0.8341,27.8833],[-1.0841,27.9389],[-1.0841,28.2444],[-1.0841,28.55],[-1.1675,28.7722],[-1.473,28.7722],[-1.7786,28.7722],[-1.973,28.8833],[-1.973,29.1889],[-1.973,29.4944],[-2.1119,29.6611],[-2.4175,29.6611],[-2.723,29.6611],[-3.0286,29.6611],[-3.3341,29.6611],[-3.6397,29.6611],[-3.7508,29.8555],[-3.7508,30.1611],[-3.7508,30.4667],[-3.973,30.55],[-4.2786,30.55],[-4.5841,30.55],[-4.6397,30.8],[-4.6397,31.1055],[-4.6397,31.4111],[-4.3619,31.4389],[-4.0564,31.4389],[-3.7508,31.4389],[-3.7508,31.7444],[-3.7508,32.05],[-3.723,32.3278],[-3.4175,32.3278],[-3.1119,32.3278],[-2.8619,32.3833],[-2.8619,32.6889],[-2.8619,32.9944],[-2.7786,33.2167],[-2.473,33.2167],[-2.1675,33.2167],[-1.973,33.3278],[-1.973,33.6333],[-1.973,33.9389],[-1.8341,34.1055],[-1.5286,34.1055],[-1.223,34.1055],[-1.0841,34.2722],[-1.0841,34.5778],[-1.0841,34.8833],[-1.0841,35.1889],[-1.0841,35.4944],[-1.0841,35.8],[-1.0841,36.1055],[-1.0841,36.4111],[-1.0841,36.7167],[-1.0841,37.0222],[-1.0841,37.3278],[-1.0841,37.6333],[-1.3619,37.6611],[-1.6675,37.6611],[-1.973,37.6611],[-1.973,37.9667],[-1.973,38.2722],[-2.0008,38.55],[-2.3064,38.55],[-2.6119,38.55],[-2.8619,38.6055],[-2.8619,38.9111],[-2.8619,39.2167],[-2.9452,39.4389],[-3.2508,39.4389],[-3.5564,39.4389],[-3.8619,39.4389],[-4.1675,39.4389],[-4.473,39.4389],[-4.6397,39.5778],[-4.6397,39.8833],[-4.6397,40.1889],[-4.8064,40.3278],[-5.1119,40.3278],[-5.4175,40.3278],[-5.723,40.3278],[-6.0286,40.3278],[-6.3341,40.3278],[-6.6397,40.3278],[-6.9452,40.3278],[-7.2508,40.3278],[-7.5564,40.3278],[-7.8619,40.3278],[-8.1675,40.3278],[-8.473,40.3278],[-8.7786,40.3278],[-9.0841,40.3278],[-9.3897,40.3278],[-9.6952,40.3278],[-10.0008,40.3278],[-10.3064,40.3278],[-10.6119,40.3278],[-10.9175,40.3278],[-11.223,40.3278],[-11.5286,40.3278],[-11.7508,40.2444],[-11.7508,39.9389],[-11.7508,39.6333],[-11.8619,39.4389],[-12.1675,39.4389],[-12.473,39.4389],[-12.7786,39.4389],[-13.0841,39.4389],[-13.3897,39.4389],[-13.6952,39.4389],[-14.0008,39.4389],[-14.3064,39.4389],[-14.4175,39.2444],[-14.4175,38.9389],[-14.4175,38.6333],[-14.6397,38.55],[-14.9452,38.55],[-15.2508,38.55],[-15.3064,38.3],[-15.3064,37.9944],[-15.3064,37.6889],[-15.5841,37.6611],[-15.8897,37.6611],[-16.1952,37.6611],[-16.1952,37.3555],[-16.1952,37.05],[-16.223,36.7722],[-16.5286,36.7722],[-16.8341,36.7722],[-17.0841,36.7167],[-17.0841,36.4111],[-17.0841,36.1055],[-17.0841,35.8],[-17.0841,35.4944],[-17.0841,35.1889],[-17.1952,34.9944],[-17.5008,34.9944],[-17.8064,34.9944],[-17.973,34.8555],[-17.973,34.55],[-17.973,34.2444],[-17.973,33.9389],[-17.973,33.6333],[-17.973,33.3278],[-17.973,33.0222],[-17.973,32.7167],[-17.973,32.4111],[-17.973,32.1055],[-17.973,31.8],[-17.973,31.4944],[-17.973,31.1889],[-17.973,30.8833],[-17.973,30.5778],[-17.973,30.2722],[-17.973,29.9667],[-17.973,29.6611],[-18.2786,29.6611],[-18.5841,29.6611],[-18.8619,29.6333],[-18.8619,29.3278],[-18.8619,29.0222],[-18.8619,28.7167],[-18.8619,28.4111],[-18.8619,28.1055],[-18.8619,27.8],[-18.8619,27.4944],[-18.8619,27.1889],[-18.7508,26.9944],[-18.4452,26.9944],[-18.1397,26.9944],[-17.973,26.8555],[-17.973,26.55],[-17.973,26.2444],[-17.8064,26.1055],[-17.5008,26.1055],[-17.1952,26.1055],[-16.8897,26.1055],[-16.5841,26.1055],[-16.2786,26.1055],[-15.973,26.1055],[-15.6675,26.1055],[-15.3619,26.1055],[-15.0564,26.1055],[-14.7508,26.1055],[-14.4452,26.1055],[-14.4175,25.8278],[-14.4175,25.5222],[-14.4175,25.2167],[-14.1119,25.2167],[-13.8064,25.2167],[-13.5286,25.1889],[-13.5286,24.8833],[-13.5286,24.5778],[-13.473,24.3278],[-13.1675,24.3278],[-12.8619,24.3278],[-12.6397,24.2444],[-12.6397,23.9389],[-12.6397,23.6333],[-12.5286,23.4389],[-12.223,23.4389],[-11.9175,23.4389],[-11.7508,23.3],[-11.7508,22.9944],[-11.7508,22.6889],[-11.7508,22.3833],[-11.7508,22.0778],[-11.7508,21.7722],[-11.5564,21.6611],[-11.2508,21.6611],[-10.9452,21.6611],[-10.6397,21.6611],[-10.3341,21.6611],[-10.0286,21.6611],[-9.723,21.6611],[-9.4175,21.6611],[-9.1119,21.6611],[-8.8064,21.6611],[-8.5008,21.6611],[-8.1952,21.6611],[-7.8897,21.6611],[-7.5841,21.6611],[-7.2786,21.6611],[-6.973,21.6611],[-6.6675,21.6611],[-6.3619,21.6611],[-6.0564,21.6611],[-5.7508,21.6611],[-5.5286,21.5778],[-5.5286,21.2722],[-5.5286,20.9667],[-5.4175,20.7722],[-5.1119,20.7722],[-4.8064,20.7722],[-4.6397,20.6333],[-4.6397,20.3278],[-4.6397,20.0222],[-4.473,19.8833],[-4.1675,19.8833],[-3.8619,19.8833],[-3.7508,19.6889],[-3.7508,19.3833],[-3.7508,19.0778],[-3.7508,18.7722],[-3.7508,18.4667],[-3.7508,18.1611],[-3.5008,18.1055],[-3.1952,18.1055],[-2.8897,18.1055],[-2.8619,17.8278],[-2.8619,17.5222],[-2.8619,17.2167],[-2.5564,17.2167],[-2.2508,17.2167],[-1.973,17.1889],[-1.973,16.8833],[-1.973,16.5778],[-1.9175,16.3278],[-1.6119,16.3278],[-1.3064,16.3278],[-1.0841,16.2444],[-1.0841,15.9389],[-1.0841,15.6333],[-0.973,15.4389],[-0.6675,15.4389],[-0.3619,15.4389],[-0.0564,15.4389],[0.2492,15.4389],[0.5548,15.4389],[0.8603,15.4389],[1.1659,15.4389],[1.4714,15.4389],[1.777,15.4389],[2.0825,15.4389],[2.3881,15.4389],[2.6936,15.4389],[2.9992,15.4389],[3.3048,15.4389],[3.6103,15.4389],[3.9159,15.4389],[4.2214,15.4389],[4.527,15.4389],[4.8325,15.4389]],"down":[[-6.8419,20.9197],[-6.5687,20.9197],[-6.2956,20.9197],[-6.0225,20.9197],[-5.7493,20.9197],[-5.4762,20.9197],[-5.203,20.9197],[-5.0641,21.054],[-5.0641,21.3271],[-5.0641,21.6003],[-4.9993,21.8086],[-4.7262,21.8086],[-4.453,21.8086],[-4.1799,21.8086],[-4.1752,22.0771],[-4.1752,22.3503],[-4.1752,22.6234],[-4.1752,22.8966],[-4.1752,23.1697],[-4.1752,23.4429],[-4.3049,23.5864],[-4.578,23.5864],[-4.8512,23.5864],[-5.0641,23.6466],[-5.0641,23.9197],[-5.0641,24.1929],[-5.0641,24.466],[-5.328,24.4753],[-5.6012,24.4753],[-5.8743,24.4753],[-5.953,24.6697],[-5.953,24.9429],[-5.953,25.216],[-5.953,25.4892],[-5.953,25.7623],[-5.953,26.0355],[-5.953,26.3086],[-5.953,26.5818],[-5.953,26.8549],[-5.953,27.128],[-5.953,27.4012],[-5.953,27.6743],[-5.953,27.9475],[-5.7632,28.0308],[-5.49,28.0308],[-5.2169,28.0308],[-5.0641,28.1512],[-5.0641,28.4243],[-5.0641,28.6975],[-5.0641,28.9706],[-5.0641,29.2438],[-5.0641,29.5169],[-5.0641,29.7901],[-5.0641,30.0632],[-5.0641,30.3364],[-5.0641,30.6095],[-4.8789,30.6975],[-4.6058,30.6975],[-4.3326,30.6975],[-4.1752,30.8132],[-4.1752,31.0864],[-4.1752,31.3595],[-4.1752,31.6327],[-4.1752,31.9058],[-4.1752,32.179],[-4.1752,32.4521],[-4.1752,32.7253],[-4.1752,32.9984],[-4.1752,33.2716],[-3.9947,33.3642],[-3.7215,33.3642],[-3.4484,33.3642],[-3.2863,33.4753],[-3.2863,33.7484],[-3.2863,34.0216],[-3.2863,34.2947],[-3.2863,34.5679],[-3.2863,34.841],[-3.2863,35.1142],[-3.041,35.1419],[-2.7678,35.1419],[-2.4947,35.1419],[-2.3975,35.3179],[-2.3975,35.591],[-2.3975,35.8642],[-2.291,36.0308],[-2.0178,36.0308],[-1.7447,36.0308],[-1.5086,36.0679],[-1.5086,36.341],[-1.5086,36.6142],[-1.5086,36.8873],[-1.5086,37.1605],[-1.5086,37.4336],[-1.5086,37.7068],[-1.3373,37.8086],[-1.0641,37.8086],[-0.791,37.8086],[-0.5178,37.8086],[-0.2447,37.8086],[0.0285,37.8086],[0.2692,37.841],[0.2692,38.1142],[0.2692,38.3873],[0.2692,38.6605],[0.5053,38.6975],[0.7785,38.6975],[1.0516,38.6975],[1.1581,38.8642],[1.1581,39.1373],[1.1581,39.4105],[1.2553,39.5864],[1.5285,39.5864],[1.8016,39.5864],[2.047,39.6142],[2.047,39.8873],[2.047,40.1605],[2.047,40.4336],[2.047,40.7068],[2.047,40.9799],[2.047,41.253],[2.047,41.5262],[2.047,41.7993],[2.047,42.0725],[2.047,42.3456],[2.047,42.6188],[2.047,42.8919],[2.047,43.1651],[2.047,43.4382],[2.047,43.7114],[2.047,43.9845],[1.8201,44.0308],[1.547,44.0308],[1.2738,44.0308],[1.1581,44.1882],[1.1581,44.4614],[1.1581,44.7345],[1.1581,45.0077],[1.1581,45.2808],[1.1581,45.554],[1.1396,45.8086],[0.8664,45.8086],[0.5933,45.8086],[0.3201,45.8086],[0.2692,46.0308],[0.2692,46.304],[0.2692,46.5771],[0.1164,46.6975],[-0.1567,46.6975],[-0.4299,46.6975],[-0.703,46.6975],[-0.9762,46.6975],[-1.2493,46.6975],[-1.5086,46.7114],[-1.5086,46.9845],[-1.5086,47.2577],[-1.5086,47.5308],[-1.7262,47.5864],[-1.9993,47.5864],[-2.2725,47.5864],[-2.5456,47.5864],[-2.8187,47.5864],[-3.0919,47.5864],[-3.365,47.5864],[-3.6382,47.5864],[-3.9113,47.5864],[-4.1845,47.5864],[-4.4576,47.5864],[-4.7308,47.5864],[-5.0039,47.5864],[-5.2771,47.5864],[-5.5502,47.5864],[-5.8234,47.5864],[-6.0965,47.5864],[-6.3697,47.5864],[-6.6428,47.5864],[-6.916,47.5864],[-7.1891,47.5864],[-7.4623,47.5864],[-7.7354,47.5864],[-8.0086,47.5864],[-8.2817,47.5864],[-8.5549,47.5864],[-8.6197,47.378],[-8.6197,47.1049],[-8.6197,46.8318],[-8.7586,46.6975],[-9.0317,46.6975],[-9.3049,46.6975],[-9.578,46.6975],[-9.8512,46.6975],[-10.1243,46.6975],[-10.3975,46.6975],[-10.3975,46.4243],[-10.3975,46.1512],[-10.3975,45.878],[-10.6012,45.8086],[-10.8743,45.8086],[-11.1475,45.8086],[-11.4206,45.8086],[-11.6937,45.8086],[-11.9669,45.8086],[-12.1752,45.7438],[-12.1752,45.4706],[-12.1752,45.1975],[-12.1752,44.9243],[-12.4437,44.9197],[-12.7169,44.9197],[-12.99,44.9197],[-13.0641,44.7206],[-13.0641,44.4475],[-13.0641,44.1743],[-13.1937,44.0308],[-13.4669,44.0308],[-13.74,44.0308],[-13.953,43.9706],[-13.953,43.6975],[-13.953,43.4243],[-13.953,43.1512],[-14.2169,43.1419],[-14.49,43.1419],[-14.7632,43.1419],[-14.8419,42.9475],[-14.8419,42.6743],[-14.8419,42.4012],[-14.8419,42.128],[-14.8419,41.8549],[-14.8419,41.5818],[-14.8975,41.3642],[-15.1706,41.3642],[-15.4437,41.3642],[-15.7169,41.3642],[-15.7308,41.1049],[-15.7308,40.8318],[-15.7308,40.5586],[-15.7308,40.2855],[-15.7308,40.0123],[-15.7308,39.7392],[-15.7308,39.466],[-15.7308,39.1929],[-15.7308,38.9197],[-15.7308,38.6466],[-15.7308,38.3734],[-15.7308,38.1003],[-15.7308,37.8271],[-15.7308,37.554],[-15.7308,37.2808],[-15.7308,37.0077],[-15.7308,36.7345],[-15.7308,36.4614],[-15.7308,36.1882],[-15.7308,35.9151],[-15.7308,35.6419],[-15.7308,35.3688],[-15.7308,35.0956],[-15.7308,34.8225],[-15.7308,34.5493],[-15.7308,34.2762],[-15.7308,34.003],[-15.7308,33.7299],[-15.7308,33.4568],[-15.7308,33.1836],[-15.7308,32.9105],[-15.7308,32.6373],[-15.7308,32.3642],[-15.7308,32.091],[-15.7308,31.8179],[-15.7308,31.5447],[-15.7308,31.2716],[-15.7308,30.9984],[-15.7308,30.7253],[-15.7308,30.4521],[-15.7308,30.179],[-15.7308,29.9058],[-15.7308,29.6327],[-15.7308,29.3595],[-15.7308,29.0864],[-15.6243,28.9197],[-15.3512,28.9197],[-15.078,28.9197],[-14.8419,28.8827],[-14.8419,28.6095],[-14.8419,28.3364],[-14.8419,28.0632],[-14.6012,28.0308],[-14.328,28.0308],[-14.0549,28.0308],[-13.953,27.8595],[-13.953,27.5864],[-13.953,27.3132],[-13.953,27.0401],[-13.953,26.7669],[-13.953,26.4938],[-13.9854,26.253],[-14.2586,26.253],[-14.5317,26.253],[-14.8049,26.253],[-14.8419,26.0169],[-14.8419,25.7438],[-14.8419,25.4706],[-14.8419,25.1975],[-14.8419,24.9243],[-14.8419,24.6512],[-14.7447,24.4753],[-14.4715,24.4753],[-14.1984,24.4753],[-13.9252,24.4753],[-13.6521,24.4753],[-13.3789,24.4753],[-13.1058,24.4753],[-13.0641,24.2438],[-13.0641,23.9706],[-13.0641,23.6975],[-12.9021,23.5864],[-12.6289,23.5864],[-12.3558,23.5864],[-12.0826,23.5864],[-11.8095,23.5864],[-11.5363,23.5864],[-11.2863,23.5632],[-11.2863,23.2901],[-11.2863,23.0169],[-11.2863,22.7438],[-11.0595,22.6975],[-10.7863,22.6975],[-10.5132,22.6975],[-10.3975,22.5401],[-10.3975,22.2669],[-10.3975,21.9938],[-10.3095,21.8086],[-10.0363,21.8086],[-9.7632,21.8086],[-9.5086,21.7901],[-9.5086,21.5169],[-9.5086,21.2438],[-9.5086,20.9706],[-9.5086,20.6975],[-9.5086,20.4243],[-9.5086,20.1512],[-9.3558,20.0308],[-9.0826,20.0308],[-8.8095,20.0308],[-8.6197,19.9475],[-8.6197,19.6743],[-8.6197,19.4012],[-8.6058,19.1419],[-8.3326,19.1419],[-8.0595,19.1419],[-7.7863,19.1419],[-7.7308,18.9243],[-7.7308,18.6512],[-7.7308,18.378],[-7.5826,18.253],[-7.3095,18.253],[-7.0363,18.253],[-6.8419,18.1743],[-6.8419,17.9012],[-6.8419,17.628],[-6.8326,17.3642],[-6.5595,17.3642],[-6.2863,17.3642],[-6.0132,17.3642],[-5.74,17.3642],[-5.4669,17.3642],[-5.1937,17.3642],[-5.0641,17.5077],[-5.0641,17.7808],[-5.0641,18.054],[-5.0641,18.3271],[-5.0641,18.6003],[-5.0641,18.8734],[-5.0641,19.1466],[-5.0641,19.4197],[-5.0641,19.6929],[-5.0641,19.966],[-5.2725,20.0308],[-5.5456,20.0308],[-5.8187,20.0308],[-6.0919,20.0308],[-6.365,20.0308],[-6.6382,20.0308],[-6.8419,20.1003],[-6.8419,20.3734],[-6.8419,20.6466]],"land":[[0.9131,9.8805],[1.0716,10.1051],[1.2301,10.3297],[1.3887,10.5542],[1.5443,10.7808],[1.6998,11.0075],[1.8553,11.2342],[2.0048,11.4649],[2.1537,11.6959],[2.3027,11.9269],[2.4431,12.1632],[2.5823,12.4002],[2.7216,12.6372],[2.8532,12.8785],[2.9835,13.1206],[3.1138,13.3626],[3.2343,13.6096],[3.3526,13.8578],[3.4709,14.1059],[3.5763,14.3596],[3.6782,14.615],[3.7801,14.8703],[3.8653,15.1314],[3.9449,15.3945],[4.0245,15.6576],[4.0757,15.9271],[4.1154,16.1991],[4.1551,16.4711],[4.1293,16.741],[4.0726,17.01],[4.016,17.279],[3.864,17.4966],[3.6703,17.6915],[3.4765,17.8865],[3.2577,18.0506],[3.0269,18.2],[2.7962,18.3494],[2.5546,18.4796],[2.3071,18.5992],[2.0596,18.7188],[1.8072,18.8271],[1.5516,18.9282],[1.2959,19.0293],[1.0373,19.1222],[0.7765,19.2089],[0.5156,19.2956],[0.2528,19.376],[-0.0117,19.451],[-0.2761,19.5259],[-0.5422,19.5947],[-0.8099,19.6573],[-1.0775,19.7199],[-1.3426,19.7918],[-1.6047,19.8747],[-1.8668,19.9576],[-2.1266,20.0471],[-2.3833,20.1453],[-2.64,20.2436],[-2.8968,20.3418],[-3.1535,20.4401],[-3.4102,20.5383],[-3.667,20.6366],[-3.9237,20.7349],[-4.1804,20.8331],[-4.4371,20.9314],[-4.6939,21.0296],[-4.9506,21.1279],[-5.119,21.2743],[-5.0627,21.5434],[-5.003,21.8111],[-4.858,22.0446],[-4.713,22.2781],[-4.5681,22.5117],[-4.423,22.7452],[-4.278,22.9787],[-4.133,23.2123],[-3.988,23.4458],[-3.8431,23.6794],[-3.6981,23.9129],[-3.5531,24.1465],[-3.4081,24.38],[-3.2631,24.6135],[-3.1181,24.8471],[-2.9731,25.0806],[-2.8282,25.3142],[-2.6832,25.5477],[-2.5382,25.7812],[-2.3932,26.0148],[-2.2482,26.2483],[-2.1032,26.4819],[-1.9582,26.7154],[-1.8132,26.9489],[-1.6682,27.1825],[-1.5232,27.416],[-1.3782,27.6496],[-1.2333,27.8831],[-1.0883,28.1167],[-0.9433,28.3502],[-0.7983,28.5837],[-0.6533,28.8173],[-0.5083,29.0508],[-0.3633,29.2843],[-0.2183,29.5179],[0.0065,29.6313],[0.278,29.6744],[0.5494,29.7174],[0.8222,29.6861],[1.0949,29.652],[1.3677,29.6179],[1.6404,29.5838],[1.9132,29.5497],[2.186,29.5157],[2.4587,29.4816],[2.7315,29.4475],[3.0043,29.4133],[3.277,29.3793],[3.5498,29.3452],[3.8226,29.3111],[4.0953,29.277],[4.3681,29.2429],[4.6409,29.2088],[4.9136,29.1747],[5.1864,29.1406],[5.4592,29.1065],[5.7319,29.0724],[6.0047,29.0383],[6.2774,29.0042],[6.417,28.8098],[6.5006,28.5479],[6.5352,28.2815],[6.5011,28.0087],[6.467,27.7359],[6.4329,27.4632],[6.3988,27.1904],[6.3647,26.9176],[6.3306,26.6449],[6.2965,26.3721],[6.2624,26.0994],[6.2283,25.8266],[6.1942,25.5538],[6.1602,25.2811],[6.1261,25.0083],[6.092,24.7355],[6.0578,24.4628],[6.0237,24.19],[5.9897,23.9172],[5.9556,23.6445],[5.9215,23.3717],[5.8874,23.0989],[5.8533,22.8262],[5.8192,22.5534],[5.7851,22.2807],[5.751,22.0079],[5.7169,21.7351],[5.6828,21.4624],[5.6487,21.1896],[5.6146,20.9168],[5.5805,20.6441],[5.5464,20.3713],[5.5124,20.0985],[5.4783,19.8258],[5.4441,19.553],[5.4082,19.2818],[5.1433,19.2083],[4.8785,19.1348],[4.6082,19.1351],[4.3354,19.1691],[4.0626,19.2032],[3.7899,19.2373],[3.5171,19.2714],[3.2443,19.3056],[2.9716,19.3396],[2.6988,19.3737],[2.426,19.4078],[2.1533,19.4419],[1.8805,19.476],[1.6078,19.5101],[1.335,19.5442],[1.0622,19.5783],[0.7895,19.6124],[0.5167,19.6465],[0.2439,19.6806],[-0.0288,19.7147],[-0.3016,19.7488],[-0.5744,19.7829],[-0.8471,19.8169],[-1.0295,19.9507],[-1.0901,20.2188],[-1.1051,20.4855],[-1.027,20.749],[-0.9489,21.0126],[-0.8708,21.2761],[-0.7928,21.5397],[-0.7147,21.8033],[-0.6366,22.0669],[-0.5586,22.3304],[-0.4805,22.594],[-0.4024,22.8576],[-0.3243,23.1211],[-0.2463,23.3847],[-0.1682,23.6483],[-0.0901,23.9118],[-0.0121,24.1754],[0.066,24.439],[0.1441,24.7025],[0.2222,24.9661],[0.3003,25.2296],[0.3784,25.4932],[0.4564,25.7568],[0.5345,26.0203],[0.6126,26.2839],[0.6906,26.5475],[0.7687,26.8111],[0.8468,27.0746],[0.9248,27.3382],[1.0029,27.6018],[1.081,27.8653],[1.1591,28.1289],[1.2372,28.3924],[1.1493,28.6505],[1.0541,28.9084],[0.9332,29.1514],[0.7568,29.3622],[0.5804,29.5731],[0.7822,29.5516],[1.05,29.4895],[1.3178,29.4274],[1.5851,29.3636],[1.8524,29.2993],[2.1197,29.235],[2.3847,29.1623],[2.6492,29.0872],[2.9136,29.0122],[3.1771,28.9338],[3.4402,28.8543],[3.7033,28.7747],[3.9641,28.688],[4.224,28.5983],[4.4838,28.5086],[4.7417,28.4135],[4.9986,28.3157],[5.2555,28.2178],[5.5103,28.1148],[5.7639,28.0088],[6.0175,27.9027],[6.2675,27.7887],[6.5152,27.6694],[6.7628,27.55],[7.009,27.4279],[7.2542,27.3036],[7.4994,27.1793],[7.7388,27.0447],[7.9729,26.9006],[8.207,26.7566],[8.4393,26.6096],[8.6695,26.4594],[8.8997,26.3092],[9.125,26.152],[9.3443,25.9862],[9.5636,25.8204],[9.7787,25.6495],[9.9879,25.4712],[10.1972,25.2929],[10.403,25.1108],[10.6034,24.9227],[10.8038,24.7345],[10.9976,24.54],[11.179,24.3334],[11.3604,24.1269],[11.5398,23.9187],[11.7148,23.7067],[11.8898,23.4947],[12.0576,23.2774],[12.2063,23.0463],[12.3551,22.8151],[12.5016,22.5825],[12.6408,22.3455],[12.78,22.1085],[12.9145,21.869],[13.0312,21.6201],[13.1479,21.3712],[13.2615,21.121],[13.36,20.8644],[13.4585,20.6077],[13.5548,20.3503],[13.6369,20.088],[13.7191,19.8257],[13.7985,19.5626],[13.8539,19.2934],[13.9093,19.0242],[13.9641,18.7548],[14.011,18.4839],[14.0578,18.2131],[14.1035,17.9421],[14.1165,17.6675],[14.1295,17.3929],[14.1424,17.1183],[14.1472,16.8435],[14.1518,16.5686],[14.1565,16.2938],[14.139,16.0195],[14.1205,15.7452],[14.1021,15.471],[14.0696,15.198],[14.036,14.9252],[14.0024,14.6524],[13.9574,14.3812],[13.9109,14.1103],[13.8644,13.8394],[13.8007,13.5721],[13.7341,13.3054],[13.6675,13.0387],[13.5957,12.7733],[13.5228,12.5083],[13.4498,12.2433],[13.362,11.9829],[13.27,11.7239],[13.1781,11.4648],[13.0814,11.2075],[12.9831,10.9508],[12.8849,10.6941],[12.7784,10.4407],[12.6685,10.1887],[12.5587,9.9367],[12.443,9.6874],[12.3244,9.4394],[12.2059,9.1914],[12.0832,8.9454],[11.9582,8.7006],[11.8332,8.4558],[11.7024,8.2141],[11.5677,7.9744],[11.4331,7.7348],[11.2966,7.4962],[11.1587,7.2584],[11.0207,7.0206],[10.8778,6.7859],[10.7305,6.5538],[10.5831,6.3218],[10.435,6.0902],[10.2861,5.8592],[10.1371,5.6281],[9.9844,5.3996],[9.8271,5.1742],[9.6698,4.9488],[9.5121,4.7236],[9.3539,4.4988],[9.1957,4.274],[9.0109,4.1927],[8.7827,4.3459],[8.5545,4.4992],[8.3278,4.6545],[8.1031,4.8129],[7.8784,4.9713],[7.6537,5.1297],[7.4291,5.288],[7.2044,5.4464],[6.9797,5.6048],[6.755,5.7631],[6.5303,5.9215],[6.3056,6.0798],[6.0809,6.2382],[5.8562,6.3966],[5.6316,6.5549],[5.4069,6.7133],[5.1822,6.8716],[4.9575,7.03],[4.7328,7.1883],[4.5081,7.3467],[4.2834,7.5051],[4.0587,7.6634],[3.834,7.8218],[3.6093,7.9801],[3.3846,8.1385],[3.16,8.2969],[2.9353,8.4552],[2.7106,8.6136],[2.4859,8.772],[2.2612,8.9303],[2.0365,9.0887],[1.8118,9.247],[1.5871,9.4054],[1.3625,9.5638],[1.1378,9.7221]]},"frontNear":{"up":[[-1.3064,15.55],[-1.7832,15.55],[-2.2601,15.55],[-2.7369,15.55],[-3.2138,15.55],[-3.6906,15.55],[-3.973,15.7444],[-3.973,16.2213],[-4.2323,16.4389],[-4.7091,16.4389],[-4.8619,16.763],[-4.8619,17.2398],[-4.8619,17.7167],[-4.8619,18.1935],[-4.4082,18.2167],[-3.973,18.2583],[-3.973,18.7352],[-3.8665,19.1055],[-3.3897,19.1055],[-2.9128,19.1055],[-2.436,19.1055],[-1.9591,19.1055],[-1.4823,19.1055],[-1.0054,19.1055],[-0.5286,19.1055],[-0.0517,19.1055],[0.4251,19.1055],[0.902,19.1055],[1.3788,19.1055],[1.8557,19.1055],[2.3325,19.1055],[2.8094,19.1055],[3.2862,19.1055],[3.7631,19.1055],[4.2399,19.1055],[4.7168,19.1055],[5.1936,19.1055],[5.6705,19.1055],[6.1474,19.1055],[6.6242,19.1055],[7.1011,19.1055],[7.5779,19.1055],[8.0548,19.1055],[8.5316,19.1055],[9.0085,19.1055],[9.4853,19.1055],[9.9622,19.1055],[10.439,19.1055],[10.9159,19.1055],[11.3927,19.1055],[11.8696,19.1055],[12.3464,19.1055],[12.8233,19.1055],[13.3001,19.1055],[13.777,19.1055],[14.2538,19.1055],[14.7307,19.1055],[15.2075,19.1055],[15.6844,19.1055],[16.1612,19.1055],[16.6381,19.1055],[17.1149,19.1055],[17.5918,19.1055],[18.0686,19.1055],[18.5455,19.1055],[19.0224,19.1055],[19.4992,19.1055],[19.9761,19.1055],[20.4529,19.1055],[20.9298,19.1055],[21.4066,19.1055],[21.8835,19.1055],[22.3603,19.1055],[22.8372,19.1055],[23.314,19.1055],[23.7909,19.1055],[24.2677,19.1055],[24.7446,19.1055],[25.2214,19.1055],[25.6983,19.1055],[26.1751,19.1055],[26.652,19.1055],[27.1288,19.1055],[27.6057,19.1055],[28.0825,19.1055],[28.5594,19.1055],[29.0362,19.1055],[29.5131,19.1055],[29.9899,19.1055],[30.4668,19.1055],[30.9436,19.1055],[31.4205,19.1055],[31.8974,19.1055],[32.3742,19.1055],[32.8511,19.1055],[33.3279,19.1055],[33.8048,19.1055],[34.2816,19.1055],[34.7585,19.1055],[35.2353,19.1055],[35.7122,19.1055],[36.189,19.1055],[36.6659,19.1055],[37.1427,19.1055],[37.6196,19.1055],[38.0964,19.1055],[38.5733,19.1055],[39.0501,19.1055],[39.527,19.1055],[40.0038,19.1055],[40.4714,19.1148],[40.4714,19.5917],[40.5455,19.9944],[41.0224,19.9944],[41.4992,19.9944],[41.9761,19.9944],[42.4529,19.9944],[42.9298,19.9944],[43.4066,19.9944],[43.8835,19.9944],[44.3603,19.9944],[44.8372,19.9944],[45.314,19.9944],[45.7909,19.9944],[46.2677,19.9944],[46.7446,19.9944],[47.2214,19.9944],[47.6983,19.9944],[48.1751,19.9944],[48.652,19.9944],[49.1288,19.9944],[49.6057,19.9944],[50.0825,19.9944],[50.5594,19.9944],[51.0362,19.9944],[51.5131,19.9944],[51.9899,19.9944],[52.4668,19.9944],[52.9436,19.9944],[53.4205,19.9944],[53.8048,19.9018],[53.8048,19.425],[53.9622,19.1055],[54.439,19.1055],[54.9159,19.1055],[55.3927,19.1055],[55.5825,18.8185],[55.5825,18.3417],[55.9344,18.2167],[56.4112,18.2167],[56.4714,17.8],[56.4714,17.3231],[56.4714,16.8463],[56.5409,16.4389],[57.0177,16.4389],[57.3603,16.3046],[57.3603,15.8278],[57.3603,15.3509],[57.3603,14.8741],[57.6242,14.6611],[58.1011,14.6611],[58.2492,14.3324],[58.2492,13.8555],[58.2492,13.3787],[58.2492,12.9018],[58.7075,12.8833],[59.1381,12.837],[59.1381,12.3602],[59.027,11.9944],[58.5501,11.9944],[58.2492,11.8185],[58.2492,11.3417],[58.0085,11.1055],[57.5316,11.1055],[57.3603,10.8],[57.3603,10.3231],[57.3603,9.8463],[57.3603,9.3694],[57.3603,8.8926],[57.3603,8.4157],[57.3603,7.9389],[57.3603,7.462],[57.3603,6.9852],[57.2075,6.6611],[56.7307,6.6611],[56.2538,6.6611],[55.777,6.6611],[55.3001,6.6611],[54.8233,6.6611],[54.3464,6.6611],[53.8696,6.6611],[53.3927,6.6611],[52.9159,6.6611],[52.439,6.6611],[51.9622,6.6611],[51.4853,6.6611],[51.0085,6.6611],[50.5316,6.6611],[50.0548,6.6611],[49.5779,6.6611],[49.1011,6.6611],[48.6242,6.6611],[48.1474,6.6611],[47.6705,6.6611],[47.1936,6.6611],[46.7168,6.6611],[46.2399,6.6611],[45.8048,6.6194],[45.8048,6.1426],[45.6983,5.7722],[45.2214,5.7722],[44.7446,5.7722],[44.2677,5.7722],[43.7909,5.7722],[43.314,5.7722],[42.8372,5.7722],[42.3603,5.7722],[41.8835,5.7722],[41.4066,5.7722],[40.9298,5.7722],[40.4529,5.7722],[39.9761,5.7722],[39.4992,5.7722],[39.0224,5.7722],[38.5455,5.7722],[38.0686,5.7722],[37.5918,5.7722],[37.1149,5.7722],[36.6381,5.7722],[36.1612,5.7722],[35.6844,5.7722],[35.2075,5.7722],[34.7307,5.7722],[34.2538,5.7722],[33.777,5.7722],[33.3001,5.7722],[32.8233,5.7722],[32.3464,5.7722],[31.8696,5.7722],[31.3927,5.7722],[30.9159,5.7722],[30.439,5.7722],[29.9622,5.7722],[29.8048,5.4528],[29.8048,4.9759],[29.4205,4.8833],[28.9436,4.8833],[28.4668,4.8833],[28.027,4.8463],[28.027,4.3694],[27.9251,3.9944],[27.4483,3.9944],[26.9714,3.9944],[26.4946,3.9944],[26.0177,3.9944],[25.5409,3.9944],[25.064,3.9944],[24.5872,3.9944],[24.1103,3.9944],[23.6335,3.9944],[23.5825,3.5685],[23.5686,3.1055],[23.0918,3.1055],[22.6149,3.1055],[22.1381,3.1055],[21.8048,2.962],[21.8048,2.4852],[21.5964,2.2167],[21.1196,2.2167],[20.6427,2.2167],[20.1659,2.2167],[20.027,1.8787],[20.027,1.4018],[19.6242,1.3278],[19.1474,1.3278],[18.6705,1.3278],[18.2492,1.2722],[18.2492,0.7954],[18.1288,0.4389],[17.652,0.4389],[17.1751,0.4389],[16.6983,0.4389],[16.4714,0.1889],[16.4714,-0.288],[16.1566,-0.45],[15.6798,-0.45],[15.5825,-0.8296],[15.5825,-1.3065],[15.1381,-1.3389],[14.6612,-1.3389],[14.1844,-1.3389],[13.7075,-1.3389],[13.2307,-1.3389],[12.9159,-1.5009],[12.9159,-1.9778],[12.689,-2.2278],[12.2122,-2.2278],[11.7353,-2.2278],[11.2585,-2.2278],[11.1381,-2.5843],[11.1381,-3.0611],[10.7168,-3.1167],[10.2492,-3.1259],[10.2492,-3.6028],[10.2492,-4.0796],[10.2492,-4.5565],[10.1103,-4.8945],[9.6335,-4.8945],[9.3603,-5.0982],[9.3603,-5.575],[9.0918,-5.7833],[8.6149,-5.7833],[8.1381,-5.7833],[7.6612,-5.7833],[7.5825,-5.3852],[7.5825,-4.9083],[7.1196,-4.8945],[6.6936,-4.8435],[6.6936,-4.3667],[6.6936,-3.8898],[6.6936,-3.413],[6.8742,-3.1167],[7.3511,-3.1167],[7.5825,-2.8713],[7.5825,-2.3945],[7.8927,-2.2278],[8.3696,-2.2278],[8.4714,-1.8528],[8.4714,-1.3759],[8.0316,-1.3389],[7.5825,-1.3111],[7.5825,-0.8343],[7.5825,-0.3574],[7.5825,0.1194],[7.4251,0.4389],[6.9483,0.4389],[6.6936,0.6611],[6.6936,1.138],[6.6936,1.6148],[6.6936,2.0917],[6.3418,2.2167],[5.8649,2.2167],[5.8048,2.6333],[5.8001,3.1055],[5.3233,3.1055],[4.9159,3.175],[4.9159,3.6518],[4.9159,4.1287],[4.9159,4.6055],[4.7168,4.8833],[4.2399,4.8833],[4.027,5.1472],[4.027,5.6241],[4.027,6.1009],[4.027,6.5778],[3.6335,6.6611],[3.1566,6.6611],[3.1381,7.1194],[3.1381,7.5963],[3.1381,8.0731],[3.027,8.4389],[2.5501,8.4389],[2.2492,8.6148],[2.2492,9.0917],[2.2492,9.5685],[2.2492,10.0454],[1.9436,10.2167],[1.4668,10.2167],[1.3603,10.587],[1.3603,11.0639],[0.9251,11.1055],[0.4714,11.1287],[0.4714,11.6055],[0.4714,12.0824],[0.4714,12.5593],[0.3186,12.8833],[-0.1582,12.8833],[-0.4175,13.1009],[-0.4175,13.5778],[-0.4175,14.0546],[-0.4175,14.5315],[-0.7647,14.6611],[-1.2415,14.6611],[-1.3064,15.0731]],"down":[[-11.4207,14.1192],[-11.4207,14.5822],[-11.3836,15.0081],[-10.9207,15.0081],[-10.4577,15.0081],[-9.9948,15.0081],[-9.6429,15.1192],[-9.6429,15.5822],[-9.4948,15.897],[-9.0318,15.897],[-8.5688,15.897],[-8.1059,15.897],[-7.6429,15.897],[-7.1799,15.897],[-6.9762,16.1562],[-6.9762,16.6192],[-6.6799,16.7859],[-6.217,16.7859],[-5.754,16.7859],[-5.2911,16.7859],[-5.1985,17.1562],[-5.1985,17.6192],[-4.7911,17.6748],[-4.3281,17.6748],[-3.8651,17.6748],[-3.4207,17.6933],[-3.4207,18.1562],[-3.3651,18.5636],[-2.9022,18.5636],[-2.5318,18.6562],[-2.5318,19.1192],[-2.4022,19.4525],[-1.9392,19.4525],[-1.6429,19.6192],[-1.6429,20.0822],[-1.4392,20.3414],[-0.9762,20.3414],[-0.754,20.5822],[-0.754,21.0451],[-0.4762,21.2303],[-0.0133,21.2303],[0.1349,21.5451],[0.1349,22.0081],[0.4867,22.1192],[0.9497,22.1192],[1.0238,22.5081],[1.0238,22.9711],[1.4497,23.0081],[1.9126,23.0081],[2.3756,23.0081],[2.8015,23.0451],[2.8015,23.5081],[2.8756,23.897],[3.3386,23.897],[3.8015,23.897],[4.2645,23.897],[4.5793,24.0451],[4.5793,24.5081],[4.7645,24.7859],[5.2275,24.7859],[5.6904,24.7859],[6.1534,24.7859],[6.3571,25.0451],[6.3571,25.5081],[6.6534,25.6748],[7.1164,25.6748],[7.5793,25.6748],[8.0423,25.6748],[8.1349,26.0451],[8.1349,26.5081],[8.5423,26.5636],[9.0052,26.5636],[9.4682,26.5636],[9.9126,26.5822],[9.9126,27.0451],[9.9682,27.4525],[10.4312,27.4525],[10.8941,27.4525],[11.3571,27.4525],[11.6904,27.5822],[11.6904,28.0451],[11.8571,28.3414],[12.3201,28.3414],[12.5793,28.5451],[12.5793,29.0081],[12.8201,29.2303],[13.283,29.2303],[13.746,29.2303],[14.2089,29.2303],[14.3571,29.5451],[14.3571,30.0081],[14.7089,30.1192],[15.1719,30.1192],[15.246,30.5081],[15.246,30.9711],[15.6719,31.0081],[16.1349,31.0081],[16.5978,31.0081],[17.0238,31.0451],[17.0238,31.5081],[17.0978,31.897],[17.5608,31.897],[18.0238,31.897],[18.4867,31.897],[18.8015,32.0451],[18.8015,32.5081],[18.9867,32.7859],[19.4497,32.7859],[19.6904,33.0081],[19.6904,33.4711],[19.9497,33.6748],[20.4126,33.6748],[20.5793,33.9711],[20.5793,34.434],[20.9126,34.5636],[21.3756,34.5636],[21.8386,34.5636],[22.3015,34.5636],[22.3571,34.9711],[22.3571,35.434],[22.8015,35.4525],[23.2645,35.4525],[23.7275,35.4525],[24.1349,35.5081],[24.1349,35.9711],[24.2275,36.3414],[24.6904,36.3414],[25.1534,36.3414],[25.6164,36.3414],[25.9126,36.5081],[25.9126,36.9711],[26.1164,37.2303],[26.5793,37.2303],[27.0423,37.2303],[27.5052,37.2303],[27.6904,37.5081],[27.6904,37.9711],[28.0052,38.1192],[28.4682,38.1192],[28.9312,38.1192],[29.3941,38.1192],[29.4682,38.5081],[29.4682,38.9711],[29.8941,39.0081],[30.3571,39.0081],[30.8201,39.0081],[31.283,39.0081],[31.746,39.0081],[32.1349,39.0822],[32.1349,39.5451],[32.246,39.897],[32.7089,39.897],[33.1719,39.897],[33.6349,39.897],[34.0978,39.897],[34.5608,39.897],[35.0238,39.897],[35.4867,39.897],[35.9497,39.897],[36.4126,39.897],[36.8756,39.897],[37.3386,39.897],[37.4682,39.5636],[37.4682,39.1007],[37.8386,39.0081],[38.3015,39.0081],[38.7645,39.0081],[39.2275,39.0081],[39.6904,39.0081],[40.1534,39.0081],[40.6164,39.0081],[41.0238,38.9525],[41.0238,38.4896],[41.1164,38.1192],[41.5793,38.1192],[42.0423,38.1192],[42.5052,38.1192],[42.9682,38.1192],[43.4312,38.1192],[43.8941,38.1192],[44.3571,38.1192],[44.5793,37.8785],[44.5793,37.4155],[44.8571,37.2303],[45.3201,37.2303],[45.4682,36.9155],[45.4682,36.4525],[45.8201,36.3414],[46.283,36.3414],[46.3571,35.9525],[46.3571,35.4896],[46.3571,35.0266],[46.3571,34.5636],[46.3571,34.1007],[46.3201,33.6748],[45.8571,33.6748],[45.4682,33.6007],[45.4682,33.1377],[45.3571,32.7859],[44.8941,32.7859],[44.5793,32.6377],[44.5793,32.1748],[44.3941,31.897],[43.9312,31.897],[43.6904,31.6748],[43.6904,31.2118],[43.6904,30.7488],[43.6904,30.2859],[43.6904,29.8229],[43.6904,29.3599],[43.3571,29.2303],[42.8941,29.2303],[42.4312,29.2303],[41.9682,29.2303],[41.9126,28.8229],[41.9126,28.3599],[41.4682,28.3414],[41.0238,28.3229],[41.0238,27.8599],[40.9682,27.4525],[40.5052,27.4525],[40.0423,27.4525],[39.5793,27.4525],[39.246,27.3229],[39.246,26.8599],[39.0793,26.5636],[38.6164,26.5636],[38.3571,26.3599],[38.3571,25.897],[38.1164,25.6748],[37.6534,25.6748],[37.4682,25.397],[37.4682,24.934],[37.1534,24.7859],[36.6904,24.7859],[36.2275,24.7859],[35.7645,24.7859],[35.6904,24.397],[35.6904,23.934],[35.2645,23.897],[34.8015,23.897],[34.3386,23.897],[33.9126,23.8599],[33.9126,23.397],[33.8386,23.0081],[33.3756,23.0081],[32.9126,23.0081],[32.4497,23.0081],[32.1349,22.8599],[32.1349,22.397],[31.9497,22.1192],[31.4867,22.1192],[31.0238,22.1192],[30.5608,22.1192],[30.3571,21.8599],[30.3571,21.397],[30.0608,21.2303],[29.5978,21.2303],[29.1349,21.2303],[28.6719,21.2303],[28.2089,21.2303],[27.746,21.2303],[27.6904,20.8229],[27.6904,20.3599],[27.246,20.3414],[26.783,20.3414],[26.3201,20.3414],[25.9126,20.2859],[25.9126,19.8229],[25.8201,19.4525],[25.3571,19.4525],[24.8941,19.4525],[24.4312,19.4525],[24.1349,19.2859],[24.1349,18.8229],[23.9312,18.5636],[23.4682,18.5636],[23.0052,18.5636],[22.5423,18.5636],[22.0793,18.5636],[21.6164,18.5636],[21.4682,18.2488],[21.4682,17.7859],[21.1164,17.6748],[20.6534,17.6748],[20.1904,17.6748],[19.7275,17.6748],[19.6904,17.2488],[19.6904,16.7859],[19.2275,16.7859],[18.7645,16.7859],[18.3015,16.7859],[17.8386,16.7859],[17.3756,16.7859],[16.9126,16.7859],[16.4497,16.7859],[15.9867,16.7859],[15.5238,16.7859],[15.0608,16.7859],[14.5978,16.7859],[14.3571,16.5636],[14.3571,16.1007],[14.3571,15.6377],[14.3571,15.1748],[14.0608,15.0081],[13.5978,15.0081],[13.4682,15.3414],[13.4682,15.8044],[13.0978,15.897],[12.6349,15.897],[12.5793,16.3044],[12.5793,16.7674],[12.1349,16.7859],[11.6719,16.7859],[11.2089,16.7859],[10.746,16.7859],[10.283,16.7859],[9.8201,16.7859],[9.3571,16.7859],[9.0238,16.6562],[9.0238,16.1933],[8.8571,15.897],[8.3941,15.897],[7.9312,15.897],[7.4682,15.897],[7.0052,15.897],[6.5423,15.897],[6.0793,15.897],[5.6164,15.897],[5.1534,15.897],[4.6904,15.897],[4.2275,15.897],[3.7645,15.897],[3.3015,15.897],[2.8386,15.897],[2.8015,15.4711],[2.8015,15.0081],[2.3386,15.0081],[1.8756,15.0081],[1.4126,15.0081],[0.9497,15.0081],[0.4867,15.0081],[0.0238,15.0081],[-0.4392,15.0081],[-0.9022,15.0081],[-1.3651,15.0081],[-1.8281,15.0081],[-2.2911,15.0081],[-2.5318,14.7859],[-2.5318,14.3229],[-2.7911,14.1192],[-3.254,14.1192],[-3.4207,13.8229],[-3.4207,13.3599],[-3.754,13.2303],[-4.217,13.2303],[-4.6799,13.2303],[-5.1429,13.2303],[-5.6059,13.2303],[-6.0688,13.2303],[-6.0874,12.7859],[-6.1059,12.3414],[-6.5688,12.3414],[-7.0318,12.3414],[-7.4948,12.3414],[-7.9577,12.3414],[-8.4207,12.3414],[-8.754,12.2118],[-8.754,11.7488],[-8.9207,11.4525],[-9.3836,11.4525],[-9.8466,11.4525],[-10.3096,11.4525],[-10.7725,11.4525],[-11.2355,11.4525],[-11.4207,11.7303],[-11.4207,12.1933],[-11.7355,12.3414],[-12.1985,12.3414],[-12.3096,12.6933],[-12.3096,13.1562],[-12.3096,13.6192],[-12.3096,14.0822],[-11.8836,14.1192]],"land":[[-6.1077,10.6407],[-5.9747,10.8978],[-5.8418,11.1548],[-5.7088,11.4119],[-5.5758,11.6689],[-5.4428,11.926],[-5.3098,12.183],[-5.1725,12.4378],[-5.0352,12.6926],[-4.8979,12.9474],[-4.7577,13.2006],[-4.6175,13.4538],[-4.4773,13.7069],[-4.3357,13.9594],[-4.1941,14.2118],[-4.0524,14.4641],[-3.9048,14.7131],[-3.7568,14.9618],[-3.6088,15.2105],[-3.4608,15.4592],[-3.3128,15.7079],[-3.1648,15.9566],[-3.0104,16.2014],[-2.8555,16.4459],[-2.7006,16.6904],[-2.5445,16.9341],[-2.3882,17.1777],[-2.232,17.4213],[-2.0713,17.662],[-1.9103,17.9025],[-1.7492,18.143],[-1.5846,18.381],[-1.4196,18.6188],[-1.2546,18.8566],[-1.0869,19.0925],[-0.9189,19.3281],[-0.7508,19.5637],[-0.5774,19.7954],[-0.4032,20.0265],[-0.229,20.2577],[-0.0534,20.4877],[0.1225,20.7176],[0.2983,20.9474],[0.481,21.1718],[0.6649,21.3953],[0.8488,21.6188],[1.0332,21.8419],[1.2177,22.0649],[1.4021,22.288],[1.5945,22.5041],[1.7885,22.7189],[1.9826,22.9336],[2.1766,23.1484],[2.3706,23.3632],[2.5646,23.5779],[2.767,23.7846],[2.9714,23.9895],[3.1758,24.1944],[3.3803,24.3993],[3.5848,24.6041],[3.7893,24.8089],[4.0021,25.005],[4.217,25.1988],[4.4319,25.3927],[4.647,25.5863],[4.8623,25.7797],[5.0775,25.9732],[5.301,26.157],[5.5269,26.3379],[5.7528,26.5189],[5.979,26.6994],[6.2054,26.8797],[6.4317,27.0601],[6.666,27.2298],[6.903,27.396],[7.1399,27.5622],[7.3776,27.7274],[7.6154,27.8922],[7.8533,28.0571],[8.0982,28.2111],[8.3457,28.3612],[8.5931,28.5113],[8.8418,28.6593],[9.0911,28.8064],[9.3403,28.9535],[9.5954,29.0901],[9.8528,29.2224],[10.1102,29.3547],[10.3694,29.4834],[10.6294,29.6106],[10.8894,29.7377],[11.1538,29.855],[11.4203,29.9679],[11.6868,30.0809],[11.9554,30.1885],[12.2251,30.2937],[12.4947,30.3989],[12.7675,30.4952],[13.0419,30.5874],[13.3162,30.6795],[13.5928,30.7646],[13.8705,30.846],[14.1483,30.9275],[14.428,31.0015],[14.7088,31.0717],[14.9896,31.1418],[15.2723,31.2031],[15.5562,31.2595],[15.8401,31.3159],[16.125,31.3666],[16.4105,31.4141],[16.696,31.4615],[16.9829,31.4984],[17.2707,31.5291],[17.5585,31.5597],[17.8467,31.5864],[18.1351,31.6108],[18.4235,31.6351],[18.7125,31.6475],[19.0018,31.6523],[19.2912,31.6572],[19.5806,31.6599],[19.87,31.6612],[20.1594,31.6625],[20.4484,31.651],[20.7371,31.6306],[21.0258,31.6102],[21.3144,31.5884],[21.6029,31.5656],[21.8915,31.5428],[22.1787,31.5085],[22.4649,31.4656],[22.7511,31.4227],[23.037,31.3777],[23.3227,31.3312],[23.6083,31.2847],[23.8922,31.2289],[24.1746,31.1655],[24.457,31.1022],[24.7374,31.0308],[25.016,30.9526],[25.2947,30.8744],[25.5778,30.8185],[25.8649,30.7817],[26.152,30.7449],[26.4404,30.7343],[26.7298,30.7409],[27.0191,30.7474],[27.3085,30.75],[27.5979,30.75],[27.8873,30.75],[28.1768,30.75],[28.4662,30.75],[28.7556,30.75],[29.045,30.75],[29.3344,30.75],[29.6238,30.75],[29.9133,30.75],[30.2027,30.75],[30.4921,30.75],[30.7815,30.75],[31.0709,30.75],[31.3604,30.75],[31.6498,30.75],[31.9392,30.75],[32.2286,30.75],[32.518,30.75],[32.8074,30.75],[33.0969,30.75],[33.3863,30.75],[33.6757,30.75],[33.9651,30.75],[34.2545,30.75],[34.544,30.75],[34.8334,30.75],[34.9813,30.6047],[34.989,30.3153],[34.9967,30.026],[35.0,29.7367],[35.0,29.4472],[35.0,29.1578],[35.0,28.8684],[35.0,28.579],[35.0,28.2896],[35.0,28.0002],[35.0,27.7107],[35.0,27.4213],[35.0,27.1319],[35.0,26.8425],[35.0,26.5531],[35.0,26.2636],[35.0,25.9742],[35.0,25.6848],[35.0,25.3954],[35.0,25.106],[35.0,24.8166],[35.0,24.5271],[35.0,24.2377],[35.0,23.9483],[35.0,23.6589],[35.0,23.3695],[35.0,23.08],[35.0,22.7906],[35.0,22.5012],[35.0,22.2118],[35.0,21.9224],[35.0,21.633],[35.0,21.3435],[35.0,21.0541],[35.0,20.7647],[35.0,20.4753],[35.0,20.1859],[35.0,19.8965],[35.0,19.607],[34.8766,19.4103],[34.5987,19.3295],[34.3206,19.25],[34.0312,19.25],[33.7417,19.25],[33.4523,19.25],[33.1629,19.25],[32.8735,19.25],[32.5841,19.25],[32.2947,19.25],[32.0052,19.25],[31.7158,19.25],[31.4264,19.25],[31.137,19.25],[30.8476,19.25],[30.5582,19.25],[30.2687,19.25],[29.9793,19.25],[29.6899,19.25],[29.4005,19.25],[29.1111,19.25],[28.8216,19.25],[28.5322,19.25],[28.2428,19.25],[27.9534,19.25],[27.664,19.25],[27.3746,19.25],[27.0851,19.2511],[26.7957,19.2522],[26.5063,19.2534],[26.2169,19.2586],[25.9276,19.2642],[25.6382,19.2697],[25.3488,19.2753],[25.0595,19.2808],[24.7701,19.2863],[24.4828,19.3202],[24.1958,19.3571],[23.9087,19.3941],[23.628,19.4635],[23.3478,19.536],[23.0676,19.6086],[22.7872,19.6801],[22.5067,19.7515],[22.2262,19.8229],[21.9435,19.8847],[21.6605,19.9452],[21.3775,20.0057],[21.091,20.0467],[20.8042,20.0849],[20.5173,20.1232],[20.2285,20.1399],[19.9394,20.1535],[19.6503,20.167],[19.3611,20.1578],[19.072,20.145],[18.7829,20.1322],[18.4959,20.0961],[18.2092,20.056],[17.9226,20.016],[17.6405,19.9524],[17.3591,19.8845],[17.0778,19.8166],[16.8034,19.7252],[16.5303,19.6293],[16.2572,19.5334],[15.9917,19.4187],[15.7277,19.3001],[15.4636,19.1816],[15.2077,19.0467],[14.9535,18.9083],[14.6994,18.7699],[14.4533,18.6177],[14.2092,18.4622],[13.9651,18.3068],[13.7287,18.1399],[13.4943,17.9701],[13.2599,17.8003],[13.0328,17.6211],[12.8075,17.4394],[12.5822,17.2577],[12.3648,17.0668],[12.1496,16.8732],[11.9344,16.6797],[11.7261,16.4789],[11.5197,16.276],[11.3134,16.073],[11.1123,15.8649],[10.9129,15.6551],[10.7135,15.4454],[10.5186,15.2314],[10.3252,15.0161],[10.1318,14.8008],[9.9455,14.5794],[9.7616,14.3559],[9.5778,14.1324],[9.3976,13.9059],[9.2189,13.6783],[9.0401,13.4507],[8.8647,13.2205],[8.6905,12.9893],[8.5164,12.7582],[8.3481,12.5227],[8.1823,12.2855],[8.0165,12.0483],[7.8524,11.8099],[7.689,11.571],[7.5257,11.3321],[7.3673,11.0899],[7.211,10.8463],[7.0548,10.6027],[6.9006,10.3578],[6.7473,10.1122],[6.5941,9.8667],[6.4444,9.6191],[6.2964,9.3703],[6.1484,9.1216],[6.0026,8.8716],[5.858,8.6209],[5.7134,8.3702],[5.5717,8.1179],[5.4315,7.8647],[5.2913,7.6115],[5.153,7.3573],[5.0158,7.1024],[4.8786,6.8476],[4.7442,6.5913],[4.6114,6.3341],[4.4785,6.077],[4.3097,5.8444],[4.1187,5.627],[3.9188,5.4569],[3.6617,5.5898],[3.4047,5.7228],[3.1476,5.8557],[2.8905,5.9886],[2.6334,6.1215],[2.3763,6.2544],[2.1192,6.3874],[1.8621,6.5203],[1.605,6.6532],[1.348,6.7861],[1.0909,6.919],[0.8338,7.0519],[0.5767,7.1848],[0.3196,7.3178],[0.0625,7.4507],[-0.1946,7.5836],[-0.4517,7.7165],[-0.7088,7.8495],[-0.9659,7.9824],[-1.223,8.1153],[-1.4801,8.2482],[-1.7372,8.3811],[-1.9943,8.514],[-2.2514,8.6469],[-2.5084,8.7798],[-2.7655,8.9128],[-3.0226,9.0457],[-3.2797,9.1786],[-3.5368,9.3115],[-3.7939,9.4444],[-4.051,9.5774],[-4.308,9.7103],[-4.5651,9.8433],[-4.8222,9.9762],[-5.0793,10.1091],[-5.3364,10.242],[-5.5935,10.3749],[-5.8506,10.5078]]},"frontFar":{"up":[[17.3603,-4.8945],[17.7955,-4.8945],[18.2307,-4.8945],[18.6659,-4.8945],[19.1011,-4.8945],[19.5362,-4.8945],[19.9714,-4.8945],[20.4066,-4.8945],[20.8418,-4.8945],[20.9159,-4.5333],[20.9159,-4.0982],[21.2585,-4.0056],[21.6936,-4.0056],[22.1288,-4.0056],[22.564,-4.0056],[22.9992,-4.0056],[23.4344,-4.0056],[23.8696,-4.0056],[24.3048,-4.0056],[24.4714,-3.737],[24.4714,-3.3019],[24.7214,-3.1167],[25.1566,-3.1167],[25.5918,-3.1167],[26.027,-3.1167],[26.4622,-3.1167],[26.8974,-3.1167],[27.3325,-3.1167],[27.7677,-3.1167],[28.2029,-3.1167],[28.6381,-3.1167],[28.9159,-2.9593],[28.9159,-2.5241],[29.0548,-2.2278],[29.4899,-2.2278],[29.9251,-2.2278],[30.3603,-2.2278],[30.7955,-2.2278],[31.2307,-2.2278],[31.6659,-2.2278],[32.1011,-2.2278],[32.5362,-2.2278],[32.9714,-2.2278],[33.4066,-2.2278],[33.8418,-2.2278],[34.277,-2.2278],[34.7122,-2.2278],[35.1474,-2.2278],[35.5825,-2.2278],[36.0177,-2.2278],[36.4529,-2.2278],[36.8881,-2.2278],[37.3233,-2.2278],[37.7585,-2.2278],[38.1936,-2.2278],[38.6288,-2.2278],[39.064,-2.2278],[39.4992,-2.2278],[39.5825,-1.8759],[39.5825,-1.4407],[39.9159,-1.3389],[40.3511,-1.3389],[40.7862,-1.3389],[41.2214,-1.3389],[41.6566,-1.3389],[42.0918,-1.3389],[42.527,-1.3389],[42.9622,-1.3389],[43.3974,-1.3389],[43.8325,-1.3389],[44.2677,-1.3389],[44.7029,-1.3389],[45.1381,-1.3389],[45.5733,-1.3389],[46.0085,-1.3389],[46.4436,-1.3389],[46.8788,-1.3389],[47.314,-1.3389],[47.7492,-1.3389],[48.1844,-1.3389],[48.6196,-1.3389],[49.0548,-1.3389],[49.4899,-1.3389],[49.9251,-1.3389],[50.3603,-1.3389],[50.7955,-1.3389],[51.2307,-1.3389],[51.6659,-1.3389],[52.1011,-1.3389],[52.5362,-1.3389],[52.9714,-1.3389],[53.4066,-1.3389],[53.8418,-1.3389],[54.277,-1.3389],[54.6936,-1.3574],[54.6936,-1.7926],[54.6936,-2.2278],[55.1288,-2.2278],[55.564,-2.2278],[55.9992,-2.2278],[56.4344,-2.2278],[56.8696,-2.2278],[57.3048,-2.2278],[57.3603,-2.6074],[57.3603,-3.0426],[57.7214,-3.1167],[58.1566,-3.1167],[58.5918,-3.1167],[59.027,-3.1167],[59.1381,-3.4407],[59.1381,-3.8759],[59.4436,-4.0056],[59.8788,-4.0056],[60.314,-4.0056],[60.7492,-4.0056],[61.1844,-4.0056],[61.6196,-4.0056],[62.0548,-4.0056],[62.4899,-4.0056],[62.9251,-4.0056],[63.3603,-4.0056],[63.7955,-4.0056],[64.2307,-4.0056],[64.4714,-3.8111],[64.4714,-3.3759],[64.6474,-3.1167],[65.0825,-3.1167],[65.5177,-3.1167],[65.9529,-3.1167],[66.2492,-2.9778],[66.2492,-2.5426],[66.3696,-2.2278],[66.8048,-2.2278],[67.1381,-2.1259],[67.1381,-1.6907],[67.1381,-1.2556],[67.1381,-0.8204],[67.2029,-0.45],[67.6381,-0.45],[68.027,-0.4037],[68.027,0.0315],[68.027,0.4667],[68.027,0.9018],[68.0362,1.3278],[68.4714,1.3278],[68.9066,1.3278],[68.9159,1.7537],[68.9159,2.1889],[68.9159,2.6241],[68.9159,3.0593],[68.9159,3.4944],[68.9159,3.9296],[68.9159,4.3648],[68.9159,4.8],[68.9159,5.2352],[68.9159,5.6704],[68.9159,6.1055],[68.9159,6.5407],[68.6011,6.6611],[68.1659,6.6611],[68.027,6.9574],[68.027,7.3926],[67.7492,7.55],[67.314,7.55],[67.1381,7.8093],[67.1381,8.2444],[66.8974,8.4389],[66.4622,8.4389],[66.2492,8.6611],[66.2492,9.0963],[66.0455,9.3278],[65.6103,9.3278],[65.3603,9.513],[65.3603,9.9481],[65.1936,10.2167],[64.7585,10.2167],[64.4714,10.3648],[64.4714,10.8],[64.3418,11.1055],[63.9066,11.1055],[63.5825,11.2167],[63.5825,11.6518],[63.4899,11.9944],[63.0548,11.9944],[62.6196,11.9944],[62.1844,11.9944],[61.8048,12.05],[61.8048,12.4852],[61.7677,12.8833],[61.3325,12.8833],[60.9159,12.8648],[60.9159,12.4296],[60.9159,11.9944],[60.4807,11.9944],[60.0455,11.9944],[60.027,11.5778],[60.027,11.1426],[60.027,10.7074],[60.027,10.2722],[59.6474,10.2167],[59.2122,10.2167],[59.1381,10.5778],[59.1381,11.013],[59.1381,11.4481],[59.1381,11.8833],[58.814,11.9944],[58.3788,11.9944],[58.2492,11.6889],[58.2492,11.2537],[57.9622,11.1055],[57.527,11.1055],[57.3603,10.837],[57.3603,10.4018],[57.1103,10.2167],[56.6751,10.2167],[56.4714,9.9852],[56.4714,9.55],[56.2585,9.3278],[55.8233,9.3278],[55.5825,9.1333],[55.5825,8.6981],[55.4066,8.4389],[54.9714,8.4389],[54.5362,8.4389],[54.1011,8.4389],[53.8048,8.3],[53.8048,7.8648],[53.6844,7.55],[53.2492,7.55],[52.814,7.55],[52.3788,7.55],[51.9436,7.55],[51.5085,7.55],[51.0733,7.55],[50.6381,7.55],[50.2029,7.55],[49.7677,7.55],[49.3325,7.55],[48.8974,7.55],[48.4622,7.55],[48.027,7.55],[47.5918,7.55],[47.1566,7.55],[46.7214,7.55],[46.2862,7.55],[45.8511,7.55],[45.4159,7.55],[44.9807,7.55],[44.5455,7.55],[44.1103,7.55],[43.6751,7.55],[43.2399,7.55],[42.8048,7.55],[42.3696,7.55],[41.9344,7.55],[41.4992,7.55],[41.064,7.55],[40.6288,7.55],[40.1936,7.55],[39.7585,7.55],[39.3233,7.55],[38.8881,7.55],[38.4529,7.55],[38.0177,7.55],[37.5825,7.55],[37.1474,7.55],[36.7122,7.55],[36.277,7.55],[35.8418,7.55],[35.4066,7.55],[34.9714,7.55],[34.5362,7.55],[34.1011,7.55],[33.6659,7.55],[33.2307,7.55],[32.7955,7.55],[32.3603,7.55],[31.9251,7.55],[31.4899,7.55],[31.0548,7.55],[30.6196,7.55],[30.1844,7.55],[29.7492,7.55],[29.314,7.55],[28.8788,7.55],[28.4436,7.55],[28.027,7.5315],[28.027,7.0963],[28.027,6.6611],[27.5918,6.6611],[27.1566,6.6611],[26.7214,6.6611],[26.2862,6.6611],[25.8511,6.6611],[25.4159,6.6611],[25.3603,6.2815],[25.3603,5.8463],[24.9992,5.7722],[24.564,5.7722],[24.1288,5.7722],[23.6936,5.7722],[23.5825,5.4481],[23.5825,5.013],[23.277,4.8833],[22.8418,4.8833],[22.4066,4.8833],[21.9714,4.8833],[21.5362,4.8833],[21.1011,4.8833],[20.9159,4.6333],[20.9159,4.1981],[20.6844,3.9944],[20.2492,3.9944],[19.814,3.9944],[19.3788,3.9944],[19.1381,3.8],[19.1381,3.3648],[18.9622,3.1055],[18.527,3.1055],[18.0918,3.1055],[17.6566,3.1055],[17.2214,3.1055],[16.7862,3.1055],[16.4714,2.9852],[16.4714,2.55],[16.3696,2.2167],[15.9344,2.2167],[15.5825,2.1333],[15.5825,1.6981],[15.5177,1.3278],[15.0825,1.3278],[14.6474,1.3278],[14.2122,1.3278],[13.8048,1.3],[13.8048,0.8648],[13.7955,0.4389],[13.3603,0.4389],[12.9251,0.4389],[12.9159,0.013],[12.9159,-0.4222],[12.5085,-0.45],[12.0733,-0.45],[11.6381,-0.45],[11.2029,-0.45],[11.1381,-0.8204],[11.1381,-1.2556],[10.7862,-1.3389],[10.3511,-1.3389],[10.2492,-1.6722],[10.2492,-2.1074],[10.2492,-2.5426],[10.2492,-2.9778],[9.9529,-3.1167],[9.5177,-3.1167],[9.3603,-3.3945],[9.3603,-3.8296],[9.6196,-4.0056],[10.0548,-4.0056],[10.2492,-4.2463],[10.2492,-4.6815],[10.4714,-4.8945],[10.9066,-4.8945],[11.1381,-4.6907],[11.1381,-4.2556],[11.3233,-4.0056],[11.7585,-4.0056],[12.027,-3.8389],[12.027,-3.4037],[12.1751,-3.1167],[12.6103,-3.1167],[13.0455,-3.1167],[13.4807,-3.1167],[13.9159,-3.1167],[14.3511,-3.1167],[14.6936,-3.2093],[14.6936,-3.6445],[14.7677,-4.0056],[15.2029,-4.0056],[15.5825,-4.0611],[15.5825,-4.4963],[15.6196,-4.8945],[16.0548,-4.8945],[16.4899,-4.8945],[16.9251,-4.8945]],"down":[[28.5793,12.3414],[28.9497,12.3414],[29.3201,12.3414],[29.4682,12.5636],[29.4682,12.934],[29.5423,13.2303],[29.9126,13.2303],[30.283,13.2303],[30.6534,13.2303],[31.0238,13.2303],[31.246,13.3785],[31.246,13.7488],[31.246,14.1192],[31.6164,14.1192],[31.9867,14.1192],[32.1349,14.3414],[32.1349,14.7118],[32.2089,15.0081],[32.5793,15.0081],[32.9497,15.0081],[33.0238,15.3044],[33.0238,15.6748],[33.1719,15.897],[33.5423,15.897],[33.9126,15.897],[34.283,15.897],[34.6534,15.897],[34.8015,16.1192],[34.8015,16.4896],[34.8756,16.7859],[35.246,16.7859],[35.6164,16.7859],[35.9867,16.7859],[36.3571,16.7859],[36.5793,16.934],[36.5793,17.3044],[36.5793,17.6748],[36.9497,17.6748],[37.3201,17.6748],[37.6904,17.6748],[38.0608,17.6748],[38.4312,17.6748],[38.8015,17.6748],[39.1719,17.6748],[39.246,17.9711],[39.246,18.3414],[39.3941,18.5636],[39.7645,18.5636],[40.1349,18.5636],[40.5052,18.5636],[40.8756,18.5636],[41.246,18.5636],[41.6164,18.5636],[41.9867,18.5636],[42.3571,18.5636],[42.7275,18.5636],[42.8015,18.8599],[42.8015,19.2303],[42.9497,19.4525],[43.3201,19.4525],[43.6904,19.4525],[44.0608,19.4525],[44.4312,19.4525],[44.8015,19.4525],[45.1719,19.4525],[45.4682,19.5266],[45.4682,19.897],[45.4682,20.2674],[45.7645,20.3414],[46.1349,20.3414],[46.5052,20.3414],[46.8756,20.3414],[47.246,20.3414],[47.6164,20.3414],[47.9867,20.3414],[48.1349,20.5636],[48.1349,20.934],[48.2089,21.2303],[48.5793,21.2303],[48.9497,21.2303],[49.3201,21.2303],[49.6904,21.2303],[50.0608,21.2303],[50.4312,21.2303],[50.8015,21.2303],[50.8015,21.6007],[50.8015,21.9711],[51.0238,22.1192],[51.3941,22.1192],[51.7645,22.1192],[52.1349,22.1192],[52.5052,22.1192],[52.8756,22.1192],[53.246,22.1192],[53.4682,22.2674],[53.4682,22.6377],[53.4682,23.0081],[53.8386,23.0081],[54.2089,23.0081],[54.5793,23.0081],[54.9497,23.0081],[55.3201,23.0081],[55.6904,23.0081],[56.0608,23.0081],[56.1349,23.3044],[56.1349,23.6748],[56.283,23.897],[56.6534,23.897],[57.0238,23.897],[57.3941,23.897],[57.7645,23.897],[57.9126,24.1192],[57.9126,24.4896],[57.9867,24.7859],[58.3571,24.7859],[58.7275,24.7859],[59.0978,24.7859],[59.4682,24.7859],[59.6904,24.934],[59.6904,25.3044],[59.6904,25.6748],[60.0608,25.6748],[60.4312,25.6748],[60.5793,25.897],[60.5793,26.2674],[60.6534,26.5636],[61.0238,26.5636],[61.3941,26.5636],[61.4682,26.8599],[61.4682,27.2303],[61.6164,27.4525],[61.9867,27.4525],[62.3571,27.4525],[62.3571,27.8229],[62.3571,28.1933],[62.3571,28.5636],[62.3571,28.934],[62.3571,29.3044],[62.3571,29.6748],[62.3571,30.0451],[62.3571,30.4155],[62.3571,30.7859],[62.2089,31.0081],[61.8386,31.0081],[61.4682,31.0081],[61.4682,31.3785],[61.4682,31.7488],[61.246,31.897],[60.8756,31.897],[60.5793,31.9711],[60.5793,32.3414],[60.5793,32.7118],[60.283,32.7859],[59.9126,32.7859],[59.5423,32.7859],[59.1719,32.7859],[58.8015,32.7859],[58.8015,33.1562],[58.8015,33.5266],[58.5793,33.6748],[58.2089,33.6748],[57.8386,33.6748],[57.4682,33.6748],[57.0978,33.6748],[56.7275,33.6748],[56.3571,33.6748],[55.9867,33.6748],[55.6164,33.6748],[55.246,33.6748],[54.8756,33.6748],[54.5052,33.6748],[54.1349,33.6748],[53.7645,33.6748],[53.3941,33.6748],[53.0238,33.6748],[52.6534,33.6748],[52.283,33.6748],[51.9126,33.6748],[51.5423,33.6748],[51.1719,33.6748],[50.8015,33.6748],[50.4312,33.6748],[50.0608,33.6748],[49.6904,33.6748],[49.3201,33.6748],[48.9497,33.6748],[48.5793,33.6748],[48.2089,33.6748],[47.8386,33.6748],[47.4682,33.6748],[47.0978,33.6748],[46.7275,33.6748],[46.3571,33.6748],[45.9867,33.6748],[45.6164,33.6748],[45.4682,33.4525],[45.4682,33.0822],[45.3941,32.7859],[45.0238,32.7859],[44.6534,32.7859],[44.283,32.7859],[43.9126,32.7859],[43.6904,32.6377],[43.6904,32.2674],[43.6904,31.897],[43.3201,31.897],[42.9497,31.897],[42.8015,31.6748],[42.8015,31.3044],[42.7275,31.0081],[42.3571,31.0081],[41.9867,31.0081],[41.6164,31.0081],[41.246,31.0081],[41.0238,30.8599],[41.0238,30.4896],[41.0238,30.1192],[40.6534,30.1192],[40.283,30.1192],[40.1349,29.897],[40.1349,29.5266],[40.0608,29.2303],[39.6904,29.2303],[39.3201,29.2303],[38.9497,29.2303],[38.5793,29.2303],[38.3571,29.0822],[38.3571,28.7118],[38.3571,28.3414],[37.9867,28.3414],[37.6164,28.3414],[37.4682,28.1192],[37.4682,27.7488],[37.3941,27.4525],[37.0238,27.4525],[36.6534,27.4525],[36.283,27.4525],[35.9126,27.4525],[35.6904,27.3044],[35.6904,26.934],[35.6904,26.5636],[35.3201,26.5636],[34.9497,26.5636],[34.8015,26.3414],[34.8015,25.9711],[34.7275,25.6748],[34.3571,25.6748],[33.9867,25.6748],[33.6164,25.6748],[33.246,25.6748],[33.0238,25.5266],[33.0238,25.1562],[33.0238,24.7859],[32.6534,24.7859],[32.283,24.7859],[31.9126,24.7859],[31.5423,24.7859],[31.246,24.7118],[31.246,24.3414],[31.246,23.9711],[30.9497,23.897],[30.5793,23.897],[30.2089,23.897],[29.8386,23.897],[29.4682,23.897],[29.4682,23.5266],[29.4682,23.1562],[29.246,23.0081],[28.8756,23.0081],[28.5052,23.0081],[28.1349,23.0081],[27.7645,23.0081],[27.6904,22.7118],[27.6904,22.3414],[27.5423,22.1192],[27.1719,22.1192],[26.8015,22.1192],[26.4312,22.1192],[26.0608,22.1192],[25.9126,21.897],[25.9126,21.5266],[25.8386,21.2303],[25.4682,21.2303],[25.0978,21.2303],[24.7275,21.2303],[24.3571,21.2303],[24.1349,21.0822],[24.1349,20.7118],[24.1349,20.3414],[23.7645,20.3414],[23.3941,20.3414],[23.0238,20.3414],[22.6534,20.3414],[22.283,20.3414],[21.9126,20.3414],[21.5423,20.3414],[21.4682,20.0451],[21.4682,19.6748],[21.3201,19.4525],[20.9497,19.4525],[20.5793,19.4525],[20.2089,19.4525],[19.8386,19.4525],[19.6904,19.2303],[19.6904,18.8599],[19.6164,18.5636],[19.246,18.5636],[18.8756,18.5636],[18.5052,18.5636],[18.1349,18.5636],[17.9126,18.4155],[17.9126,18.0451],[17.9126,17.6748],[17.5423,17.6748],[17.1719,17.6748],[16.8015,17.6748],[16.4312,17.6748],[16.0608,17.6748],[15.6904,17.6748],[15.3201,17.6748],[14.9497,17.6748],[14.5793,17.6748],[14.3571,17.5266],[14.3571,17.1562],[14.3571,16.7859],[14.3571,16.4155],[14.3571,16.0451],[14.3571,15.6748],[14.3571,15.3044],[14.4312,15.0081],[14.8015,15.0081],[15.1719,15.0081],[15.5423,15.0081],[15.9126,15.0081],[16.1349,15.1562],[16.1349,15.5266],[16.1349,15.897],[16.5052,15.897],[16.8756,15.897],[17.246,15.897],[17.6164,15.897],[17.9867,15.897],[18.3571,15.897],[18.7275,15.897],[19.0978,15.897],[19.4682,15.897],[19.8386,15.897],[20.2089,15.897],[20.5793,15.897],[20.9497,15.897],[21.3201,15.897],[21.4682,15.6748],[21.4682,15.3044],[21.5423,15.0081],[21.9126,15.0081],[22.283,15.0081],[22.6534,15.0081],[23.0238,15.0081],[23.3941,15.0081],[23.7645,15.0081],[24.1349,15.0081],[24.1349,14.6377],[24.1349,14.2674],[24.3571,14.1192],[24.7275,14.1192],[25.0978,14.1192],[25.4682,14.1192],[25.8386,14.1192],[25.9126,13.8229],[25.9126,13.4525],[25.9126,13.0822],[25.9126,12.7118],[25.9126,12.3414],[26.283,12.3414],[26.6534,12.3414],[26.8015,12.1192],[26.8015,11.7488],[26.8756,11.4525],[27.246,11.4525],[27.6164,11.4525],[27.9867,11.4525],[28.3571,11.4525],[28.5793,11.6007],[28.5793,11.9711]],"land":[[0.2501,5.9157],[0.4411,6.1612],[0.6322,6.4067],[0.8232,6.6521],[1.0142,6.8976],[1.2052,7.1431],[1.3963,7.3886],[1.5933,7.6293],[1.7906,7.8698],[1.9879,8.1103],[2.1874,8.3489],[2.3871,8.5874],[2.5868,8.8259],[2.7899,9.0615],[2.9931,9.297],[3.1964,9.5324],[3.4046,9.7636],[3.6132,9.9943],[3.8218,10.225],[4.0314,10.4549],[4.2411,10.6846],[4.4508,10.9144],[4.6675,11.1374],[4.8852,11.3596],[5.1029,11.5819],[5.3205,11.8041],[5.5382,12.0262],[5.7559,12.2484],[5.9804,12.4637],[6.2061,12.6778],[6.4317,12.8919],[6.6584,13.1049],[6.8851,13.3178],[7.1119,13.5307],[7.3438,13.7381],[7.5767,13.9442],[7.8097,14.1504],[8.045,14.3538],[8.2809,14.5565],[8.5168,14.7593],[8.7563,14.9577],[8.9967,15.1551],[9.2372,15.3524],[9.4811,15.5454],[9.726,15.7371],[9.971,15.9289],[10.2183,16.1175],[10.4664,16.3051],[10.7146,16.4926],[10.9669,16.6746],[11.2206,16.8545],[11.4744,17.0344],[11.7296,17.2121],[11.9855,17.389],[12.2414,17.5659],[12.5017,17.736],[12.764,17.9032],[13.0263,18.0705],[13.2894,18.2363],[13.5529,18.4016],[13.8164,18.5669],[14.0846,18.7244],[14.355,18.8782],[14.6254,19.0319],[14.8962,19.185],[15.1672,19.3377],[15.4382,19.4904],[15.7137,19.6346],[15.9917,19.7741],[16.2697,19.9136],[16.5478,20.053],[16.8259,20.1923],[17.1041,20.3316],[17.3864,20.462],[17.6714,20.5865],[17.9564,20.7111],[18.2414,20.8357],[18.5265,20.9602],[18.8115,21.0848],[19.1,21.2008],[19.3911,21.3104],[19.6822,21.42],[19.9734,21.5293],[20.2647,21.6383],[20.5561,21.7474],[20.8501,21.8485],[21.1465,21.9428],[21.4429,22.0372],[21.7395,22.1309],[22.0364,22.2239],[22.3332,22.317],[22.6321,22.4027],[22.933,22.4814],[23.234,22.5601],[23.5352,22.6378],[23.8366,22.7145],[24.138,22.7913],[24.441,22.8614],[24.7456,22.9243],[25.0503,22.9872],[25.3552,23.0488],[25.6603,23.1091],[25.9655,23.1693],[26.2717,23.2237],[26.5792,23.2707],[26.8867,23.3176],[27.1944,23.3632],[27.5023,23.407],[27.8103,23.4507],[28.1189,23.4893],[28.4283,23.5207],[28.7378,23.552],[29.0474,23.5818],[29.3573,23.6091],[29.6672,23.6364],[29.9773,23.6595],[30.2879,23.6755],[30.5986,23.6915],[30.9093,23.7058],[31.2202,23.7169],[31.531,23.728],[31.842,23.7357],[32.153,23.737],[32.4641,23.7383],[32.7751,23.7377],[33.0861,23.733],[33.3971,23.7283],[33.7081,23.7211],[34.0189,23.7082],[34.3297,23.6953],[34.6404,23.6804],[34.9508,23.6603],[35.2612,23.6403],[35.5715,23.6186],[35.8814,23.5924],[36.1914,23.5662],[36.5011,23.5377],[36.8102,23.5029],[37.1193,23.468],[37.4283,23.4322],[37.7369,23.3934],[38.0455,23.3547],[38.3538,23.3135],[38.661,23.2646],[38.9682,23.2156],[39.2753,23.1663],[39.5822,23.1154],[39.889,23.0645],[40.1954,23.0108],[40.4994,22.9452],[40.8035,22.8797],[41.1086,22.8205],[41.4181,22.7901],[41.7277,22.7596],[42.0375,22.7359],[42.3486,22.7409],[42.6596,22.7459],[42.9706,22.75],[43.2817,22.75],[43.5927,22.75],[43.9038,22.75],[44.2148,22.75],[44.5259,22.75],[44.8369,22.75],[45.148,22.75],[45.459,22.75],[45.7701,22.75],[46.0812,22.75],[46.3922,22.75],[46.7033,22.75],[47.0143,22.75],[47.3254,22.75],[47.6364,22.75],[47.9475,22.75],[48.2586,22.75],[48.5623,22.7331],[48.7748,22.506],[48.9873,22.2788],[49.0,21.9728],[49.0,21.6617],[49.0,21.3507],[49.0,21.0396],[49.0,20.7285],[49.0,20.4175],[49.0,20.1064],[49.0,19.7954],[49.0,19.4843],[49.0,19.1733],[49.0,18.8622],[49.0,18.5511],[49.0,18.2401],[49.0,17.929],[49.0,17.618],[49.0,17.3069],[49.0,16.9959],[49.0,16.6848],[49.0,16.3737],[49.0,16.0627],[49.0,15.7516],[49.0,15.4406],[49.0,15.1295],[49.0,14.8185],[49.0,14.5074],[49.0,14.1964],[49.0,13.8853],[48.8666,13.6136],[48.6979,13.3523],[48.4425,13.25],[48.1314,13.25],[47.8204,13.25],[47.5093,13.25],[47.1983,13.25],[46.8872,13.25],[46.5761,13.25],[46.2651,13.25],[45.954,13.25],[45.643,13.25],[45.3319,13.25],[45.0209,13.25],[44.7098,13.25],[44.3988,13.25],[44.0877,13.25],[43.7766,13.25],[43.4656,13.25],[43.1545,13.25],[42.8435,13.2508],[42.5324,13.2524],[42.2214,13.2539],[41.9103,13.2574],[41.5993,13.2628],[41.2883,13.2682],[40.9776,13.2807],[40.6672,13.301],[40.3568,13.3214],[40.0489,13.3604],[39.7437,13.4207],[39.4385,13.4809],[39.1334,13.5411],[38.8282,13.6014],[38.523,13.6616],[38.217,13.717],[37.9099,13.7663],[37.6027,13.8156],[37.2954,13.8632],[36.9876,13.9085],[36.6799,13.9538],[36.3716,13.9948],[36.0625,14.0296],[35.7534,14.0644],[35.4439,14.0958],[35.134,14.1218],[34.824,14.1478],[34.5139,14.1716],[34.2035,14.1916],[33.8931,14.2117],[33.5824,14.2264],[33.2714,14.2315],[32.9604,14.2365],[32.6494,14.2394],[32.3383,14.2379],[32.0273,14.2363],[31.7163,14.2317],[31.4054,14.2206],[31.0946,14.2095],[30.7839,14.1943],[30.4739,14.1695],[30.1638,14.1448],[29.8539,14.1178],[29.5446,14.0854],[29.2352,14.0529],[28.9262,14.0174],[28.6183,13.9736],[28.3103,13.9299],[28.0029,13.8827],[27.6971,13.8256],[27.3914,13.7685],[27.086,13.7093],[26.7819,13.6438],[26.4778,13.5784],[26.1743,13.5103],[25.8729,13.4336],[25.5715,13.3568],[25.2708,13.2773],[24.9732,13.1869],[24.6755,13.0966],[24.3784,13.0047],[24.0833,12.9061],[23.7883,12.8075],[23.494,12.7071],[23.2026,12.598],[22.9113,12.489],[22.6209,12.3778],[22.3348,12.2556],[22.0488,12.1333],[21.7633,12.01],[21.4805,11.8803],[21.1978,11.7506],[20.9157,11.6197],[20.6376,11.4802],[20.3596,11.3407],[20.0823,11.1998],[19.8104,11.0487],[19.5385,10.8976],[19.267,10.7459],[18.9986,10.5886],[18.7303,10.4314],[18.4624,10.2733],[18.2001,10.1061],[17.9378,9.9388],[17.6759,9.771],[17.4193,9.5953],[17.1627,9.4195],[16.9062,9.2435],[16.6528,9.063],[16.3994,8.8826],[16.1463,8.7018],[15.9014,8.51],[15.6565,8.3183],[15.4117,8.1264],[15.17,7.9305],[14.9284,7.7346],[14.6868,7.5387],[14.4509,7.336],[14.215,7.1332],[13.9791,6.9304],[13.749,6.7211],[13.519,6.5117],[13.2891,6.3023],[13.0622,6.0895],[12.8354,5.8766],[12.6086,5.6637],[12.3895,5.443],[12.1707,5.2218],[11.952,5.0006],[11.7347,4.778],[11.5175,4.5553],[11.3004,4.3326],[11.0911,4.1026],[10.8825,3.8718],[10.6739,3.6411],[10.4666,3.4091],[10.2595,3.177],[10.0524,2.9449],[9.8519,2.7072],[9.6522,2.4687],[9.4525,2.2302],[9.2546,1.9903],[9.0568,1.7501],[8.8591,1.51],[8.6673,1.2651],[8.4764,1.0195],[8.2856,0.7739],[8.0675,0.5527],[7.8441,0.3363],[7.6169,0.1877],[7.3714,0.3786],[7.1258,0.5695],[6.8803,0.7605],[6.6347,0.9514],[6.3891,1.1423],[6.1436,1.3333],[5.898,1.5242],[5.6525,1.7152],[5.4069,1.9061],[5.1613,2.097],[4.9158,2.2879],[4.6702,2.4789],[4.4246,2.6698],[4.1791,2.8608],[3.9335,3.0517],[3.688,3.2426],[3.4424,3.4336],[3.1969,3.6245],[2.9513,3.8154],[2.7057,4.0063],[2.4601,4.1973],[2.2146,4.3882],[1.969,4.5791],[1.7235,4.7701],[1.4779,4.961],[1.2323,5.152],[0.9868,5.3429],[0.7412,5.5338],[0.4957,5.7248]]}};
  // All airborne legs use the same rounded contour as walking, sized to
  // the approved running paws. Only articulation changes across the arc.
  function flightLegPath(name,fall,landing,root){
    const fore=name.startsWith('front'),far=name.endsWith('Far'),offset=far?-8:4;
    const value=(up,down,land)=>mix(mix(up,down,fall),land,landing);
    const wrist=fore
      ? [value(169,162,147)+offset,value(173,197.5,197.5)]
      : [value(102,77,80)+offset,value(180,183,197.5)];
    const anchor=fore?[root[0]+offset,root[1]+5]:[root[0]+Math.max(0,offset),root[1]+10];
    const joint=fore
      ? [mix(anchor[0],wrist[0],.5)-5,mix(anchor[1],wrist[1],.5)]
      : [anchor[0]+17,mix(anchor[1],wrist[1],.55)];
    const hock=fore?null:[wrist[0]-5,wrist[1]-10];
    return walkingLimbContour(anchor,joint,hock,wrist);
  }
  const flightBody={fall:0,land:0,hip:{x:84,y:154},chest:{x:126,y:153}};
  function animateFlight(state,vy,jumpDrop,dt){
    if(state!=='jump'&&state!=='land')return;
    const fallTarget=state==='land'?1:smooth((vy+(jumpDrop?230:95))/(jumpDrop?480:520));
    flightBody.fall=mix(flightBody.fall,fallTarget,1-Math.exp(-20*dt));
    flightBody.land=mix(flightBody.land,state==='land'?1:0,1-Math.exp(-24*dt));
    const f=flightBody.fall,l=flightBody.land;
    const value=(up,down,land)=>mix(mix(up,down,f),land,l);
    const hx=value(84,82,83),hy=value(154,148,170);
    const cx=value(126,126,126),cy=value(153,158,174);
    const headX=value(153,161,155),headY=value(145,157,164);
    const backX=value(58,69,68),backY=value(191,151,205);
    const frontX=value(171,162,151),frontY=value(165,206,206);
    const headAngle=value(-7,8,-2);
    flightBody.hip={x:hx,y:hy};flightBody.chest={x:cx,y:cy};
    flightRigs.forEach(({rig,backFar,frontFar,torso,neck,backNear,frontNear,head})=>{
      // One reference-pixel guard covers raster/contour antialiasing at the outer edge.
      [backFar,backNear,frontFar,frontNear].forEach(leg=>leg.setAttribute('stroke-width',0));
      backFar.setAttribute('d',flightLegPath('backFar',f,l,[hx,hy]));
      backNear.setAttribute('d',flightLegPath('backNear',f,l,[hx,hy]));
      frontFar.setAttribute('d',flightLegPath('frontFar',f,l,[cx,cy]));
      frontNear.setAttribute('d',flightLegPath('frontNear',f,l,[cx,cy]));
      torso.setAttribute('d',`M${hx-17} ${hy+1} C${hx-10} ${hy-20} ${hx+13} ${hy-19} ${cx+9} ${cy-11} Q${cx+23} ${cy+3} ${cx+8} ${cy+20} C${cx-12} ${cy+22} ${hx-17} ${hy+27} ${hx-17} ${hy+1} Z`);
      neck.setAttribute('d',`M${cx-4} ${cy-13} Q${cx+13} ${cy-20} ${headX-15} ${headY-27} L${headX+5} ${headY-8} Q${cx+24} ${cy+16} ${cx-3} ${cy+12}Z`);
      head.setAttribute('transform',`translate(${headX} ${headY}) rotate(${headAngle}) scale(1.08)`);
      rig.dataset.fall=f.toFixed(3);
      rig.dataset.hip=`${hx.toFixed(3)},${hy.toFixed(3)}`;
      rig.dataset.frontPaw=`${frontX.toFixed(3)},${frontY.toFixed(3)}`;
      rig.dataset.backPaw=`${backX.toFixed(3)},${backY.toFixed(3)}`;
    });
  }

  // The upward pose and its forepaw come from the same supplied sprite sheet.
  const pawShape = '128,155 129,136 143,108 153,100 164,104 163,119 149,148 139,165';
  const pawMask = create('mask', { id: 'cat-reach-mask', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 260, height: 220 });
  pawMask.append(create('rect', { width: 260, height: 220, fill: 'white' }));
  const pawClip = create('clipPath', { id: 'cat-reach-paw' });
  pawClip.append(create('polygon', { points: pawShape }));
  defs.append(pawMask, pawClip);
  const reachBody = create('g', { mask: 'url(#cat-reach-mask)' });
  reachBody.append(groups.reach.firstChild);
  const reachPaw = create('g', { class: 'cat-reaching-paw' });
  reachPaw.style.display='none';
  const reachWindow = create('g', { 'clip-path': 'url(#cat-reach-paw)' });
  const pawInk=create('filter',{id:'cat-paw-solid-ink',filterUnits:'userSpaceOnUse',x:0,y:0,width:260,height:220,'color-interpolation-filters':'sRGB'});
  pawInk.append(create('feFlood',{'flood-color':'#08090a',result:'ink'}),create('feComposite',{in:'ink',in2:'SourceAlpha',operator:'in'}));defs.append(pawInk);
  reachWindow.setAttribute('filter','url(#cat-paw-solid-ink)');
  reachWindow.append(image(-1041, -461));
  reachPaw.append(reachWindow);
  const stretch = create('g', { class: 'cat-reach-art' });
  stretch.append(reachBody, reachPaw);
  const reachNormalized=create('g',{'data-head-scale':1.10,transform:'translate(130 206) scale(1.10) translate(-130 -206)'});
  reachNormalized.append(stretch);
  groups.reach.append(reachNormalized);

  // One intact belly-up drawing from the supplied sheet: head, neck, torso
  // and all four paws remain in one image at a single uniform scale.
  groups.belly=create('g',{class:'cat-frame','data-pose':'belly'});
  const bellyRig=create('g',{class:'cat-belly-rig'});
  const bellyWindow=create('svg',{x:7,y:73,width:245,height:145,viewBox:'1195 690 245 145',overflow:'hidden'});
  const bellyMask=create('mask',{id:'cat-belly-tail-mask',maskUnits:'userSpaceOnUse',x:1195,y:690,width:245,height:145});
  bellyMask.append(create('rect',{x:1195,y:690,width:245,height:145,fill:'white'}),create('path',{d:'M1195 795H1226Q1236 808 1243 823L1243 835H1195Z',fill:'black'}));
  defs.append(bellyMask);
  const bellyFilter=artworkEdgeFilter('cat-edge-belly',1195,690,245,145,[1336,769]);
  const bellyImage=create('g',{mask:'url(#cat-belly-tail-mask)'});const bellyArt=image();bellyArt.setAttribute('filter',bellyFilter);bellyImage.append(bellyArt);
  bellyWindow.append(bellyImage);
  // Only the raised limbs articulate. The original connected head/torso stays intact.
  const bellyPaws=[
    {points:'1230,798 1231,781 1235,773 1243,773 1253,783 1258,807 1247,815',x:1253,y:812,phase:0},
    {points:'1257,813 1259,798 1273,783 1283,783 1290,790 1288,800 1278,813 1270,819',x:1261,y:817,phase:2.1},
    {points:'1293,771 1293,742 1299,736 1306,737 1311,749 1313,766 1304,778',x:1305,y:777,phase:1.2},
    {points:'1304,780 1304,762 1308,756 1317,756 1324,763 1328,780 1330,796 1325,805 1319,798 1315,784',x:1325,y:801,phase:3.3}
  ].map((paw,index)=>{
    const clip=create('clipPath',{id:`cat-belly-paw-${index}`,clipPathUnits:'userSpaceOnUse'});
    clip.append(create('polygon',{points:paw.points}));defs.append(clip);
    const joint=create('g',{'data-belly-paw':index});
    joint.style.display='none';
    const patch=create('g',{'clip-path':`url(#cat-belly-paw-${index})`});const pawArt=image();pawArt.setAttribute('filter',bellyFilter);patch.append(pawArt);
    joint.append(patch);bellyWindow.append(joint);
    return {...paw,joint};
  });
  bellyWindow.append(create('ellipse',{cx:1332,cy:752,rx:12.5,ry:12.5,fill:'#08090a'}),create('ellipse',{cx:1352,cy:776,rx:14,ry:15,fill:'#08090a'}));
  // Centerlines traced directly from the user's red strokes and registered
  // against the supplied character, rather than substituted circular arcs.
  function tracedClosedEye(parent,d){
    parent.append(create('path',{d,fill:'none',stroke:'#318de0','stroke-width':2.6,'stroke-linecap':'round','stroke-linejoin':'round'}));
  }
  tracedClosedEye(bellyWindow,"M1320.176 749.729C1321.584 755.337 1324.934 759.331 1330.697 760.406");
  tracedClosedEye(bellyWindow,"M1331.179 764.368C1333.131 775.433 1343.270 779.357 1352.978 782.285");
  // Cover the old painted eyelids and use the same closed-eye drawing.
  sleepingHead.append(create('ellipse',{cx:887,cy:787,rx:29,ry:29,fill:'#08090a'}),create('ellipse',{cx:944,cy:791,rx:28,ry:29,fill:'#08090a'}));
  const sleepClosedEyes=create('g',{'data-sleep-eyes':'closed'});
  sleepingHead.append(sleepClosedEyes);
  tracedClosedEye(sleepClosedEyes,"M878.591 786.178C887.011 790.300 896.010 791.972 905.591 791.178");
  tracedClosedEye(sleepClosedEyes,"M918.591 792.178C926.910 793.956 936.693 796.293 944.591 791.178");
  function animateSleep(time,state,still,wakeProgress){
    const curled=state==='sleep'||state==='wake';
    if(!curled)return;
    const phase=still?0:time*Math.PI*2/4.6;
    const breath=(1-Math.cos(phase))*.5;
    const prepare=state==='wake'?smooth(clamp(wakeProgress,0,1)):0;
    // Anchor the belly at the resting surface so breathing cannot lift the cat.
    sleepingBody.setAttribute('transform',`translate(850 819) scale(${.5*(1+breath*.04)} ${.5*(1+breath*.24+prepare*.06)}) translate(-850 -813)`);
    const tilt=-3+Math.sin(phase)*1.25+prepare*2;
    // These two points support the original jaw throughout the small rotation.
    // Match its lowest point to the belly's resting baseline instead of lifting it.
    const radians=tilt*Math.PI/180;
    const jawBottom=Math.max(...[[883,816],[898,817]].map(([x,y])=>815+(x-900)*Math.sin(radians)+(y-815)*Math.cos(radians)));
    sleepingHead.setAttribute('transform',`translate(-28 ${819-jawBottom-prepare*2}) rotate(${tilt} 900 815)`);
    // Keep the user's white Z silhouettes; gently drift and pulse the group.
    const drift=still?0:(1-Math.cos(time*Math.PI*2/3.6))*.5;
    sleepZ.setAttribute('transform',`translate(${drift*3} ${-drift*8}) translate(133 107) scale(1.3) translate(-133 -107)`);
    sleepZ.setAttribute('opacity',(still?1:.85+drift*.15)*(1-prepare));
  }
  bellyRig.append(bellyWindow);
  groups.belly.append(bellyRig);art.append(groups.belly);
  tails.belly=[72,190,-1];
  let bellyRoot={x:72,y:190},bellyExit=0;
  function animateBelly(elapsed,still,remaining,dt){
    const e=still?2:elapsed;
    const exitTarget=still?0:smooth(1-remaining/.4);
    bellyExit=still?0:bellyExit+(exitTarget-bellyExit)*(1-Math.exp(-20*Math.min(dt,.025)));
    const enter=smooth(e/.35),exit=bellyExit;
    const comfort=enter*(1-exit),roll=-32*(1-enter)+exit*24+Math.sin(e*3.2)*2.5*comfort;
    bellyRig.setAttribute('transform',`translate(78 206) rotate(${roll}) scale(1.08) translate(-78 -206)`);
    const r=roll*Math.PI/180,dx=(72-78)*1.08,dy=(190-206)*1.08;
    bellyRoot={x:78+dx*Math.cos(r)-dy*Math.sin(r),y:206+dx*Math.sin(r)+dy*Math.cos(r)};
    bellyPaws.forEach(paw=>{
      const flutter=still?0:Math.sin(e*11+paw.phase)*3.2*comfort;
      paw.joint.setAttribute('transform',`rotate(${flutter} ${paw.x} ${paw.y})`);
    });
  }

  // One tail lives outside all sprite/pose groups. Its root, length, joint
  // angles and velocities survive every pose change, including mirroring.
  const sharedTail=create('path',{id:'cat-shared-tail',class:'cat-tail',fill:'none',stroke:'#08090a','stroke-width':13,'stroke-linecap':'round','stroke-linejoin':'round'});
  const tailAttachment=create('path',{fill:'none',stroke:'#08090a','stroke-width':13,'stroke-linecap':'round'});
  art.prepend(tailAttachment,sharedTail);
  const tailState={phase:0,activity:0,previousVx:0,x:null,y:null,rootVx:0,rootVy:0,length:190,flightBlend:0,flightHeight:0,clock:0,history:[],joints:[]};
  // Sample the parent's actual motion, not seven separately prescribed poses.
  // Every child follows its parent; only the root receives the body's drive.
  function delayedTailAngle(index,delay,fallback,field='angles'){
    const history=tailState.history,when=tailState.clock-delay;
    if(!history.length)return fallback;
    let before=history[0],after=before;
    for(const sample of history){
      if(sample.time>when){after=sample;break;}
      before=after=sample;
    }
    const t=after.time===before.time?0:clamp((when-before.time)/(after.time-before.time),0,1);
    const a=before[field]?.[index]??fallback,b=after[field]?.[index]??a;
    return a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
  }
  function animateGitFlightTail(time,state,name,vx,vy,jumpHeight,jumpLift,dt,turning){
    const running=state==='run',airborne=state==='jump',sleeping=state==='sleep';
    let [rootX,rootY,side]=tails[name];
    if(name==='groom') [rootX,rootY,side]=tails.front;
    if(state==='groom'){
      const angle=groomingAngle*Math.PI/180,dx=rootX-130,dy=rootY-206;
      rootX=130+dx*Math.cos(angle)-dy*Math.sin(angle);
      rootY=206+dx*Math.sin(angle)+dy*Math.cos(angle);
    }
    if(name==='reach'){
      rootX=130+(rootX-130)*1.10;rootY=206+(rootY-206)*1.10;
      if(reachDirection<0){rootX=260-rootX;side=-side;}
    }
    if(name==='land'&&direction<0)rootX=260-rootX;
    if(running){
      rootX=turning?130:82.7;
      rootY=turning?185:160;
      if(!turning&&direction<0)rootX=260-rootX;
    }
    if(airborne||state==='land'){
      rootX=flightBody.hip.x-5;rootY=flightBody.hip.y+5;
      if(direction<0)rootX=260-rootX;
    }
    if(state==='stretch'){rootX=stretchHip.x;rootY=stretchHip.y;side=-1;}
    if(state==='belly'){rootX=bellyRoot.x;rootY=bellyRoot.y;side=-1;}
    // The pelvis owns the root position. Inertia belongs to downstream joints,
    // never to a detached root or a second connector stroke.
    tailState.x=rootX;tailState.y=rootY;tailState.rootVx=tailState.rootVy=0;
    // Keep the compact run length through the entire jump and landing; the
    // previous air pose immediately grew the tail back into a long straight rod.
    if(airborne||state==='land')tailState.flightBlend=1;
    else tailState.flightBlend*=Math.exp(-5*dt);
    const lengthTarget=mix(running?147:196,147,tailState.flightBlend);
    tailState.length=mix(tailState.length,lengthTarget,1-Math.exp(-10*dt));
    const heightTarget=airborne?clamp(Math.max(jumpHeight,jumpLift)/340,0,1):tailState.flightHeight;
    tailState.flightHeight=mix(tailState.flightHeight,heightTarget,1-Math.exp(-8*dt));
    const spine=Math.atan2(flightBody.chest.y-flightBody.hip.y,flightBody.chest.x-flightBody.hip.x);
    const strength=.7+.3*tailState.flightHeight;
    const drag=airborne?clamp(vy/800,-1,1)*.35*strength:.08;
    // A near-vertical ascent has almost no spine pitch to drive the chain.
    // Give its root the downward counterpart of the descending hip motion;
    // the existing parent-following joints carry it to the tip unchanged.
    const verticalRise=airborne&&vy<0?(1-smooth(Math.abs(vx)/220))*smooth(-vy/700):0;
    const balance=spine+drag-.85*strength*verticalRise;
    const rootAngle=direction>0?Math.PI+balance:-balance;
    tailState.clock+=dt;
    const activity=airborne?.18:state==='reach'?.45:state==='groom'?.22:Math.max(.1,Math.min(1,Math.abs(vx)/480));
    tailState.activity=mix(tailState.activity,activity,1-Math.exp(-8*dt));
    tailState.phase+=dt*(2.1+tailState.activity*2.6);
    const acceleration=clamp((vx-tailState.previousVx)/Math.max(.001,dt)/15000,-.25,.25);
    tailState.previousVx=vx;
    const base=sleeping?[0,-.94,-1.84,-2.74,-3.64,-4.54,-5.44]
      :state==='belly'?[0,-.15,-.45,-1.2,-2.3,-3,-3.2]
      :running?[.08,.12,-.12,-.3,-.15,.16,.38]
      :airborne||state==='land'?[.08,.22,.35,.32,.10,-.30,-.70]
      :['groom','land','stretch'].includes(state)?[-.1,-.4,-1,-1.9,-2.7,-3.4,-4.2]
      :[-.45,-.95,-1.35,-1.52,-1.62,-1.8,-1.95];
    const groundAngles=base.map((angle,i)=>{
      const amplitude=sleeping?.025:airborne||state==='land'?.012+(i/6)**1.2*.065:.025+(i/6)**1.2*(.08+tailState.activity*.25);
      const local=angle+Math.sin(tailState.phase-i*.95)*amplitude;
      return running?(direction>0?Math.PI-local:local)+acceleration*i/6:side<0?Math.PI-local:local;
    });
    let x=tailState.x,y=tailState.y;
    const points=[[x,y]];
    base.forEach((angle,i)=>{
      const parent=tailState.joints[i-1];
      let groundTarget=groundAngles[i];
      if(i>0&&parent){
        const a=delayedTailAngle(i-1,i*.035,groundAngles[i-1],'rest');
        const b=delayedTailAngle(i,i*.035,groundAngles[i],'rest');
        const relativeBend=Math.atan2(Math.sin(b-a),Math.cos(b-a));
        groundTarget=delayedTailAngle(i-1,.014+i*.003,parent.angle)+relativeBend;
      }
      const bend=[0,.10,.08,-.04,-.14,-.13,.06][i]*strength*direction;
      const flightTarget=i===0?rootAngle:delayedTailAngle(i-1,.014+i*.003,parent?.angle??rootAngle)+bend;
      const flightDelta=Math.atan2(Math.sin(flightTarget-groundTarget),Math.cos(flightTarget-groundTarget));
      const target=groundTarget+flightDelta*tailState.flightBlend;
      const joint=tailState.joints[i]||={angle:target,velocity:0};
      const motionWeight=sleeping?tailState.flightBlend:1;
      const frequency=mix(17-i*1.35,i===0?28:38-i,motionWeight);
      const damping=mix(1.7,1.4,motionWeight),limit=mix(3.5+i*.25,6+i*.3,motionWeight);
      // Small integration steps preserve the same flexible response at 40–120Hz.
      const steps=Math.ceil(dt*120),h=dt/steps;
      for(let n=0;n<steps;n++){
        const error=Math.atan2(Math.sin(target-joint.angle),Math.cos(target-joint.angle));
        joint.velocity+=(frequency*frequency*error-damping*frequency*joint.velocity)*h;
        joint.velocity=clamp(joint.velocity,-limit,limit);
        joint.angle+=joint.velocity*h;
      }
      x+=Math.cos(joint.angle)*tailState.length/7;
      y+=Math.sin(joint.angle)*tailState.length/7;
      points.push([x,y]);
    });
    const pair=p=>p.map(n=>n.toFixed(3)).join(',');
    let d=`M${pair(points[0])}`;
    for(let i=1;i<points.length-1;i++)d+=` Q${pair(points[i])} ${pair([(points[i][0]+points[i+1][0])/2,(points[i][1]+points[i+1][1])/2])}`;
    sharedTail.setAttribute('d',d+` T${pair(points.at(-1))}`);
    sharedTail.dataset.length=tailState.length.toFixed(3);
    sharedTail.dataset.root=`${tailState.x.toFixed(3)},${tailState.y.toFixed(3)}`;
    tailState.history.push({time:tailState.clock,angles:tailState.joints.map(j=>j.angle),rest:groundAngles});
    while(tailState.history.length>2&&tailState.history[1].time<tailState.clock-.6)tailState.history.shift();
  }


  function animateTail(time,state,name,vx,vy,jumpHeight,jumpLift,dt,turning,jumpDrop=false){
    if(state==='jump'||state==='land'){
      tailAttachment.setAttribute('d','');
      return animateGitFlightTail(time,state,name,vx,vy,jumpHeight,jumpLift,dt,turning);
    }
    const running=state==='run',airborne=state==='jump',sleeping=state==='sleep';
    sharedTail.style.visibility='visible';
    tailAttachment.style.visibility='visible';
    let [rootX,rootY,side]=tails[name];
    if(name==='groom') [rootX,rootY,side]=tails.front;
    if(name==='front'&&Math.abs(standingAngle)>.001){
      const angle=standingAngle*Math.PI/180,dx=rootX-130,dy=rootY-206;
      rootX=130+dx*Math.cos(angle)-dy*Math.sin(angle);
      rootY=206+dx*Math.sin(angle)+dy*Math.cos(angle);
    }
    if(state==='groom'){
      const angle=groomingAngle*Math.PI/180,dx=rootX-130,dy=rootY-206;
      rootX=130+dx*Math.cos(angle)-dy*Math.sin(angle);
      rootY=206+dx*Math.sin(angle)+dy*Math.cos(angle);
    }
    if(name==='reach'){
      rootX=130+(rootX-130)*1.10;rootY=206+(rootY-206)*1.10;
      if(reachDirection<0){rootX=260-rootX;side=-side;}
    }
    if(name==='land'&&direction<0)rootX=260-rootX;
    if(running){
      rootX=turning?130:82.7;
      rootY=turning?185:160;
      if(!turning&&direction<0)rootX=260-rootX;
    }
    if(name==='walk'){
      rootX=direction<0?260-walkHip.x:walkHip.x;rootY=walkHip.y;
    }
    if(name==='gallop'){
      rootX=direction<0?260-gallopHip.x:gallopHip.x;
      rootY=gallopHip.y;
    }
    if(airborne||state==='land'){
      rootX=flightBody.hip.x-5;rootY=flightBody.hip.y+5;
      if(direction<0)rootX=260-rootX;
    }
    if(state==='stretch'){rootX=stretchHip.x;rootY=stretchHip.y;side=-1;}
    if(state==='belly'){rootX=bellyRoot.x;rootY=bellyRoot.y;side=-1;}
    tailState.x=rootX;tailState.y=rootY;tailState.rootVx=tailState.rootVy=0;
    tailAttachment.setAttribute('d','');
    // Keep the compact run length through the entire jump and landing; the
    // previous air pose immediately grew the tail back into a long straight rod.
    if(airborne||state==='land')tailState.flightBlend=1;
    else tailState.flightBlend*=Math.exp(-5*dt);
    const lengthTarget=sleeping?190:mix(running?147:196,147,tailState.flightBlend);
    tailState.length=mix(tailState.length,lengthTarget,1-Math.exp(-10*dt));
    const heightTarget=airborne?clamp(Math.max(jumpHeight,jumpLift)/340,0,1):tailState.flightHeight;
    tailState.flightHeight=mix(tailState.flightHeight,heightTarget,1-Math.exp(-8*dt));
    const spine=Math.atan2(flightBody.chest.y-flightBody.hip.y,flightBody.chest.x-flightBody.hip.x);
    const strength=.7+.3*tailState.flightHeight;
    const drag=airborne?clamp(vy/800,-1,1)*.35*strength:.08;
    // The two body orientations drive the same delayed tail chain.
    const balance=spine+drag+(airborne?.5*flightBody.fall:0);
    const rootAngle=direction>0?Math.PI+balance:-balance;
    tailState.clock+=dt;
    const activity=airborne?.18:state==='reach'?.45:state==='groom'?.22:Math.max(.1,Math.min(1,Math.abs(vx)/480));
    tailState.activity=mix(tailState.activity,activity,1-Math.exp(-8*dt));
    tailState.phase+=dt*(2.1+tailState.activity*2.6);
    const acceleration=clamp((vx-tailState.previousVx)/Math.max(.001,dt)/15000,-.25,.25);
    tailState.previousVx=vx;
    const base=sleeping?[0,0,-.01,-.02,-.06,-.16,-.4]
      :state==='belly'?[0,-.15,-.45,-1.2,-2.3,-3,-3.2]
      :running?(name==='gallop'?[.04,.08,.24,.40,.53,.37,.05]:[.08,.12,-.12,-.3,-.15,.16,.38])
      :airborne||state==='land'?[.08,.22,.35,.32,.10,-.30,-.70]
      :['groom','land','stretch'].includes(state)?[-.1,-.4,-1,-1.9,-2.7,-3.4,-4.2]
      :[-.45,-.95,-1.35,-1.52,-1.62,-1.8,-1.95];
    const groundAngles=base.map((angle,i)=>{
      const amplitude=sleeping?0:airborne||state==='land'?.012+(i/6)**1.2*.065:.025+(i/6)**1.2*(.08+tailState.activity*.25);
      const local=angle+Math.sin(tailState.phase-i*.95)*amplitude;
      return running?(direction>0?Math.PI-local:local)+acceleration*i/6:side<0?Math.PI-local:local;
    });
    // Body impulses enter only at the root; the existing delayed parent chain
    // passes the gallop beat, braking and turns toward the tip.
    if(name==='gallop'){
      const rootLift=.12+.38*Math.sin(gallopPhase*Math.PI*2-.55)
        +.055*Math.sin(gallopPhase*Math.PI*4+.3);
      // Keep the root slightly above horizontal on both facings. Mirroring
      // then drives the chain over the rump instead of curling below the belly.
      groundAngles[0]=direction>0?-Math.PI+rootLift:-rootLift;
    }
    let x=tailState.x,y=tailState.y;
    const points=[[x,y]];
    base.forEach((angle,i)=>{
      const parent=tailState.joints[i-1];
      let groundTarget=groundAngles[i];
      if(i>0&&parent){
        const a=delayedTailAngle(i-1,i*.035,groundAngles[i-1],'rest');
        const b=delayedTailAngle(i,i*.035,groundAngles[i],'rest');
        const relativeBend=name==='gallop'
          ? (base[i]-base[i-1])*(direction>0?-1:1)*.65
          : Math.atan2(Math.sin(b-a),Math.cos(b-a));
        groundTarget=delayedTailAngle(i-1,name==='gallop'?.018:.014+i*.003,parent.angle)+relativeBend;
      }
      const bend=[0,.10,.08,-.04,-.14,-.13,.06][i]*strength*direction;
      const flightTarget=i===0?rootAngle:delayedTailAngle(i-1,.014+i*.003,parent?.angle??rootAngle)+bend;
      const flightDelta=Math.atan2(Math.sin(flightTarget-groundTarget),Math.cos(flightTarget-groundTarget));
      const target=groundTarget+flightDelta*tailState.flightBlend;
      const joint=tailState.joints[i]||={angle:target,velocity:0};
      const motionWeight=sleeping?tailState.flightBlend:1;
      const frequency=name==='gallop'?(i===0?38:48-i):mix(17-i*1.35,i===0?28:38-i,motionWeight);
      const damping=name==='gallop'?1.65:mix(1.7,1.4,motionWeight),limit=mix(3.5+i*.25,6+i*.3,motionWeight);
      // Small integration steps preserve the same flexible response at 40–120Hz.
      const steps=Math.ceil(dt*120),h=dt/steps;
      for(let n=0;n<steps;n++){
        const error=Math.atan2(Math.sin(target-joint.angle),Math.cos(target-joint.angle));
        joint.velocity+=(frequency*frequency*error-damping*frequency*joint.velocity)*h;
        joint.velocity=clamp(joint.velocity,-limit,limit);
        joint.angle+=joint.velocity*h;
      }
      x+=Math.cos(joint.angle)*tailState.length/7;
      y+=Math.sin(joint.angle)*tailState.length/7;
      points.push([x,y]);
    });
    const pair=p=>p.map(n=>n.toFixed(3)).join(',');
    let d=`M${pair(points[0])}`;
    for(let i=1;i<points.length-1;i++)d+=` Q${pair(points[i])} ${pair([(points[i][0]+points[i+1][0])/2,(points[i][1]+points[i+1][1])/2])}`;
    sharedTail.setAttribute('d',d+` T${pair(points.at(-1))}`);
    sharedTail.dataset.length=tailState.length.toFixed(3);
    sharedTail.dataset.root=`${tailState.x.toFixed(3)},${tailState.y.toFixed(3)}`;
    tailState.history.push({time:tailState.clock,angles:tailState.joints.map(j=>j.angle),rest:groundAngles});
    while(tailState.history.length>2&&tailState.history[1].time<tailState.clock-.6)tailState.history.shift();
  }

  // Internal seams convey overlap; the silhouette has no global pale halo.
  let active;
  let previousState;
  let direction = 1;
  let reachDirection = 1;
  let turnUntil = 0;
  let poseStarted = 0;
  let fastRun = false,walkCycle=0,lastRenderTime=null,lastGaitSwitch=-Infinity;
  window.renderPortfolioCat = ({ state, time, dt = 1 / 60, dx = 0, vx = 0, vy = 0, jumpHeight = 0, jumpLift = 0, jumpDrop = false, stride = 0, petRemaining, wakeProgress = 0, still = false }) => {
    if(state==='groom')state='sway';
    // Visual time advances only with the controller clock, not pointer events.
    dt=lastRenderTime===null?Math.min(dt,.025):clamp(time-lastRenderTime,0,.025);
    lastRenderTime=time;
    if(state!==previousState)poseStarted=time;
    const elapsed=time-poseStarted,speed=Math.abs(vx);
    animateSleep(time,state,still,wakeProgress);
    let wantsRun=fastRun;
    if(state!=='run')wantsRun=false;
    else if(speed>=120)wantsRun=true;
    else if(speed<=90)wantsRun=false;
    // Target revisions cannot restart clips or cause threshold chatter.
    if(wantsRun!==fastRun&&(state!=='run'||previousState!=='run'||time-lastGaitSwitch>=.16)){
      fastRun=wantsRun;lastGaitSwitch=time;
    }
    const gait=state==='run'?(fastRun?'run':'walk'):null;
    if(gait==='run')animateGallop(dt,speed);
    else if(gait==='walk'){
      // During stance, 52 native units cover .625 cycles. Match that rearward
      // travel to the actual screen velocity so planted paws stay on the plank.
      const scale=(art.getBoundingClientRect?.().width||102)/260;
      walkCycle=(walkCycle+dt*speed/(scale*52/.625))%1;animateWalk();
    }
    art.dataset.gait=gait||state;
    art.dataset.clipPhase=gait==='run'?runCycle.toFixed(6):gait==='walk'?walkCycle.toFixed(6):'';
    if(state==='reach'){
      if(previousState!=='reach')reachDirection=dx<-1?-1:dx>1?1:direction;
      else if(dx<-4)reachDirection=-1;
      else if(dx>4)reachDirection=1;
    }
    const swayTarget=state==='sway'?Math.sin(elapsed*4.2)*3.2*smooth(elapsed/.35):0;
    standingAngle=mix(standingAngle,swayTarget,1-Math.exp(-12*dt));
    standing.setAttribute('transform',`rotate(${standingAngle.toFixed(4)} 130 206)`);
    if(state==='stretch')animateStretch(elapsed);
    if(state==='belly'){
      if(previousState!=='belly')bellyExit=0;
      animateBelly(elapsed,still,petRemaining??Math.max(0,2.2-elapsed),dt);
    }
    animateFlight(state,vy,jumpDrop,Math.min(dt,.025),elapsed);
    if(state==='groom'){
      const lift=smooth(elapsed/.35);
      groomingAngle=Math.sin(elapsed*4)*1.3*lift;
      groomingArt.setAttribute('transform',`rotate(${groomingAngle} 130 206)`);
      const lick=Math.sin(elapsed*7)*2.5;
      const px=mix(117,122,lift),py=mix(201,150+lick,lift);
      groomingPaw.setAttribute('d',`M118 195 Q103 172 ${px} ${py}`);
      groomingToes.setAttribute('d',`M${px-3} ${py-2} l1 5 M${px+1} ${py-3} l1 5`);
    }
    let name = 'front';
    if (state === 'sleep' || state === 'wake') name = 'sleep';
    else if (state === 'stretch') name = 'stretch';
    else if (state === 'run') name = fastRun ? 'gallop' : 'walk';
    else if (state === 'jump') name = 'jump';
    else if (state === 'land') name = 'land';
    else if (state === 'groom') name = 'groom';
    else if (state === 'reach') name = 'reach';
    else if (state === 'belly') name = 'belly';
    const moving = state === 'run' || state === 'jump';
    if (moving && Math.abs(vx) > 22 && Math.sign(vx) !== direction) {
      direction = Math.sign(vx);
      turnUntil = time + .065;
    }
    const turning = state==='run' && time < turnUntil;
    if (turning && name!=='gallop') name = 'front';
    if (active !== name) {
      const duration=active==='sleep'&&name==='stretch'&&!still?'140ms':'0ms';
      if (active) {
        groups[active].style.transitionDuration = duration;
        groups[active].classList.remove('is-visible');
      }
      groups[name].style.transitionDuration = duration;
      groups[name].classList.add('is-visible');
      active = name;
      art.dataset.pose = name;
    }
    const directionalPose=name==='gallop'||name==='walk'||name==='jump'||name==='land'||name==='reach';
    const facing=name==='reach'?reachDirection:direction;
    groups[name].style.transform = directionalPose
      ? facing < 0 ? 'translateX(260px) scaleX(-1)' : '' : '';
    groups[name].style.setProperty('--cat-gaze-side', directionalPose&&facing<0?-1:1);
    if(dt>0)animateTail(time,state==='wake'?'sleep':state,name,vx,vy,jumpHeight,jumpLift,dt,turning,jumpDrop);
    previousState = state;
  };
  window.renderPortfolioCat({ state: 'sleep', time: 0 });

  // Procedural parts (especially the tail) must not appear before the raster
  // body and every SVG image instance have loaded. Register in this same task,
  // before image events can fire, and also wait for bitmap decoding.
  const svgImagesReady = Promise.all([...art.querySelectorAll('image')].map(node =>
    new Promise((resolve, reject) => {
      node.addEventListener('load', resolve, { once: true });
      node.addEventListener('error', () => reject(new Error('Cat SVG image failed to load')), { once: true });
    })));
  const bitmapReady = Promise.all([source,runSheet,walkSheet].map(url => new Promise((resolve,reject) => {
    const bitmap=new Image();
    bitmap.onload=()=>bitmap.decode?bitmap.decode().then(resolve,reject):resolve();
    bitmap.onerror=()=>reject(new Error('Cat artwork failed to load'));
    bitmap.src=url;
  })));
  window.portfolioCatReady = Promise.all([svgImagesReady, bitmapReady]);
})();

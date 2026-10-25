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
    body.append(image());
    crop.append(body);
    crops[name] = crop;
    bodyMasks[name] = bodyMask;
    group.append(crop);
    art.append(group);
    groups[name] = group;
  });

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
      fur.append(create('ellipse',{...old,fill:'#0b0b0c'}));
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
  standing.append(groups.front.firstChild);
  groups.front.append(standing);
  // Sleeping head remains full-size; only the rear torso is compressed.
  const sleepBodyClip=create('clipPath',{id:'cat-sleep-torso-window'});
  sleepBodyClip.append(create('rect',{x:730,y:691,width:120,height:132}));
  const sleepHeadClip=create('clipPath',{id:'cat-sleep-head-window'});
  sleepHeadClip.append(create('rect',{x:837,y:691,width:150,height:132}));
  defs.append(sleepBodyClip,sleepHeadClip);
  const sleepingBody=create('g',{class:'cat-sleep-body',transform:'translate(850 821) scale(.5) translate(-850 -821)'});
  const sleepingBodyWindow=create('g',{'clip-path':'url(#cat-sleep-torso-window)'});
  sleepingBodyWindow.append(image());sleepingBody.append(sleepingBodyWindow);
  const sleepingHead=create('g',{class:'cat-sleep-head','clip-path':'url(#cat-sleep-head-window)'});
  sleepingHead.append(image());
  crops.sleep.replaceChildren(sleepingBody,sleepingHead);
  crops.sleep.setAttribute('x',-50);

  // The lick begins from the exact default artwork, without swapping proportions.
  const groomingArt=create('g',{class:'cat-groom-art'});
  groomingArt.append(crops.front.cloneNode(true));
  groups.groom.replaceChildren(groomingArt);
  const groomingPaw=create('path',{class:'cat-groom-paw',fill:'none',stroke:'#0b0b0c','stroke-width':14,'stroke-linecap':'round'});
  const groomingToes=create('path',{fill:'none',stroke:'#45484a','stroke-width':1.5,'stroke-linecap':'round'});
  groomingArt.append(groomingPaw,groomingToes);
  let groomingAngle=0;

  // Keep the head height consistent while allowing the profile to become narrower.
  const poseScale={run0:1.10,run1:1.10,run2:1.08,run3:1.10,run4:1.10,run5:1.08,run6:1.10,jump:1.08};
  Object.entries(poseScale).forEach(([name,scale])=>{
    const wrapper=create('g',{'data-head-scale':scale,transform:`translate(130 206) scale(${scale}) translate(-130 -206)`});
    wrapper.append(crops[name]);groups[name].append(wrapper);
  });

  // Original head art on an independently articulated quadruped, rather than a
  // whole-sprite squash. Paws, hips, chest and head have separate trajectories.
  groups.stretch.replaceChildren();
  const stretchRig=create('g',{class:'cat-stretch-rig'});
  const limb=(width,color='#0b0b0c')=>create('path',{fill:'none',stroke:color,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round'});
  const farBack=limb(12,'#08090a'),farFront=limb(11,'#08090a');
  const stretchTorso=create('path',{fill:'#0b0b0c'});
  const nearBack=limb(14),nearFront=limb(13);
  const stretchToes=create('path',{fill:'none',stroke:'#45484a','stroke-width':1.5});
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
  stretchRig.append(farBack,farFront,stretchTorso,nearBack,nearFront,stretchHead,stretchToes);
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
    const [hx,hy,cx,cy,headX,headY,pawNear,pawFar]=av.map((v,i)=>mix(v,bv[i],u));
    stretchHip={x:hx-9,y:hy+4};
    const plantNear=206-Math.sin(Math.PI*smooth((phase-.05)/.22))*6;
    const plantFar=206-Math.sin(Math.PI*smooth((phase-.18)/.22))*6;
    farBack.setAttribute('d',`M${hx+4} ${hy+8} Q${hx+18} 188 69 204 L76 204`);
    nearBack.setAttribute('d',`M${hx-8} ${hy+10} Q${hx-20} 187 49 205 L58 205`);
    farFront.setAttribute('d',`M${cx} ${cy+5} Q${(cx+pawFar)/2} 199 ${pawFar} ${plantFar} l9 0`);
    nearFront.setAttribute('d',`M${cx+6} ${cy+8} Q${(cx+pawNear)/2-4} 199 ${pawNear} ${plantNear} l10 0`);
    stretchTorso.setAttribute('d',`M${hx-16} ${hy+7} C${hx-9} ${hy-20} ${hx+22} ${hy-24} ${cx+2} ${cy-7} Q${cx+18} ${cy+2} ${cx+6} ${cy+18} C${cx-15} ${cy+23} ${hx+7} ${hy+30} ${hx-14} ${hy+25} Z`);
    const dip=smooth(phase/.42)*(1-smooth((phase-.67)/.33));
    stretchHead.setAttribute('transform',`translate(${headX} ${headY}) rotate(${dip*7}) scale(1.08)`);
    stretchToes.setAttribute('d',`M${pawNear+5} ${plantNear-3} v5 M${pawFar+4} ${plantFar-3} v4 M53 202 v5`);
    stretchRig.dataset.phase=phase.toFixed(3);
  }

  // The same supplied head/eyes ride a four-legged flight rig. The chest and
  // forepaws lead the descent; the hips stay high instead of rotating a sprite.
  const flightHeadClip=create('clipPath',{id:'cat-flight-head-outline',clipPathUnits:'userSpaceOnUse'});
  flightHeadClip.append(create('path',{d:'M749 466H881V592H810Q782 590 760 580L749 576Z'}));
  defs.append(flightHeadClip);
  const flightRigs=['jump','land'].map(name=>{
    const rig=create('g',{class:'cat-flight-rig'});
    const backFar=limb(11,'#08090a'),frontFar=limb(10,'#08090a');
    const torso=create('path',{fill:'#0b0b0c'}),backNear=limb(14),frontNear=limb(13);
    const head=create('g',{class:'cat-flight-head','data-head-scale':1.08});
    const window=create('svg',{x:-66,y:-128,width:132,height:132,viewBox:'749 466 132 132',overflow:'hidden'});
    const headOnly=create('g',{'clip-path':'url(#cat-flight-head-outline)'});
    [...crops.jump.children].forEach(child=>headOnly.append(child.cloneNode(true)));
    window.append(headOnly);
    head.append(window);
    const toes=create('path',{fill:'none',stroke:'#45484a','stroke-width':1.5,'stroke-linecap':'round'});
    rig.append(backFar,frontFar,torso,backNear,frontNear,head,toes);
    groups[name].replaceChildren(rig);
    return {rig,backFar,frontFar,torso,backNear,frontNear,head,toes};
  });
  const flightBody={fall:0,land:0,hip:{x:84,y:154},chest:{x:126,y:153}};
  function animateFlight(state,vy,jumpDrop,dt){
    if(state!=='jump'&&state!=='land')return;
    const fallTarget=state==='land'?1:smooth((vy+(jumpDrop?230:95))/(jumpDrop?480:520));
    flightBody.fall=mix(flightBody.fall,fallTarget,1-Math.exp(-20*dt));
    flightBody.land=mix(flightBody.land,state==='land'?1:0,1-Math.exp(-24*dt));
    const f=flightBody.fall,l=flightBody.land;
    const value=(up,down,land)=>mix(mix(up,down,f),land,l);
    const hx=value(84,82,83),hy=value(154,119,175);
    const cx=value(126,126,126),cy=value(153,163,181);
    const headX=value(153,166,155),headY=value(145,192,191);
    const backX=value(58,69,68),backY=value(191,151,205);
    const frontX=value(153,162,151),frontY=value(175,206,206);
    const headAngle=value(-7,19,-2);
    flightBody.hip={x:hx,y:hy};flightBody.chest={x:cx,y:cy};
    flightRigs.forEach(({rig,backFar,frontFar,torso,backNear,frontNear,head,toes})=>{
      backFar.setAttribute('d',`M${hx+5} ${hy+7} Q${hx+16} ${hy+22} ${backX+13} ${backY-5} l8 -1`);
      backNear.setAttribute('d',`M${hx-9} ${hy+8} Q${hx-16} ${hy+28} ${backX} ${backY} l9 -1`);
      frontFar.setAttribute('d',`M${cx+4} ${cy+3} Q${cx+19} ${cy+23} ${frontX+16} ${frontY-7} l8 0`);
      frontNear.setAttribute('d',`M${cx-1} ${cy+8} Q${cx+10} ${cy+30} ${frontX} ${frontY} l10 0`);
      torso.setAttribute('d',`M${hx-17} ${hy+1} C${hx-10} ${hy-20} ${hx+13} ${hy-19} ${cx+9} ${cy-11} Q${cx+23} ${cy+3} ${cx+8} ${cy+20} C${cx-12} ${cy+22} ${hx-17} ${hy+27} ${hx-17} ${hy+1} Z`);
      head.setAttribute('transform',`translate(${headX} ${headY}) rotate(${headAngle}) scale(1.08)`);
      toes.setAttribute('d',`M${frontX+5} ${frontY-3} v5 M${frontX+20} ${frontY-10} v4 M${backX+5} ${backY-4} v4`);
      rig.dataset.fall=f.toFixed(3);
      rig.dataset.hip=`${hx.toFixed(3)},${hy.toFixed(3)}`;
      rig.dataset.frontPaw=`${frontX.toFixed(3)},${frontY.toFixed(3)}`;
      rig.dataset.backPaw=`${backX.toFixed(3)},${backY.toFixed(3)}`;
    });
  }

  // The upward pose and its forepaw come from the same supplied sprite sheet.
  const pawShape = '128,155 129,136 143,108 153,100 164,104 163,119 149,148 139,165';
  const pawMask = create('mask', { id: 'cat-reach-mask', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 260, height: 220 });
  pawMask.append(create('rect', { width: 260, height: 220, fill: 'white' }), create('polygon', { points: pawShape, fill: 'black' }));
  const pawClip = create('clipPath', { id: 'cat-reach-paw' });
  pawClip.append(create('polygon', { points: pawShape }));
  defs.append(pawMask, pawClip);
  const reachBody = create('g', { mask: 'url(#cat-reach-mask)' });
  reachBody.append(groups.reach.firstChild);
  const reachPaw = create('g', { class: 'cat-reaching-paw' });
  const reachWindow = create('g', { 'clip-path': 'url(#cat-reach-paw)' });
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
  bellyMask.append(create('rect',{x:1195,y:690,width:245,height:145,fill:'white'}),create('polygon',{points:'1195,799 1229,799 1240,806 1250,810 1245,825 1195,835',fill:'black'}));
  defs.append(bellyMask);
  const bellyImage=create('g',{mask:'url(#cat-belly-tail-mask)'});bellyImage.append(image());
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
    bellyMask.append(create('polygon',{points:paw.points,fill:'black'}));
    const joint=create('g',{'data-belly-paw':index});
    const patch=create('g',{'clip-path':`url(#cat-belly-paw-${index})`});patch.append(image());
    joint.append(patch);bellyWindow.append(joint);
    return {...paw,joint};
  });
  bellyWindow.append(create('ellipse',{cx:1332,cy:752,rx:12.5,ry:12.5,fill:'#0b0b0c'}),create('ellipse',{cx:1352,cy:776,rx:14,ry:15,fill:'#0b0b0c'}));
  bellyWindow.append(create('path',{d:'M1322 754 Q1334 757 1341 744 M1341 777 Q1353 788 1363 770',fill:'none',stroke:'#318de0','stroke-width':3.2,'stroke-linecap':'round'}));
  bellyRig.append(bellyWindow);
  groups.belly.append(bellyRig);art.append(groups.belly);
  tails.belly=[64,193,-1];
  let bellyRoot={x:64,y:193},bellyExit=0;
  function animateBelly(elapsed,still,remaining,dt){
    const e=still?2:elapsed;
    const exitTarget=still?0:smooth(1-remaining/.4);
    bellyExit=still?0:bellyExit+(exitTarget-bellyExit)*(1-Math.exp(-20*Math.min(dt,.025)));
    const enter=smooth(e/.35),exit=bellyExit;
    const comfort=enter*(1-exit),roll=-32*(1-enter)+exit*24+Math.sin(e*3.2)*2.5*comfort;
    bellyRig.setAttribute('transform',`translate(78 206) rotate(${roll}) scale(1.08) translate(-78 -206)`);
    const r=roll*Math.PI/180,dx=(64-78)*1.08,dy=(193-206)*1.08;
    bellyRoot={x:78+dx*Math.cos(r)-dy*Math.sin(r),y:206+dx*Math.sin(r)+dy*Math.cos(r)};
    bellyPaws.forEach(paw=>{
      const flutter=still?0:Math.sin(e*11+paw.phase)*3.2*comfort;
      paw.joint.setAttribute('transform',`rotate(${flutter} ${paw.x} ${paw.y})`);
    });
  }

  // One tail lives outside all sprite/pose groups. Its root, length, joint
  // angles and velocities survive every pose change, including mirroring.
  const sharedTail=create('path',{id:'cat-shared-tail',class:'cat-tail',fill:'none',stroke:'#0b0b0c','stroke-width':13,'stroke-linecap':'round','stroke-linejoin':'round'});
  art.prepend(sharedTail);
  const tailState={phase:0,activity:0,previousVx:0,x:null,y:null,rootVx:0,rootVy:0,length:196,flightBlend:0,flightHeight:0,clock:0,history:[],joints:[]};
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
  function animateTail(time,state,name,vx,vy,jumpHeight,jumpLift,dt,turning){
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
      rootX=flightBody.hip.x-12;rootY=flightBody.hip.y+1;
      if(direction<0)rootX=260-rootX;
    }
    if(state==='stretch'){rootX=stretchHip.x;rootY=stretchHip.y;side=-1;}
    if(state==='belly'){rootX=bellyRoot.x;rootY=bellyRoot.y;side=-1;}
    if(tailState.x===null){tailState.x=rootX;tailState.y=rootY;}
    const rootFrequency=airborne||state==='land'?28:18;
    tailState.rootVx+=((rootX-tailState.x)*rootFrequency**2-2*rootFrequency*tailState.rootVx)*dt;
    tailState.rootVy+=((rootY-tailState.y)*rootFrequency**2-2*rootFrequency*tailState.rootVy)*dt;
    tailState.x+=tailState.rootVx*dt;
    tailState.y+=tailState.rootVy*dt;
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

  let active;
  let previousState;
  let direction = 1;
  let reachDirection = 1;
  let turnUntil = 0;
  let poseStarted = 0;
  window.renderPortfolioCat = ({ state, time, dt = 1 / 60, dx = 0, vx = 0, vy = 0, jumpHeight = 0, jumpLift = 0, jumpDrop = false, stride = 0, petRemaining, still = false }) => {
    if(state!==previousState)poseStarted=time;
    const elapsed=time-poseStarted;
    if(state==='reach'){
      if(previousState!=='reach')reachDirection=dx<-1?-1:dx>1?1:direction;
      else if(dx<-4)reachDirection=-1;
      else if(dx>4)reachDirection=1;
    }
    if(state==='stretch')animateStretch(elapsed);
    if(state==='belly'){
      if(previousState!=='belly')bellyExit=0;
      animateBelly(elapsed,still,petRemaining??Math.max(0,2.2-elapsed),dt);
    }
    animateFlight(state,vy,jumpDrop,Math.min(dt,.025));
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
    if (state === 'sleep') name = 'sleep';
    else if (state === 'stretch') name = 'stretch';
    else if (state === 'run') name = `run${Math.floor(stride / 20) % 7}`;
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
    if (turning) name = 'front';
    if (active !== name) {
      const sameDefaultBody=(name==='groom'&&active==='front')||(name==='front'&&active==='groom');
      const sameFlightBody=(name==='jump'&&active==='land')||(name==='land'&&active==='jump');
      const duration = sameDefaultBody||sameFlightBody ? '0ms' : turning || (active === 'front' && moving) ? '45ms' : state === 'run' && previousState === 'run' ? '0ms' : previousState === 'sleep' && state === 'stretch' ? '80ms' : previousState === 'sleep' ? '200ms' : '130ms';
      if (active) {
        groups[active].style.transitionDuration = duration;
        groups[active].classList.remove('is-visible');
      }
      groups[name].style.transitionDuration = duration;
      groups[name].classList.add('is-visible');
      active = name;
      art.dataset.pose = name;
    }
    const directionalPose=name.startsWith('run')||name==='jump'||name==='land'||name==='reach';
    const facing=name==='reach'?reachDirection:direction;
    groups[name].style.transform = directionalPose
      ? facing < 0 ? 'translateX(260px) scaleX(-1)' : '' : '';
    groups[name].style.setProperty('--cat-gaze-side', directionalPose&&facing<0?-1:1);
    animateTail(time,state,name,vx,vy,jumpHeight,jumpLift,Math.min(dt,.025),turning);
    previousState = state;
  };
  window.renderPortfolioCat({ state: 'sleep', time: 0 });
})();

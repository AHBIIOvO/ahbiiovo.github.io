'use strict';

// Feet use world coordinates. Each project card is one moving, one-way plank.
// Its image and text do not create separate collision surfaces.
(() => {
  const world = document.querySelector('#cat-world');
  const cat = document.querySelector('#hero-cat');
  if (!world || !cat) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mouse = matchMedia('(hover: hover) and (pointer: fine)');
  const compact = matchMedia('(max-width: 600px)');
  const wakeDelay = .4;
  const wakeTransitionDuration = .28;
  const gravity = 1500;
  const maxRise = 420;
  const maxSpeed = 1040;
  const clamp = (n, a, b) => Math.max(a, Math.min(n, Math.max(a, b)));
  const body = { x: 0, feet: 0, vx: 0, vy: 0, ground: null, stride: 0 };
  const gaze = { x: 0, y: 0 };
  const pointer = { x: 0, y: 0, known: false, inside: false, present: false };
  const followAnchor = { x: 0, y: 0, valid: false };
  const followRadius = 24;
  const followStartRadius = 36;
  const followStopRadius = 18;
  let platforms = [];
  let bounds, width, height;
  let frame = 0, measureFrame = 0, last = 0, visible = true;
  let resourcesReady = false;
  let awake = false, age = 0, nextDecision = 2.6, nextSway = 9, swayUntil = 0, landUntil = 0;
  let wakeAge = Infinity;
  let waking = false, wakeStarted = 0, stretchUntil = 0;
  let target = null, jump = null, destination = null, nextPointerDecision = 0;
  let reachingFor = 0;
  let pointerRevision = 0, reachedRevision = -1;
  let pendingPointerTarget = false;
  let petUntil = 0, petPending = false, lastPetClick = -Infinity, stillPetTimer;
  let hoveringCat = false;
  let lastPointerAge=-Infinity,idleActive=false,idleSitUntil=0,idleBeat=0,idleWaitingForLanding=false;
  let idlePaceReadyAt=0,idlePaceLeg=0,idleAction='idle',idleActionUntil=0;
  const petParticles = new Set();
  const titleOnly = () => !mouse.matches || compact.matches;
  const pointerFollowing = () => !titleOnly() && !reduced.matches;
  const roaming = () => !reduced.matches;
  const worldInset = () => width / 2;

  const onTitle=platform=>platform&&['games','experiences'].includes(platform.id);
  const needsIdle=()=>titleOnly()||!pointer.present||!pointer.inside||age-lastPointerAge>3;
  function leavePointer(){
    pointer.present=pointer.inside=false;hoveringCat=false;followAnchor.valid=false;
    pendingPointerTarget=false;destination=target=null;reachingFor=0;
    idleSitUntil=age+1.1;nextDecision=idleSitUntil;swayUntil=0;idleWaitingForLanding=!body.ground;
    idlePaceReadyAt=idlePaceLeg=idleActionUntil=0;idleAction='idle';
    requestTick();
  }
  function idleRest(){
    // One brief stationary activity, then a quiet seat, within a 4–5s rest.
    idlePaceReadyAt=age+4+Math.random();nextDecision=idlePaceReadyAt;
    idleAction='sway';idleBeat++;
    idleActionUntil=age+2.4;
    swayUntil=idleAction==='sway'?idleActionUntil:0;
  }
  function planIdle(){
    if(!body.ground||age<idleSitUntil)return;
    const titles=platforms.filter(onTitle);
    if(!onTitle(body.ground)){
      destination=titles.reduce((best,p)=>!best||Math.abs(p.y-body.feet)<Math.abs(best.y-body.feet)?p:best,null);
      if(destination)target=clamp(body.x,destination.left+14,destination.right-14);
      return;
    }
    if(destination){
      if(Math.abs(body.x-target)>3||Math.abs(body.vx)>8)return;
      destination=target=null;
      idlePaceLeg=0;idleRest();return;
    }
    if(!idlePaceReadyAt){idleRest();return;}
    if(age<idlePaceReadyAt)return;
    idleAction='idle';idleActionUntil=swayUntil=0;
    idlePaceLeg=1;
    const other=titles.find(p=>p.id!==body.ground.id);
    destination=other&&Math.random()<.35?other:body.ground;
    const inset=Math.max(14,Math.min(24,width*.2));
    const left=clamp(destination.left+inset,worldInset(),bounds.width-worldInset());
    const right=clamp(destination.right-inset,worldInset(),bounds.width-worldInset());
    const minTravel=Math.min(70,Math.max(0,right-left)*.22);
    for(let attempt=0;attempt<6;attempt++){
      target=left+Math.random()*Math.max(0,right-left);
      if(destination.id!==body.ground.id||Math.abs(target-body.x)>=minTravel)break;
    }

  }

  // Constant acceleration with v²=2ad braking distance, independent of gait.
  function groundMotion(distance,velocity,dt,cruiseSpeed,hold=false,gentle=false){
    const acceleration=gentle?260:1800,braking=gentle?550:4200;
    const desired=hold?0:Math.sign(distance)*Math.min(cruiseSpeed,Math.sqrt(2*braking*Math.max(0,Math.abs(distance)-.75)));
    const slowing=velocity*desired<0||Math.abs(desired)<Math.abs(velocity);
    const limit=(slowing?braking:acceleration)*dt;
    const next=velocity+clamp(desired-velocity,-limit,limit);
    let advance=(velocity+next)*.5*dt;
    if(!hold&&Math.sign(advance)===Math.sign(distance)&&Math.abs(advance)>=Math.abs(distance))return{velocity:0,advance:distance};
    if(!hold&&Math.abs(distance)<.8&&Math.abs(next)<braking*dt)return{velocity:0,advance:distance};
    return{velocity:next,advance};
  }

  function pose(name) {
    if (cat.dataset.state !== name) cat.dataset.state = name;
  }

  function beginPet() {
    if (!body.ground) { petPending = true; return; }
    awake = true;
    waking = false;
    petPending = false;
    body.vx = body.vy = 0;
    destination = target = null;
    swayUntil = reachingFor = 0;
    reachedRevision = pointerRevision;
    pendingPointerTarget = false;
    petUntil = age + 2.2;
    nextDecision = petUntil + 1.3;
    nextSway = petUntil + 6;
    pose('belly');
    draw();
    requestTick();
  }
  function petBurst() {
    // Each particle has its own size and drift; none follow the cat afterwards.
    const add = (text, kind) => {
      if (petParticles.size >= 12) {
        const oldest = petParticles.values().next().value;
        oldest.remove();
        petParticles.delete(oldest);
      }
      const particle = document.createElement('span');
      particle.className = `cat-affection cat-affection-${kind}`;
      particle.textContent = text;
      particle.setAttribute('aria-hidden', 'true');
      particle.style.left = `${body.x + (Math.random() - .5) * 18}px`;
      particle.style.top = `${body.feet - height * .7}px`;
      particle.style.fontSize = `${kind === 'meow' ? 14 + Math.random() * 3 : 11 + Math.random() * 6}px`;
      particle.style.setProperty('--drift', `${(Math.random() - .5) * 70}px`);
      particle.style.setProperty('--rise', `${-(65 + Math.random() * 40)}px`);
      particle.style.setProperty('--tilt', `${(Math.random() - .5) * 24}deg`);
      particle.style.setProperty('--float-time', `${.95 + Math.random() * .35}s`);
      const remove = () => { particle.remove(); petParticles.delete(particle); };
      // Bound nodes even if animationend is suppressed by a motion preference.
      particle.addEventListener('animationend', remove, { once: true });
      setTimeout(remove, 1500);
      petParticles.add(particle);
      world.append(particle);
    };
    const meow = Math.random() < .7;
    const heart = Math.random() < .65;
    if (meow) add('meow~', 'meow');
    if (heart || !meow) add('♥', 'heart');
  }
  cat.addEventListener('click', event => {
    const clickedAt = event?.timeStamp ?? age * 1000;
    if (clickedAt - lastPetClick < 380) return;
    lastPetClick = clickedAt;
    petBurst();
    if (reduced.matches) {
      pose('belly');
      draw();
      clearTimeout(stillPetTimer);
      stillPetTimer = setTimeout(() => { pose('idle'); draw(); }, 2200);
    } else beginPet();
  });
  function updatePetLabel() {
    cat.setAttribute('aria-label', document.documentElement.lang.startsWith('zh') ? '摸摸小猫' : 'Pet the cat');
  }
  document.addEventListener('portfolio:language-change', updatePetLabel);
  updatePetLabel();

  function draw(dt = 0) {
    cat.style.transform = `translate3d(${(body.x - width / 2).toFixed(2)}px, ${(body.feet - height * .94).toFixed(2)}px, 0)`;
    const box = world.getBoundingClientRect();
    const dx = pointer.known && !idleActive ? pointer.x - box.left - body.x : 0;
    const dy = pointer.known && !idleActive ? pointer.y - box.top - (body.feet - height * .5) : 0;
    const jumpHeight = jump ? Math.max(jump.vy ** 2 / (2 * gravity), Math.abs(jump.platform.y - jump.source.y)) : 0;
    const jumpLift = jump ? Math.max(0, jump.source.y - body.feet) : 0;
    window.renderPortfolioCat?.({ state: cat.dataset.state, time: age, dt, dx, dy, vx: body.vx, vy: body.vy, jumpHeight, jumpLift, jumpDrop: !!jump?.drop, stride: body.stride, petRemaining: Math.max(0, petUntil - age), wakeProgress: clamp((age - wakeStarted) / wakeTransitionDuration, 0, 1), still: reduced.matches });
    if(awake&&idleActive){
      const observing=cat.dataset.state==='observe';
      const blend=1-Math.exp(-8*dt);
      gaze.x+=((observing?Math.sin(age*1.3)*3:0)-gaze.x)*blend;
      gaze.y+=((observing?Math.sin(age*.8)*.7:0)-gaze.y)*blend;
      cat.style.setProperty('--eye-x',gaze.x.toFixed(2)+'px');
      cat.style.setProperty('--eye-y',gaze.y.toFixed(2)+'px');
      cat.style.setProperty('--head-angle','0deg');return;
    }
    if (!awake || !pointer.known || !pointerFollowing()) return;
    const length = Math.max(65, Math.hypot(dx, dy));
    const blend = 1 - Math.exp(-20 * dt);
    // Both eyes receive one shared gaze vector, so they never converge inward.
    gaze.x += (dx / length * 6.8 - gaze.x) * blend;
    gaze.y += (dy / length * 5.8 - gaze.y) * blend;
    cat.style.setProperty('--eye-x', `${gaze.x.toFixed(2)}px`);
    cat.style.setProperty('--eye-y', `${gaze.y.toFixed(2)}px`);
    cat.style.setProperty('--head-angle', `${(dx / length * 5).toFixed(2)}deg`);
  }

  function measure() {
    measureFrame = 0;
    bounds = world.getBoundingClientRect();
    width = cat.offsetWidth;
    height = cat.offsetHeight;
    const surface = (selector, id, inset = 0) => {
      const element = document.querySelector(selector);
      const box = element.getBoundingClientRect();
      return { id, left: box.left - bounds.left, right: box.right - bounds.left, y: box.top - bounds.top + inset };
    };
    const titleSize = parseFloat(getComputedStyle(document.querySelector('.hero-title')).fontSize);
    const games = surface('.hero-first-line', 'games', titleSize * .19);
    const interactiveWord = surface('.hero-interactive', 'interactive');
    // One walking region spans both words; its only walkable top is above Games.
    games.left = Math.min(games.left, interactiveWord.left);
    games.right = Math.max(games.right, interactiveWord.right);
    const previousAnchor = body.ground?.id || jump?.source.id;
    platforms = [games, surface('.hero-experiences', 'experiences', titleSize * .13)];
    if (!titleOnly()) {
      platforms.push(surface('#work-title', 'work', 1), surface('#project-count', 'count', 1));
      const heading = document.querySelector('.section-heading').getBoundingClientRect();
      platforms.push({ id: 'divider', left: heading.left - bounds.left, right: heading.right - bounds.left, y: heading.bottom - bounds.top - 1 });
      const cards = [...document.querySelectorAll('.project-card')].map((element, index) => ({ id: `card-${element.dataset.project || index}`, card: true, element }));
      platforms.push(...cards);
      platforms.push({ id: 'floor', left: heading.left - bounds.left, right: heading.right - bounds.left, y: heading.bottom - bounds.top - 1 });
    }
    refreshCards();
    const anchor = platforms.find(p => p.id === (!awake || !roaming() ? 'experiences' : previousAnchor)) || platforms.find(p => p.id === 'experiences');
    body.x = clamp(!awake || !roaming() ? (anchor.left + anchor.right) / 2 : body.x, anchor.left + 9, anchor.right - 9);
    body.x = clamp(body.x, worldInset(), bounds.width - worldInset());
    body.feet = anchor.y;
    body.vx = body.vy = 0;
    reachingFor = 0;
    body.ground = anchor;
    jump = destination = target = null;
    if (awake && !roaming()) pose('idle');
    draw();
    requestTick();
  }

  function requestMeasure() {
    if (!measureFrame) measureFrame = requestAnimationFrame(measure);
  }

  function refreshCards() {
    bounds = world.getBoundingClientRect();
    const cards = platforms.filter(p => p.card);
    for (const card of cards) {
      const rect = card.element.getBoundingClientRect();
      Object.assign(card, { left: rect.left - bounds.left, right: rect.right - bounds.left, y: rect.top - bounds.top, bottom: rect.bottom - bounds.top });
    }
    // The final plank is also the fallback for an otherwise missed landing.
    const floor = platforms.find(p => p.id === 'floor');
    if (floor && cards.length) {
      const lastCard = cards.reduce((last, card) => card.y > last.y ? card : last);
      Object.assign(floor, { left: lastCard.left, right: lastCard.right, y: lastCard.y });
    }
    if (body.ground?.card || body.ground?.id === 'floor') body.feet = body.ground.y;
  }

  // A launch has enough height to clear the destination, then lands on its top.
  function trajectory(from, to, startX, aimX = startX) {
    const rise = from.y - to.y;
    const cardRise = Math.max(maxRise, ...platforms.filter(p => p.card).map(p => p.bottom - p.y + 120));
    if (rise > (from.card || to.card ? cardRise : maxRise)) return null;
    const vy = rise < -4 ? 0 : -Math.sqrt(2 * gravity * Math.max(48, rise + 38));
    const discriminant = vy * vy + 2 * gravity * (to.y - from.y);
    if (discriminant < 0) return null;
    const flight = (-vy + Math.sqrt(discriminant)) / gravity;
    const landingLeft = Math.max(to.left + 12, startX - maxSpeed * flight);
    const landingRight = Math.min(to.right - 12, startX + maxSpeed * flight);
    if (landingLeft > landingRight) return null;
    const endX = clamp(aimX, landingLeft, landingRight);
    const vx = (endX - startX) / flight;
    return Math.abs(vx) <= maxSpeed + 1e-6 ? { vx, vy, endX, flight } : null;
  }

  function route(from, to) {
    const queue = [{ platform: from, path: [], x: body.x }];
    const visited = new Set([from.id]);
    while (queue.length) {
      const node = queue.shift();
      for (const next of platforms) {
        if (visited.has(next.id)) continue;
        const startX = clamp(node.x, node.platform.left + 12, node.platform.right - 12);
        const down = next.y > node.platform.y + 4;
        const nextCenter = (next.left + next.right) / 2;
        const launchX = down ? node.x
          : clamp(nextCenter, node.platform.left + 12, node.platform.right - 12);
        const aimX = down ? (next.id === to.id ? target : nextCenter) : launchX;
        const arc = trajectory(node.platform, next, launchX, aimX);
        if (!arc) continue;
        const path = [...node.path, { platform: next, launchX, aimX, down }];
        if (next.id === to.id) return path[0];
        visited.add(next.id);
        queue.push({ platform: next, path, x: arc.endX || startX });
      }
    }
    return null;
  }

  function chooseTarget(usePointer) {
    if (!body.ground || !roaming()) return;
    if (usePointer && pointerFollowing() && pointer.inside) {
      const rect = world.getBoundingClientRect();
      const x = followAnchor.x - rect.left;
      const y = pointer.y - rect.top;
      const distanceTo = p => {
        const vertical = p.card ? Math.abs(y - clamp(y, p.y, p.bottom)) : Math.abs(y - p.y);
        return vertical + Math.abs(x - clamp(x, p.left, p.right)) * .7;
      };
      const closest = platforms.reduce((best, p) => {
        const distance = distanceTo(p);
        return !best || distance < best.distance ? { p, distance } : best;
      }, null);
      const current = body.ground;
      // Include the cat's body above a card in that card's pointer region.
      // A different surface must be clearly closer before switching platforms.
      const upperBuffer = current.card ? height + 36 : height * .35 + 24;
      const nearCurrent = x >= current.left - 36 && x <= current.right + 36
        && y >= current.y - upperBuffer && y <= (current.card ? current.bottom : current.y) + 24;
      destination = hoveringCat || nearCurrent || distanceTo(current) <= closest.distance + 24
        ? current : closest.p;
      const cards = platforms.filter(p => p.card).sort((a, b) => a.y - b.y);
      if (!hoveringCat && cards.length && y >= cards[0].y - (current.card ? height + 36 : 0)) {
        // Each card midpoint divides its upper plank from the next lower one.
        // The same boundary applies when approaching from either direction.
        destination = cards[0];
        for (let i = 0; i < cards.length - 1; i++) {
          if (y <= (cards[i].y + cards[i].bottom) / 2) break;
          destination = cards[i + 1];
        }
      }
      // A small zone around the cat holds its feet still. Once pursuit starts,
      // stop short of the pointer so tiny hand movements do not restart it.
      const samePlatform=destination.id===body.ground.id;
      const distance=x-body.x;
      const aim=samePlatform
        ? Math.abs(distance)<=followStartRadius?body.x:x-Math.sign(distance)*followStopRadius
        : x;
      target = clamp(aim, destination.left + 14, destination.right - 14);
    } else {
      const choices = platforms.filter(p => ['games', 'experiences'].includes(p.id) && (titleOnly() || p.id !== body.ground.id));
      destination = choices[Math.floor(Math.random() * choices.length)];
      target = destination.left + (destination.right - destination.left) * (.25 + Math.random() * .5);
    }
    swayUntil = 0;
    nextDecision = age + 6 + Math.random() * 3;
  }

  function tick(now) {
    frame = 0;
    if (!visible || document.hidden || reduced.matches) return;
    const dt = last ? Math.min((now - last) / 1000, .025) : 1 / 60;
    last = now;
    age += dt;
    refreshCards();
    if (!awake && age >= wakeAge && !waking) {
      waking = true;
      wakeStarted = age;
      stretchUntil = age + wakeTransitionDuration + 1.2;
    }
    if (waking) pose(age < wakeStarted + wakeTransitionDuration ? 'wake' : 'stretch');
    if (waking && age >= stretchUntil) {
      awake = true;
      waking = false;
      landUntil = age + .18;
      nextDecision = age + .3;
      pose('idle');
    }
    const idleNow=needsIdle();
    if(awake&&idleNow!==idleActive){
      idleActive=idleNow;destination=target=null;reachingFor=swayUntil=0;
      idlePaceReadyAt=idlePaceLeg=idleActionUntil=0;idleAction='idle';
      if(idleActive){idleSitUntil=age+1.1;nextDecision=idleSitUntil;idleWaitingForLanding=!body.ground;}
      else{pendingPointerTarget=true;nextPointerDecision=age;idleWaitingForLanding=false;}
    }
    cat.dataset.activity=idleNow?'idle':'follow';
    if (petPending && body.ground) beginPet();
    if (awake && age < petUntil) {
      pose('belly');
    } else if (awake && !idleActive && hoveringCat && body.ground && pointerFollowing()) {
      // Brake under the pointer instead of snapping velocity to zero.
      // Once stopped, hold the click target still for petting.
      const braking=groundMotion(0,body.vx,dt,560,true);
      body.vx=Math.abs(braking.velocity)<6?0:braking.velocity;
      body.x=clamp(body.x+braking.advance,body.ground.left+8,body.ground.right-8);
      body.x=clamp(body.x,width/2,bounds.width-width/2);
      body.stride+=Math.abs(braking.advance);
      destination = null;
      nextDecision = age + 1;
      pose(body.vx===0?'idle':'run');
    } else if (awake && roaming()) {
      if(idleActive)planIdle();
      if (!idleActive && pointerFollowing() && pendingPointerTarget && pointer.inside && body.ground && age >= nextPointerDecision) {
        chooseTarget(true);
        pendingPointerTarget = false;
        nextPointerDecision = age + .16;
      }
      if (!idleActive && age > nextDecision && body.ground && cat.dataset.state !== 'reach') {
        // A brief sway between trips; pointer movement can interrupt it.
        if (age > nextSway) {
          swayUntil = age + 2.1;
          nextDecision = age + 2.3;
          nextSway = age + 15;
          destination = null;
        } else chooseTarget(pointerFollowing() && pointer.inside);
      }
      if (body.ground) {
        let runTo = body.x;
        let step = null;
        if (destination && destination.id !== body.ground.id) {
          step = route(body.ground, destination);
          if (step) runTo = step.launchX;
          else destination = null;
        } else if (destination) runTo = target;
        const dx = runTo - body.x;
        if (step?.down) body.vx = 0;
        const cruiseSpeed=idleActive?(onTitle(body.ground)?65:280):Math.min(560,bounds.width*.75);
        const motion=groundMotion(dx,body.vx,dt,cruiseSpeed,age<landUntil||!!step?.down||(idleActive&&age<idleSitUntil),idleActive&&onTitle(body.ground)&&idlePaceLeg===1&&age>=idleSitUntil);
        body.vx=motion.velocity;
        const advance=motion.advance;
        body.x+=advance;
        body.stride += Math.abs(advance);
        body.x = clamp(body.x, body.ground.left + (step?.down ? -16 : 8), body.ground.right + (step?.down ? 16 : -8));
        body.x = clamp(body.x, width / 2, bounds.width - width / 2);
        if (step && Math.abs(dx) < 7 && age >= landUntil) {
          const arc = trajectory(body.ground, step.platform, body.x, step.aimX);
          if (arc) {
            jump = { platform: step.platform, source: body.ground, drop: step.down, ...arc };
            body.vx = arc.vx;
            body.vy = arc.vy;
            body.ground = null;
            reachingFor = 0;
            pose('jump');
          }
        } else {
          const rect = world.getBoundingClientRect();
          const pointerX = pointer.x - rect.left;
          const pointerY = pointer.y - rect.top;
          const closest = !step && Math.abs(dx) < 4 && Math.abs(body.vx) < 18;
          const wantsToReach = !idleActive && pointerFollowing() && pointer.known && pointer.inside && closest
            && pointerY < body.feet - height * .58
            && Math.abs(pointerX - body.x) < width * .9;
          reachingFor = wantsToReach && reachedRevision !== pointerRevision ? reachingFor + dt : 0;
          if (reachingFor >= 2.23) {
            reachedRevision = pointerRevision;
            reachingFor = 0;
          }
          if (age < landUntil) pose('land');
          else if (Math.abs(body.vx) > 8) pose('run');
          else if (reachingFor > .18) pose('reach');
          else if (age < swayUntil) pose('sway');
          else if(idleActive&&age<idleActionUntil)pose(idleAction);
          else pose('idle');
        }
      }
      if (!body.ground) {
        const previousFeet = body.feet;
        body.vy += gravity * dt;
        body.feet += body.vy * dt;
        body.x = clamp(body.x + body.vx * dt, width / 2, bounds.width - width / 2);
        if (body.vy >= 0) {
          // Drop through only the departure surface; all lower surfaces remain solid.
          const landing = platforms.filter(p => !(jump?.drop && p.id === jump.source.id)
            && previousFeet <= p.y + .5 && body.feet >= p.y
            && body.x >= p.left + 3 && body.x <= p.right - 3).sort((a, b) => a.y - b.y)[0];
          if (landing) {
            body.feet = landing.y;
            body.vx = body.vy = 0;
            body.ground = landing;
            jump = null;
            landUntil = age + .14;
            pose('land');
            if(idleActive&&idleWaitingForLanding){idleWaitingForLanding=false;idleSitUntil=age+1.1;nextDecision=idleSitUntil;}
          }
        }
        // Keep a missed jump on the final plank.
        const floor = platforms.at(-1);
        if (body.feet > floor.y) {
          body.feet = floor.y;
          body.x = clamp(body.x, floor.left + 10, floor.right - 10);
          body.vx = body.vy = 0;
          body.ground = floor;
          jump = null;
          if(idleActive&&idleWaitingForLanding){idleWaitingForLanding=false;idleSitUntil=age+1.1;nextDecision=idleSitUntil;}
        }
      }
    } else if (awake) {
      // Reduced-motion preference retains a quiet, stationary pose.
      if (age >= nextSway) {
        swayUntil = age + 2.1;
        nextSway = age + 10 + Math.random() * 4;
      }
      pose(age < swayUntil ? 'sway' : 'idle');
    }
    draw(dt);
    requestTick();
  }

  function requestTick() {
    if (resourcesReady && !frame && visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
  }

  cat.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' && pointerFollowing()) hoveringCat = true;
  });
  cat.addEventListener('pointerleave', () => {
    hoveringCat = false;
    if (pointerFollowing() && pointer.known) pendingPointerTarget = true;
  });

  document.addEventListener('pointermove', event => {
    if (!resourcesReady || event.pointerType !== 'mouse') return;
    // Mouse activity wakes the cat even on layouts where following is disabled.
    if (!awake && !waking && !Number.isFinite(wakeAge)) wakeAge = age + wakeDelay;
    if (reduced.matches && !awake) { awake = true; pose('idle'); draw(); }
    requestTick();
    if (!pointerFollowing()) return;
    pointer.present=true;lastPointerAge=age;
    // Petting holds the pose in tick(), but pointer intent must stay current.
    const rect = world.getBoundingClientRect();
    const movedBeyondRadius = !followAnchor.valid || Math.hypot(event.clientX - followAnchor.x, event.clientY - followAnchor.y) > followRadius;
    if (movedBeyondRadius) {
      pointerRevision++;
      reachingFor = 0;
      followAnchor.x = event.clientX;
      followAnchor.y = event.clientY;
      followAnchor.valid = true;
      pendingPointerTarget = true;
    }
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.known = true;
    pointer.inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    // Pointer events update intent only. The next simulation tick consumes it
    // using the existing .16s retarget gate and advances the visual clock once.
    requestTick();
  }, { passive: true });
  document.addEventListener('pointerout',event=>{if(event.pointerType==='mouse'&&!event.relatedTarget)leavePointer();});
  document.documentElement.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse')leavePointer();});
  window.addEventListener('blur',leavePointer);
  window.addEventListener('scroll', () => {
    if (!pointer.present || !pointer.known || !pointerFollowing()) return;
    const rect = world.getBoundingClientRect();
    pointer.inside = pointer.x >= rect.left && pointer.x <= rect.right
      && pointer.y >= rect.top && pointer.y <= rect.bottom;
    if (awake && roaming() && age >= petUntil) {
      followAnchor.x = pointer.x;
      followAnchor.y = pointer.y;
      pointerRevision++;
      pendingPointerTarget = true;
      requestTick();
    }
  }, { passive: true });
  new ResizeObserver(requestMeasure).observe(world);
  window.addEventListener('resize', requestMeasure, { passive: true });
  document.addEventListener('portfolio:language-change', requestMeasure);
  document.fonts.ready.then(requestMeasure);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    world.classList.toggle('is-offscreen', !visible);
    last = 0;
    if (!visible) { cancelAnimationFrame(frame); frame = 0; }
    else requestTick();
  }).observe(world);
  document.addEventListener('visibilitychange', () => {
    last = 0;
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else requestTick();
  });
  [reduced, mouse, compact].forEach(query => query.addEventListener('change', () => {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (reduced.matches && (awake || waking)) { awake = true; waking = false; pose('idle'); }
    requestMeasure();
  }));
  pose('sleep');
  measure();
  window.portfolioCatReady?.then(() => {
    resourcesReady = true;
    measure();
    // Let SVG masks and the first positioned pose paint before revealing all
    // parts together. Keep the complete cat hidden if an asset fails to load.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      cat.dataset.ready = 'true';
      cat.style.visibility = 'visible';
    }));
  }).catch(() => { cat.dataset.ready = 'failed'; });
})();

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
  const gravity = 1500;
  const maxRise = 420;
  const maxSpeed = 1040;
  const clamp = (n, a, b) => Math.max(a, Math.min(n, Math.max(a, b)));
  const body = { x: 0, feet: 0, vx: 0, vy: 0, ground: null, stride: 0 };
  const gaze = { x: 0, y: 0 };
  const pointer = { x: 0, y: 0, known: false, inside: false };
  const followAnchor = { x: 0, y: 0, valid: false };
  const followRadius = 24;
  let platforms = [];
  let bounds, width, height;
  let frame = 0, measureFrame = 0, last = 0, visible = true;
  let resourcesReady = false;
  let awake = false, age = 0, nextDecision = 2.6, nextGroom = 9, groomUntil = 0, landUntil = 0;
  let wakeAge = mouse.matches && !compact.matches ? Infinity : document.readyState === 'complete' ? wakeDelay : Infinity;
  let waking = false, stretchUntil = 0;
  let target = null, jump = null, destination = null, nextPointerDecision = 0;
  let reachingFor = 0;
  let pointerRevision = 0, reachedRevision = -1;
  let pendingPointerTarget = false;
  let petUntil = 0, petPending = false, lastPetClick = -Infinity, stillPetTimer;
  let hoveringCat = false;
  const petParticles = new Set();
  const titleOnly = () => !mouse.matches || compact.matches;
  const pointerFollowing = () => !titleOnly() && !reduced.matches;
  const roaming = () => !reduced.matches;
  const worldInset = () => width / 2;

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
    groomUntil = reachingFor = 0;
    pendingPointerTarget = false;
    petUntil = age + 2.2;
    nextDecision = petUntil + 1.3;
    nextGroom = petUntil + 6;
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

  function draw(dt = 1 / 60) {
    cat.style.transform = `translate3d(${(body.x - width / 2).toFixed(2)}px, ${(body.feet - height * .94).toFixed(2)}px, 0)`;
    const box = world.getBoundingClientRect();
    const dx = pointer.known ? pointer.x - box.left - body.x : 0;
    const dy = pointer.known ? pointer.y - box.top - (body.feet - height * .5) : 0;
    const jumpHeight = jump ? Math.max(jump.vy ** 2 / (2 * gravity), Math.abs(jump.platform.y - jump.source.y)) : 0;
    const jumpLift = jump ? Math.max(0, jump.source.y - body.feet) : 0;
    window.renderPortfolioCat?.({ state: cat.dataset.state, time: age, dt, dx, dy, vx: body.vx, vy: body.vy, jumpHeight, jumpLift, jumpDrop: !!jump?.drop, stride: body.stride, petRemaining: Math.max(0, petUntil - age), still: reduced.matches });
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
      const y = followAnchor.y - rect.top;
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
      target = clamp(x, destination.left + 14, destination.right - 14);
    } else {
      const choices = platforms.filter(p => ['games', 'experiences'].includes(p.id) && (titleOnly() || p.id !== body.ground.id));
      destination = choices[Math.floor(Math.random() * choices.length)];
      target = destination.left + (destination.right - destination.left) * (.25 + Math.random() * .5);
    }
    groomUntil = 0;
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
      stretchUntil = age + 1.2;
      pose('stretch');
    }
    if (waking && age >= stretchUntil) {
      awake = true;
      waking = false;
      landUntil = age + .18;
      nextDecision = age + .3;
      pose('idle');
    }
    if (petPending && body.ground) beginPet();
    if (awake && age < petUntil) {
      pose('belly');
    } else if (awake && hoveringCat && body.ground && pointerFollowing()) {
      // Hold still under the mouse so the click target cannot run away.
      body.vx = 0;
      destination = null;
      nextDecision = age + 1;
      pose('idle');
    } else if (awake && roaming()) {
      if (pointerFollowing() && pendingPointerTarget && pointer.inside && body.ground && age >= nextPointerDecision) {
        chooseTarget(true);
        pendingPointerTarget = false;
        nextPointerDecision = age + .16;
      }
      if (age > nextDecision && body.ground && cat.dataset.state !== 'reach') {
        // A quiet paw wash between trips; pointer movement can interrupt it.
        if (age > nextGroom) {
          groomUntil = age + 2.1;
          nextDecision = age + 2.3;
          nextGroom = age + 15;
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
        const desired = age < landUntil || Math.abs(dx) < 2 ? 0 : Math.sign(dx) * Math.min(titleOnly() ? 110 : 480, Math.abs(dx) * 16);
        body.vx += clamp(desired - body.vx, -3000 * dt, 3000 * dt);
        if (Math.abs(dx) < 2 && Math.abs(body.vx) < 18) body.vx = 0;
        const advance = body.vx * dt;
        body.x += Math.abs(advance) > Math.abs(dx) && Math.sign(advance) === Math.sign(dx) ? dx : advance;
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
          const pointerX = followAnchor.x - rect.left;
          const pointerY = followAnchor.y - rect.top;
          const closest = !step && Math.abs(dx) < 4 && Math.abs(body.vx) < 18;
          const wantsToReach = pointerFollowing() && pointer.known && pointer.inside && closest
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
          else if (age < groomUntil) pose('groom');
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
        }
      }
    } else if (awake) {
      // Reduced-motion preference retains a quiet, stationary pose.
      if (age >= nextGroom) {
        groomUntil = age + 2.1;
        nextGroom = age + 10 + Math.random() * 4;
      }
      pose(age < groomUntil ? 'groom' : 'idle');
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
    if (!resourcesReady || !pointerFollowing() || event.pointerType !== 'mouse') return;
    if (age < petUntil) return;
    if (!awake && !waking && !Number.isFinite(wakeAge)) wakeAge = age + wakeDelay;
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
    const rect = world.getBoundingClientRect();
    pointer.inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (movedBeyondRadius && awake && age > nextPointerDecision && pointer.inside && body.ground) {
      chooseTarget(true);
      pendingPointerTarget = false;
      nextPointerDecision = age + .16;
    }
    draw();
  }, { passive: true });
  window.addEventListener('scroll', () => {
    if (!pointer.known || !pointerFollowing()) return;
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
  window.addEventListener('load', () => {
    if (!mouse.matches || compact.matches) wakeAge = age + wakeDelay;
    requestTick();
  }, { once: true });
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
    if (reduced.matches) { awake = true; pose('idle'); }
    requestMeasure();
  }));
  if (reduced.matches) { awake = true; pose('idle'); }
  measure();
  window.portfolioCatReady?.then(() => {
    resourcesReady = true;
    if (!mouse.matches || compact.matches) wakeAge = age + wakeDelay;
    measure();
    // Let SVG masks and the first positioned pose paint before revealing all
    // parts together. Keep the complete cat hidden if an asset fails to load.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      cat.dataset.ready = 'true';
      cat.style.visibility = 'visible';
    }));
  }).catch(() => { cat.dataset.ready = 'failed'; });
})();

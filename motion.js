(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 650px)');
  const deck = document.querySelector('.learning-grid, .teacher-feature-grid');
  if (!deck) return;
  const cards = [...deck.children];
  const track = document.createElement('div');
  track.className = 'story-track';
  const stage = document.createElement('div');
  stage.className = 'story-stage';
  deck.before(track); track.append(stage); stage.append(deck);
  deck.classList.add('story-deck');
  const controls = document.createElement('div');
  controls.className = 'story-controls';
  controls.innerHTML = '<button type="button">Previous</button><span></span><button type="button">Next</button><i class="story-progress" aria-hidden="true"></i>';
  stage.append(controls);
  const [previous,next] = controls.querySelectorAll('button');
  const counter = controls.querySelector('span');
  let active = -1, step = 0, pinned = false, frame = 0;
  function show(index) {
    if (index === active) return;
    active = index;
    cards.forEach((card,i) => {
      card.classList.toggle('is-active', i === index);
      card.inert = pinned && i !== index;
      if (pinned && i !== index) card.setAttribute('aria-hidden','true');
      else card.removeAttribute('aria-hidden');
    });
    counter.textContent = `${index + 1} / ${cards.length}`;
    previous.disabled = index === 0; next.disabled = index === cards.length - 1;
    track.style.setProperty('--story-progress',`${(index+1)/cards.length*100}%`);
  }
  function update() {
    frame = 0;
    if (!pinned) return;
    const top = parseFloat(track.style.getPropertyValue('--story-top'));
    const traveled = top - track.getBoundingClientRect().top;
    show(Math.max(0,Math.min(cards.length-1,Math.floor(traveled/step+.15))));
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function layout() {
    track.classList.remove('is-pinned'); pinned = false;
    cards.forEach(card => {card.inert=false; card.removeAttribute('aria-hidden');});
    if (!mobile.matches || reduced.matches) return;
    track.classList.add('is-pinned');
    const height = stage.getBoundingClientRect().height;
    const bar = document.querySelector('.topbar');
    const header = ['sticky','fixed'].includes(getComputedStyle(bar).position) ? bar.getBoundingClientRect().height : 0;
    if (height > innerHeight-header-32) { track.classList.remove('is-pinned'); return; }
    pinned = true;
    const top = header + (innerHeight-header-height)/2;
    step = innerHeight*.65;
    track.style.setProperty('--story-top',`${top}px`);
    track.style.setProperty('--story-length',`${height+step*(cards.length-1)+24}px`);
    active=-1; update();
  }
  function go(delta) {
    const target = Math.max(0,Math.min(cards.length-1,active+delta));
    const top = parseFloat(track.style.getPropertyValue('--story-top'));
    window.scrollTo({top:scrollY+track.getBoundingClientRect().top-top+target*step,behavior:'smooth'});
  }
  previous.addEventListener('click',()=>go(-1)); next.addEventListener('click',()=>go(1));
  addEventListener('scroll',schedule,{passive:true});
  // Only width changes recalculate the track; mobile browser chrome must not make it jump.
  let width=innerWidth;
  addEventListener('resize',()=>{if(innerWidth!==width){width=innerWidth;layout();}});
  mobile.addEventListener('change',layout); reduced.addEventListener('change',layout);
  addEventListener('load',layout,{once:true});
  document.fonts.ready.then(layout); layout();
  if (!reduced.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if(entry.isIntersecting){
        if(!mobile.matches) entry.target.classList.add('motion-enter');
        observer.unobserve(entry.target);
      }
    }),{threshold:.12});
    document.querySelectorAll('.section-head,.report-intro,.learning-card,.teacher-feature-grid article,.report-depth > div,.report-depth-grid article,.teacher-ethos,.discovery-card').forEach(el=>observer.observe(el));
  }
})();

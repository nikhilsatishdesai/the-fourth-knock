// THE FOURTH KNOCK — portfolio page behaviour. No dependencies. Everything degrades to plain content without JS.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection && navigator.connection.saveData;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---- nav turns solid once the hero has scrolled away
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('solid', scrollY > innerHeight * .6);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // ---- reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  // ---- loops: load only near the viewport, play only while visible, never with reduced motion
  const setSources = v => {
    if (v.dataset.loaded) return;
    v.dataset.loaded = '1';
    for (const [attr, type] of [['srcWebm', 'video/webm'], ['srcMp4', 'video/mp4']]) {
      if (!v.dataset[attr]) continue;
      const s = document.createElement('source'); s.src = v.dataset[attr]; s.type = type; v.append(s);
    }
    v.load();
  };
  const loops = $$('video.loop');
  const lio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) {
      setSources(v);
      if (!reduce && !v.dataset.userPaused) v.play().catch(() => {});
    } else if (!v.paused) v.pause();
  }), { rootMargin: '200px 0px', threshold: .2 });
  loops.forEach(v => {
    lio.observe(v);
    const btn = v.parentElement.querySelector('.loop-toggle');
    if (!btn) return;
    btn.hidden = false;
    const sync = () => { btn.textContent = v.paused ? '▶' : '❚❚'; btn.setAttribute('aria-label', v.paused ? 'Play the loop' : 'Pause the loop'); };
    if (reduce) sync();
    v.addEventListener('play', sync); v.addEventListener('pause', sync);
    btn.addEventListener('click', () => { setSources(v); if (v.paused) { delete v.dataset.userPaused; v.play().catch(() => {}); } else { v.dataset.userPaused = '1'; v.pause(); } });
  });

  // ---- hero: the painted house comes alive after load (wide screens only; never on reduced motion or save-data)
  const hv = $('.hero-media video');
  if (hv && !reduce && !saveData && matchMedia('(min-width: 900px)').matches) {
    addEventListener('load', () => setTimeout(() => {
      setSources(hv);
      hv.addEventListener('playing', () => hv.classList.add('on'), { once: true });
      hv.play().catch(() => {});
    }, 600));
  } else if (hv) hv.remove();

  // ---- trailer: click to play with sound; the right size for the screen
  const player = $('#player');
  const startTrailer = () => {
    if (player.querySelector('video')) { player.querySelector('video').play(); return; }
    // 1080p where the player is large on screen; 720p on phones and data-saver connections
    const big = !saveData && innerWidth >= 720 && player.clientWidth * (devicePixelRatio || 1) >= 1000;
    const v = document.createElement('video');
    Object.assign(v, { controls: true, playsInline: true, preload: 'auto', src: big ? 'media/video/trailer-1080.mp4' : 'media/video/trailer-720.mp4' });
    v.setAttribute('poster', player.querySelector('img').currentSrc || player.querySelector('img').src);
    v.setAttribute('aria-label', 'The Fourth Knock, official trailer');
    player.append(v);
    player.querySelector('.player-btn').remove();
    v.play().catch(() => {});
    v.focus();
  };
  $('.player-btn', player)?.addEventListener('click', startTrailer);
  $$('[data-trailer-link]').forEach(a => a.addEventListener('click', ev => {
    ev.preventDefault();
    player.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    setTimeout(startTrailer, reduce ? 0 : 500);
  }));

  // ---- audio: only one sound at a time
  let current = null;
  const stopAll = () => { if (current) { current.pause(); current.currentTime = 0; current = null; } $$('.wall-btn').forEach(b => b.setAttribute('aria-pressed', 'false')); marks(-1); };

  // One storm, different walls
  const walls = $$('.wall-btn');
  walls.forEach(b => b.addEventListener('click', () => {
    const was = b.getAttribute('aria-pressed') === 'true';
    stopAll();
    if (was) return;
    const a = new Audio(b.dataset.src); a.loop = true; a.volume = .9;
    a.play().catch(() => {}); current = a; b.setAttribute('aria-pressed', 'true');
  }));

  // The Four Knocks: the marks light with the recording's own onsets
  const OFFSETS = [.15, 1.10, 2.05, 4.30];
  const bars = $$('[data-knocks] .knock-bars i');
  function marks(n) { bars.forEach((b, i) => b.classList.toggle('on', i < n)); }
  const kbtn = $('[data-knock-play]');
  kbtn?.addEventListener('click', () => {
    stopAll();
    const a = new Audio('media/audio/four-knocks.mp3'); current = a; marks(0);
    const tick = () => { if (current !== a) return; const t = a.currentTime; marks(OFFSETS.filter(o => t >= o + .02).length); if (!a.ended) requestAnimationFrame(tick); };
    a.addEventListener('ended', () => { setTimeout(() => { if (current === a) { current = null; } }, 1600); });
    a.play().then(() => requestAnimationFrame(tick)).catch(() => {});
  });
})();

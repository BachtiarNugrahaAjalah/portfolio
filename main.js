// main.js - Skrip Interaktif Portfolio Bachtiar Nugraha
// Fitur: Monochrome Pure Theme Toggle, Calm Grid-Aligned Canvas,
//        Scroll Reveal "Tersusun dari Acak" (Scattered Assembly & Cipher Decode),
//        Protected Hover Scramble (Icon-Preserving), Typewriter, dan Copy Utility.

(function () {
  'use strict';

  const root = document.documentElement;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let isReducedMotion = reducedMotionQuery.matches;
  const motionToggle = document.getElementById('motion-toggle');
  let motionPaused = isReducedMotion;
  let revealObserver = null;
  let dividerObserver = null;
  let revealItems = [];
  let dividerItems = [];
  let typewriterTimer = null;
  let resumeTypewriter = null;

  // Himpunan glif ASCII murni tanpa karakter em-dash (mematuhi R-02 & anti-jitter)
  const GLYPHS = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!<>_[]{}*^?#';

  // ==========================================================================
  // 0. Calm Grid-Aligned Canvas Background (Pure Monochrome)
  //    Partikel bergerak strictly sepanjang garis grid 32x32 dengan kecepatan
  //    tenang dan halus (ambient), tanpa aksen ungu.
  // ==========================================================================
  function createNeonBackground() {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas && canvas.getContext('2d');
    if (!canvas || !ctx) return null;

    const GRID = 32;             // Sesuai dengan ukuran CSS grid 32px
    const PARTICLE_COUNT = 12;
    // Kecepatan tenang dan halus (px per ms): ~0.02 - 0.055
    const SPEED_MIN = 0.1;
    const SPEED_MAX = 0.2;
    const TRAIL_MAX = 90;
    const FPS_CAP = 2000;

    let W = 0;
    let H = 0;
    let frameId = null;
    let lastTime = 0;
    let particles = [];
    let baseColor = '#fafafa';

    function snap(v) {
      return Math.round(v / GRID) * GRID;
    }

    function updateColor() {
      const isDark = root.getAttribute('data-theme') !== 'light';
      baseColor = isDark ? '#fafafa' : '#09090b';
    }

    function makeParticle(isFirst) {
      const cols = Math.floor(W / GRID);
      const rows = Math.floor(H / GRID);
      if (cols < 1 || rows < 1) return null;

      const horizontal = Math.random() < 0.5;
      let gx, gy, dx, dy;

      if (horizontal) {
        gx = isFirst ? Math.floor(Math.random() * cols) : (Math.random() < 0.5 ? 0 : cols);
        gy = Math.floor(Math.random() * (rows + 1));
        dx = gx === 0 ? 1 : -1;
        dy = 0;
      } else {
        gx = Math.floor(Math.random() * (cols + 1));
        gy = isFirst ? Math.floor(Math.random() * rows) : (Math.random() < 0.5 ? 0 : rows);
        dx = 0;
        dy = gy === 0 ? 1 : -1;
      }

      const speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
      const alpha = 0.25 + Math.random() * 0.45;
      const trailLen = (3 + Math.floor(Math.random() * 4)) * GRID;

      return {
        x: gx * GRID,
        y: gy * GRID,
        dx,
        dy,
        speed,
        alpha,
        trailLen,
        trail: []
      };
    }

    function spawnParticles() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = makeParticle(true);
        if (p) particles.push(p);
      }
    }

    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawnParticles();
    }

    function stepParticle(p, dt) {
      const dist = p.speed * dt;
      p.x += p.dx * dist;
      p.y += p.dy * dist;

      const sx = snap(p.x);
      const sy = snap(p.y);
      const last = p.trail[p.trail.length - 1];
      if (!last || last.x !== sx || last.y !== sy) {
        p.trail.push({ x: sx, y: sy });
        while (p.trail.length > Math.ceil(TRAIL_MAX / GRID) + 1) {
          p.trail.shift();
        }
      }

      const margin = GRID * 3;
      if (p.x < -margin || p.x > W + margin || p.y < -margin || p.y > H + margin) {
        const fresh = makeParticle(false);
        if (fresh) {
          Object.assign(p, fresh);
        }
      }
    }

    function drawParticle(p) {
      if (p.trail.length < 2) return;

      for (let i = 1; i < p.trail.length; i++) {
        const t = i / p.trail.length;
        const a = t * p.alpha;

        ctx.beginPath();
        ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
        ctx.lineTo(p.trail[i].x, p.trail[i].y);
        ctx.strokeStyle = baseColor;
        ctx.globalAlpha = a;
        ctx.lineWidth = 1;
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.stroke();
      }

      const hx = snap(p.x);
      const hy = snap(p.y);
      ctx.beginPath();
      ctx.arc(hx, hy, 1.25, 0, Math.PI * 2);
      ctx.fillStyle = baseColor;
      ctx.globalAlpha = p.alpha;
      ctx.shadowColor = baseColor;
      ctx.shadowBlur = 4;
      ctx.fill();
    }

    function render(timestamp) {
      frameId = null;
      if (motionPaused || isReducedMotion || document.hidden) return;

      const delta = timestamp - lastTime;
      if (delta < 1000 / FPS_CAP) {
        frameId = window.requestAnimationFrame(render);
        return;
      }
      const dt = Math.min(delta, 50);
      lastTime = timestamp;

      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      particles.forEach(function (p) {
        stepParticle(p, dt);
        drawParticle(p);
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      frameId = window.requestAnimationFrame(render);
    }

    function start() {
      if (frameId === null && !motionPaused && !isReducedMotion && !document.hidden) {
        lastTime = performance.now();
        frameId = window.requestAnimationFrame(render);
      }
    }

    function pause() {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
      ctx.clearRect(0, 0, W, H);
    }

    resizeCanvas();
    updateColor();

    let resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCanvas, 150);
    }, { passive: true });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause();
      else start();
    });

    return { start, pause, updateColor };
  }

  const neonBackground = createNeonBackground();

  // ==========================================================================
  // Section Content Typewriter Animation on Scroll (Anti-CLS Ghost Technique)
  // Menampilkan animasi mengetik pada isi setiap section saat pertama kali muncul.
  // Menggunakan teknik ghost text (visibleSpan + ghostSpan) agar tinggi wadah dan
  // pembungkusan baris terkunci 100% sejak frame 0 (CLS = 0).
  // ==========================================================================
  const activeTwTimers = [];
  const typewriteItems = [];
  let twObserver = null;

  function stopAllSectionTypewriters() {
    while (activeTwTimers.length > 0) {
      const timer = activeTwTimers.pop();
      clearInterval(timer);
      clearTimeout(timer);
    }
    typewriteItems.forEach(function (el) {
      const fullText = el.getAttribute('data-tw-text') || el.textContent.trim();
      if (fullText) {
        el.textContent = fullText;
        el.dataset.twDone = 'true';
        el.dataset.twRunning = 'false';
      }
    });
  }

  function typewriteElement(el, delay) {
    if (isReducedMotion || motionPaused) {
      const fullText = el.getAttribute('data-tw-text') || el.textContent.trim();
      el.textContent = fullText;
      el.dataset.twDone = 'true';
      return;
    }
    if (el.dataset.twDone === 'true' || el.dataset.twRunning === 'true') return;
    el.dataset.twRunning = 'true';

    const fullText = el.getAttribute('data-tw-text') || el.textContent.trim();
    if (!el.getAttribute('data-tw-text')) {
      el.setAttribute('data-tw-text', fullText);
    }

    let visibleSpan = el.querySelector('.tw-visible');
    let cursorSpan = el.querySelector('.tw-cursor');
    let ghostSpan = el.querySelector('.tw-ghost');

    if (!visibleSpan || !ghostSpan) {
      visibleSpan = document.createElement('span');
      visibleSpan.className = 'tw-visible';

      cursorSpan = document.createElement('span');
      cursorSpan.className = 'tw-cursor';
      cursorSpan.setAttribute('aria-hidden', 'true');
      cursorSpan.textContent = '';

      ghostSpan = document.createElement('span');
      ghostSpan.className = 'tw-ghost';
      ghostSpan.setAttribute('aria-hidden', 'true');
      ghostSpan.textContent = fullText;

      el.replaceChildren(visibleSpan, cursorSpan, ghostSpan);
    }

    function runTyping() {
      if (cursorSpan) {
        cursorSpan.textContent = '_';
      }

      if (motionPaused || isReducedMotion) {
        el.textContent = fullText;
        el.dataset.twDone = 'true';
        el.dataset.twRunning = 'false';
        return;
      }

      let charIndex = 0;
      const totalChars = fullText.length;
      // Langkah karakter dinamis agar irama pengetikan cepat dan nyaman dibaca (~1.2 - 1.8s)
      const step = totalChars > 220 ? 3 : (totalChars > 110 ? 2 : 1);
      const intervalMs = 20;

      const timer = setInterval(function () {
        if (motionPaused || isReducedMotion) {
          clearInterval(timer);
          const tIdx = activeTwTimers.indexOf(timer);
          if (tIdx !== -1) activeTwTimers.splice(tIdx, 1);
          el.textContent = fullText;
          el.dataset.twDone = 'true';
          el.dataset.twRunning = 'false';
          return;
        }

        charIndex += step;
        if (charIndex >= totalChars) {
          clearInterval(timer);
          const tIdx = activeTwTimers.indexOf(timer);
          if (tIdx !== -1) activeTwTimers.splice(tIdx, 1);

          visibleSpan.textContent = fullText;
          ghostSpan.textContent = '';
          el.dataset.twDone = 'true';
          el.dataset.twRunning = 'false';

          setTimeout(function () {
            if (cursorSpan && cursorSpan.parentNode) {
              cursorSpan.classList.add('tw-fade-out');
              setTimeout(function () {
                if (cursorSpan && cursorSpan.parentNode) {
                  cursorSpan.remove();
                }
              }, 400);
            }
          }, 650);
          return;
        }

        visibleSpan.textContent = fullText.slice(0, charIndex);
        ghostSpan.textContent = fullText.slice(charIndex);
      }, intervalMs);

      activeTwTimers.push(timer);
    }

    if (delay && delay > 0) {
      const waitTimer = setTimeout(runTyping, delay);
      activeTwTimers.push(waitTimer);
    } else {
      runTyping();
    }
  }

  function setupTypewriterOnScroll() {
    const rawItems = document.querySelectorAll('.typewrite-on-scroll');
    if (rawItems.length === 0) return;

    typewriteItems.length = 0;
    rawItems.forEach(function (el) {
      typewriteItems.push(el);
      const fullText = el.textContent.trim();
      el.setAttribute('data-tw-text', fullText);
      if (!el.hasAttribute('aria-label')) {
        el.setAttribute('aria-label', fullText);
      }

      if (isReducedMotion || motionPaused) {
        el.dataset.twDone = 'true';
        return;
      }

      const visibleSpan = document.createElement('span');
      visibleSpan.className = 'tw-visible';

      const cursorSpan = document.createElement('span');
      cursorSpan.className = 'tw-cursor';
      cursorSpan.setAttribute('aria-hidden', 'true');
      cursorSpan.textContent = '';

      const ghostSpan = document.createElement('span');
      ghostSpan.className = 'tw-ghost';
      ghostSpan.setAttribute('aria-hidden', 'true');
      ghostSpan.textContent = fullText;

      el.replaceChildren(visibleSpan, cursorSpan, ghostSpan);
    });

    if (isReducedMotion || motionPaused || !('IntersectionObserver' in window)) return;

    twObserver = new IntersectionObserver(
      function (entries) {
        if (!twObserver) return;
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const target = entry.target;
          twObserver.unobserve(target);

          const startDelay = 120;
          typewriteElement(target, startDelay);
        });
      },
      { rootMargin: '0px 0px -4% 0px', threshold: 0.08 }
    );

    typewriteItems.forEach(function (item) {
      const parentProject = item.closest('.project-item');
      if (parentProject && !parentProject.classList.contains('is-expanded')) {
        return;
      }
      twObserver.observe(item);
    });
  }

  // ==========================================================================
  // Motion Pause Toggle Utility
  // ==========================================================================
  function setMotionPaused(paused) {
    motionPaused = paused;
    document.body.classList.toggle('motion-paused', paused);

    if (motionToggle) {
      motionToggle.setAttribute('aria-pressed', String(paused));
      motionToggle.setAttribute('aria-label', paused ? 'Lanjutkan animasi' : 'Jeda animasi');
      motionToggle.title = paused ? 'Lanjutkan animasi latar dan efek bergerak' : 'Jeda animasi latar dan efek bergerak';
    }

    if (paused) {
      if (typewriterTimer !== null) {
        window.clearTimeout(typewriterTimer);
        typewriterTimer = null;
      }
      stopAllSectionTypewriters();
      if (twObserver) {
        twObserver.disconnect();
        twObserver = null;
      }
      if (revealObserver) {
        revealObserver.disconnect();
        revealObserver = null;
        revealItems.forEach(function (item) {
          item.classList.remove('is-pending');
          item.classList.add('is-visible');
          item.style.removeProperty('--reveal-delay');
        });
      }
      if (dividerObserver) {
        dividerObserver.disconnect();
        dividerObserver = null;
        dividerItems.forEach(function (item) {
          item.classList.remove('is-pending');
          item.classList.remove('is-visible');
          item.classList.add('is-settled');
        });
      }
      if (neonBackground) neonBackground.pause();
    } else {
      if (resumeTypewriter) {
        typewriterTimer = window.setTimeout(resumeTypewriter, 0);
      }
      if (neonBackground) neonBackground.start();
    }
  }

  if (motionToggle) {
    motionToggle.addEventListener('click', function () {
      setMotionPaused(!motionPaused);
    });
  }

  // ==========================================================================
  // Cipher Decode Helper for Scroll Reveal ("Tersusun dari Karakter Acak")
  // ==========================================================================
  function decodeTextOnScroll(el) {
    if (isReducedMotion || motionPaused) return;
    if (el.dataset.scrambleDecoded === 'true') return;
    el.dataset.scrambleDecoded = 'true';

    const original = el.getAttribute('data-original-text') || el.textContent.trim();
    if (!el.getAttribute('data-original-text')) {
      el.setAttribute('data-original-text', original);
    }

    let iteration = 0;
    const totalIterations = Math.min(original.length * 1.6, 28);

    const timer = setInterval(function () {
      el.textContent = original
        .split('')
        .map(function (char, index) {
          if (char === ' ' || char === '\n' || char === '&' || char === '/') return char;
          if (index < (iteration / totalIterations) * original.length) {
            return original[index];
          }
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join('');

      iteration++;
      if (iteration >= totalIterations) {
        clearInterval(timer);
        el.textContent = original;
      }
    }, 28);
  }

  // ==========================================================================
  // Scroll Reveal: Konten Tersusun dari Keadaan Acak (Scattered Assembly)
  // Setiap elemen menunggu di posisi acak (offset x, y, rotasi, blur, dan skala)
  // lalu saat di-scroll menyatu secara mulus ke posisi aslinya.
  // ==========================================================================
  function setupScrollReveal() {
    if (isReducedMotion || !('IntersectionObserver' in window)) return;

    const selectors = [
      '.content-section > *',
      '.project-item',
      '.resume-item',
      '.tech-group-item',
      '.hud-frame'
    ];

    const seen = new Set();
    revealItems = [];
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (!seen.has(el)) {
          seen.add(el);
          revealItems.push(el);
        }
      });
    });

    // Vektor acak terarah agar elemen tersusun dari arah dan sudut yang beragam
    const xOffsets = [-32, 28, -22, 34, -18, 26, -30, 20];
    const yOffsets = [30, 44, 34, 48, 28, 40, 46, 32];
    const rotOffsets = [-2.2, 1.8, -1.4, 2.4, -1.8, 1.5, -2.5, 1.2];
    const blurOffsets = [4, 6, 5, 7, 4, 6, 5, 7];
    const scaleOffsets = [0.94, 0.96, 0.95, 0.97, 0.94, 0.96, 0.95, 0.97];

    revealItems.forEach(function (item, index) {
      const rx = xOffsets[index % xOffsets.length];
      const ry = yOffsets[index % yOffsets.length];
      const rRot = rotOffsets[index % rotOffsets.length];
      const rBlur = blurOffsets[index % blurOffsets.length];
      const rScale = scaleOffsets[index % scaleOffsets.length];

      item.style.setProperty('--rnd-x', rx + 'px');
      item.style.setProperty('--rnd-y', ry + 'px');
      item.style.setProperty('--rnd-rot', rRot + 'deg');
      item.style.setProperty('--rnd-blur', rBlur + 'px');
      item.style.setProperty('--rnd-scale', rScale);

      item.classList.add('reveal-on-scroll', 'is-pending');
    });

    revealObserver = new IntersectionObserver(
      function (entries) {
        if (!revealObserver) return;
        entries.filter(function (e) { return e.isIntersecting; })
          .forEach(function (entry, index) {
            const target = entry.target;
            target.style.setProperty('--reveal-delay', Math.min(index, 4) * 80 + 'ms');
            target.classList.remove('is-pending');
            target.classList.add('is-visible');

            // Jika elemen merupakan label atau heading, jalankan efek penyusunan karakter dari acak
            if (target.classList.contains('section-label') || target.classList.contains('section-heading') || target.classList.contains('stream-column-heading') || target.classList.contains('tech-group-title')) {
              decodeTextOnScroll(target);
            } else {
              // Jika memiliki anak label/heading di dalamnya, jalankan juga
              const childHeading = target.querySelector('.section-label, .section-heading, .stream-column-heading, .tech-group-title');
              if (childHeading) decodeTextOnScroll(childHeading);
            }

            revealObserver.unobserve(target);
          });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 }
    );

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  }

  function setupDividerReveal() {
    if (isReducedMotion || !('IntersectionObserver' in window)) return;

    dividerItems = Array.from(document.querySelectorAll('.neon-divider'));
    dividerItems.forEach(function (item) {
      item.classList.add('is-pending');
    });

    dividerObserver = new IntersectionObserver(
      function (entries) {
        if (!dividerObserver) return;
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove('is-pending');
          entry.target.classList.add('is-visible');
          dividerObserver.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    dividerItems.forEach(function (item) {
      dividerObserver.observe(item);
    });
  }

  setupScrollReveal();
  setupDividerReveal();
  setupTypewriterOnScroll();
  setMotionPaused(motionPaused);

  function handleReducedMotionChange(event) {
    isReducedMotion = event.matches;
    if (event.matches) setMotionPaused(true);
  }

  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
  } else {
    reducedMotionQuery.addListener(handleReducedMotionChange);
  }

  // ==========================================================================
  // 1. Theme Management (Monochrome Dark / Light Mode)
  // ==========================================================================
  const themeToggle = document.getElementById('theme-toggle');
  const themeIconSun = document.getElementById('theme-icon-sun');
  const themeIconMoon = document.getElementById('theme-icon-moon');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  function getPreferredTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      if (themeColorMeta) themeColorMeta.setAttribute('content', '#ffffff');
      if (themeToggle) themeToggle.setAttribute('aria-label', 'Beralih ke mode gelap');
      if (themeIconSun && themeIconMoon) {
        themeIconSun.style.display = 'none';
        themeIconMoon.style.display = 'block';
      }
    } else {
      root.removeAttribute('data-theme');
      if (themeColorMeta) themeColorMeta.setAttribute('content', '#09090b');
      if (themeToggle) themeToggle.setAttribute('aria-label', 'Beralih ke mode terang');
      if (themeIconSun && themeIconMoon) {
        themeIconSun.style.display = 'block';
        themeIconMoon.style.display = 'none';
      }
    }
    if (neonBackground) neonBackground.updateColor();
  }

  const currentTheme = getPreferredTheme();
  applyTheme(currentTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const active = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const target = active === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', target);
      applyTheme(target);
    });
  }

  // ==========================================================================
  // 2. Layout-Safe Random Letters Scramble Animation on Hover
  //    DIPERBAIKI: Menjaga elemen SVG agar tidak pernah hilang atau tertimpa
  //    oleh textContent saat tombol di-hover.
  // ==========================================================================
  function scrambleElement(el) {
    if (isReducedMotion || motionPaused) return;

    // Proteksi: Jika elemen yang dikirim adalah tombol atau link yang membungkus SVG,
    // arahkan secara spesifik ke elemen teks (.pill-label atau .brand-name)
    let target = el;
    if (el.querySelector('svg')) {
      const innerLabel = el.querySelector('.pill-label') || el.querySelector('.scramble-hover');
      if (innerLabel) {
        target = innerLabel;
      } else {
        return; // Jangan pernah mengubah elemen yang memiliki SVG tanpa pembungkus teks
      }
    }

    if (target.dataset.scrambling === 'true') return;

    const originalText = target.getAttribute('data-original-text') || target.textContent.trim();
    if (!target.getAttribute('data-original-text')) {
      target.setAttribute('data-original-text', originalText);
    }

    const rect = target.getBoundingClientRect();
    const originalInlineDisplay = target.style.display;
    const computedDisplay = window.getComputedStyle(target).display;

    if (computedDisplay === 'inline') target.style.display = 'inline-block';
    target.style.width = Math.ceil(rect.width) + 'px';
    target.style.textAlign = 'center';
    target.dataset.scrambling = 'true';

    let iteration = 0;
    const totalIterations = originalText.length * 2.2;

    const interval = setInterval(function () {
      target.textContent = originalText
        .split('')
        .map(function (char, index) {
          if (char === ' ' || char === '\n') return char;
          if (index < iteration / 2.2) return originalText[index];
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join('');

      iteration += 1;

      if (iteration >= totalIterations) {
        clearInterval(interval);
        target.textContent = originalText;
        target.dataset.scrambling = 'false';
        target.style.width = '';
        target.style.textAlign = '';
        target.style.display = originalInlineDisplay;
      }
    }, 28);
  }

  // Pasang listener pada semua elemen berkelas .scramble-hover
  document.querySelectorAll('.scramble-hover').forEach(function (item) {
    item.addEventListener('mouseenter', function () {
      scrambleElement(item);
    });
  });

  // Pasang listener juga pada parent .contact-pill agar hover di area icon atau padding
  // tetap memicu scramble teks dengan aman tanpa merusak SVG
  document.querySelectorAll('.contact-pill').forEach(function (pill) {
    pill.addEventListener('mouseenter', function () {
      const label = pill.querySelector('.pill-label') || pill.querySelector('.scramble-hover');
      if (label) {
        scrambleElement(label);
      }
    });
  });

  // ==========================================================================
  // 3. Typewriter Animation for Hero Subtitle
  // ==========================================================================
  const typewriterElement = document.getElementById('typewriter-text');
  if (typewriterElement && !isReducedMotion) {
    const roles = [
      'Mahasiswa S1 Ilmu Komputer',
      'Software Developer',
      'Problem Solver & Algoritma',
      'AI & Machine Learning Enthusiast'
    ];
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typingSpeed = 85;
    const deletingSpeed = 40;
    const holdDelay = 1800;

    function typeStep() {
      if (motionPaused) return;
      const currentRole = roles[roleIndex];

      if (isDeleting) {
        charIndex--;
        typewriterElement.textContent = currentRole.substring(0, charIndex);
      } else {
        charIndex++;
        typewriterElement.textContent = currentRole.substring(0, charIndex);
      }

      let timeout = isDeleting ? deletingSpeed : typingSpeed;
      if (!isDeleting && charIndex === currentRole.length) {
        timeout = holdDelay;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        timeout = 350;
      }

      typewriterTimer = window.setTimeout(typeStep, timeout);
    }

    resumeTypewriter = typeStep;
    typewriterTimer = window.setTimeout(typeStep, 500);
  } else if (typewriterElement) {
    typewriterElement.textContent = 'Mahasiswa S1 Ilmu Komputer · Software Developer';
  }

  // ==========================================================================
  // 4. Mobile Navigation Menu Toggle
  // ==========================================================================
  const menuToggle = document.getElementById('menu-toggle');
  const siteNav = document.getElementById('site-nav');

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', function () {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', !isExpanded);
      siteNav.classList.toggle('nav-open', !isExpanded);
      document.body.classList.toggle('menu-active', !isExpanded);
    });

    siteNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (siteNav.classList.contains('nav-open')) {
          menuToggle.setAttribute('aria-expanded', 'false');
          siteNav.classList.remove('nav-open');
          document.body.classList.remove('menu-active');
        }
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && siteNav.classList.contains('nav-open')) {
        menuToggle.setAttribute('aria-expanded', 'false');
        siteNav.classList.remove('nav-open');
        document.body.classList.remove('menu-active');
        menuToggle.focus();
      }
    });
  }

  // ==========================================================================
  // 5. Copy to Clipboard with Text Feedback (Icon Preserving)
  // ==========================================================================
  function setupCopyButton(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    btn.addEventListener('click', function () {
      const textToCopy = btn.getAttribute('data-copy') || 'bachtiar.nugraha.245@gmail.com';

      navigator.clipboard.writeText(textToCopy).then(
        function () { showFeedback(btn, 'Tersalin!'); },
        function () {
          const ta = document.createElement('textarea');
          ta.value = textToCopy;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand('copy');
            showFeedback(btn, 'Tersalin!');
          } catch (_) {
            showFeedback(btn, 'Gagal');
          }
          document.body.removeChild(ta);
        }
      );
    });
  }

  function showFeedback(btn, message) {
    const labelEl = btn.querySelector('.pill-label') || btn;
    const original = labelEl.getAttribute('data-original-text') || labelEl.textContent.trim();
    if (!labelEl.getAttribute('data-original-text')) {
      labelEl.setAttribute('data-original-text', original);
    }

    labelEl.textContent = message;
    btn.classList.add('copy-success');

    setTimeout(function () {
      labelEl.textContent = original;
      btn.classList.remove('copy-success');
    }, 2200);
  }

  setupCopyButton('copy-email-hero');
  setupCopyButton('copy-email-contact');

  // ==========================================================================
  // 6. Active Navigation Indicator via IntersectionObserver
  // ==========================================================================
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-link');
  const telemetryNodes = document.querySelectorAll('.telemetry-node');

  if ('IntersectionObserver' in window && sections.length > 0) {
    const navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navItems.forEach(function (item) {
              const href = item.getAttribute('href');
              if (href === '#' + id) {
                item.classList.add('active');
                item.setAttribute('aria-current', 'page');
              } else {
                item.classList.remove('active');
                item.removeAttribute('aria-current');
              }
            });
            telemetryNodes.forEach(function (node) {
              const href = node.getAttribute('href');
              if (href === '#' + id) {
                node.classList.add('active');
              } else {
                node.classList.remove('active');
              }
            });
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );
    sections.forEach(function (sec) { navObserver.observe(sec); });
  }

  // ==========================================================================
  // 7. Futuristic HUD Scroll Telemetry (Replaces Traditional Scrollbar)
  // ==========================================================================
  const telemetryRail = document.getElementById('telemetry-rail');
  const telemetryReticle = document.getElementById('telemetry-reticle');
  const telemetryReadout = document.getElementById('telemetry-readout-val');

  function updateScrollTelemetry() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(Math.max(scrollY / maxScroll, 0), 1) : 0;

    if (telemetryReticle && telemetryRail) {
      const railHeight = telemetryRail.clientHeight;
      const topPx = progress * railHeight;
      telemetryReticle.style.top = topPx + 'px';
    }

    if (telemetryReadout) {
      const pct = Math.round(progress * 100);
      telemetryReadout.textContent = (pct < 10 ? '00' : pct < 100 ? '0' : '') + pct + '%';
    }
  }

  let telemetryTicking = false;
  function requestTelemetryUpdate() {
    if (!telemetryTicking) {
      window.requestAnimationFrame(function () {
        updateScrollTelemetry();
        telemetryTicking = false;
      });
      telemetryTicking = true;
    }
  }

  window.addEventListener('scroll', requestTelemetryUpdate, { passive: true });
  window.addEventListener('resize', requestTelemetryUpdate, { passive: true });
  updateScrollTelemetry();

  // Memungkinkan klik pada rail telemetry untuk lompat mulus ke posisi scroll
  if (telemetryRail) {
    telemetryRail.addEventListener('click', function (e) {
      if (e.target.closest('.telemetry-node')) return;
      const rect = telemetryRail.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const ratio = Math.min(Math.max(clickY / rect.height, 0), 1);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({
        top: ratio * maxScroll,
        behavior: 'smooth'
      });
    });
  }

  // ==========================================================================
  // 8. Photo Card Hover Greeting Message Controller
  // ==========================================================================
  const greetingTextEl = document.getElementById('hud-greeting-text');
  const hudFrame = document.querySelector('.hud-frame');

  function updateGreetingMessage() {
    if (!greetingTextEl) return;
    const hour = new Date().getHours();
    let timeGreeting = 'Selamat datang';
    if (hour >= 4 && hour < 11) {
      timeGreeting = 'Selamat pagi';
    } else if (hour >= 11 && hour < 15) {
      timeGreeting = 'Selamat siang';
    } else if (hour >= 15 && hour < 18) {
      timeGreeting = 'Selamat sore';
    } else {
      timeGreeting = 'Selamat malam';
    }

    greetingTextEl.textContent = `Halo, ${timeGreeting.toLowerCase()}! Senang Anda mampir ke portfolio saya. Semoga harimu menyenangkan dan mari terhubung untuk berkolaborasi.`;
  }

  updateGreetingMessage();

  // Dukungan sentuhan untuk perangkat mobile/layar sentuh
  if (hudFrame) {
    hudFrame.addEventListener('click', function (e) {
      if (e.target.closest('a') || e.target.closest('button')) return;
      hudFrame.classList.toggle('greeting-active');
    });
  }

  // ==========================================================================
  // 9. Project Accordion / Details Toggle Controller
  //    Default menampilkan detail proyek paling atas, menyembunyikan detail
  //    proyek lainnya dengan tombol toggle interaktif.
  // ==========================================================================
  function setupProjectToggles() {
    const projectItems = document.querySelectorAll('.project-item');

    projectItems.forEach(function (item) {
      const toggleBtn = item.querySelector('.project-detail-toggle');
      const header = item.querySelector('.project-item-header');

      // Hindari pasang ganda jika dipanggil ulang
      if (item.dataset.toggleBound === 'true') return;
      item.dataset.toggleBound = 'true';

      function toggleDetails(expanded) {
        const isNowExpanded = typeof expanded === 'boolean' ? expanded : !item.classList.contains('is-expanded');
        item.classList.toggle('is-expanded', isNowExpanded);

        if (isNowExpanded) {
          const descEl = item.querySelector('.typewrite-on-scroll');
          if (descEl && descEl.dataset.twDone !== 'true') {
            typewriteElement(descEl, 80);
          }
        }

        if (toggleBtn) {
          toggleBtn.setAttribute('aria-expanded', String(isNowExpanded));
          const titleLink = item.querySelector('.project-item-title a');
          const title = titleLink ? titleLink.textContent.trim().replace(/\s*→\s*$/, '') : 'proyek';
          toggleBtn.setAttribute(
            'aria-label',
            (isNowExpanded ? 'Sembunyikan' : 'Tampilkan') + ' detail ' + title
          );
        }
      }

      if (toggleBtn) {
        toggleBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          toggleDetails();
        });
      }

      if (header) {
        header.addEventListener('click', function (e) {
          if (e.target.closest('a') || e.target.closest('button')) return;
          toggleDetails();
        });
      }
    });
  }

  // ==========================================================================
  // 9b. Projects Data Loader: Memuat Repositori Pinned dari data/projects.json
  //     Menghasilkan kartu proyek dinamis, tombol toggle SVG, dan integrasi GitHub telemetry.
  // ==========================================================================
  function setupProjectsLoader() {
    const projectList = document.getElementById('project-list');
    if (!projectList) return;

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function buildProjectCard(item, index) {
      const isExpanded = index === 0;
      const cardNum = index + 1;
      const tagsHtml = Array.isArray(item.tags)
        ? item.tags.map(function (t) {
            return '<span class="meta-pill">' + escapeHtml(t) + '</span>';
          }).join('')
        : '';

      const stars = typeof item.stars === 'number' ? item.stars : 0;
      const forks = typeof item.forks === 'number' ? item.forks : 0;
      const forkDisplay = forks > 0 ? 'inline-flex' : 'none';

      return (
        '<article class="project-item' + (isExpanded ? ' is-expanded' : '') + '" id="' + escapeHtml(item.id || 'project-card-' + cardNum) + '">' +
          '<div class="project-item-header">' +
            '<div class="project-title-meta">' +
              '<span class="project-item-title">' +
                '<a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer">' +
                  escapeHtml(item.judul) + ' &rarr;' +
                '</a>' +
              '</span>' +
              '<div class="project-badges-group">' +
                '<span class="project-badge-tag">' + escapeHtml(item.kategori) + '</span>' +
                '<a ' +
                  'href="' + escapeHtml(item.url) + '/stargazers" ' +
                  'target="_blank" ' +
                  'rel="noopener noreferrer" ' +
                  'class="project-github-pill" ' +
                  'data-repo="' + escapeHtml(item.repo) + '" ' +
                  'aria-label="' + stars + ' bintang di GitHub" ' +
                  'title="Bintang GitHub: ' + escapeHtml(item.repo) + '"' +
                '>' +
                  '<span class="gh-pill-item gh-pill-star">' +
                    '<svg class="gh-icon star-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                      '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>' +
                    '</svg>' +
                    '<span class="gh-count star-count">' + stars + '</span>' +
                  '</span>' +
                  '<span class="gh-pill-item gh-pill-fork" style="display: ' + forkDisplay + ';">' +
                    '<svg class="gh-icon fork-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                      '<line x1="6" y1="3" x2="6" y2="15"></line>' +
                      '<circle cx="18" cy="6" r="3"></circle>' +
                      '<circle cx="6" cy="18" r="3"></circle>' +
                      '<path d="M18 9a9 9 0 0 1-9 9"></path>' +
                    '</svg>' +
                    '<span class="gh-count fork-count">' + forks + '</span>' +
                  '</span>' +
                '</a>' +
              '</div>' +
            '</div>' +
            '<button ' +
              'type="button" ' +
              'id="toggle-project-' + cardNum + '" ' +
              'class="project-detail-toggle" ' +
              'aria-expanded="' + isExpanded + '" ' +
              'aria-controls="project-detail-' + cardNum + '" ' +
              'aria-label="' + (isExpanded ? 'Sembunyikan' : 'Tampilkan') + ' detail proyek ' + escapeHtml(item.judul) + '"' +
            '>' +
              '<svg class="toggle-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<polyline points="6 9 12 15 18 9"></polyline>' +
              '</svg>' +
            '</button>' +
          '</div>' +
          '<div class="project-item-details" id="project-detail-' + cardNum + '">' +
            '<div class="project-item-details-inner">' +
              '<p class="project-item-desc typewrite-on-scroll">' +
                escapeHtml(item.deskripsi) +
              '</p>' +
              '<div class="project-item-meta">' +
                tagsHtml +
              '</div>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }

    fetch('data/projects.json')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!Array.isArray(data.proyek) || data.proyek.length === 0) return;
        projectList.innerHTML = data.proyek.map(buildProjectCard).join('');

        // Pasang listener accordion pada kartu yang baru di-render
        setupProjectToggles();

        // Daftarkan elemen typewriter baru ke observer
        if (typeof setupTypewriterOnScroll === 'function') {
          setupTypewriterOnScroll();
        }

        // Sinkronkan bintang live dengan GitHub API
        if (typeof setupGitHubStarsSync === 'function') {
          setupGitHubStarsSync();
        }
      })
      .catch(function (err) {
        console.warn('[projects-loader] Gagal memuat data/projects.json:', err.message);
      });
  }

  setupProjectsLoader();

  // ==========================================================================
  // 10. Floating CV Download Placeholder Controller
  // TODO: Ketika file fisik CV (PDF) sudah selesai disusun, hubungkan tombol
  //       ini langsung ke berkas PDF (misal: "dokumen/cv-bachtiar-nugraha.pdf")
  //       atau jadikan tag <a> dengan atribut download="CV-Bachtiar-Nugraha.pdf".
  // ==========================================================================
  function setupFloatingCV() {
    const cvBtn = document.getElementById('floating-cv-btn');
    const toast = document.getElementById('floating-cv-toast');
    const statusEl = document.getElementById('cv-btn-status');
    if (!cvBtn || !toast) return;

    let toastTimer = null;

    cvBtn.addEventListener('click', function () {
      if (toastTimer) {
        clearTimeout(toastTimer);
      }

      // Berikan respons visual interaktif pada status badge tombol
      if (statusEl) {
        statusEl.textContent = '[ PROSES KURASI ]';
      }

      toast.classList.add('is-active');
      cvBtn.setAttribute('aria-expanded', 'true');

      toastTimer = setTimeout(function () {
        toast.classList.remove('is-active');
        cvBtn.setAttribute('aria-expanded', 'false');
        if (statusEl) {
          statusEl.textContent = '[ SEGERA ]';
        }
        toastTimer = null;
      }, 3400);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toast.classList.contains('is-active')) {
        toast.classList.remove('is-active');
        cvBtn.setAttribute('aria-expanded', 'false');
        if (statusEl) {
          statusEl.textContent = '[ SEGERA ]';
        }
        if (toastTimer) {
          clearTimeout(toastTimer);
          toastTimer = null;
        }
      }
    });
  }

  setupFloatingCV();

  // ==========================================================================
  // 11. GitHub Repository Telemetry & Stars Sync
  // Mengintegrasikan data bintang (stars) dan repositori langsung dari GitHub API
  // secara real-time dengan caching sessionStorage (15 menit) untuk efisiensi kuota.
  // ==========================================================================
  function setupGitHubStarsSync() {
    const GITHUB_USERNAME = 'BachtiarNugrahaAjalah';
    const CACHE_KEY = 'gh_repos_cache_' + GITHUB_USERNAME;
    const CACHE_TTL = 15 * 60 * 1000; // 15 menit
    const syncLabel = document.getElementById('github-sync-label');

    function applyRepoData(repoMap, totalRepos, totalStars) {
      document.querySelectorAll('.project-github-pill[data-repo]').forEach(function (pill) {
        const fullRepo = pill.getAttribute('data-repo') || '';
        const repoName = fullRepo.split('/')[1] || fullRepo;
        const normalized = repoName.toLowerCase();

        const data = repoMap[normalized];
        if (data) {
          const starCountEl = pill.querySelector('.star-count');
          if (starCountEl) {
            starCountEl.textContent = String(data.stars);
          }
          pill.setAttribute('aria-label', `${data.stars} bintang di GitHub`);

          const forkPill = pill.querySelector('.gh-pill-fork');
          const forkCountEl = pill.querySelector('.fork-count');
          if (forkPill && forkCountEl) {
            forkCountEl.textContent = String(data.forks);
            forkPill.style.display = data.forks > 0 ? 'inline-flex' : 'none';
          }
        }
      });

      if (syncLabel) {
        syncLabel.textContent = `GITHUB // PINNED REPOS · 4 REPOSITORI · ${totalStars} BINTANG`;
      }
    }

    function fetchFromGitHub() {
      const url = `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`;
      fetch(url)
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (repos) {
          if (!Array.isArray(repos)) return;
          const repoMap = {};
          let totalStars = 0;

          repos.forEach(function (r) {
            const stars = typeof r.stargazers_count === 'number' ? r.stargazers_count : 0;
            const forks = typeof r.forks_count === 'number' ? r.forks_count : 0;
            totalStars += stars;
            repoMap[r.name.toLowerCase()] = {
              stars: stars,
              forks: forks,
              url: r.html_url
            };
          });

          const cachePayload = {
            timestamp: Date.now(),
            totalRepos: repos.length,
            totalStars: totalStars,
            repoMap: repoMap
          };

          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
          } catch (_) {
            // Abaikan jika storage privat penuh
          }

          applyRepoData(repoMap, repos.length, totalStars);
        })
        .catch(function (_) {
          if (syncLabel) {
            syncLabel.textContent = 'GITHUB // REPOSITORI TERVERIFIKASI';
          }
        });
    }

    // Cek cache terlebih dahulu
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL && parsed.repoMap) {
          applyRepoData(parsed.repoMap, parsed.totalRepos || 4, parsed.totalStars || 0);
          return;
        }
      }
    } catch (_) {
      // Abaikan error parsing cache
    }

    // Jika cache kosong atau usang, lakukan fetch
    fetchFromGitHub();
  }

  setupGitHubStarsSync();

  // ==========================================================================
  // 12. Resume Data Loader: Pengalaman & Pendidikan dari data/resume.json
  // Memisahkan data konten dari markup tampilan agar mudah diperbarui.
  // ==========================================================================
  function setupResumeLoader() {
    const expList = document.getElementById('resume-experience-list');
    const eduList = document.getElementById('resume-education-list');
    if (!expList && !eduList) return;

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function buildExperienceItem(item) {
      return (
        '<article class="resume-item" id="' + escapeHtml(item.id) + '">' +
          '<div class="resume-header">' +
            '<h4 class="resume-role">' + escapeHtml(item.jabatan) + '</h4>' +
            '<span class="resume-period">' + escapeHtml(item.periode) + '</span>' +
          '</div>' +
          '<p class="resume-place">' + escapeHtml(item.tempat) + '</p>' +
          '<p class="resume-desc typewrite-on-scroll">' + escapeHtml(item.deskripsi) + '</p>' +
        '</article>'
      );
    }

    function buildEducationItem(item) {
      var gpaTag = item.prestasi
        ? '<div class="education-gpa-tag"><span>' + escapeHtml(item.prestasi) + '</span></div>'
        : '';
      return (
        '<article class="resume-item" id="' + escapeHtml(item.id) + '">' +
          '<div class="resume-header">' +
            '<h4 class="resume-role">' + escapeHtml(item.jenjang) + '</h4>' +
            '<span class="resume-period">' + escapeHtml(item.periode) + '</span>' +
          '</div>' +
          '<p class="resume-place">' + escapeHtml(item.tempat) + '</p>' +
          '<p class="resume-desc typewrite-on-scroll">' + escapeHtml(item.deskripsi) + '</p>' +
          gpaTag +
        '</article>'
      );
    }

    function renderResume(data) {
      if (expList && Array.isArray(data.pengalaman)) {
        expList.innerHTML = data.pengalaman.map(buildExperienceItem).join('');
      }
      if (eduList && Array.isArray(data.pendidikan)) {
        eduList.innerHTML = data.pendidikan.map(buildEducationItem).join('');
      }
      // Daftarkan elemen typewriter baru ke observer
      if (typeof setupTypewriterOnScroll === 'function') {
        setupTypewriterOnScroll();
      } else {
        // Fallback: trigger observer re-scan pada elemen baru
        document.querySelectorAll('.typewrite-on-scroll').forEach(function (el) {
          if (!el.dataset.twInit) {
            if (typeof typewriteObserver !== 'undefined' && typewriteObserver) {
              typewriteObserver.observe(el);
            }
          }
        });
      }
    }

    fetch('data/resume.json')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(renderResume)
      .catch(function (err) {
        // Gagal memuat JSON: biarkan kontainer kosong, tidak crash
        console.warn('[resume-loader] Gagal memuat data/resume.json:', err.message);
      });
  }

  setupResumeLoader();

  // ==========================================================================
  // 13. Gallery Data Loader: Memuat Karya Desain Grafis dari data/gallery.json
  // Menampilkan aset format WebP dan hyperlink opsional platform (Figma, dsb.)
  // ==========================================================================
  function setupGalleryLoader() {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) return;

    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxBadge = document.getElementById('lightbox-badge');
    const lightboxDesc = document.getElementById('lightbox-desc');
    const lightboxActions = document.getElementById('lightbox-actions');
    const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
    const lightboxBackdrop = document.getElementById('lightbox-backdrop');

    let lastFocusedElement = null;

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function getPlatformIcon(platform) {
      const p = (platform || '').toLowerCase();
      if (p.includes('figma')) {
        return (
          '<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">' +
            '<path d="M8 24c2.2 0 4-1.8 4-4v-4H8c-2.2 0-4 1.8-4 4s1.8 4 4 4z"/>' +
            '<path d="M4 12c0-2.2 1.8-4 4-4h4v8H8c-2.2 0-4-1.8-4-4z"/>' +
            '<path d="M4 4c0-2.2 1.8-4 4-4h4v8H8c-2.2 0-4-1.8-4-4z"/>' +
            '<path d="M12 0h4c2.2 0 4 1.8 4 4s-1.8 4-4 4h-4V0z"/>' +
            '<path d="M20 12c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4 4 1.8 4 4z"/>' +
          '</svg>'
        );
      }
      return (
        '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>' +
          '<polyline points="15 3 21 3 21 9"></polyline>' +
          '<line x1="10" y1="14" x2="21" y2="3"></line>' +
        '</svg>'
      );
    }

    function openLightbox(item) {
      if (!lightbox) return;
      lastFocusedElement = document.activeElement;

      const webpPath = 'assets/gallery/webp/' + escapeHtml(item.file);
      if (lightboxImg) {
        lightboxImg.src = webpPath;
        lightboxImg.alt = 'Pratinjau karya ' + escapeHtml(item.judul);
      }
      if (lightboxTitle) lightboxTitle.textContent = item.judul || '';
      if (lightboxBadge) {
        lightboxBadge.textContent = '// ' + (item.kategori || 'DESAIN GRAFIS').toUpperCase();
      }
      if (lightboxDesc) lightboxDesc.textContent = item.deskripsi || '';

      if (lightboxActions) {
        if (item.platform_url) {
          const platformName = item.platform || 'Platform Desain';
          lightboxActions.innerHTML =
            '<a href="' + escapeHtml(item.platform_url) + '" target="_blank" rel="noopener noreferrer" class="gallery-platform-link" aria-label="Buka ' + escapeHtml(item.judul) + ' di ' + escapeHtml(platformName) + '">' +
              getPlatformIcon(item.platform) +
              '<span>Buka di ' + escapeHtml(platformName) + ' &rarr;</span>' +
            '</a>';
        } else {
          lightboxActions.innerHTML = '<span class="gallery-internal-badge">ARSIP DESAIN INTERNAL</span>';
        }
      }

      lightbox.removeAttribute('hidden');
      document.body.style.overflow = 'hidden';
      if (lightboxCloseBtn) lightboxCloseBtn.focus();
    }

    function closeLightbox() {
      if (!lightbox || lightbox.hasAttribute('hidden')) return;
      lightbox.setAttribute('hidden', '');
      document.body.style.overflow = '';
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    }

    if (lightboxCloseBtn) {
      lightboxCloseBtn.addEventListener('click', closeLightbox);
    }
    if (lightboxBackdrop) {
      lightboxBackdrop.addEventListener('click', closeLightbox);
    }

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox && !lightbox.hasAttribute('hidden')) {
        closeLightbox();
      }
    });

    function buildGalleryCard(item) {
      const webpPath = 'assets/gallery/webp/' + escapeHtml(item.file);
      const tagsHtml = Array.isArray(item.tags)
        ? item.tags.map(function (t) {
            return '<span class="meta-pill">' + escapeHtml(t) + '</span>';
          }).join('')
        : '';

      let linkHtml = '';
      if (item.platform_url) {
        const platformName = item.platform || 'Platform Desain';
        linkHtml =
          '<a href="' + escapeHtml(item.platform_url) + '" target="_blank" rel="noopener noreferrer" class="gallery-platform-link" aria-label="Buka desain ' + escapeHtml(item.judul) + ' di ' + escapeHtml(platformName) + '">' +
            getPlatformIcon(item.platform) +
            '<span>Lihat di ' + escapeHtml(platformName) + ' &rarr;</span>' +
          '</a>';
      } else {
        linkHtml = '<span class="gallery-internal-badge">DESAIN ASLI</span>';
      }

      return (
        '<article class="gallery-card" id="' + escapeHtml(item.id) + '">' +
          '<div class="gallery-media-wrap">' +
            '<picture>' +
              '<source srcset="' + webpPath + '" type="image/webp">' +
              '<img src="' + webpPath + '" alt="' + escapeHtml(item.judul) + '" class="gallery-img" loading="lazy" width="800" height="500">' +
            '</picture>' +
            '<button type="button" id="zoom-btn-' + escapeHtml(item.id) + '" class="gallery-zoom-trigger" aria-label="Perbesar gambar ' + escapeHtml(item.judul) + '">' +
              '<span class="gallery-zoom-hint">' +
                '<svg aria-hidden="true" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                  '<circle cx="11" cy="11" r="8"></circle>' +
                  '<line x1="21" y1="21" x2="16.65" y2="16.65"></line>' +
                  '<line x1="11" y1="8" x2="11" y2="14"></line>' +
                  '<line x1="8" y1="11" x2="14" y2="11"></line>' +
                '</svg>' +
                'PERBESAR WEBP' +
              '</span>' +
            '</button>' +
          '</div>' +
          '<div class="gallery-body">' +
            '<div class="gallery-meta-row">' +
              '<span class="gallery-cat-badge">' + escapeHtml(item.kategori || 'Desain Grafis') + '</span>' +
              '<span class="gallery-year">' + escapeHtml(item.tahun || '2025') + '</span>' +
            '</div>' +
            '<h3 class="gallery-title">' + escapeHtml(item.judul) + '</h3>' +
            '<p class="gallery-desc">' + escapeHtml(item.deskripsi) + '</p>' +
            '<div class="gallery-tags-list">' + tagsHtml + '</div>' +
            '<div class="gallery-actions-row">' +
              linkHtml +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }

    fetch('data/gallery.json')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!Array.isArray(data.galeri) || data.galeri.length === 0) return;
        galleryGrid.innerHTML = data.galeri.map(buildGalleryCard).join('');

        // Pasang event listener untuk membuka lightbox pada masing-masing card
        data.galeri.forEach(function (item) {
          const btn = document.getElementById('zoom-btn-' + item.id);
          if (btn) {
            btn.addEventListener('click', function () {
              openLightbox(item);
            });
          }
        });
      })
      .catch(function (err) {
        console.warn('[gallery-loader] Gagal memuat data/gallery.json:', err.message);
      });
  }

  setupGalleryLoader();

  // Start canvas after all setup
  if (neonBackground && !motionPaused) neonBackground.start();
})();

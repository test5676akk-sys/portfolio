import './style.css';

gsap.registerPlugin(ScrollTrigger);

// 1. АУДИО
const soundtrack = new Howl({ src: ['/track.mp3'], loop: true, volume: 0.6, html5: true });

// 2. ПЛАВНЫЙ СКРОЛЛ
const lenis = new Lenis({ duration: 1.5, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time)=>{ lenis.raf(time * 1000) });
gsap.ticker.lagSmoothing(0);

lenis.on('scroll', (e) => { document.querySelector('.scroll-progress-line').style.width = `${(e.scroll / e.limit) * 100}%`; });

// 3. УПРАВЛЕНИЕ КУРСОРOM
const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');
let mX = window.innerWidth/2, mY = window.innerHeight/2;
if (window.matchMedia("(hover: hover)").matches) {
  window.addEventListener('mousemove', (e) => { mX = e.clientX; mY = e.clientY; gsap.to(cursor, { x: mX, y: mY, duration: 0.08 }); });
  let pX = mX, pY = mY;
  gsap.ticker.add(() => { pX += (mX - pX) / 6; pY += (mY - pY) / 6; gsap.set(cursorFollower, { x: pX, y: pY }); });
  document.querySelectorAll('.interactive-element, a').forEach(el => {
    el.addEventListener('mouseenter', () => cursorFollower.classList.add('cursor-expanded'));
    el.addEventListener('mouseleave', () => cursorFollower.classList.remove('cursor-expanded'));
  });
}

// 4. ЛОГИКА ШАПКИ И МОБИЛЬНОГО МЕНЮ
const mobileToggle = document.getElementById('mobile-toggle');
const navTabs = document.getElementById('nav-tabs');
const navLinks = document.querySelectorAll('.nav-link');

if (mobileToggle) {
  mobileToggle.addEventListener('click', () => {
    mobileToggle.classList.toggle('active');
    navTabs.classList.toggle('active');
    // Блокируем скролл тела сайта, пока открыто меню на мобилке
    document.body.style.overflow = navTabs.classList.contains('active') ? 'hidden' : '';
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileToggle.classList.remove('active');
      navTabs.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

// 5. ГРАФИЧЕСКИЙ ДВИЖОК 3D ЧАСТИЦ (ДНК -> БИТКОИН -> ВЗРЫВ)
const canvas = document.getElementById('stage-canvas');
const ctx = canvas.getContext('2d');
let w, h, particles = [];
let currentStage = 'idle'; // Фазы: idle -> loader_phase -> scatter -> small_bitcoins -> grid -> sphere -> fluid
let loaderProgress = 0; // 0..1 (для трансформации ДНК -> Биткоин)

function initEngine() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  particles = [];
  const count = window.innerWidth < 768 ? 450 : 850; 
  
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w, y: Math.random() * h,
      vx: 0, vy: 0,
      id: i, total: count,
      rad: Math.random() * 1.5 + 0.8,
      alpha: Math.random() * 0.5 + 0.3,
      seedX: Math.random() * 1000,
      seedY: Math.random() * 1000
    });
  }
}

// Математика 3D фигур
function getTarget(p, stage, time) {
  let tx = w/2, ty = h/2, tz = 0;

  if (stage === 'idle') {
    tx = w/2 + Math.sin(time * 0.4 + p.seedX) * w * 0.35;
    ty = h/2 + Math.cos(time * 0.4 + p.seedY) * h * 0.35;
    tz = Math.sin(time + p.id) * 80;
  }
  
  else if (stage === 'loader_phase') {
    // ДНК
    let dnaH = h * 0.75;
    let dnaY = -dnaH/2 + (p.id / p.total) * dnaH;
    let dnaAngle = dnaY * 0.016 + time;
    let dnaRad = w < 768 ? 50 : 130;
    let strand = p.id % 2 === 0 ? 0 : Math.PI;
    let dX = Math.sin(dnaAngle + strand) * dnaRad;
    let dY = dnaY;
    let dZ = Math.cos(dnaAngle + strand) * dnaRad;

    // БИТКОИН
    let bX = 0, bY = 0, bZ = 0;
    let size = w < 768 ? 80 : 180;
    let pct = p.id / p.total;

    if (pct < 0.4) {
      let bAngle = (pct / 0.4) * Math.PI * 1.4 - (Math.PI * 0.7);
      let r = size * 0.45;
      let offY = pct < 0.2 ? -size * 0.22 : size * 0.22;
      bX = Math.cos(bAngle) * r + (bAngle > 0 ? -size*0.05 : 0);
      bY = Math.sin(bAngle) * r + offY;
      bZ = Math.sin(time * 2 + p.id) * 15;
    } else if (pct < 0.65) {
      let factor = (pct - 0.4) / 0.25;
      bX = -size * 0.25;
      bY = -size * 0.65 + factor * (size * 1.3);
      bZ = Math.cos(time * 2 + p.id) * 15;
    } else if (pct < 0.85) {
      let sub = (pct - 0.65) / 0.2;
      let line = Math.floor(sub * 3);
      let lFactor = (sub * 3) - line;
      bX = -size * 0.25 + lFactor * (size * 0.5);
      bY = line === 0 ? -size * 0.45 : (line === 1 ? 0 : size * 0.45);
      bZ = Math.sin(time + p.id) * 10;
    } else {
      let sub = (pct - 0.85) / 0.15;
      let line = Math.floor(sub * 4);
      let lFactor = (sub * 4) - line;
      let offX = (line % 2 === 0) ? -size * 0.05 : size * 0.05;
      bX = offX;
      bY = (line < 2) ? (-size * 0.75 + lFactor * (size * 0.2)) : (size * 0.55 + lFactor * (size * 0.2));
      bZ = Math.cos(time + p.id) * 10;
    }

    // МОРФИНГ (0.0 -> 0.45 = ДНК, 0.45 -> 1.0 = Биткоин)
    let tFactor = 0;
    if (loaderProgress > 0.45) {
      tFactor = (loaderProgress - 0.45) / 0.55;
    }
    let smoothMix = gsap.parseEase("power2.inOut")(tFactor);
    
    tx = dX + (bX - dX) * smoothMix;
    ty = dY + (bY - dY) * smoothMix;
    tz = dZ + (bZ - dZ) * smoothMix;

    let rA = time * 0.6;
    let nx = tx * Math.cos(rA) - tz * Math.sin(rA);
    let nz = tx * Math.sin(rA) + tz * Math.cos(rA);
    tx = nx; tz = nz;
  }
  
  else if (stage === 'small_bitcoins') {
    let group = p.id % 3;
    let size = w < 768 ? 35 : 65;
    let pct = (p.id / 3) / (p.total / 3);
    
    let bX = 0, bY = 0;
    if (pct < 0.4) {
      let bAngle = (pct / 0.4) * Math.PI * 1.4 - (Math.PI * 0.7);
      bX = Math.cos(bAngle) * size * 0.45;
      bY = Math.sin(bAngle) * size * 0.45 + (pct < 0.2 ? -size * 0.22 : size * 0.22);
    } else if (pct < 0.7) {
      bX = -size * 0.25;
      bY = -size * 0.65 + ((pct - 0.4) / 0.3) * (size * 1.3);
    } else {
      bX = Math.sin(time + p.id) * 10; bY = Math.cos(time + p.id) * 10;
    }

    let offsetX = group === 0 ? -w*0.25 : (group === 1 ? w*0.22 : 0);
    let offsetY = group === 0 ? -h*0.15 : (group === 1 ? h*0.12 : -h*0.25);

    tx = offsetX + bX; ty = offsetY + bY; tz = Math.cos(time * 1.5 + p.id) * 30;

    let rA = time * 0.5 + group;
    let nx = tx * Math.cos(rA) - tz * Math.sin(rA);
    let nz = tx * Math.sin(rA) + tz * Math.cos(rA);
    tx = nx; tz = nz;
  }
  
  else if (stage === 'grid') {
    let gridSize = Math.cbrt(p.total);
    let spacing = w < 768 ? 25 : 45;
    let ix = p.id % Math.floor(gridSize);
    let iy = Math.floor(p.id / gridSize) % Math.floor(gridSize);
    let iz = Math.floor(p.id / (gridSize * gridSize));

    tx = (ix - gridSize/2) * spacing;
    ty = (iy - gridSize/2) * spacing;
    tz = (iz - gridSize/2) * spacing;

    let rA = time * 0.25;
    let nx = tx * Math.cos(rA) - tz * Math.sin(rA);
    let nz = tx * Math.sin(rA) + tz * Math.cos(rA);
    tx = nx; tz = nz;
  }
  
  else if (stage === 'sphere') {
    let phi = Math.acos( -1 + ( 2 * p.id ) / p.total );
    let theta = Math.sqrt( p.total * Math.PI ) * phi;
    let radius = (w < 768 ? 100 : 220) + Math.sin(time * 2.5 + p.seedX) * 12;
    
    tx = radius * Math.cos(theta) * Math.sin(phi);
    ty = radius * Math.sin(theta) * Math.sin(phi);
    tz = radius * Math.cos(phi);

    let rotX = tx * Math.cos(time * 0.4) - tz * Math.sin(time * 0.4);
    let rotZ = tx * Math.sin(time * 0.4) + tz * Math.cos(time * 0.4);
    tx = rotX; tz = rotZ;
  }
  
  else if (stage === 'fluid') {
    tx = (w/2 - mX) * (p.seedX * 0.006) + Math.sin(time + p.seedX) * 180;
    ty = (h/2 - mY) * (p.seedY * 0.006) + Math.cos(time + p.seedY) * 180;
    tz = Math.sin(time + p.id) * 120;
  }

  if (stage !== 'idle') {
    let tilt = -Math.PI / 8;
    let finalY = ty * Math.cos(tilt) - tz * Math.sin(tilt);
    let finalZ = ty * Math.sin(tilt) + tz * Math.cos(tilt);
    return { x: w/2 + tx, y: h/2 + finalY, z: finalZ };
  } 
  return { x: tx, y: ty, z: tz };
}

function updateAndRenderStage() {
  requestAnimationFrame(updateAndRenderStage);
  ctx.clearRect(0, 0, w, h);
  let time = Date.now() * 0.001;

  particles.forEach(p => {
    let target = getTarget(p, currentStage, time);
    
    if (currentStage === 'scatter') {
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.95; p.vy *= 0.95; 
    } else {
      let ease = currentStage === 'loader_phase' ? 0.04 : 0.07;
      p.vx += (target.x - p.x) * ease;
      p.vy += (target.y - p.y) * ease;
      p.vx *= 0.72; p.vy *= 0.72;
      p.x += p.vx; p.y += p.vy;
    }

    let depthScale = target.z ? (target.z + 500) / 500 : 1;
    depthScale = Math.max(0.15, Math.min(2.4, depthScale));

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.rad * depthScale, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 179, 255, ${p.alpha * depthScale})`;
    
    if (currentStage === 'loader_phase') {
      ctx.shadowBlur = 8 * depthScale;
      ctx.shadowColor = "rgba(0, 179, 255, 0.7)";
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fill();
  });
}
initEngine(); updateAndRenderStage(); window.addEventListener('resize', initEngine);

// 6. ПРИВЯЗКА ФИГУР К СКРОЛЛУ
function bindScrollStages() {
  const registerStage = (id, stageName) => {
    ScrollTrigger.create({
      trigger: id, start: 'top 50%', end: 'bottom 50%',
      onEnter: () => currentStage = stageName,
      onEnterBack: () => currentStage = stageName
    });
  };
  registerStage('#sec-hero', 'small_bitcoins');
  registerStage('#sec-focus', 'grid');
  registerStage('#sec-competencies', 'sphere');
  registerStage('#sec-solutions', 'fluid');
}

// 7. ЗАПУСК ДВИЖКА (КЛИК -> ДНК -> БИТКОИН -> ВЗРЫВ)
const authBtn = document.getElementById('auth-btn');

authBtn.addEventListener('click', () => {
  soundtrack.play(); 
  
  // Удерживаем юзера наверху
  window.scrollTo(0, 0);
  document.body.style.overflow = 'hidden';

  gsap.to('#preloader', { backgroundColor: 'rgba(1, 1, 3, 0)', duration: 0.5 });
  
  gsap.to('#trigger-stage', { opacity: 0, duration: 0.5, onComplete: () => {
    document.getElementById('trigger-stage').style.display = 'none';
    currentStage = 'loader_phase'; 
  }});

  // Таймлайн морфинга ДНК в Биткоин
  gsap.to({ progress: 0 }, {
    progress: 1, duration: 5.5, ease: "power1.inOut",
    onUpdate: function() { loaderProgress = this.targets()[0].progress; }
  });

  // ВЗРЫВ 
  gsap.delayedCall(5.8, () => {
    document.body.style.overflow = '';
    
    particles.forEach(p => {
      let angle = Math.random() * Math.PI * 2;
      let force = Math.random() * 65 + 25; 
      p.vx = Math.cos(angle) * force; 
      p.vy = Math.sin(angle) * force;
    });
    
    currentStage = 'scatter';

    gsap.to('#preloader', { opacity: 0, duration: 1.0, onComplete: () => {
        document.getElementById('preloader').remove();
        currentStage = 'small_bitcoins';
        bindScrollStages();
      }
    });

    // Опускаем шапку
    document.getElementById('main-header').style.top = '0';

    gsap.to('.main-wrapper', { opacity: 1, duration: 0.1 });
    document.querySelector('.main-wrapper').style.pointerEvents = 'auto';

    const tl = gsap.timeline();
    tl.fromTo('.animate-up', { y: 35, opacity: 0, filter: 'blur(10px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.5, stagger: 0.2, ease: 'power3.out' });

    initTextTriggers();
  });
});

function initTextTriggers() {
  document.querySelectorAll('.scroll-reveal').forEach(el => {
    gsap.to(el, { y: 0, opacity: 1, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }});
  });
}
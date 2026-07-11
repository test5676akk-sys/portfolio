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

// 3. КУРСОРЫ
const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');
let mX = window.innerWidth/2, mY = window.innerHeight/2;
if (window.matchMedia("(hover: hover)").matches) {
  window.addEventListener('mousemove', (e) => { mX = e.clientX; mY = e.clientY; gsap.to(cursor, { x: mX, y: mY, duration: 0.08 }); });
  let pX = mX, pY = mY;
  gsap.ticker.add(() => { pX += (mX - pX) / 6; pY += (mY - pY) / 6; gsap.set(cursorFollower, { x: pX, y: pY }); });
  document.querySelectorAll('.interactive-element').forEach(el => {
    el.addEventListener('mouseenter', () => cursorFollower.classList.add('cursor-expanded'));
    el.addEventListener('mouseleave', () => cursorFollower.classList.remove('cursor-expanded'));
  });
}

// 4. ЯДРО 3D ЧАСТИЦ (PRO-LEVEL MATH)
const canvas = document.getElementById('stage-canvas');
const ctx = canvas.getContext('2d');
let w, h, particles = [];
let currentStage = 'idle'; // idle -> giant_dna -> scatter -> small_dnas -> grid -> sphere -> fluid

function initEngine() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  particles = [];
  const count = window.innerWidth < 768 ? 400 : 700;
  
  for (let i = 0; i < count; i++) {
    particles.push({
      // Фактические координаты на экране
      x: Math.random() * w, y: Math.random() * h,
      vx: 0, vy: 0,
      
      // Базовые параметры
      id: i,
      total: count,
      rad: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.2,
      
      // Рандомные сиды для математики
      seedX: Math.random() * 1000,
      seedY: Math.random() * 1000
    });
  }
}

// Математические формации для вычисления Target (Куда стремится частица)
function getTarget(p, stage, time) {
  let tx = w/2, ty = h/2, tz = 0;

  if (stage === 'idle') {
    // Просто хаос до нажатия кнопки
    tx = w/2 + Math.sin(time + p.seedX) * w * 0.4;
    ty = h/2 + Math.cos(time + p.seedY) * h * 0.4;
    tz = 0;
  }
  
  else if (stage === 'giant_dna') {
    // 1 Огромная ДНК
    let height = h * 0.8;
    let yPos = -height/2 + (p.id / p.total) * height;
    let angle = yPos * 0.015;
    let radius = w < 768 ? 60 : 150;
    let strand = p.id % 2 === 0 ? 0 : Math.PI;
    
    tx = Math.sin(angle + strand + time) * radius;
    ty = yPos;
    tz = Math.cos(angle + strand + time) * radius;
  }
  
  else if (stage === 'small_dnas') {
    // 3 Маленькие ДНК по экрану
    let group = p.id % 3;
    let height = h * 0.4;
    let yPos = -height/2 + ((p.id / 3) / (p.total / 3)) * height;
    let angle = yPos * 0.02;
    let radius = 30;
    let strand = p.id % 2 === 0 ? 0 : Math.PI;

    let offsetX = group === 0 ? -w*0.25 : (group === 1 ? 0 : w*0.25);
    let offsetY = group === 0 ? -h*0.1 : (group === 1 ? h*0.1 : -h*0.2);

    tx = offsetX + Math.sin(angle + strand + time*1.5) * radius;
    ty = offsetY + yPos;
    tz = Math.cos(angle + strand + time*1.5) * radius;
  }
  
  else if (stage === 'grid') {
    // Строгий 3D Куб/Матрица
    let gridSize = Math.cbrt(p.total); // Корень кубический
    let spacing = w < 768 ? 30 : 50;
    
    let ix = p.id % Math.floor(gridSize);
    let iy = Math.floor(p.id / gridSize) % Math.floor(gridSize);
    let iz = Math.floor(p.id / (gridSize * gridSize));

    tx = (ix - gridSize/2) * spacing;
    ty = (iy - gridSize/2) * spacing;
    tz = (iz - gridSize/2) * spacing;

    // Вращение куба
    let rotAngle = time * 0.3;
    let nx = tx * Math.cos(rotAngle) - tz * Math.sin(rotAngle);
    let nz = tx * Math.sin(rotAngle) + tz * Math.cos(rotAngle);
    tx = nx; tz = nz;
  }
  
  else if (stage === 'sphere') {
    // Пульсирующая сфера
    let phi = Math.acos( -1 + ( 2 * p.id ) / p.total );
    let theta = Math.sqrt( p.total * Math.PI ) * phi;
    
    let radius = (w < 768 ? 100 : 200) + Math.sin(time * 3 + p.seedX) * 20; // Пульсация
    
    tx = radius * Math.cos(theta) * Math.sin(phi);
    ty = radius * Math.sin(theta) * Math.sin(phi);
    tz = radius * Math.cos(phi);

    // Вращение
    let rotX = tx * Math.cos(time) - tz * Math.sin(time);
    let rotZ = tx * Math.sin(time) + tz * Math.cos(time);
    tx = rotX; tz = rotZ;
  }

  else if (stage === 'fluid') {
    // Поле, реагирующее на мышь
    tx = (w/2 - mX) * (p.seedX * 0.005) + Math.sin(time + p.seedX) * 150;
    ty = (h/2 - mY) * (p.seedY * 0.005) + Math.cos(time + p.seedY) * 150;
    tz = Math.sin(time + p.id) * 100;
  }

  // Если это не хаос, возвращаем координаты относительно центра экрана
  if (stage !== 'idle') {
    // Глобальный наклон (Perspective Tilt)
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
    // 1. Получаем цель (куда лететь)
    let target = getTarget(p, currentStage, time);
    
    // 2. Логика полета (Physics)
    if (currentStage === 'scatter') {
      // Режим разлета (инерция после взрыва)
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.95; p.vy *= 0.95; // Трение космоса
    } else {
      // Режим магнитной сборки (упругое стремление к цели)
      let ease = currentStage === 'giant_dna' ? 0.04 : 0.08;
      p.vx += (target.x - p.x) * ease;
      p.vy += (target.y - p.y) * ease;
      p.vx *= 0.7; // Демпфирование (чтобы не болтались как сопли)
      p.vy *= 0.7;
      p.x += p.vx;
      p.y += p.vy;
    }

    // 3. 3D Масштаб и прозрачность
    let depthScale = target.z ? (target.z + 500) / 500 : 1;
    depthScale = Math.max(0.2, Math.min(2, depthScale));

    // 4. Отрисовка
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.rad * depthScale, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 229, 255, ${p.alpha * depthScale})`;
    
    if (currentStage === 'giant_dna') {
      ctx.shadowBlur = 10 * depthScale; 
      ctx.shadowColor = "rgba(0, 229, 255, 0.8)";
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fill();
  });
}
initEngine(); updateAndRenderStage(); window.addEventListener('resize', initEngine);

// 5. ЛОГИКА СКРОЛЛА (ПЕРЕКЛЮЧЕНИЕ СТИЛЕЙ)
function bindScrollStages() {
  const registerStage = (id, stageName) => {
    ScrollTrigger.create({
      trigger: id, start: 'top 50%', end: 'bottom 50%',
      onEnter: () => currentStage = stageName,
      onEnterBack: () => currentStage = stageName
    });
  };
  registerStage('#sec-hero', 'small_dnas');
  registerStage('#sec-manifesto', 'grid');
  registerStage('#sec-skills', 'sphere');
  registerStage('#sec-cases', 'fluid');
}

// 6. ЗАПУСК И ВЗРЫВ
const authBtn = document.getElementById('auth-btn');

authBtn.addEventListener('click', () => {
  soundtrack.play();

  // Прячем текст прелоадера
  gsap.to('#trigger-stage', { opacity: 0, duration: 0.5, onComplete: () => {
    document.getElementById('trigger-stage').style.display = 'none';
    currentStage = 'giant_dna'; // Начинаем 5-секундную сборку Большой ДНК
  }});

  // ВЗРЫВ на 5.8 сек (перед самым дропом)
  gsap.delayedCall(5.8, () => {
    // Даем бешеную скорость частицам
    particles.forEach(p => {
      let angle = Math.random() * Math.PI * 2;
      let force = Math.random() * 60 + 20; 
      p.vx = Math.cos(angle) * force; 
      p.vy = Math.sin(angle) * force;
    });
    
    currentStage = 'scatter'; // Частицы летят по инерции

    // Убираем черный экран прелоадера
    gsap.to('#preloader', { opacity: 0, duration: 1.0, ease: 'power2.out', onComplete: () => {
        document.getElementById('preloader').remove();
        currentStage = 'small_dnas'; // Осколки превращаются в маленькие ДНК
        bindScrollStages(); // Включаем реакцию на скролл
      }
    });

    // Показываем интерфейс сайта
    gsap.to('.main-wrapper', { opacity: 1, duration: 0.1 });
    document.querySelector('.main-wrapper').style.pointerEvents = 'auto';

    // Плавный выезд текстов
    const tl = gsap.timeline();
    tl.fromTo('.animate-up', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.2, ease: 'power3.out' });

    initTextTriggers();
  });
});

function initTextTriggers() {
  document.querySelectorAll('.scroll-reveal').forEach(el => {
    gsap.to(el, { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }});
  });
}
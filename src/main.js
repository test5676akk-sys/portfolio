import './style.css';

gsap.registerPlugin(ScrollTrigger);

// 1. АУДИО-ДВИЖОК С ВЫСОКОЙ СОВМЕСТИМОСТЬЮ
const soundtrack = new Howl({
  src: ['/track.mp3'],
  loop: true,
  volume: 0.55,
  html5: true
});

// 2. ЭЛИТНЫЙ ПЛАВНЫЙ СКРОЛЛ (LENIS)
const lenis = new Lenis({ 
  duration: 1.5, 
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true 
});
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time)=>{ lenis.raf(time * 1000) });
gsap.ticker.lagSmoothing(0);

lenis.on('scroll', (e) => {
  const progress = (e.scroll / (e.limit)) * 100;
  document.querySelector('.scroll-progress-line').style.width = `${progress}%`;
});

// 4. ИНТЕРФЕЙС УПРАВЛЕНИЯ КУРСОРOM
const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');
let mX = window.innerWidth/2, mY = window.innerHeight/2, pX = mX, pY = mY;

if (window.matchMedia("(hover: hover)").matches) {
  window.addEventListener('mousemove', (e) => {
    mX = e.clientX; mY = e.clientY;
    gsap.to(cursor, { x: mX, y: mY, duration: 0.08 });
  });
  gsap.ticker.add(() => {
    pX += (mX - pX) / 6; pY += (mY - pY) / 6;
    gsap.set(cursorFollower, { x: pX, y: pY });
  });
  document.querySelectorAll('.interactive-element, button, a').forEach(el => {
    el.addEventListener('mouseenter', () => cursorFollower.classList.add('cursor-expanded'));
    el.addEventListener('mouseleave', () => cursorFollower.classList.remove('cursor-expanded'));
  });
}

// 5. КИНЕМАТОГРАФИЧЕСКИЙ ГРАФИЧЕСКИЙ ДВИЖОК (3D DNA HELIX & WAVE NETWORK)
const canvas = document.getElementById('stage-canvas');
const ctx = canvas.getContext('2d');
let w, h, particles = [];
let currentStage = 'dna'; // Этапы: dna, morphing, hero, manifesto, skills, cases, footer
let morphProgress = 0; // Фактор трансформации геометрии от 0 до 1

function initEngine() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  particles = [];
  
  // Создаем массив квантовых частиц (оптимизировано под плавную 3D проекцию)
  const count = window.innerWidth < 768 ? 250 : 550;
  
  for (let i = 0; i < count; i++) {
    // 3D Математические параметры для Double Helix (ДНК)
    let angle = (i / count) * Math.PI * 9; // Витки спирали
    let distance = window.innerWidth < 768 ? 40 : 90; // Радиус
    let strand = i % 2 === 0 ? 1 : -1;
    
    // Смещение по вертикали
    let dnaHeight = h * 0.85;
    let initialY = -dnaHeight / 2 + (i / count) * dnaHeight;

    particles.push({
      // Текущие координаты
      x: Math.random() * w,
      y: Math.random() * h,
      
      // Локальные параметры 3D ДНК
      dnaX: Math.sin(angle + (strand * Math.PI)) * distance,
      dnaY: initialY,
      dnaZ: Math.cos(angle + (strand * Math.PI)) * distance,
      angle: angle + (strand * Math.PI),
      
      // Векторы волнового поля (для фонового режима)
      waveSeedX: Math.random() * 100,
      waveSeedY: Math.random() * 100,
      waveSpeed: 0.002 + Math.random() * 0.003,
      
      // Базовые параметры частицы
      rad: Math.random() * 1.5 + 1,
      alpha: Math.random() * 0.4 + 0.3,
      speed: 0.02 + Math.random() * 0.03
    });
  }
}

function updateAndRenderStage() {
  requestAnimationFrame(updateAndRenderStage);
  ctx.clearRect(0, 0, w, h);
  let time = Date.now() * 0.0008;

  particles.forEach((p, idx) => {
    let targetX, targetY, depthScale = 1;

    // МАТЕМАТИЧЕСКАЯ МОДЕЛЬ 1: 3D ВРАЩАЮЩАЯСЯ СПИРАЛЬ ДНК
    let rotationAngle = time * 0.7;
    let rotX = p.dnaX * Math.cos(rotationAngle) - p.dnaZ * Math.sin(rotationAngle);
    let rotZ = p.dnaX * Math.sin(rotationAngle) + p.dnaZ * Math.cos(rotationAngle);
    
    // Легкий наклон оси ДНК в пространстве для объема
    let tilt = -Math.PI / 6;
    let finalDnaX = w / 2 + (rotX * Math.cos(tilt) - p.dnaY * Math.sin(tilt));
    let finalDnaY = h / 2 + (rotX * Math.sin(tilt) + p.dnaY * Math.cos(tilt));
    
    depthScale = (rotZ + 200) / 200; // Перспектива приближения/удаления

    // МАТЕМАТИЧЕСКАЯ МОДЕЛЬ 2: ТЕКУЧИЕ КВАНТОВЫЕ ВОЛНЫ (БЭКГРАУНД)
    let waveX, waveY;

    if (currentStage === 'hero' || currentStage === 'footer') {
      // Плавное следование за мышью + мягкие волны
      let offset = Math.sin(time + p.waveSeedX) * 40;
      waveX = p.x + (mX - p.x) * (0.01 + (idx * 0.00003)) + offset;
      waveY = p.y + (mY - p.y) * (0.01 + (idx * 0.00003)) + Math.cos(time + p.waveSeedY) * 40;
    } 
    else if (currentStage === 'manifesto') {
      // Строгие структурные математические синусоиды
      let freq = 0.003;
      waveX = (idx % 25) * (w / 24);
      waveY = (h / 2) + Math.sin(waveX * freq + time * 2 + idx) * (h * 0.25);
    } 
    else if (currentStage === 'skills') {
      // Рассредоточенная цифровая матрица данных
      waveX = (idx % 20) * (w / 19);
      waveY = Math.floor(idx / 20) * (h / 25) + (h * 0.15) + Math.sin(time + idx) * 20;
    } 
    else {
      // Базовый дрейф волн
      waveX = w / 2 + Math.sin(time + p.waveSeedX) * (w * 0.4);
      waveY = h / 2 + Math.cos(time + p.waveSeedY) * (h * 0.4);
    }

    // ИНТЕРПОЛЯЦИЯ МЕЖДУ РЕЖИМАМИ (МОРФИНГ ГЕОМЕТРИИ)
    if (currentStage === 'dna') {
      targetX = finalDnaX; targetY = finalDnaY;
    } else if (currentStage === 'morphing') {
      // Мягкое бесшовное перетекание из ДНК в волну без взрывов
      targetX = gsap.utils.interpolate(finalDnaX, waveX, morphProgress);
      targetY = gsap.utils.interpolate(finalDnaY, waveY, morphProgress);
      depthScale = gsap.utils.interpolate(depthScale, 1, morphProgress);
    } else {
      targetX = waveX; targetY = waveY;
      depthScale = 1;
    }

    // Мягкое сглаживание движения
    p.x += (targetX - p.x) * 0.06;
    p.y += (targetY - p.y) * 0.06;

    // ОТРИСОВКА ЧАСТИЦЫ
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.2, p.rad * depthScale), 0, Math.PI * 2);
    
    // Подсветка нитей во время нахождения в форме ДНК
    if (currentStage === 'dna' || currentStage === 'morphing') {
      let alphaFactor = currentStage === 'dna' ? 1 : (1 - morphProgress);
      ctx.fillStyle = `rgba(0, 212, 255, ${Math.max(0.08, p.alpha * depthScale)})`;
      ctx.shadowBlur = 10 * depthScale * alphaFactor;
      ctx.shadowColor = "rgba(0, 212, 255, 0.6)";
    } else {
      ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha * 0.7})`;
      ctx.shadowBlur = 0;
    }
    
    ctx.fill();
  });
}
initEngine(); updateAndRenderStage(); window.addEventListener('resize', initEngine);

// Управление геометрией частиц привязано к координатам ScrollTrigger
function bindScrollStages() {
  const registerStage = (id, stageName) => {
    ScrollTrigger.create({
      trigger: id, start: 'top 65%', end: 'bottom 35%',
      onEnter: () => { if(currentStage !== 'morphing') currentStage = stageName; },
      onEnterBack: () => { if(currentStage !== 'morphing') currentStage = stageName; }
    });
  };
  registerStage('#sec-hero', 'hero');
  registerStage('#sec-manifesto', 'manifesto');
  registerStage('#sec-skills', 'skills');
  registerStage('#sec-cases', 'hero'); // Используем плавное следование для кейсов
  registerStage('#sec-footer', 'footer');
}

// 6. БЕЗУПРЕЧНЫЙ ПЛАВНЫЙ ПЕРЕХОД ПО КЛИКУ РОДНОГО ТРЕКА
const authBtn = document.getElementById('auth-btn');
const preloader = document.getElementById('preloader');
const mainWrapper = document.querySelector('.main-wrapper');

authBtn.addEventListener('click', () => {
  soundtrack.play(); // Старт трека

  // Элегантное растворение интерфейса прелоадера
  gsap.to('#trigger-stage', { opacity: 0, duration: 0.8, onComplete: () => {
    document.getElementById('trigger-stage').style.display = 'none';
    currentStage = 'morphing'; // Включаем режим плавного перестроения спирали
  }});

  // Магия расплетения ДНК: спираль тает и превращается в потоки за 5.8 секунд (под дроп)
  gsap.to({ progress: 0 }, {
    progress: 1,
    duration: 5.6,
    ease: "power2.inOut",
    onUpdate: function() {
      morphProgress = this.targets()[0].progress;
    },
    onComplete: () => {
      currentStage = 'hero'; // Фиксируем фоновое состояние
      bindScrollStages();    // Включаем скролл-триггеры для фона
    }
  });

  // Мягкое проявление основного сайта (синхронно с 6-й секундой начала баса)
  gsap.to(preloader, {
    opacity: 0,
    duration: 1.5,
    delay: 5.2,
    ease: "power1.inOut",
    onComplete: () => preloader.remove()
  });

  gsap.to(mainWrapper, { opacity: 1, duration: 1.5, delay: 5.4 });
  mainWrapper.style.pointerEvents = 'auto';

  // Плавный выезд контента из киношного размытия
  const tl = gsap.timeline({ delay: 5.8 });
  tl.fromTo('.animate-blur', 
    { filter: 'blur(20px)', y: 30, opacity: 0 }, 
    { filter: 'blur(0px)', y: 0, opacity: 1, duration: 1.6, stagger: 0.2, ease: 'power3.out' }
  );

  // Инициализация триггеров контента
  initTextTriggers();
  initTiltCards();
  initDecodeEffect();
});

// Анимации проявления блоков при скролле
function initTextTriggers() {
  document.querySelectorAll('.scroll-reveal').forEach(el => {
    gsap.to(el, {
      y: 0, opacity: 1, duration: 1.4, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' }
    });
  });
}

// Логика 3D наклона карточек услуг
function initTiltCards() {
  if (window.innerWidth < 768) return;
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - (rect.width/2);
      const y = e.clientY - rect.top - (rect.height/2);
      gsap.to(card, { rotateX: -y / 12, rotateY: x / 12, duration: 0.3 });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6 });
    });
  });
}

// Эффект премиальной кибер-дешифровки заголовков при наведении
function initDecodeEffect() {
  const letters = "01XØ$#@%&§?+=*";
  document.querySelectorAll('.DecodeText').forEach(el => {
    el.addEventListener('mouseenter', () => {
      let iteration = 0;
      const interval = setInterval(() => {
        el.innerText = el.innerText.split("").map((letter, idx) => {
          if (idx < iteration) return el.dataset.text[idx];
          return letters[Math.floor(Math.random() * letters.length)];
        }).join("");
        if (iteration >= el.dataset.text.length) clearInterval(interval);
        iteration += 1 / 2;
      }, 25);
    });
  });
}
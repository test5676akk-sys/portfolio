import './style.css';

gsap.registerPlugin(ScrollTrigger);

// 1. ЗВУКОВОЙ ПРОТОКОЛ
const soundtrack = new Howl({
  src: ['/track.mp3'],
  loop: true,
  volume: 0.6,
  html5: true
});

// 2. КИНЕМАТОГРАФИЧНЫЙ СКРОЛЛ
const lenis = new Lenis({ duration: 1.4, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time)=>{ lenis.raf(time * 1000) });
gsap.ticker.lagSmoothing(0);

lenis.on('scroll', (e) => {
  const progress = (e.scroll / (e.limit)) * 100;
  document.querySelector('.scroll-progress-line').style.width = `${progress}%`;
});

// 3. АДАПТИВНЫЙ ИНТЕРФЕЙС КУРСОРОВ
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

// 4. ГРАФИЧЕСКИЙ ДВИЖОК CANVAS С ПИКСЕЛЬНЫМ СКАНЕРОМ ИМЕНИ
const canvas = document.getElementById('stage-canvas');
const ctx = canvas.getContext('2d');
let w, h, particles = [];
let currentStage = 'loader';
let assembleProgress = 0;

// ФУНКЦИЯ: Сканирует текст и возвращает точные пиксельные координаты букв
function getTextCoordinates(text) {
  const offCanvas = document.createElement('canvas');
  const offCtx = offCanvas.getContext('2d');
  offCanvas.width = w;
  offCanvas.height = h;

  // Рисуем текст невидимо шрифтом Oswald
  let fontSize = window.innerWidth < 768 ? 120 : 250;
  offCtx.font = `900 ${fontSize}px 'Oswald', sans-serif`;
  offCtx.textAlign = "center";
  offCtx.textBaseline = "middle";
  offCtx.fillStyle = "white";
  offCtx.fillText(text, w / 2, h / 2);

  const imgData = offCtx.getImageData(0, 0, w, h).data;
  const coords = [];

  // Собираем пиксели с шагом 4-5px для плотной матрицы
  let step = window.innerWidth < 768 ? 3 : 5;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const alpha = imgData[(y * w + x) * 4 + 3];
      if (alpha > 128) {
        coords.push({ x: x, y: y });
      }
    }
  }
  return coords;
}

function initEngine() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  
  let nameCoords = getTextCoordinates("ИЛЬЯ");
  particles = [];
  
  // До 1200 частиц для кристально четкого текста
  let maxParticles = window.innerWidth < 768 ? 600 : 1200;
  let pCount = Math.min(nameCoords.length, maxParticles);
  
  for (let i = 0; i < pCount; i++) {
    // Равномерно распределяем частицы по сканированным пикселям букв
    let target = nameCoords[Math.floor(i * (nameCoords.length / pCount))];
    
    particles.push({
      x: Math.random() * w, 
      y: Math.random() * h,
      tx: target ? target.x : w/2, 
      ty: target ? target.y : h/2,
      vx: (Math.random() - 0.5) * 3, 
      vy: (Math.random() - 0.5) * 3,
      rad: Math.random() * 1.5 + 0.8, 
      alpha: Math.random() * 0.5 + 0.3,
      angleOffset: Math.random() * Math.PI * 2,
      ox: (Math.random() - 0.5) * 2, // Микро-смещение для эффекта живого неона
      oy: (Math.random() - 0.5) * 2
    });
  }
}

function updateAndRenderStage() {
  requestAnimationFrame(updateAndRenderStage);
  ctx.clearRect(0, 0, w, h);

  particles.forEach((p, idx) => {
    if (currentStage === 'loader') {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }
    else if (currentStage === 'assemble') {
      // Экспоненциальный разгон сборки магнитных частиц
      let speedFactor = 0.04 + (assembleProgress * 0.08);
      
      // Сильная вибрация за полсекунды до взрыва
      let vibX = assembleProgress > 0.8 ? Math.sin(Date.now() * 0.05 + p.angleOffset) * (assembleProgress * 2.5) : 0;
      let vibY = assembleProgress > 0.8 ? Math.cos(Date.now() * 0.05 + p.angleOffset) * (assembleProgress * 2.5) : 0;
      
      p.x += (p.tx + p.ox + vibX - p.x) * speedFactor;
      p.y += (p.ty + p.oy + vibY - p.y) * speedFactor;
    }
    else if (currentStage === 'hero') {
      p.x += p.vx * 0.6; p.y += p.vy * 0.6;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      // Отрисовка линий связей нейросети (лимитируем для производительности)
      if (window.innerWidth > 768 && idx < 150) {
        for (let j = idx + 1; j < 150; j++) {
          let dist = Math.hypot(p.x - particles[j].x, p.y - particles[j].y);
          if (dist < 120) {
            ctx.beginPath(); ctx.strokeStyle = `rgba(0, 255, 136, ${0.15 * (1 - dist/120)})`;
            ctx.lineWidth = 0.5; ctx.moveTo(p.x, p.y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
          }
        }
      }
    }
    else if (currentStage === 'manifesto') {
      let colX = (idx % 6) * (w / 5) + 50;
      p.x += (colX - p.x) * 0.05; p.y += p.vy * 0.8;
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
    }
    else if (currentStage === 'skills') {
      let gridX = (idx % 20) * (w / 19);
      let gridY = Math.floor(idx / 20) * (h / 15) + 40;
      p.x += (gridX - p.x) * 0.1; p.y += (gridY - p.y) * 0.1;
    }
    else if (currentStage === 'cases' || currentStage === 'footer') {
      p.x += (mX - p.x) * (0.015 + (idx * 0.0002));
      p.y += (mY - p.y) * (0.015 + (idx * 0.0002));
    }

    ctx.beginPath(); ctx.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
    
    // Включение яркого свечения при сборке букв
    if (currentStage === 'assemble') {
      ctx.fillStyle = `rgba(0, 255, 136, ${0.4 + (assembleProgress * 0.6)})`;
      ctx.shadowBlur = 8 + (assembleProgress * 15); 
      ctx.shadowColor = "var(--cyber-green)";
    } else {
      ctx.fillStyle = `rgba(0, 255, 136, ${p.alpha})`;
      ctx.shadowBlur = 0;
    }
    
    ctx.fill();
  });
}

// Гарантируем запуск после загрузки шрифтов, чтобы сканер не срисовал стандартный Arial
let engineRunning = false;
document.fonts.ready.then(() => {
  initEngine();
  if(!engineRunning) {
    updateAndRenderStage();
    engineRunning = true;
  }
});
window.addEventListener('resize', initEngine);

function bindScrollStages() {
  const registerStage = (id, stageName) => {
    ScrollTrigger.create({
      trigger: id, start: 'top 60%', end: 'bottom 40%',
      onEnter: () => currentStage = stageName,
      onEnterBack: () => currentStage = stageName
    });
  };
  registerStage('#sec-hero', 'hero');
  registerStage('#sec-manifesto', 'manifesto');
  registerStage('#sec-skills', 'skills');
  registerStage('#sec-cases', 'cases');
  registerStage('#sec-footer', 'footer');
}

// 6. ХАКЕРСКИЙ ЗАПУСК И СБОРКА ИМЕНИ ПОД ДРОП
const authBtn = document.getElementById('auth-btn');
const triggerStage = document.getElementById('trigger-stage');
const flashEffect = document.getElementById('flash-effect');

authBtn.addEventListener('click', () => {
  soundtrack.play(); // Старт музыки

  // Растворение кнопки
  gsap.to(triggerStage, { opacity: 0, duration: 0.5, onComplete: () => {
    triggerStage.style.display = 'none';
    currentStage = 'assemble'; // Активация магнитного сканера
  }});

  // График напряжения анимации (0 -> 1)
  gsap.to({ progress: 0 }, {
    progress: 1,
    duration: 5.5,
    ease: "power1.in",
    onUpdate: function() {
      assembleProgress = this.targets()[0].progress;
    }
  });

  // ИДЕАЛЬНЫЙ ТАЙМИНГ ВЗРЫВА (ровно на 5.8 секунд, чтобы на 6.0 был кадр удара)
  gsap.delayedCall(5.8, () => {
    triggerExplosionWithFlash();
  });
});

function triggerExplosionWithFlash() {
  // Эффект белой ослепляющей вспышки экрана
  gsap.fromTo(flashEffect, { opacity: 1 }, { opacity: 0, duration: 1.2, ease: "power2.out" });

  // Взрывная волна из центра имени
  particles.forEach(p => {
    let angle = Math.random() * Math.PI * 2;
    let force = Math.random() * 40 + 20; 
    p.vx = Math.cos(angle) * force; 
    p.vy = Math.sin(angle) * force;
  });
  currentStage = 'loader';

  // Убираем темный фон лоадера
  gsap.to('#preloader', {
    scale: 2.5, opacity: 0, duration: 1.0, ease: 'expo.out',
    onComplete: () => {
      document.getElementById('preloader').remove();
      currentStage = 'hero';
      bindScrollStages();
    }
  });

  // Проявляем интерфейс портфолио
  gsap.to('.main-wrapper', { opacity: 1, duration: 0.1, delay: 0.2 });
  document.querySelector('.main-wrapper').style.pointerEvents = 'auto';

  // Массовое появление текстов
  const tl = gsap.timeline({ delay: 0.4 });
  tl.fromTo('.animate-blur', { filter: 'blur(20px)', y: 40, opacity: 0 }, { filter: 'blur(0px)', y: 0, opacity: 1, duration: 1.4, stagger: 0.2, ease: 'power4.out' });

  initTextTriggers();
  initTiltCards();
  initDecodeEffect();
}

// ... инициализации scrollTrigger остаются прежними
function initTextTriggers() {
  document.querySelectorAll('.scroll-reveal').forEach(el => {
    gsap.to(el, { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }});
  });
}

function initTiltCards() {
  if (window.innerWidth < 768) return;
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - (rect.width/2);
      const y = e.clientY - rect.top - (rect.height/2);
      gsap.to(card, { rotateX: -y / 10, rotateY: x / 10, duration: 0.3 });
    });
    card.addEventListener('mouseleave', () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5 }));
  });
}

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
      }, 30);
    });
  });
}
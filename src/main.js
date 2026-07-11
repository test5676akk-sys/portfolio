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

// 4. ГРАФИЧЕСКИЙ ДВИЖОК CANVAS (ГЕНЕРАЦИЯ 3D ДНК)
const canvas = document.getElementById('stage-canvas');
const ctx = canvas.getContext('2d');
let w, h, particles = [];
let currentStage = 'loader';
let assembleProgress = 0;
let dnaBases = [];

function initEngine() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  particles = [];
  dnaBases = [];
  
  // Параметры ДНК
  let numStrandDots = window.innerWidth < 768 ? 180 : 350;
  let numRungs = window.innerWidth < 768 ? 16 : 28;
  let dotsPerRung = window.innerWidth < 768 ? 8 : 15;
  
  let height = h * 0.9;
  let startY = -height/2;
  let freq = 0.012; // Частота закручивания спирали
  
  // Генерация спиралей (2 цепи)
  for(let i=0; i<numStrandDots; i++) {
    let y = startY + (i / numStrandDots) * height;
    let angle = y * freq;
    dnaBases.push({ y: y, angle: angle, isRung: false }); // Первая цепь
    dnaBases.push({ y: y, angle: angle + Math.PI, isRung: false }); // Вторая цепь
  }
  
  // Генерация мостиков между цепями
  for(let i=0; i<=numRungs; i++) {
    let y = startY + (i / numRungs) * height;
    let angle = y * freq;
    for(let j=0; j<dotsPerRung; j++) {
       let lerp = (j / dotsPerRung) * 2 - 1; // От -1 до 1
       dnaBases.push({ y: y, angle: angle, lerp: lerp, isRung: true });
    }
  }

  // Привязываем частицы к точкам базы ДНК
  for (let i = 0; i < dnaBases.length; i++) {
    particles.push({
      x: Math.random() * w, 
      y: Math.random() * h,
      base: dnaBases[i],
      vx: (Math.random() - 0.5) * 3, 
      vy: (Math.random() - 0.5) * 3,
      rad: Math.random() * 1.5 + 1.2, 
      alpha: Math.random() * 0.5 + 0.3
    });
  }
}

function updateAndRenderStage() {
  requestAnimationFrame(updateAndRenderStage);
  ctx.clearRect(0, 0, w, h);
  let time = Date.now() * 0.001; // Глобальное время для вращения

  particles.forEach((p, idx) => {
    let scale = 1; // По умолчанию плоские

    if (currentStage === 'loader') {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }
    else if (currentStage === 'assemble') {
      let b = p.base;
      let currentAngle = b.angle + (time * 0.8); // ДНК медленно вращается вокруг оси
      let targetX, targetY, targetZ;
      let dnaRadius = w < 768 ? 50 : 110;

      if(b.isRung) {
          targetX = Math.sin(currentAngle) * (dnaRadius * b.lerp);
          targetZ = Math.cos(currentAngle) * (dnaRadius * b.lerp);
      } else {
          targetX = Math.sin(currentAngle) * dnaRadius;
          targetZ = Math.cos(currentAngle) * dnaRadius;
      }
      
      // Наклоняем всю ДНК по диагонали (-45 градусов для эффекта как на фото)
      let tilt = -Math.PI / 5;
      let rotX = targetX * Math.cos(tilt) - b.y * Math.sin(tilt);
      let rotY = targetX * Math.sin(tilt) + b.y * Math.cos(tilt);
      
      // Вычисляем финальные координаты на экране
      let finalX = (w / 2) + rotX;
      let finalY = (h / 2) + rotY;
      
      // Псевдо-3D глубина (частицы сзади меньше и темнее, спереди ярче)
      scale = (targetZ + 300) / 300; 
      
      // Плавное притяжение
      let speedFactor = 0.03 + (assembleProgress * 0.07);
      p.x += (finalX - p.x) * speedFactor;
      p.y += (finalY - p.y) * speedFactor;
    }
    else if (currentStage === 'hero') {
      p.x += p.vx * 0.5; p.y += p.vy * 0.5;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      // Связи нейросети на главном экране
      if (window.innerWidth > 768 && idx < 150) {
        for (let j = idx + 1; j < 150; j++) {
          let dist = Math.hypot(p.x - particles[j].x, p.y - particles[j].y);
          if (dist < 130) {
            ctx.beginPath(); ctx.strokeStyle = `rgba(0, 212, 255, ${0.15 * (1 - dist/130)})`;
            ctx.lineWidth = 0.5; ctx.moveTo(p.x, p.y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
          }
        }
      }
    }
    else if (currentStage === 'manifesto') {
      let colX = (idx % 8) * (w / 7) + 50;
      p.x += (colX - p.x) * 0.04; p.y += p.vy * 0.6;
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

    // Отрисовка с учетом 3D перспективы
    ctx.beginPath(); 
    ctx.arc(p.x, p.y, Math.max(0.1, p.rad * scale), 0, Math.PI * 2);
    
    if (currentStage === 'assemble') {
      let baseAlpha = 0.3 + (assembleProgress * 0.7);
      ctx.fillStyle = `rgba(0, 212, 255, ${Math.max(0.1, scale * baseAlpha)})`;
      ctx.shadowBlur = 12 * scale * assembleProgress; 
      ctx.shadowColor = "rgba(0, 212, 255, 0.8)";
    } else {
      ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`;
      ctx.shadowBlur = 0;
    }
    
    ctx.fill();
  });
}
initEngine(); updateAndRenderStage(); window.addEventListener('resize', initEngine);

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

// 6. ЗАПУСК ДНК И ВЗРЫВ ПОД ДРОП
const authBtn = document.getElementById('auth-btn');
const triggerStage = document.getElementById('trigger-stage');
const flashEffect = document.getElementById('flash-effect');

authBtn.addEventListener('click', () => {
  soundtrack.play(); // Запуск аудио

  // Растворение кнопки
  gsap.to(triggerStage, { opacity: 0, duration: 0.5, onComplete: () => {
    triggerStage.style.display = 'none';
    currentStage = 'assemble'; // Начинаем сборку ДНК
  }});

  // Наращиваем силу притяжения частиц в течение 5.5 сек
  gsap.to({ progress: 0 }, {
    progress: 1,
    duration: 5.5,
    ease: "power1.inOut",
    onUpdate: function() {
      assembleProgress = this.targets()[0].progress;
    }
  });

  // ВЗРЫВ РОВНО НА 5.8 СЕКУНДЕ
  gsap.delayedCall(5.8, () => {
    triggerExplosionWithFlash();
  });
});

function triggerExplosionWithFlash() {
  // Эффект ослепляющей фотовспышки
  gsap.fromTo(flashEffect, { opacity: 1 }, { opacity: 0, duration: 1.2, ease: "power2.out" });

  // Взрывная волна частиц во все стороны
  particles.forEach(p => {
    let angle = Math.random() * Math.PI * 2;
    let force = Math.random() * 45 + 20; 
    p.vx = Math.cos(angle) * force; 
    p.vy = Math.sin(angle) * force;
  });
  currentStage = 'loader';

  // Убираем черный фон прелоадера
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

  // Анимация размытия для текстов
  const tl = gsap.timeline({ delay: 0.4 });
  tl.fromTo('.animate-blur', { filter: 'blur(20px)', y: 40, opacity: 0 }, { filter: 'blur(0px)', y: 0, opacity: 1, duration: 1.4, stagger: 0.2, ease: 'power4.out' });

  initTextTriggers();
  initTiltCards();
  initDecodeEffect();
}

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
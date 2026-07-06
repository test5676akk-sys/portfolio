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

// 4. ГРАФИЧЕСКИЙ ДВИЖОК CANVAS (ПОВЫШЕННАЯ ПЛОТНОСТЬ ТОЧЕК ИМЕНИ)
const canvas = document.getElementById('stage-canvas');
const ctx = canvas.getContext('2d');
let w, h, particles = [];
let currentStage = 'loader';
let assembleProgress = 0; // Фактор разгона сборки от 0 до 1

const nameMatrix = [
  // БУКВА "И" (Сверхплотная калибровка линий)
  {x:10,y:10},{x:10,y:11},{x:10,y:12},{x:10,y:13},{x:10,y:14},{x:10,y:15},{x:10,y:16},{x:10,y:17},{x:10,y:18},{x:10,y:19},{x:10,y:20},{x:10,y:21},{x:10,y:22},{x:10,y:23},{x:10,y:24},{x:10,y:25},{x:10,y:26},{x:10,y:27},{x:10,y:28},{x:10,y:29},{x:10,y:30},
  {x:11,y:10},{x:11,y:30},{x:11,y:29},{x:12,y:28},{x:13,y:27},{x:14,y:26},{x:15,y:25},{x:16,y:24},{x:17,y:23},{x:18,y:22},{x:19,y:21},{x:20,y:20},{x:21,y:19},{x:22,y:18},{x:23,y:17},{x:24,y:16},{x:25,y:15},{x:26,y:14},{x:27,y:13},{x:28,y:12},{x:29,y:11},{x:30,y:10},
  {x:30,y:11},{x:30,y:12},{x:30,y:13},{x:30,y:14},{x:30,y:15},{x:30,y:16},{x:30,y:17},{x:30,y:18},{x:30,y:19},{x:30,y:20},{x:30,y:21},{x:30,y:22},{x:30,y:23},{x:30,y:24},{x:30,y:25},{x:30,y:26},{x:30,y:27},{x:30,y:28},{x:30,y:29},{x:30,y:30},{x:31,y:10},{x:31,y:30},

  // БУКВА "Л" (Широкие, геометричные стойки)
  {x:38,y:12},{x:38,y:13},{x:38,y:14},{x:38,y:15},{x:38,y:16},{x:38,y:17},{x:38,y:18},{x:38,y:19},{x:38,y:20},{x:38,y:21},{x:38,y:22},{x:38,y:23},{x:38,y:24},{x:38,y:25},{x:38,y:26},{x:38,y:27},{x:38,y:28},{x:38,y:29},{x:38,y:30},{x:37,y:30},
  {x:39,y:11},{x:40,y:10},{x:41,y:10},{x:42,y:10},{x:43,y:11},{x:44,y:12},{x:45,y:13},{x:46,y:14},{x:47,y:15},{x:48,y:16},{x:49,y:17},{x:50,y:18},{x:51,y:19},{x:52,y:20},{x:53,y:21},{x:54,y:22},{x:55,y:23},{x:56,y:24},{x:57,y:25},{x:58,y:26},{x:59,y:27},{x:60,y:28},{x:61,y:29},{x:62,y:30},{x:63,y:30},

  // БУКВА "Ь" (Идеальное скругление нижнего кольца)
  {x:70,y:10},{x:70,y:11},{x:70,y:12},{x:70,y:13},{x:70,y:14},{x:70,y:15},{x:70,y:16},{x:70,y:17},{x:70,y:18},{x:70,y:19},{x:70,y:20},{x:70,y:21},{x:70,y:22},{x:70,y:23},{x:70,y:24},{x:70,y:25},{x:70,y:26},{x:70,y:27},{x:70,y:28},{x:70,y:29},{x:70,y:30},
  {x:71,y:20},{x:72,y:20},{x:73,y:20},{x:74,y:21},{x:75,y:22},{x:76,y:23},{x:76,y:24},{x:76,y:25},{x:76,y:26},{x:75,y:27},{x:74,y:28},{x:73,y:29},{x:72,y:30},{x:71,y:30},
  {x:71,y:10},{x:72,y:10},

  // БУКВА "Я" (Финальный росчерк ножки)
  {x:84,y:20},{x:84,y:21},{x:84,y:22},{x:84,y:23},{x:84,y:24},{x:84,y:25},{x:84,y:26},{x:84,y:27},{x:84,y:28},{x:84,y:29},{x:84,y:30},
  {x:85,y:20},{x:86,y:21},{x:87,y:22},{x:88,y:23},{x:89,y:24},{x:90,y:25},{x:91,y:26},{x:92,y:27},{x:93,y:28},{x:94,y:29},{x:95,y:30},
  {x:85,y:15},{x:86,y:15},{x:87,y:14},{x:88,y:13},{x:89,y:12},{x:88,y:11},{x:87,y:10},{x:86,y:10},{x:85,y:10},{x:84,y:11},{x:84,y:12},{x:84,y:13},{x:84,y:14},{x:84,y:15},
  {x:85,y:16},{x:86,y:17},{x:87,y:18},{x:88,y:19},{x:89,y:20}
];

function initEngine() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  particles = [];
  
  // Увеличиваем массив частиц для плотности прорисовки имени
  const count = window.innerWidth < 768 ? 200 : 450;
  
  for (let i = 0; i < count; i++) {
    let targetX = null, targetY = null;
    if (i < nameMatrix.length) {
      // Идеальное масштабирование имени по центру
      let scale = window.innerWidth < 768 ? 6.5 : 13.5;
      targetX = (nameMatrix[i].x - 52) * scale + (w / 2);
      targetY = (nameMatrix[i].y - 20) * scale + (h / 2);
    }
    
    particles.push({
      x: Math.random() * w, y: Math.random() * h,
      tx: targetX, ty: targetY,
      vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
      rad: Math.random() * 2 + 1, alpha: Math.random() * 0.5 + 0.3,
      angleOffset: Math.random() * Math.PI * 2
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
      if (p.tx !== null) {
        // Прогрессивный разгон сборки букв во времени
        let speedFactor = 0.03 + (assembleProgress * 0.12);
        
        // Магнитное притяжение к вектору буквы
        p.x += (p.tx - p.x) * speedFactor;
        p.y += (p.ty - p.y) * speedFactor;
        
        // Эффект кибернетической вибрации перед взрывом (нарастает к 5-й секунде)
        if (assembleProgress > 0.7) {
          p.x += Math.sin(Date.now() * 0.05 + p.angleOffset) * (assembleProgress * 1.5);
          p.y += Math.cos(Date.now() * 0.05 + p.angleOffset) * (assembleProgress * 1.5);
        }
      } else {
        // Частицы без целей плавно вращаются туманностью вокруг центра
        let angle = 0.005;
        let dx = p.x - w/2; let dy = p.y - h/2;
        p.x = w/2 + dx * Math.cos(angle) - dy * Math.sin(angle);
        p.y = h/2 + dx * Math.sin(angle) + dy * Math.cos(angle);
      }
    }
    else if (currentStage === 'hero') {
      p.x += p.vx * 0.6; p.y += p.vy * 0.6;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      if (window.innerWidth > 768) {
        for (let j = idx + 1; j < particles.length; j++) {
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
      let gridX = (idx % 15) * (w / 14);
      let gridY = Math.floor(idx / 15) * (h / 12) + 40;
      p.x += (gridX - p.x) * 0.1; p.y += (gridY - p.y) * 0.1;
    }
    else if (currentStage === 'cases' || currentStage === 'footer') {
      p.x += (mX - p.x) * (0.02 + (idx * 0.0003));
      p.y += (mY - p.y) * (0.02 + (idx * 0.0003));
    }

    ctx.beginPath(); ctx.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
    
    // Подсветка букв во время финальной сборки
    if (currentStage === 'assemble' && p.tx !== null) {
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

// 6. ХАКЕРСКИЙ ЗАПУСК И СБОРКА ИМЕНИ ПОД ДРОП
const authBtn = document.getElementById('auth-btn');
const triggerStage = document.getElementById('trigger-stage');
const flashEffect = document.getElementById('flash-effect');

authBtn.addEventListener('click', () => {
  soundtrack.play(); // Старт музыки

  // Плавное растворение стартового оверлея
  gsap.to(triggerStage, { opacity: 0, duration: 0.5, onComplete: () => {
    triggerStage.style.display = 'none';
    currentStage = 'assemble'; // Переключение Canvas на векторную матрицу букв
  }});

  // График разгона физики притяжения частиц (нарастает плавно в течение 5.5 секунд)
  gsap.to({ progress: 0 }, {
    progress: 1,
    duration: 5.5,
    ease: "power1.in",
    onUpdate: function() {
      assembleProgress = this.targets()[0].progress;
    }
  });

  // ИДЕАЛЬНЫЙ СИНХРОН С ДРОПОМ ТРЕКА НА 6-Й СЕКУНДЕ (5800 мс)
  gsap.delayedCall(5.8, () => {
    triggerExplosionWithFlash();
  });
});

function triggerExplosionWithFlash() {
  // 1. Активируем белый Glow-взрыв по экрану
  gsap.fromTo(flashEffect, { opacity: 1 }, { opacity: 0, duration: 0.8, ease: "power2.out" });

  // 2. Расталкиваем частицы взрывной волной из центра имени
  particles.forEach(p => {
    let angle = Math.random() * Math.PI * 2;
    let force = Math.random() * 30 + 20; // Увеличенная сила детонации
    p.vx = Math.cos(angle) * force; 
    p.vy = Math.sin(angle) * force;
  });
  currentStage = 'loader';

  // 3. Вышвыриваем прелоадер из дерева
  gsap.to('#preloader', {
    scale: 2.5, opacity: 0, duration: 1.0, ease: 'expo.out',
    onComplete: () => {
      document.getElementById('preloader').remove();
      currentStage = 'hero';
      bindScrollStages();
    }
  });

  // 4. Проявляем интерфейс портфолио
  gsap.to('.main-wrapper', { opacity: 1, duration: 0.1, delay: 0.2 });
  document.querySelector('.main-wrapper').style.pointerEvents = 'auto';

  const tl = gsap.timeline({ delay: 0.4 });
  tl.fromTo('.animate-blur', { filter: 'blur(20px)', y: 40, opacity: 0 }, { filter: 'blur(0px)', y: 0, opacity: 1, duration: 1.4, stagger: 0.2, ease: 'power4.out' });

  initTextTriggers();
  initTiltCards();
  initDecodeEffect();
}

function initTextTriggers() {
  document.querySelectorAll('.scroll-reveal').forEach(el => {
    gsap.to(el, {
      y: 0, opacity: 1, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
    });
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
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5 });
    });
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
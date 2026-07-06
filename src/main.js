import './style.css';

gsap.registerPlugin(ScrollTrigger);

// 1. ЗВУКОВОЙ ПРОТОКОЛ
const soundtrack = new Howl({
  src: ['/track.mp3'],
  loop: true,
  volume: 0.55,
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

// 4. ГРАФИЧЕСКИЙ ДВИЖОК CANVAS
const canvas = document.getElementById('stage-canvas');
const ctx = canvas.getContext('2d');
let w, h, particles = [];
let currentStage = 'loader';

const nameMatrix = [
  {x:12,y:10},{x:12,y:11},{x:12,y:12},{x:12,y:13},{x:12,y:14},{x:12,y:15},{x:12,y:16},{x:12,y:17},{x:12,y:18},{x:12,y:19},{x:12,y:20},{x:12,y:21},{x:12,y:22},{x:12,y:23},{x:12,y:24},{x:12,y:25},{x:12,y:26},{x:12,y:27},{x:12,y:28},{x:12,y:29},{x:12,y:30}, // И
  {x:13,y:29},{x:14,y:28},{x:15,y:27},{x:16,y:26},{x:17,y:25},{x:18,y:24},{x:19,y:23},{x:20,y:22},{x:21,y:21},{x:22,y:20},{x:23,y:19},{x:24,y:18},{x:25,y:17},{x:26,y:16},{x:27,y:15},{x:28,y:14},{x:29,y:13},{x:30,y:12},{x:31,y:11},{x:32,y:10},
  {x:32,y:11},{x:32,y:12},{x:32,y:13},{x:32,y:14},{x:32,y:15},{x:32,y:16},{x:32,y:17},{x:32,y:18},{x:32,y:19},{x:32,y:20},{x:32,y:21},{x:32,y:22},{x:32,y:23},{x:32,y:24},{x:32,y:25},{x:32,y:26},{x:32,y:27},{x:32,y:28},{x:32,y:29},{x:32,y:30},
  
  {x:38,y:10},{x:38,y:11},{x:38,y:12},{x:38,y:13},{x:38,y:14},{x:38,y:15},{x:38,y:16},{x:38,y:17},{x:38,y:18},{x:38,y:19},{x:38,y:20},{x:38,y:21},{x:38,y:22},{x:38,y:23},{x:38,y:24},{x:38,y:25},{x:38,y:26},{x:38,y:27},{x:38,y:28},{x:38,y:29},{x:38,y:30}, // Л
  {x:39,y:10},{x:40,y:10},{x:41,y:11},{x:42,y:12},{x:43,y:13},{x:44,y:14},{x:45,y:15},{x:46,y:16},{x:47,y:17},{x:48,y:18},{x:49,y:19},{x:50,y:20},{x:51,y:21},{x:52,y:22},{x:53,y:23},{x:54,y:24},{x:55,y:25},{x:56,y:26},{x:57,y:27},{x:58,y:28},{x:59,y:29},{x:60,y:30},
  
  {x:66,y:10},{x:66,y:11},{x:66,y:12},{x:66,y:13},{x:66,y:14},{x:66,y:15},{x:67,y:10},{x:68,y:10},{x:69,y:11},{x:70,y:12},{x:71,y:13},{x:72,y:14},{x:72,y:15},{x:72,y:16},{x:72,y:17},{x:71,y:18},{x:70,y:19},{x:69,y:20},{x:68,y:20},{x:67,y:20},{x:66,y:20}, // Ь
  {x:66,y:21},{x:66,y:22},{x:66,y:23},{x:66,y:24},{x:66,y:25},{x:66,y:26},{x:66,y:27},{x:66,y:28},{x:66,y:29},{x:66,y:30},
  {x:67,y:30},{x:68,y:30},{x:69,y:29},{x:70,y:28},{x:71,y:27},{x:72,y:26},{x:72,y:25},{x:72,y:24},{x:72,y:23},{x:72,y:22},{x:71,y:21},{x:70,y:20},
  
  {x:78,y:26},{x:78,y:27},{x:78,y:28},{x:78,y:29},{x:78,y:30},{x:79,y:25},{x:80,y:24},{x:81,y:23},{x:82,y:22},{x:83,y:21},{x:84,y:20},{x:85,y:19},{x:86,y:18},{x:87,y:17},{x:88,y:16},{x:89,y:15},{x:90,y:14},{x:91,y:13},{x:92,y:12},{x:93,y:11},{x:94,y:10}, // Я
  {x:85,y:20},{x:86,y:21},{x:87,y:22},{x:88,y:23},{x:89,y:24},{x:90,y:25},{x:91,y:26},{x:92,y:27},{x:93,y:28},{x:94,y:29},{x:95,y:30},
  {x:84,y:15},{x:83,y:15},{x:82,y:14},{x:81,y:13},{x:80,y:12},{x:79,y:12},{x:78,y:13},{x:78,y:14},{x:79,y:15},{x:80,y:16},{x:81,y:17},{x:82,y:17},{x:83,y:17},{x:84,y:16}
];

function initEngine() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  particles = [];
  const count = window.innerWidth < 768 ? 80 : 220;
  
  for (let i = 0; i < count; i++) {
    let targetX = null, targetY = null;
    if (i < nameMatrix.length) {
      targetX = (nameMatrix[i].x - 53) * (window.innerWidth < 768 ? 6 : 12) + (w / 2);
      targetY = (nameMatrix[i].y - 20) * (window.innerWidth < 768 ? 6 : 12) + (h / 2);
    }
    
    particles.push({
      x: Math.random() * w, y: Math.random() * h,
      tx: targetX, ty: targetY,
      vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
      rad: Math.random() * 2.5 + 1, alpha: Math.random() * 0.4 + 0.3
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
        p.x += (p.tx - p.x) * 0.08; p.y += (p.ty - p.y) * 0.08;
      } else {
        p.x += p.vx * 0.2; p.y += p.vy * 0.2;
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
      p.x += (colX - p.x) * 0.05;
      p.y += p.vy * 0.8;
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
    ctx.fillStyle = currentStage === 'assemble' ? `rgba(0, 255, 136, 0.95)` : `rgba(0, 255, 136, ${p.alpha})`;
    ctx.fill();
    
    if (currentStage === 'assemble' && p.tx !== null) {
      ctx.shadowBlur = 15; ctx.shadowColor = "var(--cyber-green)";
    } else {
      ctx.shadowBlur = 0;
    }
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

// 6. ХАКЕРСКИЕ ЛОГИ И ИСПРАВЛЕННЫЙ ЗАПУСК
const authBtn = document.getElementById('auth-btn');
const triggerStage = document.getElementById('trigger-stage'); // ИСПРАВЛЕНО: раньше было auth-block
const matrixStage = document.getElementById('matrix-stage');
const termLogs = document.getElementById('term-logs');
const percentVal = document.getElementById('percent-val');

const systemLogs = [
  "CONNECTING TO RPC NODE: https://api.mainnet-beta.solana.com...",
  "EXTRACTING SMART-CONTRACT STRUCTS... OK",
  "DECRYPTING EASYTOPAY MERCHANT WEBHOOK GATEWAY...",
  "INITIALIZING C# CORE RUNTIME AND MS SQL COMPILER...",
  "BYPASSING FRAMEWORKS ARCHITECTURE... AUTONOMY ON",
  "DEVRUN: ALL INFRASTRUCTURE SYSTEMS STABLE."
];

authBtn.addEventListener('click', () => {
  soundtrack.play();

  // Теперь скрывается правильный контейнер
  gsap.to(triggerStage, { opacity: 0, duration: 0.4, onComplete: () => {
    triggerStage.style.display = 'none';
    matrixStage.style.display = 'block';
    gsap.to(matrixStage, { opacity: 1, duration: 0.4 });
    currentStage = 'assemble';
  }});

  let lIdx = 0;
  const logTimer = setInterval(() => {
    if (lIdx < systemLogs.length) {
      termLogs.innerHTML += `> ${systemLogs[lIdx]}<br>`;
      lIdx++;
    }
  }, 700);

  gsap.to({ val: 0 }, {
    val: 100, duration: 5, ease: 'power2.inOut',
    onUpdate: function() { percentVal.innerText = `${Math.round(this.targets()[0].val)}%`; },
    onComplete: () => { clearInterval(logTimer); explosionTransition(); }
  });
});

function explosionTransition() {
  particles.forEach(p => {
    let angle = Math.random() * Math.PI * 2;
    let force = Math.random() * 25 + 15;
    p.vx = Math.cos(angle) * force; p.vy = Math.sin(angle) * force;
  });
  currentStage = 'loader';

  gsap.to('#preloader', {
    scale: 2, opacity: 0, duration: 1.2, ease: 'expo.inOut',
    onComplete: () => {
      document.getElementById('preloader').remove();
      currentStage = 'hero';
      bindScrollStages();
    }
  });

  gsap.to('.main-wrapper', { opacity: 1, duration: 0.1, delay: 0.4 });
  document.querySelector('.main-wrapper').style.pointerEvents = 'auto';

  const tl = gsap.timeline({ delay: 0.6 });
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
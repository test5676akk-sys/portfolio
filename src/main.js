import './style.css'; 

gsap.registerPlugin(ScrollTrigger);

// 1. ИНИЦИАЛИЗАЦИЯ АУДИО
const soundtrack = new Howl({
  src: ['/track.mp3'], // Убедись, что трек в папке public!
  loop: true,
  volume: 0.6
});

// 2. ПЛАВНЫЙ СКРОЛЛ (LENIS)
const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time)=>{ lenis.raf(time * 1000) });
gsap.ticker.lagSmoothing(0);

// 3. КАСТОМНЫЙ КУРСОР
const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');
let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2, posX = mouseX, posY = mouseY;

if (window.matchMedia("(hover: hover)").matches) {
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    gsap.to(cursor, { x: mouseX, y: mouseY, duration: 0.1 });
  });
  gsap.ticker.add(() => {
    posX += (mouseX - posX) / 6; posY += (mouseY - posY) / 6;
    gsap.set(cursorFollower, { x: posX, y: posY });
  });
  document.querySelectorAll('.interactive, button, a').forEach(el => {
    el.addEventListener('mouseenter', () => cursorFollower.classList.add('cursor-active'));
    el.addEventListener('mouseleave', () => cursorFollower.classList.remove('cursor-active'));
  });
}

// 4. ИНТЕРАКТИВНЫЙ CANVAS (WEB3 СЕТЬ)
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let width, height, particles;

function initCanvas() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  particles = [];
  const count = window.innerWidth < 768 ? 40 : 100;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width, y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2
    });
  }
}
function animateCanvas() {
  requestAnimationFrame(animateCanvas);
  ctx.clearRect(0, 0, width, height);
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > width) p.vx *= -1;
    if (p.y < 0 || p.y > height) p.vy *= -1;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 255, 136, 0.5)'; ctx.fill();
  });
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 150) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 255, 136, ${0.15 * (1 - distance / 150)})`;
        ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}
initCanvas(); animateCanvas(); window.addEventListener('resize', initCanvas);

// 5. ЛОГИКА 5-СЕКУНДНОЙ ЗАГРУЗКИ ПОД ТРЕК
const enterBtn = document.getElementById('enter-btn');
const authBlock = document.getElementById('auth-block');
const loadingBlock = document.getElementById('loading-block');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const terminalLogs = document.getElementById('terminal-logs');
const preloader = document.getElementById('preloader');
const mainWrapper = document.querySelector('.main-wrapper');

const logs = [
  "ПОДКЛЮЧЕНИЕ К СЕТИ SOLANA...", "ПРОВЕРКА ВАЛИДНОСТИ СМАРТ-КОНТРАКТОВ...",
  "ЗАПУСК ИИ-АССИСТЕНТОВ...", "ИНТЕГРАЦИЯ ПЛАТЕЖЕЙ EASYTOPAY... УСПЕШНО",
  "КОМПИЛЯЦИЯ WPF ИНТЕРФЕЙСОВ...", "СИНХРОНИЗАЦИЯ MS SQL SERVER...",
  "ОБХОД СТАНДАРТНЫХ ШАБЛОНОВ...", "СИСТЕМА ГОТОВА. ДОБРО ПОЖАЛОВАТЬ."
];

enterBtn.addEventListener('click', () => {
  // 5.1 Запускаем музыку
  soundtrack.play();

  // 5.2 Прячем кнопку, показываем лоадер
  gsap.to(authBlock, { opacity: 0, duration: 0.5, onComplete: () => {
    authBlock.style.display = 'none';
    loadingBlock.style.display = 'block';
    gsap.to(loadingBlock, { opacity: 1, duration: 0.5 });
  }});

  // 5.3 Имитация логов терминала во время загрузки
  let logIndex = 0;
  const logInterval = setInterval(() => {
    if (logIndex < logs.length) {
      terminalLogs.innerHTML += `> ${logs[logIndex]}<br>`;
      terminalLogs.scrollTop = terminalLogs.scrollHeight;
      logIndex++;
    }
  }, 600); // Логи печатаются примерно 5 секунд

  // 5.4 Ползунок на ровно 5 секунд (5000 мс)
  gsap.to(progressBar, {
    width: '100%',
    duration: 5,
    ease: 'power1.inOut',
    onUpdate: function() {
      progressText.innerText = `${Math.round(this.progress() * 100)}%`;
    },
    onComplete: () => {
      clearInterval(logInterval);
      revealSite();
    }
  });
});

// 6. ОТКРЫТИЕ САЙТА
function revealSite() {
  // Зум-эффект ухода лоадера
  gsap.to(preloader, {
    scale: 3, opacity: 0, duration: 1.2, ease: 'power4.inOut',
    onComplete: () => preloader.remove()
  });

  // Показ сайта
  gsap.to(mainWrapper, { opacity: 1, duration: 0.1, delay: 0.5 });
  mainWrapper.style.pointerEvents = 'auto';

  // Анимация шапки
  const tl = gsap.timeline({ delay: 0.8 });
  tl.fromTo('.subtitle', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' })
    .fromTo('.title-main', { scale: 0.9, opacity: 0, filter: 'blur(10px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 1.5, ease: 'expo.out' }, "-=0.6")
    .fromTo('.tech-stack span', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' }, "-=1");

  // Инициализация скролл-анимаций
  initScrollAnimations();
}

// 7. SCROLL TRIGGER АНИМАЦИИ
function initScrollAnimations() {
  const scrollElements = document.querySelectorAll('.scroll-fade');
  scrollElements.forEach((el) => {
    gsap.fromTo(el, 
      { y: 80, opacity: 0 },
      { 
        y: 0, opacity: 1, duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
      }
    );
  });
}
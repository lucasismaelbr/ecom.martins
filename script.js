/* ═══════════════════════════════════════════════════════════════════════════
   Lucas Martins — script.js
   Mobile menu · Scroll animations · Sticky navbar shadow · Footer year
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Footer year ──────────────────────────────────────────────────────── */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── Mobile menu toggle ───────────────────────────────────────────────── */
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-link, .mobile-cta');
  let menuOpen = false;

  function openMenu() {
    menuOpen = true;
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-label', 'Close menu');
    menuToggle.setAttribute('aria-expanded', 'true');
    // Animate hamburger → X
    const spans = menuToggle.querySelectorAll('.menu-icon span');
    spans[0].style.transform = 'translateY(7px) rotate(45deg)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
  }

  function closeMenu() {
    menuOpen = false;
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-label', 'Open menu');
    menuToggle.setAttribute('aria-expanded', 'false');
    // Restore hamburger
    const spans = menuToggle.querySelectorAll('.menu-icon span');
    spans[0].style.transform = '';
    spans[1].style.opacity = '';
    spans[2].style.transform = '';
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => menuOpen ? closeMenu() : openMenu());

    // Close when a mobile link is clicked
    mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

    // Close on Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menuOpen) closeMenu();
    });
  }

  /* ── Sticky navbar shadow on scroll ──────────────────────────────────── */
  const navbar = document.getElementById('navbar');
  function handleNavScroll() {
    if (!navbar) return;
    if (window.scrollY > 20) {
      navbar.style.boxShadow = '0 4px 32px rgba(0,0,0,.5)';
    } else {
      navbar.style.boxShadow = '';
    }
  }
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  /* ── Scroll fade-up + reveal animations (Intersection Observer) ────────── */
  const REVEAL_SELECTOR = [
    '.fade-up',
    '.reveal-left',
    '.reveal-right',
    '.reveal-up',
    '.reveal-zoom',
    '.reveal-flip',
    '.reveal-fade',
    '.reveal-bounce',
  ].join(', ');

  const fadeEls = document.querySelectorAll(REVEAL_SELECTOR);

  if ('IntersectionObserver' in window && fadeEls.length) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    fadeEls.forEach(el => observer.observe(el));
  } else {
    // Fallback: show all immediately
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  /* ── Smooth active nav link highlight on scroll ───────────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  function updateActiveLink() {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 90;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();

  /* ── Contact form async submit ────────────────────────────────────────── */
  const contactForm   = document.getElementById('contact-form');
  const submitBtn     = document.getElementById('form-submit-btn');
  const formFeedback  = document.getElementById('form-feedback');

  if (contactForm && submitBtn && formFeedback) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Basic HTML5 validation
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      // Loading state
      const originalLabel = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true" style="animation:spin .8s linear infinite">
          <circle cx="12" cy="12" r="10" stroke-opacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
        Enviando…`;
      formFeedback.textContent = '';
      formFeedback.className = 'form-feedback';

      try {
        const data = new FormData(contactForm);
        // Tell FormSubmit to respond in JSON so we can stay on page
        data.append('_next', 'false');

        const res = await fetch(contactForm.action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok || res.status === 200) {
          formFeedback.textContent = '✅ Mensagem enviada! Entraremos em contato em breve.';
          formFeedback.className = 'form-feedback success';
          contactForm.reset();
        } else {
          throw new Error('Servidor retornou erro ' + res.status);
        }
      } catch (err) {
        formFeedback.textContent = '❌ Erro ao enviar. Tente pelo WhatsApp ou tente novamente.';
        formFeedback.className = 'form-feedback error';
        console.error('[ContactForm]', err);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalLabel;
      }
    });
  }

  /* ── Encrypt / Scramble button effect ───────────────────────────────── */
  const SCRAMBLE_CHARS = '!@#$%^&*(){}|<>/?ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const CYCLES_PER_LETTER = 3;
  const SHUFFLE_MS = 30;

  // Detect touch-primary devices once
  const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  function initEncryptBtn(btn) {
    const target   = btn.dataset.scramble || '';
    const textEl   = btn.querySelector('.btn-text');
    if (!textEl || !target) return;

    const originalText = textEl.textContent.trim();
    let intervalId     = null;

    /* ── Scramble forward (reveals target text) ── */
    function scrambleForward(onComplete) {
      let pos = 0;
      clearInterval(intervalId);
      intervalId = setInterval(() => {
        const result = target.split('').map((char, idx) => {
          if (char === ' ') return ' ';
          if (pos / CYCLES_PER_LETTER > idx) return char;
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }).join('');
        textEl.textContent = result;
        pos++;
        if (pos >= target.length * CYCLES_PER_LETTER) {
          clearInterval(intervalId);
          textEl.textContent = target;
          if (onComplete) onComplete();
        }
      }, SHUFFLE_MS);
    }

    /* ── Scramble back (restores original text) ── */
    function scrambleBack() {
      clearInterval(intervalId);
      let pos = target.length * CYCLES_PER_LETTER;
      intervalId = setInterval(() => {
        const result = originalText.split('').map((char, idx) => {
          if (char === ' ') return ' ';
          const revIdx = originalText.length - 1 - idx;
          if (pos / CYCLES_PER_LETTER < revIdx) {
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          }
          return char;
        }).join('');
        textEl.textContent = result;
        pos--;
        if (pos <= 0) { clearInterval(intervalId); textEl.textContent = originalText; }
      }, SHUFFLE_MS);
    }

    if (isTouchDevice) {
      /* ── Touch mode: tap triggers scramble once, auto-restores ── */
      btn.addEventListener('touchstart', () => {
        btn.classList.add('btn-encrypt--touching');
        scrambleForward(() => {
          // After scramble completes, wait briefly then restore
          setTimeout(() => {
            scrambleBack();
            // Remove CSS class after visual effects finish
            setTimeout(() => btn.classList.remove('btn-encrypt--touching'), 600);
          }, 350);
        });
      }, { passive: true });

    } else {
      /* ── Desktop/mouse mode: hover triggers scramble ── */
      btn.addEventListener('mouseenter', () => scrambleForward(null));
      btn.addEventListener('mouseleave', scrambleBack);
      btn.addEventListener('focus',      () => scrambleForward(null));
      btn.addEventListener('blur',       scrambleBack);
    }
  }

  document.querySelectorAll('.btn-encrypt').forEach(initEncryptBtn);

  /* ── Spin keyframe (for loading icon) ───────────────────────────────────*/
  if (!document.getElementById('spin-keyframes')) {
    const style = document.createElement('style');
    style.id = 'spin-keyframes';
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }

})();


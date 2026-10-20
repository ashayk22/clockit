const fs = require('fs');

const mainJsCode = `import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MusicController } from './music/MusicController.js';
import { MusicState, PROVIDERS } from './music/MusicState.js';

gsap.registerPlugin(ScrollTrigger);

// Check if running on Safari for specific easing adjustments
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// ============================================================================
// STEEP HERO SCROLL-PIN TIMELINE SETUP
// ============================================================================

function initSteepHeroAnimation() {
  const container = document.getElementById('hero-scroll-container');
  const stage = document.getElementById('hero-stage');
  const bgLayer = document.getElementById('hero-bg-layer');
  const textBlock = document.getElementById('hero-text-block');
  const appFrame = document.getElementById('hero-app-frame');
  const contentStart = document.getElementById('app-content-start');
  const contentDocked = document.getElementById('app-content-docked');
  
  // Floating Artifacts
  const pinkBlock = document.getElementById('hero-pink-block');
  const blueBlock = document.getElementById('hero-blue-block');
  const grayBlock = document.getElementById('hero-gray-block');
  const aiComposer = document.getElementById('hero-ai-composer');
  const cursorLeft = document.getElementById('hero-cursor-left');
  const carousel = document.getElementById('hero-carousel');

  if (!container || !stage || !appFrame) return;

  // Responsive dimensions & scale calculation
  function getMeasurements() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Smooth adaptive scale factor for various desktop resolutions
    const scaleFactor = (width === 0 || width >= 1440) 
      ? 1 
      : Math.max((width - 80) / 1360, 0.72);
      
    const a = Math.max(0, Math.min(1, (height - 800) / 400));
    
    return {
      scaleFactor,
      width,
      height,
      containerHeight: 1480 * scaleFactor,
      yOffset: 160 * a
    };
  }

  let { scaleFactor, width, containerHeight, yOffset: ea } = getMeasurements();

  // Set initial stage container sizing
  gsap.set(container, { height: containerHeight });
  gsap.set(stage, {
    xPercent: -50,
    x: 0,
    y: 0,
    scale: scaleFactor,
    transformOrigin: "top center"
  });

  // Mobile/tablet fallback for small viewports
  if (width < 1024) {
    gsap.set(stage, { position: "relative", left: "auto", xPercent: 0, x: 0, scale: 1, width: "100%" });
    gsap.set(textBlock, { position: "relative", top: "auto", left: "auto", transform: "none", width: "100%", padding: "120px 20px 40px" });
    gsap.set(appFrame, { width: "100%", maxWidth: "100%", margin: "0 auto", height: "auto", opacity: 1, y: 0, scale: 1 });
    gsap.set([pinkBlock, blueBlock, grayBlock, aiComposer], { display: "none" });
    gsap.set(contentDocked, { opacity: 1, position: "relative", top: 0, left: 0, right: 0 });
    gsap.set(contentStart, { display: "none" });
    if (carousel) gsap.set(carousel, { position: "relative", left: 0, width: "100%" });
    return;
  }

  // Exact Steep coordinate models
  const P = (e) => ({ opacity: 1, y: 0 + e });
  const O = { opacity: 0, scale: 0.55, y: -260, duration: 0.5 };
  const z = { scale: 0.82, y: 800, opacity: 0 };
  const M = { scale: 1, y: 200, opacity: 1 };
  const F = { y: 800 };
  const D = { y: 280 };
  
  // Right Peach Registrations Card: floats to the right of headline
  const G = (e) => ({ x: 1040, y: -590 + e });
  const L = { x: 860, y: M.y - 600 }; // docks into right column
  
  // Left Region/Workspaces Card: floats to the left flank
  const B = (e) => ({ x: -160, y: -640 + e });
  const V = { x: 247, y: M.y - 600 }; // docks into left column
  
  // Bottom-Left Activation Card: floats below the left card
  const Z = (e) => ({ x: -40, y: -300 + e });
  const H = { x: 247, y: M.y - 354 };
  
  // Bottom AI Composer: centered beneath the headline & CTAs
  const q = (e) => ({ opacity: 1, x: 370, y: -190 + e, width: 460 });
  const W = { x: 248, y: M.y - 740, width: 600 };

  const K = { y: 0 };
  const Y = { y: -130 };
  const Q = { opacity: 0, top: 28, left: 300, y: 200 };

  // Initial placements
  const initialP = P(ea);
  const initialG = G(ea);
  const initialB = B(ea);
  const initialZ = Z(ea);
  const initialq = q(ea);

  gsap.set(appFrame, z);
  if (pinkBlock) gsap.set(pinkBlock, initialG);
  if (blueBlock) gsap.set(blueBlock, initialB);
  if (grayBlock) gsap.set(grayBlock, initialZ);
  if (aiComposer) gsap.set(aiComposer, initialq);
  if (textBlock) gsap.set(textBlock, initialP);
  if (carousel) gsap.set(carousel, F);
  if (bgLayer) gsap.set(bgLayer, K);
  if (contentDocked) gsap.set(contentDocked, Q);

  // Master scrub timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: container,
      start: "top top",
      pin: true,
      scrub: isSafari ? 0.6 : 0.8,
      end: () => \`+=\${1.2 * containerHeight}\`,
      anticipatePin: 0.5,
      invalidateOnRefresh: true,
      refreshPriority: 1
    }
  });

  // 1. Text fades out, scales down, moves up
  if (textBlock) tl.fromTo(textBlock, initialP, O, 0);

  // 2. Main desktop app mockup glides up from y:800 to y:200 and scales to 1
  tl.fromTo(appFrame, z, M, 0);

  // 3. Background layer subtle parallax
  if (bgLayer) tl.fromTo(bgLayer, K, Y, 0);

  // 4. Logo ticker glides up to sit under the app mockup
  if (carousel) tl.fromTo(carousel, F, D, 0);

  // 5. Floating cards glide inwards towards their app docking points
  const shadowStart = { boxShadow: "0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)" };
  const shadowEnd   = { boxShadow: "none" };

  if (pinkBlock) tl.fromTo(pinkBlock, { ...initialG, ...shadowStart }, { ...L, ...shadowEnd }, 0);
  if (blueBlock) tl.fromTo(blueBlock, { ...initialB, ...shadowStart }, { ...V, ...shadowEnd }, 0);
  if (grayBlock) tl.fromTo(grayBlock, { ...initialZ, ...shadowStart }, { ...H, ...shadowEnd }, 0);
  if (aiComposer) tl.fromTo(aiComposer, { ...initialq, ...shadowStart }, { ...W, ...shadowEnd }, 0);

  // 6. AI Bar typing and morphing sequence
  const aiPlaceholder = document.getElementById('ai-placeholder-text');
  const aiTyped = document.getElementById('ai-typed-text');
  const aiIcons = document.getElementById('ai-icons-bar');
  const aiContainer = document.getElementById('ai-composer-container');

  if (aiPlaceholder) tl.fromTo(aiPlaceholder, { opacity: 1 }, { opacity: 0, duration: 0.2 }, 0);
  if (aiTyped) tl.to(aiTyped, { width: "auto", duration: 0.4, ease: "none", y: -4 }, 0.2);
  if (aiIcons) tl.to(aiIcons, { opacity: 0, duration: 0.2 }, 0.6);
  if (aiComposer) tl.to(aiComposer, { x: 594, width: 486, duration: 0.5, y: "-=80" }, 0.7);
  if (aiContainer) tl.to(aiContainer, { backgroundColor: "#F3F3F5", height: 45, duration: 0.5 }, 0.7);

  // 7. Floating cards blend into the app canvas and fade
  if (pinkBlock) tl.to(pinkBlock, { opacity: 0, duration: 0.3 }, 0.7);
  if (blueBlock) tl.to(blueBlock, { opacity: 0, duration: 0.3 }, 0.7);
  if (grayBlock) tl.to(grayBlock, { opacity: 0, duration: 0.3 }, 0.7);

  // 8. Start content fades out, live docked dashboard content fades in
  if (contentStart) tl.to(contentStart, { opacity: 0, duration: 0.3 }, 0.6);
  if (contentDocked) tl.to(contentDocked, { opacity: 1, y: 0, duration: 0.4 }, 0.7);
  const searchSlot = document.getElementById('docked-search-slot');
  if (searchSlot) tl.to(searchSlot, { opacity: 1, duration: 0.3 }, 0.75);

  // Handle window resizing
  window.addEventListener('resize', () => {
    const updated = getMeasurements();
    if (updated.width >= 1024) {
      gsap.set(container, { height: updated.containerHeight });
      gsap.set(stage, { xPercent: -50, x: 0, scale: updated.scaleFactor });
      ScrollTrigger.refresh();
    }
  });
}

// ============================================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================================

let toastTimeout = null;

export function showToast(message, duration = 3200) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-msg');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.hidden = false;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => {
      toast.hidden = true;
    }, 200);
  }, duration);
}

// ============================================================================
// REAL INTERACTIVE KANBAN BOARD DEMO
// ============================================================================

function initInteractiveKanbanBoard() {
  const grid = document.getElementById('kanban-grid');
  const stackTodo = document.getElementById('stack-todo');
  const stackInprogress = document.getElementById('stack-inprogress');
  const stackReview = document.getElementById('stack-review');
  const stackDone = document.getElementById('stack-done');
  const velocityEl = document.getElementById('live-velocity-count');
  const resetBtn = document.getElementById('reset-demo-board-btn');
  const addBtn = document.getElementById('add-demo-task-btn');

  if (!grid || !stackTodo || !stackInprogress || !stackReview || !stackDone) return;

  // Cache initial markup for instant reset
  const initialMarkup = {
    todo: stackTodo.innerHTML,
    inprogress: stackInprogress.innerHTML,
    review: stackReview.innerHTML,
    done: stackDone.innerHTML
  };

  function updateBoardMetrics() {
    const countTodo = stackTodo.querySelectorAll('.interactive-task-card').length;
    const countInprog = stackInprogress.querySelectorAll('.interactive-task-card').length;
    const countRev = stackReview.querySelectorAll('.interactive-task-card').length;
    const countDone = stackDone.querySelectorAll('.interactive-task-card').length;

    const elTodo = document.getElementById('count-todo');
    const elInprog = document.getElementById('count-inprogress');
    const elRev = document.getElementById('count-review');
    const elDone = document.getElementById('count-done');

    if (elTodo) elTodo.textContent = countTodo;
    if (elInprog) elInprog.textContent = countInprog;
    if (elRev) elRev.textContent = countRev;
    if (elDone) elDone.textContent = countDone;

    if (velocityEl) {
      let donePts = 0;
      let totalPts = 0;
      document.querySelectorAll('.interactive-task-card').forEach(card => {
        const pts = parseInt(card.getAttribute('data-points')) || 0;
        totalPts += pts;
        if (card.closest('#stack-done')) {
          donePts += pts;
        }
      });
      velocityEl.textContent = \`\${donePts} / \${totalPts} pts completed\`;
    }
  }

  function advanceCard(card) {
    const parentStack = card.parentElement;
    const taskId = card.getAttribute('data-id') || 'Task';
    const taskPts = card.getAttribute('data-points') || '3';
    const hintEl = card.querySelector('.task-action-hint, .task-done-badge');

    if (parentStack === stackTodo) {
      stackInprogress.appendChild(card);
      card.classList.remove('card-done');
      card.classList.add('active-pulse');
      if (hintEl) {
        hintEl.className = 'task-action-hint';
        hintEl.textContent = 'Click to review ->';
      }
      showToast(\`\${taskId} moved to In Progress\`);
    } else if (parentStack === stackInprogress) {
      stackReview.appendChild(card);
      card.classList.remove('active-pulse', 'card-done');
      if (hintEl) {
        hintEl.className = 'task-action-hint';
        hintEl.textContent = 'Click to merge ->';
      }
      showToast(\`\${taskId} submitted for Review\`);
    } else if (parentStack === stackReview) {
      stackDone.appendChild(card);
      card.classList.remove('active-pulse');
      card.classList.add('card-done');
      if (hintEl) {
        hintEl.className = 'task-done-badge';
        hintEl.textContent = 'Merged';
      }
      showToast(\`\${taskId} merged into main (+\${taskPts} pts)\`);
    } else if (parentStack === stackDone) {
      // Cycle back to backlog so demo remains endlessly interactive
      stackTodo.appendChild(card);
      card.classList.remove('card-done', 'active-pulse');
      if (hintEl) {
        hintEl.className = 'task-action-hint';
        hintEl.textContent = 'Click to advance ->';
      }
      showToast(\`\${taskId} returned to Backlog\`);
    }

    updateBoardMetrics();
  }

  function bindCardEvents(card) {
    card.addEventListener('click', () => advanceCard(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advanceCard(card);
      }
    });
  }

  function bindAllExistingCards() {
    document.querySelectorAll('.interactive-task-card').forEach(bindCardEvents);
  }

  bindAllExistingCards();
  updateBoardMetrics();

  // Reset Button Handler
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      stackTodo.innerHTML = initialMarkup.todo;
      stackInprogress.innerHTML = initialMarkup.inprogress;
      stackReview.innerHTML = initialMarkup.review;
      stackDone.innerHTML = initialMarkup.done;
      bindAllExistingCards();
      updateBoardMetrics();
      showToast('Demo board reset to baseline sprint');
    });
  }

  // Quick Issue Add Handler
  let nextId = 126;
  const sampleBacklog = [
    { title: 'Zero-downtime database failover handler', squad: 'Platform', pts: 5 },
    { title: 'Distributed edge rate-limiting middleware', squad: 'Infra', pts: 8 },
    { title: 'Automated SOC 2 audit snapshot exporter', squad: 'Security', pts: 3 },
    { title: 'Optimistic UI rollback for offline edits', squad: 'Frontend', pts: 5 },
    { title: 'Webhook retry backoff with jitter queue', squad: 'DevOps', pts: 5 }
  ];
  let sampleIndex = 0;

  function addNewTask(customTask = null) {
    const item = customTask || sampleBacklog[sampleIndex % sampleBacklog.length];
    sampleIndex++;
    const taskId = \`ST-\${nextId++}\`;

    const card = document.createElement('div');
    card.className = 'interactive-task-card';
    card.setAttribute('data-id', taskId);
    card.setAttribute('data-points', item.pts);
    card.setAttribute('tabindex', '0');

    card.innerHTML = \`
      <div class="card-top-row">
        <span class="task-code">\${taskId}</span>
        <span class="task-pts-chip">\${item.pts} pts</span>
      </div>
      <div class="task-name">\${item.title}</div>
      <div class="card-footer-row">
        <span class="task-squad">\${item.squad}</span>
        <span class="task-action-hint">Click to advance -></span>
      </div>
    \`;

    bindCardEvents(card);
    stackTodo.prepend(card);
    updateBoardMetrics();
    showToast(\`Created issue \${taskId} in Backlog\`);
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => addNewTask());
  }

  // Seed sample tasks button in Empty State modal
  const seedBtn = document.getElementById('seed-sample-tasks-btn');
  if (seedBtn) {
    seedBtn.addEventListener('click', () => {
      closeModal('empty-modal');
      addNewTask({ title: 'Realtime presence state sync channel', squad: 'Platform', pts: 5 });
      addNewTask({ title: 'Automatic flaky test quarantine runner', squad: 'DevOps', pts: 3 });
      showToast('Created 2 sample sprint issues');
    });
  }
}

// ============================================================================
// FAQ ACCORDION
// ============================================================================

function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close other FAQs for smooth accordion flow
      items.forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          const otherTrigger = other.querySelector('.faq-trigger');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
        }
      });

      if (isOpen) {
        item.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

// ============================================================================
// ACCESSIBLE MODALS (TOS, Privacy Policy, 404, Empty State, Auth)
// ============================================================================

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

export function closeModal(modalId) {
  const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (!modal) return;
  modal.hidden = true;
  if (!document.querySelector('.modal-backdrop:not([hidden])')) {
    document.body.style.overflow = '';
  }
}

function initModals() {
  const openTosBtn = document.getElementById('open-tos-btn');
  const openPrivacyBtn = document.getElementById('open-privacy-btn');
  const simulate404Btn = document.getElementById('simulate-404-btn');
  const emptyStateBtn = document.getElementById('trigger-empty-state-btn');
  const contactBtn = document.getElementById('open-contact-btn');

  if (openTosBtn) openTosBtn.addEventListener('click', () => openModal('tos-modal'));
  if (openPrivacyBtn) openPrivacyBtn.addEventListener('click', () => openModal('privacy-modal'));
  if (simulate404Btn) simulate404Btn.addEventListener('click', () => openModal('notfound-modal'));
  if (emptyStateBtn) emptyStateBtn.addEventListener('click', () => openModal('empty-modal'));

  if (contactBtn) {
    contactBtn.addEventListener('click', () => {
      showToast('Support: support@tracker.app | Hotline: +1 (800) 555-0199', 4500);
    });
  }

  // Handle all [data-close] buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      if (modalId) closeModal(modalId);
    });
  });

  // Close when clicking modal backdrop
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop:not([hidden])').forEach(modal => {
        closeModal(modal);
      });
    }
  });
}

// ============================================================================
// SCROLL ISLAND (Case Studies Dynamic Floating Navigation)
// ============================================================================

function initScrollIsland() {
  const islandContainer = document.getElementById('scroll-island');
  const islandCard = document.getElementById('scroll-island-card');
  const islandTrigger = document.getElementById('scroll-island-trigger');
  const progressRing = document.getElementById('island-progress-ring');
  const progressNum = document.getElementById('island-progress-num');
  const backdrop = document.getElementById('island-backdrop');
  const caseStudySection = document.getElementById('case-study');
  const topicBtns = document.querySelectorAll('.island-topic-btn');

  if (!islandContainer || !islandCard || !caseStudySection) return;

  function updateScrollProgress() {
    const rect = caseStudySection.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Show island when case study section is scrolled into viewport
    const isVisible = rect.top <= windowHeight * 0.6 && rect.bottom >= 150;

    if (isVisible) {
      islandContainer.classList.add('visible');
      // Calculate progress percentage through the case study section
      const totalScrollable = rect.height - windowHeight * 0.4;
      const scrolled = (windowHeight * 0.6) - rect.top;
      const progress = Math.max(0, Math.min(100, Math.round((scrolled / Math.max(totalScrollable, 1)) * 100)));

      if (progressRing) {
        progressRing.style.background = \`conic-gradient(#ffffff \${progress}%, #3a3b40 0)\`;
      }
      if (progressNum) {
        progressNum.textContent = \`\${progress}%\`;
      }
    } else {
      islandContainer.classList.remove('visible');
      // Collapse when out of view
      islandCard.classList.remove('expanded');
      if (backdrop) backdrop.classList.remove('visible');
      if (islandTrigger) islandTrigger.setAttribute('aria-expanded', 'false');
    }
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress, { passive: true });
  updateScrollProgress();

  // Toggle island menu
  if (islandTrigger) {
    islandTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = islandCard.classList.toggle('expanded');
      islandTrigger.setAttribute('aria-expanded', isExpanded);
      if (backdrop) {
        backdrop.classList.toggle('visible', isExpanded);
      }
    });

    islandTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        islandTrigger.click();
      }
    });
  }

  // Close island when clicking backdrop
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      islandCard.classList.remove('expanded');
      backdrop.classList.remove('visible');
      if (islandTrigger) islandTrigger.setAttribute('aria-expanded', 'false');
    });
  }

  // Topic button navigation with flash effect
  topicBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);

      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        targetEl.classList.remove('animate-flash');
        void targetEl.offsetWidth;
        targetEl.classList.add('animate-flash');
        setTimeout(() => {
          targetEl.classList.remove('animate-flash');
        }, 1800);
      }

      islandCard.classList.remove('expanded');
      if (backdrop) backdrop.classList.remove('visible');
      if (islandTrigger) islandTrigger.setAttribute('aria-expanded', 'false');
    });
  });
}

// ============================================================================
// FAMILY-STYLE SOCIAL AUTH DRAWER / MODAL
// ============================================================================

function initAuthDrawer() {
  const openAuthBtn = document.getElementById('open-auth-btn');
  const tabBtns = document.querySelectorAll('.auth-tab-btn');
  const viewEmail = document.getElementById('auth-view-email');
  const viewPhone = document.getElementById('auth-view-phone');
  const viewPasskey = document.getElementById('auth-view-passkey');
  const emailForm = document.getElementById('auth-email-form');
  const phoneForm = document.getElementById('auth-phone-form');
  const emailInput = document.getElementById('auth-email-input');
  const phoneInput = document.getElementById('auth-phone-input');
  const verifyPasskeyBtn = document.getElementById('verify-passkey-btn');
  const connectGitBtn = document.getElementById('connect-git-btn');
  const socialBtns = document.querySelectorAll('.auth-social-btn');

  if (openAuthBtn) {
    openAuthBtn.addEventListener('click', () => {
      openModal('auth-modal');
    });
  }

  // Segmented tab switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const tab = btn.getAttribute('data-tab');
      if (viewEmail) viewEmail.style.display = tab === 'email' ? 'block' : 'none';
      if (viewPhone) viewPhone.style.display = tab === 'phone' ? 'block' : 'none';
      if (viewPasskey) viewPasskey.style.display = tab === 'passkey' ? 'block' : 'none';

      if (tab === 'email' && emailInput) emailInput.focus();
      if (tab === 'phone' && phoneInput) phoneInput.focus();
    });
  });

  // Social Sign In Buttons
  socialBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.getAttribute('data-provider') || 'Provider';
      showToast(\`Redirecting to \${provider} sign-in...\`);
      setTimeout(() => {
        closeModal('auth-modal');
      }, 700);
    });
  });

  // Email Submit
  if (emailForm) {
    emailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput ? emailInput.value.trim() : '';
      if (!email) return;
      showToast(\`Magic sign-in link sent to \${email}\`);
      closeModal('auth-modal');
      if (emailInput) emailInput.value = '';
    });
  }

  // Phone Submit
  if (phoneForm) {
    phoneForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const phone = phoneInput ? phoneInput.value.trim() : '';
      if (!phone) return;
      showToast(\`Verification code sent to \${phone}\`);
      closeModal('auth-modal');
      if (phoneInput) phoneInput.value = '';
    });
  }

  // Passkey Biometrics Verification
  if (verifyPasskeyBtn) {
    verifyPasskeyBtn.addEventListener('click', () => {
      showToast('Passkey verified. Welcome back to Tracker!');
      closeModal('auth-modal');
    });
  }

  // GitHub Workspace Connect
  if (connectGitBtn) {
    connectGitBtn.addEventListener('click', () => {
      showToast('Redirecting to GitHub Workspace authorization...');
      setTimeout(() => {
        closeModal('auth-modal');
      }, 800);
    });
  }
}

// ============================================================================
// THEME TOGGLE (Dark / Light Mode)
// ============================================================================

function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  const storedTheme = localStorage.getItem('tracker-theme');
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialDark = storedTheme === 'dark' || (!storedTheme && systemPrefersDark);
  if (initialDark) document.documentElement.classList.add('dark');
  else             document.documentElement.classList.remove('dark');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('tracker-theme', isDark ? 'dark' : 'light');
      showToast(isDark ? 'Switched to Dark mode' : 'Switched to Light mode', 2000);
    });
  }
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('tracker-theme')) document.documentElement.classList.toggle('dark', e.matches);
    });
  }
}

// ============================================================================
// MUSIC WIDGET - Controller-based (YouTube, Spotify, Web Audio)
// ============================================================================

function initMusicWidget() {
  const widgetContainer = document.getElementById('music-widget');
  const pillTrigger     = document.getElementById('music-pill-trigger');
  const pillPlayBtn     = document.getElementById('music-pill-play-btn');
  const pillStatus      = document.getElementById('music-pill-status');
  const pillInfo        = document.getElementById('music-pill-info');
  const discBtn         = document.getElementById('music-disc-btn');
  const playerCard      = document.getElementById('music-player-card');
  const minimizeBtn     = document.getElementById('music-minimize-btn');
  const mainPlayBtn     = document.getElementById('music-main-play-btn');
  const prevBtn         = document.getElementById('music-prev-btn');
  const nextBtn         = document.getElementById('music-next-btn');
  const muteBtn         = document.getElementById('music-mute-btn');
  const volSlider       = document.getElementById('music-vol-slider');
  const progressBar     = document.getElementById('music-progress-bar');
  const progressFill    = document.getElementById('music-progress-fill');
  const currentTimeEl   = document.getElementById('music-current-time');
  const durationTimeEl  = document.getElementById('music-duration-time');
  const trackTitleEl    = document.getElementById('music-track-title');
  const trackArtistEl   = document.getElementById('music-track-artist');
  const trackGenreEl    = document.getElementById('music-track-genre');
  const providerTabBtns = document.querySelectorAll('.music-provider-tab');
  const ytInput         = document.getElementById('yt-video-id-input');
  const ytLoadBtn       = document.getElementById('yt-load-btn');
  const spotifyInput    = document.getElementById('spotify-uri-input');
  const spotifyLoadBtn  = document.getElementById('spotify-load-btn');

  if (!widgetContainer || !pillTrigger || !playerCard) return;

  const controller = new MusicController();

  function formatTime(secs) {
    const s = Math.floor(secs || 0);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  const onStateChange = () => {
    const st      = MusicState;
    const playing = st.isPlaying;
    widgetContainer.classList.toggle('is-playing', playing);

    const pillPlaySvg  = pillPlayBtn && pillPlayBtn.querySelector('.pill-play-icon');
    const pillPauseSvg = pillPlayBtn && pillPlayBtn.querySelector('.pill-pause-icon');
    if (pillPlaySvg)  pillPlaySvg.style.display  = playing ? 'none' : 'block';
    if (pillPauseSvg) pillPauseSvg.style.display = playing ? 'block' : 'none';

    const mainPlaySvg  = mainPlayBtn && mainPlayBtn.querySelector('.main-play-icon');
    const mainPauseSvg = mainPlayBtn && mainPlayBtn.querySelector('.main-pause-icon');
    if (mainPlaySvg)  mainPlaySvg.style.display  = playing ? 'none' : 'block';
    if (mainPauseSvg) mainPauseSvg.style.display = playing ? 'block' : 'none';

    if (pillStatus) pillStatus.textContent = playing ? ('Playing • ' + (st.trackTitle || 'Track')) : 'Paused • Tap to play';
    if (trackTitleEl)   trackTitleEl.textContent  = st.trackTitle  || '';
    if (trackArtistEl)  trackArtistEl.textContent = st.trackArtist || '';
    if (trackGenreEl)   trackGenreEl.textContent  = st.trackGenre  || '';
    if (durationTimeEl) durationTimeEl.textContent = st.trackDuration ? formatTime(st.trackDuration) : '--:--';

    providerTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-provider') === st.provider);
    });

    widgetContainer.querySelectorAll('.provider-panel').forEach(panel => {
      panel.hidden = panel.getAttribute('data-provider-panel') !== st.provider;
    });

    if (st.provider === PROVIDERS.WEBAUDIO) {
      widgetContainer.querySelectorAll('.preset-pill').forEach(pill => {
        const idx = parseInt(pill.getAttribute('data-track'), 10);
        pill.classList.toggle('active', idx === (controller._adapter ? controller._adapter._trackIdx : 0));
      });
    }

    const errorBanner = widgetContainer.querySelector('.music-error-banner');
    if (errorBanner) {
      errorBanner.hidden      = !st.error;
      errorBanner.textContent = st.error || '';
    }
  };

  const onProgress = (elapsed, duration) => {
    const pct = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;
    if (progressFill) progressFill.style.width = pct + '%';
    if (currentTimeEl) currentTimeEl.textContent = formatTime(elapsed);
    if (progressBar) progressBar.setAttribute('aria-valuenow', Math.round(pct));
    MusicState.patch({ trackElapsed: elapsed });
  };

  controller.setCallbacks({ onStateChange, onProgress });

  // Provider tabs
  providerTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.getAttribute('data-provider');
      if (p) controller.selectProvider(p);
    });
  });

  // YouTube input
  if (ytLoadBtn && ytInput) {
    ytLoadBtn.addEventListener('click', () => {
      const raw   = ytInput.value.trim();
      const match = raw.match(/(?:v=|youtu\\.be\\/)([A-Za-z0-9_-]{11})/);
      const id    = match ? match[1] : (raw.length === 11 ? raw : null);
      if (!id) { showToast('Enter a valid YouTube URL or 11-char video ID', 3000); return; }
      controller.setYouTubeVideoId(id);
      controller.play();
    });
    ytInput.addEventListener('keydown', e => { if (e.key === 'Enter') ytLoadBtn.click(); });
  }

  // Spotify input
  if (spotifyLoadBtn && spotifyInput) {
    spotifyLoadBtn.addEventListener('click', () => {
      const raw      = spotifyInput.value.trim();
      const urlMatch = raw.match(/open\\.spotify\\.com\\/(track|album|playlist|artist)\\/([A-Za-z0-9]+)/);
      const uri      = urlMatch ? (urlMatch[1] + '/' + urlMatch[2]) : raw;
      if (!uri) { showToast('Enter a valid Spotify URL or URI', 3000); return; }
      controller.setSpotifyUri(uri);
      controller.play();
    });
    spotifyInput.addEventListener('keydown', e => { if (e.key === 'Enter') spotifyLoadBtn.click(); });
  }

  // Expand / Collapse
  function expandPlayer()  { pillTrigger.style.display = 'none'; playerCard.hidden = false; }
  function collapsePlayer() { playerCard.hidden = true; pillTrigger.style.display = 'flex'; }

  if (discBtn) discBtn.addEventListener('click', expandPlayer);
  const expandBtn = document.getElementById('music-pill-expand-btn');
  if (expandBtn) expandBtn.addEventListener('click', expandPlayer);
  if (pillInfo) {
    pillInfo.addEventListener('click', expandPlayer);
    pillInfo.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); expandPlayer(); }
    });
  }
  if (minimizeBtn) minimizeBtn.addEventListener('click', collapsePlayer);

  // Playback
  if (pillPlayBtn) pillPlayBtn.addEventListener('click', e => { e.stopPropagation(); controller.toggle(); });
  if (mainPlayBtn) mainPlayBtn.addEventListener('click', () => controller.toggle());
  if (nextBtn)     nextBtn.addEventListener('click', () => controller.next());
  if (prevBtn)     prevBtn.addEventListener('click', () => controller.prev());

  // Seek
  if (progressBar) {
    progressBar.addEventListener('click', e => {
      const rect = progressBar.getBoundingClientRect();
      const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      controller.seek(pct);
    });
  }

  // Volume / Mute
  function updateMuteIcons() {
    const highSvg  = muteBtn && muteBtn.querySelector('.vol-high-icon');
    const mutedSvg = muteBtn && muteBtn.querySelector('.vol-muted-icon');
    if (highSvg)  highSvg.style.display  = MusicState.isMuted ? 'none' : 'block';
    if (mutedSvg) mutedSvg.style.display = MusicState.isMuted ? 'block' : 'none';
    if (volSlider) volSlider.value = MusicState.isMuted ? 0 : MusicState.volume;
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const nowMuted = !MusicState.isMuted;
      MusicState.patch({ isMuted: nowMuted });
      controller.setMuted(nowMuted);
      updateMuteIcons();
    });
  }
  if (volSlider) {
    volSlider.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      MusicState.patch({ isMuted: false });
      controller.setVolume(v);
      updateMuteIcons();
    });
  }

  // WebAudio preset pills
  widgetContainer.querySelectorAll('.preset-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const idx = parseInt(pill.getAttribute('data-track'), 10);
      if (MusicState.provider === PROVIDERS.WEBAUDIO && !isNaN(idx)) {
        if (controller._adapter && controller._adapter.setTrack) {
          controller._adapter.setTrack(idx);
          if (!MusicState.isPlaying) controller.play();
        }
      }
    });
  });

  // MediaSession
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play',          () => controller.play());
      navigator.mediaSession.setActionHandler('pause',         () => controller.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => controller.prev());
      navigator.mediaSession.setActionHandler('nexttrack',     () => controller.next());
    } catch (e) {}
  }

  if (volSlider) volSlider.value = MusicState.volume;
  updateMuteIcons();
  onStateChange();
}

// ============================================================================
// BOOTSTRAP APPLICATION
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
  initSteepHeroAnimation();
  initInteractiveKanbanBoard();
  initFaqAccordion();
  initModals();
  initScrollIsland();
  initAuthDrawer();
  initThemeToggle();
  initMusicWidget();
});
`;

fs.writeFileSync('src/main.js', mainJsCode, 'utf8');
console.log('Successfully wrote restored src/main.js');

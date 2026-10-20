import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MusicController } from './music/MusicController.js';
import { MusicState, PROVIDERS } from './music/MusicState.js';
import { initPomodoroTimer } from './pomodoro.js';

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

  // Allow clicking the Focus Timer floating preview to jump directly into the full Pomodoro Timer
  if (pinkBlock) {
    pinkBlock.style.cursor = 'pointer';
    pinkBlock.setAttribute('title', 'Click to open Pomodoro Focus Timer');
    pinkBlock.addEventListener('click', () => {
      localStorage.setItem('tracker-demo-auth', 'true');
      document.body.classList.add('in-app-mode');
      const actualAppView = document.getElementById('actual-app-view');
      if (actualAppView) actualAppView.hidden = false;
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (window.switchClockitView) window.switchClockitView('timer');
    });
  }

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

  // Exact ClockIt coordinate models (natural, compact, unstretched)
  const P = (e) => ({ opacity: 1, scale: 1, y: 0 + e });
  const O = { opacity: 0, scale: 0.65, y: -200, duration: 0.45 };
  const z = { scale: 0.85, y: 680, opacity: 0 };
  const M = { scale: 1, y: 110, opacity: 1 };
  const F = { y: 720, opacity: 0 };
  const D = { y: 200, opacity: 1 };
  
  // Floating Card 1: Today's Progress donut card (Left)
  // Sits level with the hero headline text at scroll:0
  const startProgress = (e) => ({ x: -110, y: 195 + e * 0.5, width: 330, opacity: 1 });
  // Docks into Left Summary Slot (left: 20px, top: M.y + 182 = 292px, width: 377px)
  const dockProgress = { x: 20, y: M.y + 182, width: 377, opacity: 0.98 };

  // Floating Card 2: Focus Timer peach card (Right)
  // Sits level with the hero headline text at scroll:0
  const startTimer = (e) => ({ x: 960, y: 200 + e * 0.5, width: 330, opacity: 1 });
  // Docks into Middle Summary Slot (Peach) (left: 411px, top: M.y + 182 = 292px, width: 377px)
  const dockTimer = { x: 411, y: M.y + 182, width: 377, opacity: 0.98 };

  // Floating Card 3: Backlog summary card (Left-lower)
  // Sits level with subhead & CTAs at scroll:0
  const startBacklog = (e) => ({ x: -60, y: 380 + e * 0.5, width: 300, opacity: 1 });
  // Docks into Right Summary Slot (left: 802px, top: M.y + 182 = 292px, width: 377px)
  const dockBacklog = { x: 802, y: M.y + 182, width: 377, opacity: 0.98 };

  // Floating Card 4: Quick Notes card (Right-lower)
  // Sits level with subhead & CTAs at scroll:0
  const startNotes = (e) => ({ x: 930, y: 380 + e * 0.5, width: 270, opacity: 1 });
  // Docks into Quick Notes Column (left: 910px, top: M.y + 304 = 414px, width: 270px)
  const dockNotes = { x: 910, y: M.y + 304, width: 270, opacity: 0.98 };

  const K = { y: 0 };
  const Y = { y: -120 };
  const Q = { opacity: 0, y: 14 };

  // Initial placements
  const initialP = P(ea);
  const initialProgress = startProgress(ea);
  const initialTimer = startTimer(ea);
  const initialBacklog = startBacklog(ea);
  const initialNotes = startNotes(ea);

  gsap.set(appFrame, z);
  if (blueBlock) gsap.set(blueBlock, initialProgress);
  if (pinkBlock) gsap.set(pinkBlock, initialTimer);
  if (grayBlock) gsap.set(grayBlock, initialBacklog);
  if (aiComposer) gsap.set(aiComposer, initialNotes);
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
      end: () => `+=${1.2 * containerHeight}`,
      anticipatePin: 0.5,
      invalidateOnRefresh: true,
      refreshPriority: 1
    }
  });

  // 1. Text fades out, scales down, moves up
  if (textBlock) tl.fromTo(textBlock, initialP, O, 0);

  // 2. Main desktop app mockup glides up from y:760 to y:160 and scales to 1
  tl.fromTo(appFrame, z, M, 0);

  // 3. Background layer subtle parallax
  if (bgLayer) tl.fromTo(bgLayer, K, Y, 0);

  // 4. Logo ticker glides up to sit under the app mockup
  if (carousel) tl.fromTo(carousel, F, D, 0);

  // 5. Floating cards glide inwards towards their ClockIt docking points
  const shadowStart = { boxShadow: "0 24px 50px -8px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)" };
  const shadowEnd   = { boxShadow: "0 0 0 0 rgba(0,0,0,0)" };

  if (blueBlock) tl.fromTo(blueBlock, { ...initialProgress, ...shadowStart }, { ...dockProgress, ...shadowEnd }, 0);
  if (pinkBlock) tl.fromTo(pinkBlock, { ...initialTimer, ...shadowStart }, { ...dockTimer, ...shadowEnd }, 0);
  if (grayBlock) tl.fromTo(grayBlock, { ...initialBacklog, ...shadowStart }, { ...dockBacklog, ...shadowEnd }, 0);
  if (aiComposer) tl.fromTo(aiComposer, { ...initialNotes, ...shadowStart }, { ...dockNotes, ...shadowEnd }, 0);

  // 6. Docking sequence: placeholder blueprints dissolve, live ClockIt dashboard reveals
  if (contentStart) tl.to(contentStart, { opacity: 0, duration: 0.22, ease: "power2.inOut" }, 0.62);

  // Floating cards cross-fade into the live docked elements seamlessly
  if (blueBlock) tl.to(blueBlock, { opacity: 0, pointerEvents: "none", duration: 0.22, ease: "power2.inOut" }, 0.65);
  if (pinkBlock) tl.to(pinkBlock, { opacity: 0, pointerEvents: "none", duration: 0.22, ease: "power2.inOut" }, 0.65);
  if (grayBlock) tl.to(grayBlock, { opacity: 0, pointerEvents: "none", duration: 0.22, ease: "power2.inOut" }, 0.65);
  if (aiComposer) tl.to(aiComposer, { opacity: 0, pointerEvents: "none", duration: 0.22, ease: "power2.inOut" }, 0.65);

  // Fully docked interactive ClockIt dashboard fades in
  if (contentDocked) tl.fromTo(contentDocked, Q, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0.66);

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
      velocityEl.textContent = `${donePts} / ${totalPts} pts completed`;
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
      showToast(`${taskId} moved to In Progress`);
    } else if (parentStack === stackInprogress) {
      stackReview.appendChild(card);
      card.classList.remove('active-pulse', 'card-done');
      if (hintEl) {
        hintEl.className = 'task-action-hint';
        hintEl.textContent = 'Click to merge ->';
      }
      showToast(`${taskId} submitted for Review`);
    } else if (parentStack === stackReview) {
      stackDone.appendChild(card);
      card.classList.remove('active-pulse');
      card.classList.add('card-done');
      if (hintEl) {
        hintEl.className = 'task-done-badge';
        hintEl.textContent = 'Merged';
      }
      showToast(`${taskId} merged into main (+${taskPts} pts)`);
    } else if (parentStack === stackDone) {
      // Cycle back to backlog so demo remains endlessly interactive
      stackTodo.appendChild(card);
      card.classList.remove('card-done', 'active-pulse');
      if (hintEl) {
        hintEl.className = 'task-action-hint';
        hintEl.textContent = 'Click to advance ->';
      }
      showToast(`${taskId} returned to Backlog`);
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
    const taskId = `ST-${nextId++}`;

    const card = document.createElement('div');
    card.className = 'interactive-task-card';
    card.setAttribute('data-id', taskId);
    card.setAttribute('data-points', item.pts);
    card.setAttribute('tabindex', '0');

    card.innerHTML = `
      <div class="card-top-row">
        <span class="task-code">${taskId}</span>
        <span class="task-pts-chip">${item.pts} pts</span>
      </div>
      <div class="task-name">${item.title}</div>
      <div class="card-footer-row">
        <span class="task-squad">${item.squad}</span>
        <span class="task-action-hint">Click to advance -></span>
      </div>
    `;

    bindCardEvents(card);
    stackTodo.prepend(card);
    updateBoardMetrics();
    showToast(`Created issue ${taskId} in Backlog`);
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
        progressRing.style.background = `conic-gradient(#ffffff ${progress}%, #3a3b40 0)`;
      }
      if (progressNum) {
        progressNum.textContent = `${progress}%`;
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
      showToast(`Redirecting to ${provider} sign-in...`);
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
      showToast(`Magic sign-in link sent to ${email}`);
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
      showToast(`Verification code sent to ${phone}`);
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
      const match = raw.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
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
      const urlMatch = raw.match(/open\.spotify\.com\/(track|album|playlist|artist)\/([A-Za-z0-9]+)/);
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


// ============================================================================
// ACTUAL APP: INTERACTIVE SPRINT 34 DASHBOARD
// ============================================================================

const INITIAL_SPRINT_TASKS = [
  { id: 'ST-101', title: 'Distributed Redis lease coordinator with heartbeat', squad: 'Platform', pts: 5, status: 'inprogress', assignee: 'AC' },
  { id: 'ST-104', title: 'WebSocket sync stream for active sprint standup', squad: 'Platform', pts: 8, status: 'todo', assignee: 'JB' },
  { id: 'ST-112', title: 'Optimistic UI rollback and conflict resolution modal', squad: 'Frontend', pts: 3, status: 'review', assignee: 'SL' },
  { id: 'ST-115', title: 'Automated SOC 2 token revocation middleware', squad: 'Security', pts: 5, status: 'done', assignee: 'MV' },
  { id: 'ST-118', title: 'Multi-cloud Terraform VPC peering configuration', squad: 'DevOps', pts: 5, status: 'review', assignee: 'ER' },
  { id: 'ST-120', title: 'Cluster autoscaling threshold alert channels', squad: 'DevOps', pts: 3, status: 'todo', assignee: 'JB' },
  { id: 'ST-122', title: 'Interactive soundstage lo-fi audio deck', squad: 'Frontend', pts: 5, status: 'done', assignee: 'AC' },
  { id: 'ST-125', title: 'Zero-downtime database schema migration runner', squad: 'Platform', pts: 8, status: 'inprogress', assignee: 'AC' },
];

let appSprintTasks = [...INITIAL_SPRINT_TASKS];
let activeSquadFilter = 'all';
let activeSearchQuery = '';

function saveAppTasks() {
  try {
    localStorage.setItem('tracker_app_tasks', JSON.stringify(appSprintTasks));
  } catch (e) {}
}

function loadAppTasks() {
  try {
    const stored = localStorage.getItem('tracker_app_tasks');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].assignee) {
        appSprintTasks = parsed;
        return;
      }
    }
  } catch (e) {}
  appSprintTasks = [...INITIAL_SPRINT_TASKS];
}

function updateAppMetrics() {
  let totalPts = 0;
  let donePts = 0;
  let todoCount = 0;
  let inprogCount = 0;
  let reviewCount = 0;
  let doneCount = 0;

  appSprintTasks.forEach(t => {
    totalPts += t.pts;
    if (t.status === 'done') donePts += t.pts;
    if (t.status === 'todo') todoCount++;
    if (t.status === 'inprogress') inprogCount++;
    if (t.status === 'review') reviewCount++;
    if (t.status === 'done') doneCount++;
  });

  // ClockIt Today's Progress Card
  const clockitPctEl = document.getElementById('clockit-progress-pct');
  const clockitDonutFill = document.getElementById('clockit-donut-fill');
  const clockitRatioEl = document.getElementById('clockit-progress-ratio');
  const clockitBacklogEl = document.getElementById('clockit-backlog-count');

  if (clockitPctEl && clockitRatioEl) {
    const totalToday = 5;
    const completedToday = Math.min(doneCount + 1, totalToday);
    const todayPct = Math.round((completedToday / totalToday) * 100);
    clockitRatioEl.textContent = `${completedToday} / ${totalToday}`;
    clockitPctEl.textContent = `${todayPct}%`;
    if (clockitDonutFill) clockitDonutFill.setAttribute('stroke-dasharray', `${todayPct}, 100`);
  }

  if (clockitBacklogEl) {
    clockitBacklogEl.textContent = '4';
  }

  // Update 4-column counts
  const cTodo = document.getElementById('app-count-todo');
  const cInprog = document.getElementById('app-count-inprogress');
  const cRev = document.getElementById('app-count-review');
  const cDone = document.getElementById('app-count-done');

  if (cTodo) cTodo.textContent = todoCount;
  if (cInprog) cInprog.textContent = inprogCount;
  if (cRev) cRev.textContent = reviewCount;
  if (cDone) cDone.textContent = doneCount;
}

function renderAppDashboard() {
  const colTodo = document.getElementById('app-cards-todo');
  const colInprog = document.getElementById('app-cards-inprogress');
  const colReview = document.getElementById('app-cards-review');
  const colDone = document.getElementById('app-cards-done');
  const tableBody = document.getElementById('app-issues-table-body');

  if (!colTodo || !colInprog || !colReview || !colDone) return;

  colTodo.innerHTML = '';
  colInprog.innerHTML = '';
  colReview.innerHTML = '';
  colDone.innerHTML = '';
  if (tableBody) tableBody.innerHTML = '';

  const q = activeSearchQuery.toLowerCase().trim();
  const filtered = appSprintTasks.filter(t => {
    const matchSquad = activeSquadFilter === 'all' || t.squad.toLowerCase() === activeSquadFilter.toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.squad.toLowerCase().includes(q);
    return matchSquad && matchSearch;
  });

  filtered.forEach(task => {
    // Kanban Card
    const card = document.createElement('div');
    card.className = 'app-task-card';
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', task.id);
    card.setAttribute('tabindex', '0');

    card.innerHTML = `
      <div class="app-card-top">
        <span class="app-card-id">${task.id}</span>
        <span class="app-card-pts">${task.pts} pts</span>
      </div>
      <div class="app-card-title">${task.title}</div>
      <div class="app-card-bottom">
        <span class="app-squad-tag ${task.squad}">${task.squad}</span>
        <div class="app-card-right-meta">
          <div class="app-card-actions">
            <button class="app-card-action-btn advance" title="Advance status" type="button">&rarr;</button>
            <button class="app-card-action-btn delete" title="Delete task" type="button">&times;</button>
          </div>
          <div class="app-assignee-avatar" title="Assignee: ${task.assignee}">${task.assignee}</div>
        </div>
      </div>
    `;

    // Click to advance or button
    card.querySelector('.advance').addEventListener('click', (e) => {
      e.stopPropagation();
      advanceAppTask(task.id);
    });

    card.querySelector('.delete').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteAppTask(task.id);
    });

    card.addEventListener('click', () => {
      advanceAppTask(task.id);
    });

    // Drag-and-drop
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', task.id);
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    if (task.status === 'todo') colTodo.appendChild(card);
    else if (task.status === 'inprogress') colInprog.appendChild(card);
    else if (task.status === 'review') colReview.appendChild(card);
    else if (task.status === 'done') colDone.appendChild(card);

    // List View Table Row
    if (tableBody) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 600; color: var(--color-slate-gray, #777b86);">${task.id}</td>
        <td style="font-weight: 500;">${task.title}</td>
        <td><span class="app-squad-tag ${task.squad}">${task.squad}</span></td>
        <td><span class="status-badge ${task.status}">${task.status}</span></td>
        <td><strong>${task.pts} pts</strong></td>
        <td><div class="app-assignee-avatar" style="display:inline-flex;">${task.assignee}</div></td>
        <td style="text-align: right;">
          <button class="pill-btn-ghost-sm" style="height:26px; font-size:11px; padding:0 8px;" type="button">Next &rarr;</button>
        </td>
      `;
      tr.querySelector('button').addEventListener('click', () => advanceAppTask(task.id));
      tableBody.appendChild(tr);
    }
  });

  updateAppMetrics();
}

function advanceAppTask(taskId) {
  const task = appSprintTasks.find(t => t.id === taskId);
  if (!task) return;

  const flow = {
    'todo': 'inprogress',
    'inprogress': 'review',
    'review': 'done',
    'done': 'todo'
  };

  task.status = flow[task.status] || 'todo';
  saveAppTasks();
  renderAppDashboard();

  if (task.status === 'done') {
    showToast(`${task.id} completed & merged into main! (+${task.pts} pts)`);
  } else if (task.status === 'todo') {
    showToast(`${task.id} returned to Backlog`);
  } else {
    showToast(`${task.id} moved to ${task.status.toUpperCase()}`);
  }
}

function deleteAppTask(taskId) {
  const idx = appSprintTasks.findIndex(t => t.id === taskId);
  if (idx === -1) return;
  const removed = appSprintTasks.splice(idx, 1)[0];
  saveAppTasks();
  renderAppDashboard();
  showToast(`Removed ${removed.id}: ${removed.title}`);
}

function initAppDragAndDrop() {
  const cols = document.querySelectorAll('.app-board-col');
  cols.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.style.background = 'rgba(245, 155, 107, 0.08)';
    });

    col.addEventListener('dragleave', () => {
      col.style.background = '';
    });

    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.style.background = '';
      const taskId = e.dataTransfer.getData('text/plain');
      const targetStatus = col.getAttribute('data-col');
      const task = appSprintTasks.find(t => t.id === taskId);
      if (task && targetStatus && task.status !== targetStatus) {
        task.status = targetStatus;
        saveAppTasks();
        renderAppDashboard();
        showToast(`${task.id} moved to ${targetStatus.toUpperCase()}`);
      }
    });
  });
}

function initAppDashboard() {
  loadAppTasks();
  renderAppDashboard();
  initAppDragAndDrop();

  // Search input with real-time filtering
  const searchInput = document.getElementById('app-task-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      activeSearchQuery = e.target.value;
      renderAppDashboard();
    });

    // Keyboard shortcut /
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput && !document.activeElement.matches('input, textarea')) {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  // Squad chips filter (Board toolbar)
  const squadChips = document.querySelectorAll('.squad-chip');
  squadChips.forEach(chip => {
    chip.addEventListener('click', () => {
      squadChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeSquadFilter = chip.getAttribute('data-filter') || 'all';

      // Sync sidebar squad filter
      document.querySelectorAll('.app-squad-filter').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-squad') === activeSquadFilter);
      });

      renderAppDashboard();
    });
  });

  // Sidebar squad filter
  const sidebarSquadBtns = document.querySelectorAll('.app-squad-filter');
  sidebarSquadBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sidebarSquadBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSquadFilter = btn.getAttribute('data-squad') || 'all';

      // Sync board toolbar chips
      document.querySelectorAll('.squad-chip').forEach(c => {
        c.classList.toggle('active', c.getAttribute('data-filter') === activeSquadFilter);
      });

      renderAppDashboard();
    });
  });

  // Tab views (Board vs List vs Analytics)
  const appTabLinks = document.querySelectorAll('.app-nav-link');
  const panelBoard = document.getElementById('app-panel-board');
  const panelList = document.getElementById('app-panel-list');
  const panelAnalytics = document.getElementById('app-panel-analytics');

  appTabLinks.forEach(link => {
    link.addEventListener('click', () => {
      appTabLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const tab = link.getAttribute('data-app-tab');

      if (panelBoard) panelBoard.hidden = tab !== 'board';
      if (panelList) panelList.hidden = tab !== 'list';
      if (panelAnalytics) panelAnalytics.hidden = tab !== 'analytics';
    });
  });

  // Reset Board Button
  const resetBtn = document.getElementById('app-reset-board-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      appSprintTasks = [...INITIAL_SPRINT_TASKS];
      activeSquadFilter = 'all';
      activeSearchQuery = '';
      if (searchInput) searchInput.value = '';
      document.querySelectorAll('.squad-chip').forEach(c => c.classList.toggle('active', c.getAttribute('data-filter') === 'all'));
      document.querySelectorAll('.app-squad-filter').forEach(b => b.classList.toggle('active', b.getAttribute('data-squad') === 'all'));
      saveAppTasks();
      renderAppDashboard();
      showToast('Sprint 34 board reset to baseline');
    });
  }

  // Create Issue Form & Modal
  const openNewTaskBtn = document.getElementById('app-new-task-btn');
  const createTaskModal = document.getElementById('app-create-task-modal');
  const createTaskForm = document.getElementById('app-create-task-form');

  if (openNewTaskBtn) {
    openNewTaskBtn.addEventListener('click', () => {
      openModal('app-create-task-modal');
      const titleInput = document.getElementById('new-task-title');
      if (titleInput) setTimeout(() => titleInput.focus(), 100);
    });
  }

  if (createTaskForm) {
    createTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const titleEl = document.getElementById('new-task-title');
      const squadEl = document.getElementById('new-task-squad');
      const ptsEl = document.getElementById('new-task-points');

      const title = titleEl ? titleEl.value.trim() : '';
      const squad = squadEl ? squadEl.value : 'Platform';
      const pts = ptsEl ? parseInt(ptsEl.value, 10) || 3 : 3;

      if (!title) return;

      const nextNum = 126 + appSprintTasks.length;
      const newTask = {
        id: `ST-${nextNum}`,
        title,
        squad,
        pts,
        status: 'todo',
        assignee: 'AC'
      };

      appSprintTasks.unshift(newTask);
      saveAppTasks();
      renderAppDashboard();
      closeModal('app-create-task-modal');
      if (titleEl) titleEl.value = '';
      showToast(`Created task ${newTask.id}: ${title}`);
    });
  }

  // Live Clock & Greeting
  const timeDigitsEl = document.getElementById('clockit-time-digits');
  const timeAmpmEl = document.getElementById('clockit-time-ampm');
  const dateBadgeEl = document.getElementById('clockit-live-date');
  const greetingEl = document.getElementById('clockit-greeting-text');

  function updateLiveClock() {
    const now = new Date();
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const hoursStr = hours.toString().padStart(2, '0');

    if (timeDigitsEl) timeDigitsEl.textContent = `${hoursStr} : ${minutes}`;
    if (timeAmpmEl) timeAmpmEl.textContent = ampm;

    const rawHours = now.getHours();
    let greeting = 'Good morning, Ashay.';
    if (rawHours >= 12 && rawHours < 17) greeting = 'Good afternoon, Ashay.';
    else if (rawHours >= 17) greeting = 'Good evening, Ashay.';
    if (greetingEl) greetingEl.textContent = greeting;

    if (dateBadgeEl) {
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const dayName = days[now.getDay()];
      const dayNum = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();
      dateBadgeEl.textContent = `${dayName}, ${dayNum} ${monthName} ${year}`;
    }
  }

  updateLiveClock();
  setInterval(updateLiveClock, 30000);

  // Initialize ClockIt Pomodoro Timer
  initPomodoroTimer(showToast);

  // Quick Notes submission
  const notesForm = document.getElementById('clockit-notes-form');
  const noteInput = document.getElementById('clockit-new-note-input');
  const notesList = document.getElementById('clockit-notes-list');

  if (notesForm && noteInput && notesList) {
    notesForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = noteInput.value.trim();
      if (!text) return;

      const colors = ['border-yellow', 'border-red', 'border-purple'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const noteCard = document.createElement('div');
      noteCard.className = `quick-note-item ${randomColor}`;
      noteCard.innerHTML = `
        <div class="note-item-header">
          <span class="note-item-tag">&#128221; Note</span>
          <span class="note-item-time">Just now</span>
        </div>
        <ul class="note-bullets">
          <li>${text}</li>
        </ul>
      `;
      notesList.prepend(noteCard);
      noteInput.value = '';
      showToast('Note added to Quick Notes');
    });
  }

  // Avatar user dropdown
  const userBtn = document.getElementById('clockit-user-btn');
  const userDropdown = document.getElementById('clockit-user-dropdown');
  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => {
      userDropdown.classList.remove('open');
    });
  }

  // ClockIt search button
  const clockitSearchBtn = document.getElementById('clockit-search-btn');
  if (clockitSearchBtn) {
    clockitSearchBtn.addEventListener('click', () => {
      const query = prompt('Search tasks (by title, ID, or squad):', activeSearchQuery);
      if (query !== null) {
        activeSearchQuery = query;
        renderAppDashboard();
        if (query) showToast(`Filtering tasks for "${query}"`);
      }
    });
  }

  // App Theme Toggle button (syncs with global theme)
  const appThemeBtn = document.getElementById('app-theme-toggle-btn');
  if (appThemeBtn) {
    appThemeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('tracker-theme', isDark ? 'dark' : 'light');
      showToast(isDark ? 'Switched to Dark mode' : 'Switched to Light mode', 2000);
    });
  }
}

// ============================================================================
// DUMMY AUTH SYSTEM & VIEW NAVIGATION
// ============================================================================

function initAuthSystem() {
  const navUserPill = document.getElementById('nav-user-pill');
  const openAuthBtn = document.getElementById('open-auth-btn');
  const navCtaBtn = document.getElementById('nav-cta-btn');
  const navOpenAppBtn = document.getElementById('nav-open-app-btn');
  const navSignoutBtn = document.getElementById('nav-signout-btn');
  const appExitBtn = document.getElementById('app-exit-view-btn');
  const appSignoutBtn = document.getElementById('app-signout-action-btn');
  const actualAppView = document.getElementById('actual-app-view');

  function updateAuthUI(isLoggedIn) {
    if (navUserPill) navUserPill.hidden = !isLoggedIn;
    if (openAuthBtn) openAuthBtn.hidden = isLoggedIn;
    if (navCtaBtn) navCtaBtn.hidden = isLoggedIn;
  }

  function enterAppDashboard() {
    document.body.classList.add('in-app-mode');
    if (actualAppView) actualAppView.hidden = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
    renderAppDashboard();
  }

  function exitAppDashboard() {
    document.body.classList.remove('in-app-mode');
    if (actualAppView) actualAppView.hidden = true;
    ScrollTrigger.refresh();
  }

  function signInAsDemo(suppressToast = false) {
    localStorage.setItem('tracker-demo-auth', 'true');
    updateAuthUI(true);
    closeModal('auth-modal');
    enterAppDashboard();
    if (!suppressToast) {
      showToast('Signed in as Alex Chen (Staff Engineer) • Sprint 34 Active', 3500);
    }
  }

  function signOut() {
    localStorage.removeItem('tracker-demo-auth');
    updateAuthUI(false);
    exitAppDashboard();
    showToast('Signed out of Acme Engineering workspace');
  }

  // Restore existing session if signed in
  const isAuth = localStorage.getItem('tracker-demo-auth') === 'true';
  updateAuthUI(isAuth);

  // Auto-enter ClockIt if URL hash requests timer or app
  function handleUrlHash() {
    const urlHash = window.location.hash.toLowerCase();
    if (urlHash.includes('timer') || urlHash.includes('app') || urlHash.includes('clockit')) {
      signInAsDemo(true);
      if (urlHash.includes('timer') && window.switchClockitView) {
        window.switchClockitView('timer');
      }
    }
  }

  handleUrlHash();
  window.addEventListener('hashchange', handleUrlHash);

  // The single standard "Sign in" button in navbar is now the dummy sign-in
  if (openAuthBtn) {
    openAuthBtn.addEventListener('click', () => signInAsDemo());
  }

  // Also allow submitting the auth modal if opened
  const emailForm = document.getElementById('auth-email-form');
  const phoneForm = document.getElementById('auth-phone-form');
  const verifyPasskeyBtn = document.getElementById('verify-passkey-btn');
  const connectGitBtn = document.getElementById('connect-git-btn');
  const socialBtns = document.querySelectorAll('.auth-social-btn');

  if (emailForm) {
    emailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      signInAsDemo();
    });
  }
  if (phoneForm) {
    phoneForm.addEventListener('submit', (e) => {
      e.preventDefault();
      signInAsDemo();
    });
  }
  socialBtns.forEach(btn => {
    btn.addEventListener('click', () => signInAsDemo());
  });
  if (verifyPasskeyBtn) {
    verifyPasskeyBtn.addEventListener('click', () => signInAsDemo());
  }
  if (connectGitBtn) {
    connectGitBtn.addEventListener('click', () => signInAsDemo());
  }

  // Open App Button when signed in
  if (navOpenAppBtn) {
    navOpenAppBtn.addEventListener('click', enterAppDashboard);
  }

  // Sign out buttons
  if (navSignoutBtn) navSignoutBtn.addEventListener('click', signOut);
  if (appSignoutBtn) appSignoutBtn.addEventListener('click', signOut);

  // Back to website
  if (appExitBtn) {
    appExitBtn.addEventListener('click', () => {
      exitAppDashboard();
      showToast('Returned to Tracker marketing overview');
    });
  }
}


window.addEventListener('DOMContentLoaded', () => {
  initSteepHeroAnimation();
  initInteractiveKanbanBoard();
  initFaqAccordion();
  initModals();
  initScrollIsland();
  initAuthDrawer();
  initThemeToggle();
  initMusicWidget();
  initAuthSystem();
  initAppDashboard();
});

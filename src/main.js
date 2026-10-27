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

  // Interactive click handlers for all floating preview artifacts
  if (pinkBlock) {
    pinkBlock.style.cursor = 'pointer';
    pinkBlock.setAttribute('title', 'Click to open Pomodoro Focus Timer');
    pinkBlock.addEventListener('click', () => {
      if (window.navigateToTrackerView) window.navigateToTrackerView('timer');
    });
  }
  if (blueBlock) {
    blueBlock.style.cursor = 'pointer';
    blueBlock.setAttribute('title', 'Click to view Today\'s Progress');
    blueBlock.addEventListener('click', () => {
      if (window.navigateToTrackerView) window.navigateToTrackerView('dashboard');
    });
  }
  if (grayBlock) {
    grayBlock.style.cursor = 'pointer';
    grayBlock.setAttribute('title', 'Click to open Backlog');
    grayBlock.addEventListener('click', () => {
      if (window.navigateToTrackerView) window.navigateToTrackerView('tasks');
    });
  }
  if (aiComposer) {
    aiComposer.style.cursor = 'pointer';
    aiComposer.setAttribute('title', 'Click to open Quick Notes');
    aiComposer.addEventListener('click', () => {
      if (window.navigateToTrackerView) window.navigateToTrackerView('notes');
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
      : Math.max((width - 80) / 1360, 0.58);
      
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

  // Mobile fallback for small viewports (< 768px phones)
  if (width < 768) {
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
    if (updated.width >= 768) {
      gsap.set(container, { height: updated.containerHeight });
      gsap.set(stage, { xPercent: -50, x: 0, scale: updated.scaleFactor });
      ScrollTrigger.refresh();
    }
  });

  // Ensure perfect layout measurement after fonts & images finish loading
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
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
  // Default to light mode on first visit; only activate dark if explicitly set by the user
  const initialDark = storedTheme === 'dark';
  if (initialDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('tracker-theme', isDark ? 'dark' : 'light');
      showToast(isDark ? 'Switched to Dark mode' : 'Switched to Light mode', 2000);
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
// ACTUAL APP: INTERACTIVE TRACKER DASHBOARD & MULTI-VIEW WORKSPACE
// Warm cream background, peach accents, elegant serif headings, rounded cards
// ============================================================================

export const INITIAL_SPRINT_TASKS = [
  // Backlog
  { id: 'task-1', title: 'Research new UI transition and physics models', category: 'Research', priority: 'Medium', status: 'todo', dueDate: '2026-10-29' },
  { id: 'task-2', title: 'Draft monthly product strategy & reflections', category: 'Writing', priority: 'Low', status: 'todo', dueDate: '2026-10-31' },
  { id: 'task-3', title: 'Organize workspace assets and SVG icon library', category: 'Design', priority: 'Low', status: 'todo', dueDate: '2026-11-02' },

  // In Progress
  { id: 'task-4', title: 'Refine visual tokens and typography hierarchy', category: 'Design', priority: 'High', status: 'inprogress', dueDate: '2026-10-26' },
  { id: 'task-5', title: 'Tune Pomodoro liquid wave oscillation physics', category: 'Dev', priority: 'High', status: 'inprogress', dueDate: '2026-10-26' },
  { id: 'task-6', title: 'Prepare design review presentation deck', category: 'Personal', priority: 'Medium', status: 'inprogress', dueDate: '2026-10-27' },

  // In Review
  { id: 'task-7', title: 'Audit Obsidian knowledge graph edge routing', category: 'Dev', priority: 'Medium', status: 'review', dueDate: '2026-10-27' },
  { id: 'task-8', title: 'Update documentation and keyboard shortcut guide', category: 'Writing', priority: 'Low', status: 'review', dueDate: '2026-10-28' },

  // Done
  { id: 'task-9', title: 'Setup unified cream and peach design system tokens', category: 'Design', priority: 'High', status: 'done', dueDate: '2026-10-24' },
  { id: 'task-10', title: 'Implement top pill liquid navigation with slider', category: 'Dev', priority: 'High', status: 'done', dueDate: '2026-10-25' },
  { id: 'task-11', title: 'Configure ambient lo-fi sound generator synthesizer', category: 'Dev', priority: 'Medium', status: 'done', dueDate: '2026-10-25' }
];

let appSprintTasks = [...INITIAL_SPRINT_TASKS];
let activeStatusFilter = 'all';
let activeCategoryFilter = 'all';
let activeSearchQuery = '';
let currentActiveView = 'dashboard';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
      if (Array.isArray(parsed) && parsed.length > 0) {
        appSprintTasks = parsed.map((t, idx) => ({
          id: t.id || `task-${idx + 1}`,
          title: t.title || 'Untitled Task',
          category: t.category || t.squad || 'Personal',
          priority: t.priority || (t.pts >= 8 ? 'High' : t.pts >= 5 ? 'Medium' : 'Low'),
          status: t.status || 'todo',
          dueDate: t.dueDate || '2026-10-26'
        }));
        return;
      }
    }
  } catch (e) {}
  appSprintTasks = [...INITIAL_SPRINT_TASKS];
}

// ============================================================================
// METRICS & PROGRESS CALCULATIONS (Functional Real Personal Tasks)
// ============================================================================

export function updateAppMetrics() {
  const totalTasks = appSprintTasks.length;
  let todoCount = 0;
  let inprogCount = 0;
  let reviewCount = 0;
  let doneCount = 0;

  appSprintTasks.forEach(t => {
    if (t.status === 'done') doneCount++;
    else if (t.status === 'inprogress') inprogCount++;
    else if (t.status === 'review') reviewCount++;
    else todoCount++;
  });

  const completionPct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  // Update Today's Progress ring & ratio
  const progressPctEl = document.getElementById('clockit-progress-pct');
  const donutFillEl = document.getElementById('clockit-donut-fill');
  const progressRatioEl = document.getElementById('clockit-progress-ratio');

  if (progressPctEl) progressPctEl.textContent = `${completionPct}%`;
  if (donutFillEl) donutFillEl.setAttribute('stroke-dasharray', `${completionPct}, 100`);
  if (progressRatioEl) progressRatioEl.textContent = `${doneCount} / ${totalTasks}`;

  // Backlog counter
  const backlogCountEl = document.getElementById('clockit-backlog-count');
  if (backlogCountEl) backlogCountEl.textContent = todoCount;

  // Column counts on Dashboard and Tasks view
  document.querySelectorAll('#app-count-todo').forEach(el => el.textContent = todoCount);
  document.querySelectorAll('#app-count-inprogress').forEach(el => el.textContent = inprogCount);
  document.querySelectorAll('#app-count-review').forEach(el => el.textContent = reviewCount);
  document.querySelectorAll('#app-count-done').forEach(el => el.textContent = doneCount);
}

// ============================================================================
// KANBAN CARD CREATION & RENDERING (Personal Productivity Styling)
// ============================================================================

function formatTaskDueDate(dueDate) {
  if (!dueDate) return 'Today';
  if (dueDate === '2026-10-26') return 'Today';
  const parts = dueDate.split('-');
  if (parts.length === 3) {
    const monthIdx = parseInt(parts[1], 10) - 1;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[monthIdx] || ''} ${parseInt(parts[2], 10)}`;
  }
  return dueDate;
}

function createKanbanCard(task) {
  const card = document.createElement('div');
  card.className = 'app-task-card';
  card.setAttribute('draggable', 'true');
  card.setAttribute('data-id', task.id);
  card.setAttribute('tabindex', '0');

  const isChecked = task.status === 'done';
  const prioClean = (task.priority || 'medium').toLowerCase();
  const catClean = (task.category || 'personal').toLowerCase().replace(/[^a-z0-9]/g, '');

  card.innerHTML = `
    <div class="app-card-header">
      <div class="app-card-check-wrap">
        <input type="checkbox" class="app-card-checkbox" title="${isChecked ? 'Mark incomplete' : 'Mark done'}" ${isChecked ? 'checked' : ''}>
        <span class="app-priority-tag priority-${prioClean}">${task.priority || 'Medium'}</span>
      </div>
      <button class="app-card-more-btn" title="Edit task" type="button" aria-label="Task options">&bull;&bull;&bull;</button>
    </div>
    <div class="app-card-title ${isChecked ? 'strikethrough' : ''}">${escapeHtml(task.title)}</div>
    <div class="app-card-footer">
      <span class="app-category-tag cat-${catClean}">${task.category || 'Personal'}</span>
      <span class="app-due-chip">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        ${formatTaskDueDate(task.dueDate)}
      </span>
    </div>
  `;

  // Checkbox: toggle between done and todo
  const checkbox = card.querySelector('.app-card-checkbox');
  checkbox.addEventListener('click', (e) => {
    e.stopPropagation();
    task.status = checkbox.checked ? 'done' : 'todo';
    saveAppTasks();
    renderAppDashboard();
    renderPersonalCalendar();
    showToast(checkbox.checked ? `Task marked as Done!` : `Task returned to Backlog`);
  });

  // More button & card click: open Edit Modal
  const moreBtn = card.querySelector('.app-card-more-btn');
  moreBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openEditTaskModal(task.id);
  });

  card.addEventListener('click', (e) => {
    if (e.target.closest('.app-card-checkbox') || e.target.closest('.app-card-more-btn')) return;
    openEditTaskModal(task.id);
  });

  // Drag and drop
  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', task.id);
    card.classList.add('dragging');
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
  });

  return card;
}

export function renderAppDashboard() {
  const colTodo = document.getElementById('app-cards-todo');
  const colInprog = document.getElementById('app-cards-inprogress');
  const colReview = document.getElementById('app-cards-review');
  const colDone = document.getElementById('app-cards-done');
  if (!colTodo || !colInprog || !colReview || !colDone) return;

  colTodo.innerHTML = '';
  colInprog.innerHTML = '';
  colReview.innerHTML = '';
  colDone.innerHTML = '';

  const q = activeSearchQuery.toLowerCase().trim();
  const filtered = appSprintTasks.filter(t => {
    const matchCategory = activeCategoryFilter === 'all' || (t.category || '').toLowerCase() === activeCategoryFilter.toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || (t.category && t.category.toLowerCase().includes(q));
    const matchStatus = activeStatusFilter === 'all' 
      || (activeStatusFilter === 'inprogress' && t.status === 'inprogress')
      || (activeStatusFilter === 'review' && t.status === 'review')
      || (activeStatusFilter === 'done' && t.status === 'done');
    return matchCategory && matchSearch && matchStatus;
  });

  filtered.forEach(task => {
    const card = createKanbanCard(task);
    if (task.status === 'todo') colTodo.appendChild(card);
    else if (task.status === 'inprogress') colInprog.appendChild(card);
    else if (task.status === 'review') colReview.appendChild(card);
    else if (task.status === 'done') colDone.appendChild(card);
  });

  // Also render in Tasks Page board if present
  const tasksPageBoard = document.getElementById('tasks-page-board');
  if (tasksPageBoard) {
    tasksPageBoard.innerHTML = `
      <div class="app-board-col" data-col="todo">
        <div class="clockit-col-header">
          <div class="col-indicator-wrap"><span class="status-dot dot-todo"></span><span class="col-title-text">Backlog</span></div>
          <span class="col-count-bubble">${appSprintTasks.filter(t => t.status === 'todo').length}</span>
        </div>
        <div class="app-cards-container" id="tasks-cards-todo"></div>
      </div>
      <div class="app-board-col" data-col="inprogress">
        <div class="clockit-col-header">
          <div class="col-indicator-wrap"><span class="status-dot dot-inprogress"></span><span class="col-title-text">In Progress</span></div>
          <span class="col-count-bubble">${appSprintTasks.filter(t => t.status === 'inprogress').length}</span>
        </div>
        <div class="app-cards-container" id="tasks-cards-inprogress"></div>
      </div>
      <div class="app-board-col" data-col="review">
        <div class="clockit-col-header">
          <div class="col-indicator-wrap"><span class="status-dot dot-review"></span><span class="col-title-text">In Review</span></div>
          <span class="col-count-bubble">${appSprintTasks.filter(t => t.status === 'review').length}</span>
        </div>
        <div class="app-cards-container" id="tasks-cards-review"></div>
      </div>
      <div class="app-board-col" data-col="done">
        <div class="clockit-col-header">
          <div class="col-indicator-wrap"><span class="status-dot dot-done"></span><span class="col-title-text">Done</span></div>
          <span class="col-count-bubble">${appSprintTasks.filter(t => t.status === 'done').length}</span>
        </div>
        <div class="app-cards-container" id="tasks-cards-done"></div>
      </div>
    `;

    const cTodo = document.getElementById('tasks-cards-todo');
    const cInprog = document.getElementById('tasks-cards-inprogress');
    const cRev = document.getElementById('tasks-cards-review');
    const cDone = document.getElementById('tasks-cards-done');

    filtered.forEach(task => {
      const card = createKanbanCard(task);
      if (task.status === 'todo' && cTodo) cTodo.appendChild(card);
      else if (task.status === 'inprogress' && cInprog) cInprog.appendChild(card);
      else if (task.status === 'review' && cRev) cRev.appendChild(card);
      else if (task.status === 'done' && cDone) cDone.appendChild(card);
    });

    initAppDragAndDrop();
  }

  updateAppMetrics();
}

function initAppDragAndDrop() {
  document.querySelectorAll('.app-board-col').forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
    });

    col.addEventListener('dragleave', () => {
      col.classList.remove('drag-over');
    });

    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const taskId = e.dataTransfer.getData('text/plain');
      const targetCol = col.getAttribute('data-col');
      if (!taskId || !targetCol) return;

      const task = appSprintTasks.find(t => t.id === taskId);
      if (task && task.status !== targetCol) {
        task.status = targetCol;
        saveAppTasks();
        renderAppDashboard();
        renderPersonalCalendar();
        showToast(`Moved "${task.title}" to ${targetCol.toUpperCase()}`);
      }
    });
  });
}

// ============================================================================
// TASK EDIT MODAL (Functional Editing & Deletion)
// ============================================================================

function openEditTaskModal(taskId) {
  const task = appSprintTasks.find(t => t.id === taskId);
  if (!task) return;

  const idInput = document.getElementById('edit-task-id');
  const titleInput = document.getElementById('edit-task-title');
  const catSelect = document.getElementById('edit-task-category');
  const prioSelect = document.getElementById('edit-task-priority');
  const statusSelect = document.getElementById('edit-task-status');
  const dateInput = document.getElementById('edit-task-duedate');

  if (idInput) idInput.value = task.id;
  if (titleInput) titleInput.value = task.title;
  if (catSelect) catSelect.value = task.category || 'Personal';
  if (prioSelect) prioSelect.value = task.priority || 'Medium';
  if (statusSelect) statusSelect.value = task.status || 'todo';
  if (dateInput) dateInput.value = task.dueDate || '2026-10-26';

  openModal('app-edit-task-modal');
}

function initEditTaskModal() {
  const form = document.getElementById('app-edit-task-form');
  const deleteBtn = document.getElementById('edit-task-delete-btn');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-task-id').value;
      const title = document.getElementById('edit-task-title').value.trim();
      const category = document.getElementById('edit-task-category').value;
      const priority = document.getElementById('edit-task-priority').value;
      const status = document.getElementById('edit-task-status').value;
      const dueDate = document.getElementById('edit-task-duedate').value || '2026-10-26';

      const task = appSprintTasks.find(t => t.id === id);
      if (task) {
        task.title = title;
        task.category = category;
        task.priority = priority;
        task.status = status;
        task.dueDate = dueDate;
        saveAppTasks();
        renderAppDashboard();
        renderPersonalCalendar();
        closeModal('app-edit-task-modal');
        showToast(`Updated task "${task.title}"`);
      }
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      const id = document.getElementById('edit-task-id').value;
      const idx = appSprintTasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        const removed = appSprintTasks.splice(idx, 1)[0];
        saveAppTasks();
        renderAppDashboard();
        renderPersonalCalendar();
        closeModal('app-edit-task-modal');
        showToast(`Deleted task "${removed.title}"`);
      }
    });
  }
}

// ============================================================================
// PERSONAL PRODUCTIVITY CALENDAR (Month Grid, Deadlines, & Selected-Day Agenda)
// ============================================================================

let calCurrentYear = 2026;
let calCurrentMonthIndex = 9; // 0-indexed (9 = Oct)
let calSelectedDate = '2026-10-26'; // Default to reference today date

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(year, monthIdx) {
  return new Date(year, monthIdx + 1, 0).getDate();
}

function getFirstDayOfWeek(year, monthIdx) {
  const jsDay = new Date(year, monthIdx, 1).getDay();
  return (jsDay + 6) % 7;
}

export function renderPersonalCalendar() {
  const heading = document.getElementById('cal-month-year');
  if (heading) heading.textContent = `${MONTH_NAMES[calCurrentMonthIndex]} ${calCurrentYear}`;

  const matrix = document.getElementById('cal-days-matrix');
  if (!matrix) return;
  matrix.innerHTML = '';

  const totalDays = getDaysInMonth(calCurrentYear, calCurrentMonthIndex);
  const startDayOffset = getFirstDayOfWeek(calCurrentYear, calCurrentMonthIndex);
  const todayStr = '2026-10-26';

  // Prev month padding days
  const prevMonthDays = getDaysInMonth(calCurrentYear, (calCurrentMonthIndex - 1 + 12) % 12);
  for (let i = startDayOffset - 1; i >= 0; i--) {
    const padDate = prevMonthDays - i;
    const padCell = document.createElement('div');
    padCell.className = 'cal-day-cell is-muted';
    padCell.innerHTML = `<span class="cal-day-num">${padDate}</span>`;
    matrix.appendChild(padCell);
  }

  // Active month days (1 to totalDays)
  for (let d = 1; d <= totalDays; d++) {
    const dayCell = document.createElement('button');
    dayCell.type = 'button';
    const monthPadded = String(calCurrentMonthIndex + 1).padStart(2, '0');
    const dayPadded = String(d).padStart(2, '0');
    const dateStr = `${calCurrentYear}-${monthPadded}-${dayPadded}`;
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === calSelectedDate;

    dayCell.className = `cal-day-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`;
    dayCell.setAttribute('data-date', dateStr);

    // Find tasks matching this date
    const dayTasks = appSprintTasks.filter(t => {
      if (t.dueDate === dateStr) return true;
      if (t.dueDate && t.dueDate.endsWith(`-${dayPadded}`) && calCurrentMonthIndex === 9) return true;
      return false;
    });

    let dotsHtml = '';
    if (dayTasks.length > 0) {
      const hasHigh = dayTasks.some(t => (t.priority || '').toLowerCase() === 'high');
      const allDone = dayTasks.every(t => t.status === 'done');
      const dotClass = allDone ? 'dot-done' : (hasHigh ? 'dot-high' : 'dot-medium');
      dotsHtml = `
        <div class="cal-dots-wrap">
          <span class="cal-bullet ${dotClass}"></span>
          ${dayTasks.length > 1 ? `<span class="cal-count-badge">${dayTasks.length}</span>` : ''}
        </div>
      `;
    }

    dayCell.innerHTML = `
      <div class="cal-cell-header">
        <span class="cal-day-num">${d}</span>
        ${isToday ? '<span class="cal-today-tag">TODAY</span>' : ''}
      </div>
      ${dotsHtml}
    `;

    dayCell.addEventListener('click', () => {
      calSelectedDate = dateStr;
      renderPersonalCalendar();
    });

    matrix.appendChild(dayCell);
  }

  // Next month padding days to complete 35 or 42 grid slots
  const filledSlots = startDayOffset + totalDays;
  const targetSlots = filledSlots > 35 ? 42 : 35;
  for (let p = 1; p <= (targetSlots - filledSlots); p++) {
    const nextPadCell = document.createElement('div');
    nextPadCell.className = 'cal-day-cell is-muted';
    nextPadCell.innerHTML = `<span class="cal-day-num">${p}</span>`;
    matrix.appendChild(nextPadCell);
  }

  // Update schedule summary
  const totalUpcoming = appSprintTasks.filter(t => t.status !== 'done').length;
  const summaryLabel = document.getElementById('cal-schedule-summary');
  if (summaryLabel) {
    summaryLabel.textContent = `${totalUpcoming} Active Deadlines`;
  }

  renderSelectedDayAgenda(calSelectedDate);
}

export function renderSelectedDayAgenda(dateStr) {
  const titleEl = document.getElementById('cal-selected-date-title');
  const countEl = document.getElementById('cal-selected-task-count');
  const badgeEl = document.getElementById('cal-selected-status-badge');
  const feed = document.getElementById('cal-selected-tasks-feed');
  if (!feed) return;
  feed.innerHTML = '';

  const parsed = new Date(dateStr + 'T00:00:00');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const formattedDay = !isNaN(parsed.getTime())
    ? `${dayNames[parsed.getDay()]}, ${MONTH_NAMES[parsed.getMonth()]} ${parsed.getDate()}`
    : dateStr;

  if (titleEl) titleEl.textContent = formattedDay;

  const isToday = dateStr === '2026-10-26';
  if (badgeEl) {
    badgeEl.textContent = isToday ? 'Today' : 'Scheduled';
    badgeEl.classList.toggle('badge-today', isToday);
  }

  const dayTasks = appSprintTasks.filter(t => {
    if (t.dueDate === dateStr) return true;
    const dayPadded = dateStr.slice(-2);
    if (t.dueDate && t.dueDate.endsWith(`-${dayPadded}`) && calCurrentMonthIndex === 9) return true;
    return false;
  });

  if (countEl) {
    countEl.textContent = dayTasks.length === 0
      ? 'No tasks scheduled for this day'
      : `${dayTasks.length} task${dayTasks.length === 1 ? '' : 's'} scheduled`;
  }

  if (dayTasks.length === 0) {
    feed.innerHTML = `
      <div class="agenda-empty-state">
        <div class="agenda-empty-icon">&#9749;</div>
        <p class="agenda-empty-text">No tasks due on this day. Take time to focus or schedule a new task below.</p>
      </div>
    `;
    return;
  }

  dayTasks.forEach(task => {
    const isDone = task.status === 'done';
    const row = document.createElement('div');
    row.className = `agenda-task-item ${isDone ? 'is-completed' : ''}`;
    const prioClean = (task.priority || 'medium').toLowerCase();
    const catClean = (task.category || 'personal').toLowerCase();

    row.innerHTML = `
      <div class="agenda-task-left">
        <input type="checkbox" class="agenda-task-checkbox" ${isDone ? 'checked' : ''} title="${isDone ? 'Mark incomplete' : 'Mark done'}">
        <div class="agenda-task-info">
          <span class="agenda-task-title ${isDone ? 'strikethrough' : ''}">${escapeHtml(task.title)}</span>
          <div class="agenda-task-tags">
            <span class="app-priority-tag priority-${prioClean}">${task.priority || 'Medium'}</span>
            <span class="app-category-tag cat-${catClean}">${task.category || 'Personal'}</span>
          </div>
        </div>
      </div>
      <button class="agenda-task-edit-btn" title="Edit task" type="button">&bull;&bull;&bull;</button>
    `;

    row.querySelector('.agenda-task-checkbox').addEventListener('click', (e) => {
      e.stopPropagation();
      task.status = e.target.checked ? 'done' : 'todo';
      saveAppTasks();
      renderAppDashboard();
      renderPersonalCalendar();
      showToast(e.target.checked ? `Task marked as Done!` : `Task returned to Backlog`);
    });

    row.querySelector('.agenda-task-edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditTaskModal(task.id);
    });

    feed.appendChild(row);
  });
}

export function initPersonalCalendar() {
  renderPersonalCalendar();

  // Navigation Arrows
  const prevBtn = document.getElementById('cal-prev-month');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      calCurrentMonthIndex = (calCurrentMonthIndex - 1 + 12) % 12;
      if (calCurrentMonthIndex === 11) calCurrentYear--;
      renderPersonalCalendar();
    });
  }

  const nextBtn = document.getElementById('cal-next-month');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      calCurrentMonthIndex = (calCurrentMonthIndex + 1) % 12;
      if (calCurrentMonthIndex === 0) calCurrentYear++;
      renderPersonalCalendar();
    });
  }

  // Today buttons
  const todayAction = () => {
    calCurrentMonthIndex = 9;
    calCurrentYear = 2026;
    calSelectedDate = '2026-10-26';
    renderPersonalCalendar();
    showToast('Jumped to Today: 26 October 2026');
  };

  const headerTodayBtn = document.getElementById('cal-header-today-btn');
  if (headerTodayBtn) headerTodayBtn.addEventListener('click', todayAction);

  // Add task for this day buttons
  const openCreateForDate = (dateStr) => {
    openModal('app-create-task-modal');
    const dateInput = document.getElementById('new-task-duedate');
    if (dateInput) dateInput.value = dateStr || calSelectedDate;
    const titleInput = document.getElementById('new-task-title');
    if (titleInput) setTimeout(() => titleInput.focus(), 80);
  };

  const calQuickAddBtn = document.getElementById('cal-quick-add-btn');
  if (calQuickAddBtn) {
    calQuickAddBtn.addEventListener('click', () => openCreateForDate(calSelectedDate));
  }

  const agendaAddBtn = document.getElementById('cal-agenda-add-task-btn');
  if (agendaAddBtn) {
    agendaAddBtn.addEventListener('click', () => openCreateForDate(calSelectedDate));
  }
}

// Aliases for view router & verification checks
export const renderCalendarView = renderPersonalCalendar;
export const initCalendarView = initPersonalCalendar;
export const renderSubscriptionCalendar = renderPersonalCalendar;

// Unified Note & Journal Interface Stubs
export function renderJournalNavigation() {}
export function initJournalNavigation() {}

// ============================================================================
// OBSIDIAN KNOWLEDGE GRAPH & MARKDOWN NOTES WORKSPACE
// ============================================================================

export const DEFAULT_NOTES = [
  {
    id: 'note-1',
    title: 'App Architecture & Sync',
    category: 'Architecture',
    date: '24 Oct 2026',
    content: `# App Architecture & Sync

Core architectural model for offline persistence, state caching, and client synchronization.

### Technical Priorities
- [x] Local storage reactive cache with JSON serialization
- [x] Timestamp-anchored Pomodoro countdown without drift
- [ ] Align UI tokens with [[Design System]]
- [ ] Connect daily agenda items with [[Focus & Productivity]]

### Service Performance
| Module | Latency | Status |
| State Cache | 0.8ms | Operational |
| Wave Physics | 60 FPS | Optimal |
| Storage Sync | 1.2ms | Operational |

Internal references: [[Design System]], [[Focus & Productivity]].`
  },
  {
    id: 'note-2',
    title: 'Design System',
    category: 'Ideas',
    date: '25 Oct 2026',
    content: `# Design System

Warm cream palette, Instrument Serif headers, and tactile peach accents.

### Core Token Specifications
- [x] Warm cream background token (#fbf9f5)
- [x] Coral & peach highlight accents (#fa6a2e / #e07a5f)
- [x] Instrument Serif & Inter typographic pairing
- [ ] Harmonize cards across [[App Architecture & Sync]] and [[Focus & Productivity]]

Internal references: [[App Architecture & Sync]], [[Focus & Productivity]].`
  },
  {
    id: 'note-3',
    title: 'Focus & Productivity',
    category: 'Personal',
    date: '26 Oct 2026',
    content: `# Focus & Productivity

Daily workflows, deep focus intervals, and Pomodoro cadence.

### Daily Flow Routine
- [x] Morning review & backlog grooming
- [x] 25-minute Pomodoro sessions with liquid wave indicator
- [ ] Weekly alignment with [[Quarterly Goals]]
- [ ] Maintain consistent card styling from [[Design System]]

Internal references: [[App Architecture & Sync]], [[Design System]], [[Quarterly Goals]].`
  },
  {
    id: 'note-4',
    title: 'Quarterly Goals',
    category: 'Personal',
    date: '26 Oct 2026',
    content: `# Quarterly Goals

Personal milestones, project roadmap, and learning targets.

### Key Milestones
- [x] Deliver polished unified ClockIt tracker workspace
- [x] Implement smooth liquid wave physics and zero-latency calendar
- [ ] Ship unified Obsidian-style graph linked directly to notes
- [ ] Establish daily habits documented in [[Focus & Productivity]]

Internal references: [[Focus & Productivity]], [[Design System]].`
  }
];

let appNotes = [];
let activeNoteId = 'note-1';
let activeNoteTag = 'all';

function loadNotes() {
  const saved = localStorage.getItem('tracker-notes-data');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasLegacySprint = parsed.some(n => (n.title || '').includes('Sprint') || (n.content || '').includes('Sprint 12'));
        if (hasLegacySprint) {
          appNotes = [...DEFAULT_NOTES];
          saveNotes();
        } else {
          appNotes = parsed;
        }
      } else {
        appNotes = [...DEFAULT_NOTES];
      }
    } catch (e) {
      appNotes = [...DEFAULT_NOTES];
    }
  } else {
    appNotes = [...DEFAULT_NOTES];
    saveNotes();
  }
}

function saveNotes() {
  localStorage.setItem('tracker-notes-data', JSON.stringify(appNotes));
}

function renderNotesList() {
  const container = document.getElementById('notes-items-list');
  if (!container) return;
  container.innerHTML = '';

  const q = (document.getElementById('notes-search-field')?.value || '').toLowerCase().trim();
  const filtered = appNotes.filter(n => {
    const matchTag = activeNoteTag === 'all' || n.category === activeNoteTag;
    const matchQ = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    return matchTag && matchQ;
  });

  filtered.forEach(note => {
    const card = document.createElement('div');
    const isActive = note.id === activeNoteId;
    card.className = `note-list-card ${isActive ? 'is-active-note' : ''}`;
    card.setAttribute('data-id', note.id);

    const preview = note.content.replace(/#+s+/g, '').replace(/[[/g, '').replace(/]]/g, '').slice(0, 72) + '...';

    card.innerHTML = `
      <div class="note-card-top">
        <h4 class="note-card-title font-serif">${escapeHtml(note.title)}</h4>
        <span class="note-card-badge badge-${note.category.toLowerCase()}">${note.category}</span>
      </div>
      <p class="note-card-snippet">${escapeHtml(preview)}</p>
      <div class="note-card-footer">
        <span class="note-card-date">${note.date || 'Recent'}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      activeNoteId = note.id;
      renderNotesList();
      loadActiveNote();
      renderKnowledgeGraph();
    });

    container.appendChild(card);
  });
}

function loadActiveNote() {
  const note = appNotes.find(n => n.id === activeNoteId);
  if (!note) return;

  const titleInput = document.getElementById('note-active-title');
  const categorySelect = document.getElementById('note-active-category');
  const bodyTextarea = document.getElementById('note-active-body');

  if (titleInput) titleInput.value = note.title;
  if (categorySelect) categorySelect.value = note.category;
  if (bodyTextarea) bodyTextarea.value = note.content;

  renderActiveNotePreview(note.content);
}

function renderActiveNotePreview(rawContent) {
  const preview = document.getElementById('note-active-rendered');
  if (!preview) return;

  let html = rawContent;

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3 class="preview-h3 font-serif">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="preview-h2 font-serif">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="preview-h1 font-serif">$1</h1>');

  // Bold & Italics
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Checklists (- [x] or - [ ])
  html = html.replace(/^-\s*\[(x|X)\]\s*(.*$)/gim, '<div class="preview-checklist-item is-checked"><input type="checkbox" checked disabled> <span>$2</span></div>');
  html = html.replace(/^-\s*\[ \]\s*(.*$)/gim, '<div class="preview-checklist-item"><input type="checkbox" disabled> <span>$1</span></div>');

  // Obsidian [[Internal Link]] pills
  html = html.replace(/\[\[([^\]]+)\]\]/g, '<span class="obsidian-link-pill" data-link="$1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> <span>$1</span></span>');

  // Tables
  html = html.replace(/\|(.+)\|/g, (match) => {
    const cells = match.split('|').filter(c => c.trim().length > 0);
    if (cells.some(c => c.includes('---'))) {
      return ''; // divider row
    }
    const tdCells = cells.map(c => `<td>${c.trim()}</td>`).join('');
    return `<tr>${tdCells}</tr>`;
  });
  html = html.replace(/(<tr>.*?<\/tr>\s*)+/gs, '<div class="preview-table-wrap"><table class="preview-table"><tbody>$&</tbody></table></div>');

  // Paragraph breaks
  html = html.replace(/\n\n+/g, '<br><br>');

  preview.innerHTML = html;

  // Make [[Internal Link]] clickable
  preview.querySelectorAll('.obsidian-link-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const targetName = pill.getAttribute('data-link');
      const targetNote = appNotes.find(n => n.title.toLowerCase().includes(targetName.toLowerCase()));
      if (targetNote) {
        activeNoteId = targetNote.id;
        renderNotesList();
        loadActiveNote();
        renderKnowledgeGraph();
        showToast(`Navigated to: ${targetNote.title}`);
      } else {
        showToast(`Internal Link: ${targetName}`);
      }
    });
  });
}

function initNotesWorkspace() {
  loadNotes();
  renderNotesList();
  loadActiveNote();
  renderKnowledgeGraph();

  // Search input
  const searchInput = document.getElementById('notes-search-field');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderNotesList();
    });
  }

  // Tags filter bar
  document.querySelectorAll('#notes-tags-bar .notes-tag-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#notes-tags-bar .notes-tag-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeNoteTag = chip.getAttribute('data-tag');
      renderNotesList();
    });
  });

  // Editor typing & Auto-save
  const titleInput = document.getElementById('note-active-title');
  const categorySelect = document.getElementById('note-active-category');
  const bodyTextarea = document.getElementById('note-active-body');
  const saveStatus = document.getElementById('note-save-status');

  function saveCurrentNote() {
    const note = appNotes.find(n => n.id === activeNoteId);
    if (!note) return;

    if (titleInput) note.title = titleInput.value || 'Untitled Note';
    if (categorySelect) note.category = categorySelect.value;
    if (bodyTextarea) note.content = bodyTextarea.value;

    saveNotes();
    if (saveStatus) {
      saveStatus.textContent = 'Saved';
      saveStatus.classList.add('status-saved');
    }
    renderActiveNotePreview(note.content);
    renderNotesList();
    renderKnowledgeGraph();
  }

  let saveTimer = null;
  const triggerDebouncedSave = () => {
    if (saveStatus) {
      saveStatus.textContent = 'Editing...';
      saveStatus.classList.remove('status-saved');
    }
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveCurrentNote, 400);
  };

  if (titleInput) titleInput.addEventListener('input', triggerDebouncedSave);
  if (categorySelect) categorySelect.addEventListener('change', triggerDebouncedSave);
  if (bodyTextarea) bodyTextarea.addEventListener('input', triggerDebouncedSave);

  // New Note CTA
  const newNoteBtn = document.getElementById('notes-new-btn');
  if (newNoteBtn) {
    newNoteBtn.addEventListener('click', () => {
      const nextId = `note-${Date.now()}`;
      const newNote = {
        id: nextId,
        title: 'New Interconnected Note',
        category: 'Ideas',
        date: 'Today',
        content: `# New Interconnected Note

Document ideas, architecture, and team specs here.

### Checklist
- [ ] First task
- [ ] Connect with [[Sprint 12 Architecture & API]]

Internal references: [[Design System & Visual Tokens]].`
      };
      appNotes.unshift(newNote);
      activeNoteId = nextId;
      saveNotes();
      renderNotesList();
      loadActiveNote();
      renderKnowledgeGraph();
      showToast('Created new connected note');
      if (titleInput) setTimeout(() => { titleInput.focus(); titleInput.select(); }, 100);
    });
  }

  // Editor Formatting Buttons
  document.querySelectorAll('.editor-tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!bodyTextarea) return;
      const type = btn.getAttribute('data-insert');
      const start = bodyTextarea.selectionStart;
      const end = bodyTextarea.selectionEnd;
      const text = bodyTextarea.value;

      let insert = '';
      if (type === 'bold') insert = '**bold text**';
      else if (type === 'italic') insert = '*italic text*';
      else if (type === 'heading') insert = '\n### Subheading\n';
      else if (type === 'checklist') insert = '\n- [ ] New checklist item';
      else if (type === 'table') insert = '\n| Feature | Status | Lead |\n| API Endpoints | Ready | Alex |\n| DB Indexes | Done | Raj |\n';
      else if (type === 'link') insert = '[[API Authentication]]';

      bodyTextarea.value = text.substring(0, start) + insert + text.substring(end);
      bodyTextarea.focus();
      triggerDebouncedSave();
    });
  });

  // Knowledge Graph Reset Button
  const resetGraphBtn = document.getElementById('graph-reset-btn');
  if (resetGraphBtn) {
    resetGraphBtn.addEventListener('click', () => {
      renderKnowledgeGraph();
      showToast('Recentered Obsidian Knowledge Graph');
    });
  }
}

function selectNote(noteId) {
  activeNoteId = noteId;
  renderNotesList();
  loadActiveNote();
  renderKnowledgeGraph();
}

function renderKnowledgeGraph() {
  const svg = document.getElementById('knowledge-graph-svg');
  if (!svg) return;
  svg.innerHTML = '';

  const nodes = [];
  const links = [];
  const nodeMap = new Map();

  // 1. Gather all Note Nodes (Strictly actual notes)
  appNotes.forEach((n) => {
    const nodeObj = {
      id: n.id,
      name: n.title,
      type: 'note',
      category: n.category,
      active: n.id === activeNoteId
    };
    nodes.push(nodeObj);
    nodeMap.set(n.title.toLowerCase(), nodeObj);
    nodeMap.set(n.id, nodeObj);
  });

  // 2. Parse [[...]] links between actual notes ONLY
  appNotes.forEach(n => {
    const regex = /\[\[([^\]]+)\]\]/g;
    let match;
    while ((match = regex.exec(n.content)) !== null) {
      const targetName = match[1].trim().toLowerCase();
      const targetNote = appNotes.find(other => 
        other.id !== n.id && (
          other.title.toLowerCase() === targetName ||
          other.title.toLowerCase().includes(targetName) ||
          targetName.includes(other.title.toLowerCase())
        )
      );

      if (targetNote) {
        const sourceNode = nodeMap.get(n.id);
        const targetNode = nodeMap.get(targetNote.id);
        if (sourceNode && targetNode) {
          const alreadyLinked = links.some(l => 
            (l.source.id === sourceNode.id && l.target.id === targetNode.id) ||
            (l.source.id === targetNode.id && l.target.id === sourceNode.id)
          );
          if (!alreadyLinked) {
            links.push({
              source: sourceNode,
              target: targetNode
            });
          }
        }
      }
    }
  });

  // 3. Layout: Balanced circular layout with straight line geometry
  const width = 380;
  const height = 440;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.35;

  nodes.forEach((node, i) => {
    const angle = (i / Math.max(1, nodes.length)) * 2 * Math.PI - (Math.PI / 2);
    const r = node.active ? radius * 0.55 : radius * 0.88;
    node.x = cx + r * Math.cos(angle);
    node.y = cy + r * Math.sin(angle);
  });

  // 4. Render STRAIGHT Connecting Lines (Obsidian style)
  const linesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  linesGroup.setAttribute('class', 'graph-lines-group');

  links.forEach(l => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', l.source.x);
    line.setAttribute('y1', l.source.y);
    line.setAttribute('x2', l.target.x);
    line.setAttribute('y2', l.target.y);
    line.setAttribute('class', `graph-straight-edge ${l.source.active || l.target.active ? 'edge-active' : ''}`);
    line.setAttribute('data-src', l.source.id);
    line.setAttribute('data-tgt', l.target.id);
    linesGroup.appendChild(line);
  });

  svg.appendChild(linesGroup);

  // 5. Render Circular Nodes & Typography Labels
  const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  nodesGroup.setAttribute('class', 'graph-nodes-group');

  nodes.forEach(node => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', `graph-node-group ${node.active ? 'is-active-node' : ''}`);
    g.setAttribute('data-id', node.id);

    // Glow aura for active node
    if (node.active) {
      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glow.setAttribute('cx', node.x);
      glow.setAttribute('cy', node.y);
      glow.setAttribute('r', '17');
      glow.setAttribute('class', 'node-glow-aura');
      g.appendChild(glow);
    }

    // Node Circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', node.x);
    circle.setAttribute('cy', node.y);
    circle.setAttribute('r', node.active ? '9.5' : '7.5');
    circle.setAttribute('class', 'graph-circle-node');
    g.appendChild(circle);

    // Node Label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', node.x);
    text.setAttribute('y', node.y + (node.y > cy ? 17 : -12));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'graph-node-label');
    text.textContent = node.name.length > 20 ? node.name.substring(0, 18) + '...' : node.name;
    g.appendChild(text);

    // Hover Highlight
    g.addEventListener('mouseenter', () => {
      svg.querySelectorAll('.graph-straight-edge').forEach(edge => {
        const isConnected = edge.getAttribute('data-src') === node.id || edge.getAttribute('data-tgt') === node.id;
        edge.classList.toggle('edge-highlight', isConnected);
      });
      g.classList.add('node-hover');
    });

    g.addEventListener('mouseleave', () => {
      svg.querySelectorAll('.graph-straight-edge').forEach(edge => edge.classList.remove('edge-highlight'));
      g.classList.remove('node-hover');
    });

    // Click to Open Note
    g.addEventListener('click', () => {
      selectNote(node.id);
      showToast(`Switched to note "${node.name}"`);
    });

    nodesGroup.appendChild(g);
  });

  svg.appendChild(nodesGroup);
}

// ============================================================================
// MASTER VIEW NAVIGATION (Home, Dashboard, Tasks, Calendar, Notes, Timer, Reports)
// ============================================================================

export function updateLiquidPillGlider(activeTab) {
  const glider = document.getElementById('liquid-pill-glider');
  const nav = document.getElementById('clockit-top-pills');
  if (!glider || !nav) return;
  const tab = activeTab || nav.querySelector('.clockit-pill-tab.active');
  if (!tab) return;
  const navRect = nav.getBoundingClientRect();
  const tabRect = tab.getBoundingClientRect();
  if (tabRect.width === 0) return;
  glider.style.left = `${tabRect.left - navRect.left}px`;
  glider.style.width = `${tabRect.width}px`;
  glider.style.opacity = '1';
}

export function navigateToTrackerView(viewName) {
  currentActiveView = viewName;
  const homeSection = document.getElementById('clockit-home-section');
  const appMain = document.getElementById('clockit-app-main') || document.getElementById('actual-app-view');

  if (viewName === 'home') {
    if (homeSection) {
      homeSection.hidden = false;
      homeSection.style.display = 'block';
    }
    if (appMain) {
      appMain.hidden = true;
      appMain.classList.remove('active');
    }
    document.body.classList.remove('in-app-mode');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    }, 120);
  } else {
    if (homeSection) {
      homeSection.hidden = true;
      homeSection.style.display = 'none';
    }
    if (appMain) {
      appMain.hidden = false;
      appMain.classList.add('active');
    }
    document.body.classList.add('in-app-mode');

    // Views dictionary
    const views = {
      'dashboard': document.getElementById('tracker-view-dashboard'),
      'tasks': document.getElementById('tracker-view-tasks'),
      'calendar': document.getElementById('tracker-view-calendar'),
      'notes': document.getElementById('tracker-view-notes'),
      'reports': document.getElementById('tracker-view-reports'),
      'timer': document.getElementById('tracker-view-timer')
    };

    // Hide all views first
    Object.values(views).forEach(v => {
      if (v) {
        v.hidden = true;
        v.classList.remove('active');
      }
    });

    // Show target view
    const targetViewEl = views[viewName] || views['dashboard'];
    if (targetViewEl) {
      targetViewEl.hidden = false;
      targetViewEl.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Handle specific view hooks
    if (viewName === 'notes') {
      renderNotesList();
      loadActiveNote();
      renderKnowledgeGraph();
    } else if (viewName === 'calendar') {
      renderPersonalCalendar();
    } else if (viewName === 'tasks' || viewName === 'dashboard') {
      renderAppDashboard();
    } else if (viewName === 'timer') {
      const timerView = document.getElementById('clockit-timer-view');
      if (timerView) timerView.style.display = 'block';
    }
  }

  // Sync Top Nav Pills
  document.querySelectorAll('#clockit-top-pills .clockit-pill-tab, #tracker-top-pills .tracker-pill-tab').forEach(pill => {
    const target = pill.getAttribute('data-view');
    const isAct = target === viewName;
    pill.classList.toggle('active', isAct);
    pill.setAttribute('aria-selected', isAct ? 'true' : 'false');
    if (isAct) {
      updateLiquidPillGlider(pill);
    }
  });

  // Sync Left Sidebar Items if any exist
  document.querySelectorAll('#tracker-sidebar .tracker-sidebar-item').forEach(item => {
    const target = item.getAttribute('data-view');
    item.classList.toggle('active', target === viewName);
  });
}

if (typeof window !== 'undefined') {
  window.navigateToTrackerView = navigateToTrackerView;
  window.switchClockitView = navigateToTrackerView;
  window.updateLiquidPillGlider = updateLiquidPillGlider;
}

// ============================================================================
// BOOTSTRAP APP DASHBOARD & EVENT LISTENERS
// ============================================================================

function initAppDashboard() {
  loadAppTasks();
  renderAppDashboard();
  initAppDragAndDrop();
  initEditTaskModal();
  initCalendarView();
  initNotesWorkspace();

  initLiquidNavigation();
  initFluidCards();
  initLiquidTimerWave();
  initLiveClockAndGreeting();
  initPomodoroTimer(showToast);
  initQuickNotes();

  // Left Sidebar Click
  document.querySelectorAll('#tracker-sidebar .tracker-sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.getAttribute('data-action');
      if (action === 'settings') {
        const settingsModal = document.getElementById('timer-settings-modal');
        if (settingsModal) settingsModal.hidden = false;
        return;
      }
      const view = item.getAttribute('data-view') || 'dashboard';
      navigateToTrackerView(view);
    });
  });

  // Expand notes button from quick notes card
  const expandNotesBtn = document.getElementById('expand-notes-page-btn');
  if (expandNotesBtn) {
    expandNotesBtn.addEventListener('click', () => navigateToTrackerView('notes'));
  }

  // Jump to backlog button
  const jumpBacklogBtn = document.getElementById('jump-to-backlog-btn');
  if (jumpBacklogBtn) {
    jumpBacklogBtn.addEventListener('click', () => {
      const col = document.querySelector('.app-board-col[data-col="todo"]');
      if (col) col.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Dashboard filter pills (All issues, My issues, In progress, In review)
  document.querySelectorAll('#dashboard-filter-pills .filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#dashboard-filter-pills .filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeStatusFilter = pill.getAttribute('data-filter') || 'all';
      renderAppDashboard();
    });
  });

  // Tasks page filter pills
  document.querySelectorAll('#tasks-page-filter-pills .filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#tasks-page-filter-pills .filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeStatusFilter = pill.getAttribute('data-filter') || 'all';
      renderAppDashboard();
    });
  });

  // Search input on Dashboard
  const searchInput = document.getElementById('app-task-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      activeSearchQuery = e.target.value;
      renderAppDashboard();
    });
  }

  // Search input on Tasks Page
  const tasksSearchInput = document.getElementById('tasks-page-search-input');
  if (tasksSearchInput) {
    tasksSearchInput.addEventListener('input', (e) => {
      activeSearchQuery = e.target.value;
      renderAppDashboard();
    });
  }

  // Category select on Tasks Page
  const tasksCategorySelect = document.getElementById('tasks-page-category-select');
  if (tasksCategorySelect) {
    tasksCategorySelect.addEventListener('change', (e) => {
      activeCategoryFilter = e.target.value;
      renderAppDashboard();
    });
  }

  // Global search trigger button (magnifying glass)
  const searchTrigger = document.getElementById('tracker-search-trigger');
  if (searchTrigger) {
    searchTrigger.addEventListener('click', () => {
      if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Notification bell trigger
  const notifTrigger = document.getElementById('tracker-notif-trigger');
  if (notifTrigger) {
    notifTrigger.addEventListener('click', () => {
      showToast('All tasks and workspace systems operational.');
    });
  }

  // New Issue Button (+ New Issue)
  const openNewTaskBtn = document.getElementById('app-new-task-btn');
  const tasksCreateBtn = document.getElementById('tasks-page-create-btn');
  const createTaskModal = document.getElementById('app-create-task-modal');
  const createTaskForm = document.getElementById('app-create-task-form');

  const openCreateHandler = () => {
    openModal('app-create-task-modal');
    const titleInput = document.getElementById('new-task-title');
    if (titleInput) setTimeout(() => titleInput.focus(), 100);
  };

  if (openNewTaskBtn) openNewTaskBtn.addEventListener('click', openCreateHandler);
  if (tasksCreateBtn) tasksCreateBtn.addEventListener('click', openCreateHandler);

  if (createTaskForm) {
    createTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const titleEl = document.getElementById('new-task-title');
      const catEl = document.getElementById('new-task-category');
      const prioEl = document.getElementById('new-task-priority');
      const dueEl = document.getElementById('new-task-duedate');

      const title = titleEl ? titleEl.value.trim() : '';
      const category = catEl ? catEl.value : 'Personal';
      const priority = prioEl ? prioEl.value : 'Medium';
      const dueDate = dueEl ? dueEl.value : '2026-10-26';

      if (!title) return;

      const newTask = {
        id: `task-${Date.now()}`,
        title,
        category,
        priority,
        dueDate,
        status: 'todo'
      };

      appSprintTasks.unshift(newTask);
      saveAppTasks();
      renderAppDashboard();
      renderPersonalCalendar();
      closeModal('app-create-task-modal');
      if (titleEl) titleEl.value = '';
      showToast(`Created task: ${title}`);
    });
  }
}

// ============================================================================
// CLOCKIT LIQUID UI & MODULAR CONTROLLERS (TOP LEVEL)
// ============================================================================

export function initLiquidNavigation() {
  // Top Nav Pills Click
  document.querySelectorAll('#clockit-top-pills .clockit-pill-tab, #tracker-top-pills .tracker-pill-tab').forEach(pill => {
    pill.addEventListener('click', () => {
      const action = pill.getAttribute('data-action');
      if (action === 'settings') {
        const settingsModal = document.getElementById('timer-settings-modal');
        if (settingsModal) settingsModal.hidden = false;
        return;
      }
      const view = pill.getAttribute('data-view') || 'dashboard';
      navigateToTrackerView(view);
    });
  });

  // ClockIt Home Brand Logo Button
  const brandHomeBtn = document.getElementById('clockit-brand-home-btn');
  if (brandHomeBtn) {
    brandHomeBtn.addEventListener('click', () => {
      navigateToTrackerView('home');
    });
  }

  // Header Actions: Music Toggle, Settings, Profile
  const topAudioBtn = document.getElementById('top-audio-toggle-btn');
  if (topAudioBtn) {
    topAudioBtn.addEventListener('click', () => {
      const musicWidget = document.getElementById('music-widget');
      if (musicWidget) {
        musicWidget.classList.toggle('active');
        musicWidget.hidden = !musicWidget.classList.contains('active');
      }
    });
  }

  const topSettingsBtn = document.getElementById('top-settings-btn');
  if (topSettingsBtn) {
    topSettingsBtn.addEventListener('click', () => {
      const modal = document.getElementById('timer-settings-modal');
      if (modal) modal.hidden = false;
    });
  }

  // Avatar User Dropdown
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

  // Theme Toggle Button inside User Menu
  const appThemeBtn = document.getElementById('app-theme-toggle-btn');
  if (appThemeBtn) {
    appThemeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('tracker-theme', isDark ? 'dark' : 'light');
      showToast(isDark ? 'Switched to Dark mode' : 'Switched to Light mode', 2000);
    });
  }

  // Open Preferences Modal
  const openPrefBtn = document.getElementById('app-open-settings-item');
  if (openPrefBtn) {
    openPrefBtn.addEventListener('click', () => {
      const modal = document.getElementById('timer-settings-modal');
      if (modal) modal.hidden = false;
    });
  }

  window.addEventListener('resize', () => {
    updateLiquidPillGlider();
  });
  setTimeout(() => updateLiquidPillGlider(), 150);
}

export function initFluidCards() {
  const cards = document.querySelectorAll('.clockit-fluid-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

export function initLiquidTimerWave() {
  const dashCanvas = document.getElementById('liquid-timer-canvas');
  const fullCanvas = document.getElementById('pomodoro-liquid-canvas');
  if (!dashCanvas && !fullCanvas) return;

  let waveOffset = 0;

  function drawWaveOnCanvas(canvas, snap) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Calculate level based on actual remaining progress from engine
    const progress = (snap && typeof snap.progress === 'number') ? snap.progress : 0;
    const remainingRatio = Math.max(0.06, Math.min(0.94, 1 - progress));
    const waterY = height - (height * remainingRatio);

    const isBreak = snap && (snap.mode === 'shortBreak' || snap.mode === 'longBreak');
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    ctx.save();
    // Circular clipping
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, (width / 2) - 1.5, 0, Math.PI * 2);
    ctx.clip();

    // Wave 1: Back/crest wave (lighter/translucent)
    ctx.beginPath();
    ctx.moveTo(0, height);
    const amp1 = prefersReducedMotion ? 0 : (width > 200 ? 7 : 3.8);
    const freq1 = width > 200 ? 32 : 18;
    for (let x = 0; x <= width; x += 2) {
      const y = waterY + Math.sin((x / freq1) + waveOffset) * amp1;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = isBreak ? 'rgba(114, 181, 149, 0.38)' : 'rgba(248, 191, 162, 0.42)';
    ctx.fill();

    // Wave 2: Foreground deeper wave with gradient
    ctx.beginPath();
    ctx.moveTo(0, height);
    const amp2 = prefersReducedMotion ? 0 : (width > 200 ? 8.5 : 4.8);
    const freq2 = width > 200 ? 28 : 16;
    for (let x = 0; x <= width; x += 2) {
      const y = waterY + Math.cos((x / freq2) + (waveOffset * 1.25)) * amp2;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, waterY, 0, height);
    if (isBreak) {
      grad.addColorStop(0, 'rgba(74, 150, 114, 0.78)');
      grad.addColorStop(1, 'rgba(45, 105, 78, 0.95)');
    } else {
      grad.addColorStop(0, 'rgba(224, 122, 95, 0.78)');
      grad.addColorStop(1, 'rgba(186, 101, 66, 0.96)');
    }
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();
  }

  function renderWave() {
    const snap = (typeof window !== 'undefined' && window.pomodoroEngine) 
      ? window.pomodoroEngine.getSnapshot() 
      : { progress: 0.25, mode: 'focus', state: 'idle' };

    drawWaveOnCanvas(dashCanvas, snap);
    drawWaveOnCanvas(fullCanvas, snap);

    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      waveOffset += 0.035;
    }

    requestAnimationFrame(renderWave);
  }

  renderWave();
}

export function initLiveClockAndGreeting() {
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
  setInterval(updateLiveClock, 1000);
}

export function initQuickNotes() {
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
          <li>${escapeHtml(text)}</li>
        </ul>
      `;
      notesList.prepend(noteCard);
      noteInput.value = '';
      showToast('Note added to Quick Notes');
    });
  }
}

// ============================================================================
// AUTH & VIEW NAVIGATION SYSTEM
// Default: Shows Home page with full GSAP Hero Scrolling Animation
// App Dashboard: Opened on Sign In, Start Free, Focus Timer card, or #app/#dashboard hash
// ============================================================================

function initAuthSystem() {
  const actualAppView = document.getElementById('clockit-app-main') || document.getElementById('actual-app-view');
  const navUserPill = document.getElementById('nav-user-pill');
  const navCtaBtn = document.getElementById('nav-cta-btn');
  const heroStartBtn = document.getElementById('hero-start-btn');
  const navSignoutBtn = document.getElementById('nav-signout-btn');
  const appExitBtn = document.getElementById('app-exit-view-btn');
  const appSignoutBtn = document.getElementById('app-signout-action-btn');
  const trackerBrandHomeBtn = document.getElementById('tracker-brand-home-btn');

  function updateAuthUI(isLoggedIn) {
    if (navUserPill) navUserPill.hidden = !isLoggedIn;
    if (navCtaBtn) navCtaBtn.hidden = isLoggedIn;
  }

  function enterAppDashboard(targetView = 'dashboard') {
    navigateToTrackerView(targetView);
    updateAuthUI(true);
  }

  function exitAppDashboard() {
    navigateToTrackerView('home');
    if (window.location.hash && !window.location.hash.includes('website')) {
      try {
        history.pushState(null, null, window.location.pathname);
      } catch (e) {}
    }
  }

  function signInAsDemo(targetView = 'dashboard', suppressToast = false) {
    enterAppDashboard(targetView);
    closeModal('auth-modal');
    if (!suppressToast) {
      showToast('Signed in as Alex Chen &bull; Sprint 12 Active', 3000);
    }
  }

  function signOut() {
    exitAppDashboard();
    updateAuthUI(false);
    showToast('Signed out of Tracker workspace');
  }

  // Website topbar "Sign in" button
  if (navCtaBtn) {
    navCtaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      signInAsDemo('dashboard');
    });
  }

  // Hero section "Start tracking free" CTA button
  if (heroStartBtn) {
    heroStartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      signInAsDemo('dashboard');
    });
  }

  // Website logged-in user pill click (jump straight to app dashboard)
  if (navUserPill) {
    navUserPill.addEventListener('click', (e) => {
      if (e.target.closest('#nav-signout-btn')) return;
      enterAppDashboard('dashboard');
    });
  }

  // App Top Bar brand logo -> return to Website Home Page with scroll animation
  if (trackerBrandHomeBtn) {
    trackerBrandHomeBtn.addEventListener('click', () => {
      exitAppDashboard();
    });
  }

  // Back to website button inside User Menu dropdown
  if (appExitBtn) {
    appExitBtn.addEventListener('click', () => {
      exitAppDashboard();
      showToast('Returned to Tracker marketing overview');
    });
  }

  if (navSignoutBtn) navSignoutBtn.addEventListener('click', signOut);
  if (appSignoutBtn) appSignoutBtn.addEventListener('click', signOut);

  // URL hash navigation support (#tasks, #calendar, #notes, #timer, #dashboard, #app)
  function handleUrlHash() {
    const hash = window.location.hash.toLowerCase();
    const isAppTarget = hash.includes('app') || hash.includes('dashboard') || hash.includes('task') || hash.includes('calendar') || hash.includes('note') || hash.includes('timer') || hash.includes('report');

    if (isAppTarget) {
      let target = 'dashboard';
      if (hash.includes('task')) target = 'tasks';
      else if (hash.includes('calendar')) target = 'calendar';
      else if (hash.includes('note')) target = 'notes';
      else if (hash.includes('timer')) target = 'timer';
      else if (hash.includes('report')) target = 'reports';
      enterAppDashboard(target);
    } else {
      // Default: Root home page with full GSAP Hero Scrolling Animation
      exitAppDashboard();
    }
  }

  window.addEventListener('hashchange', handleUrlHash);
  if (window.location.hash) {
    handleUrlHash();
  } else {
    // Show Home Page on root URL
    exitAppDashboard();
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
  initAppDashboard();
  initAuthSystem();
});

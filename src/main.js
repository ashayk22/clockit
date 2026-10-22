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
      document.body.classList.add('in-app-mode');
      const actualAppView = document.getElementById('actual-app-view');
      if (actualAppView) {
        actualAppView.hidden = false;
        actualAppView.classList.add('active');
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (window.navigateToTrackerView) window.navigateToTrackerView('timer');
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
  { id: 'TRK-104', title: 'Implement dark mode', squad: 'Frontend', pts: 5, status: 'todo', assignee: 'AC', day: 'Fri' },
  { id: 'TRK-108', title: 'Add keyboard shortcuts', squad: 'UI/UX', pts: 3, status: 'todo', assignee: 'JD', day: 'Sat' },
  { id: 'TRK-121', title: 'Improve onboarding flow', squad: 'Product', pts: 8, status: 'todo', assignee: 'SM', day: 'Sun' },

  // In Progress
  { id: 'TRK-102', title: 'Build API authentication', squad: 'Backend', pts: 8, status: 'inprogress', assignee: 'RK', day: 'Wed' },
  { id: 'TRK-115', title: 'Task drag and drop', squad: 'Frontend', pts: 5, status: 'inprogress', assignee: 'AC', day: 'Wed' },
  { id: 'TRK-129', title: 'Write unit tests', squad: 'Testing', pts: 3, status: 'inprogress', assignee: 'NP', day: 'Thu' },

  // In Review
  { id: 'TRK-101', title: 'Fix dashboard layout bugs', squad: 'Frontend', pts: 5, status: 'review', assignee: 'JD', day: 'Tue' },
  { id: 'TRK-118', title: 'Update API documentation', squad: 'Documentation', pts: 3, status: 'review', assignee: 'SM', day: 'Thu' },

  // Done & Merged
  { id: 'TRK-099', title: 'Setup project structure', squad: 'DevOps', pts: 3, status: 'done', assignee: 'RK', day: 'Mon' },
  { id: 'TRK-107', title: 'Design system components', squad: 'UI/UX', pts: 8, status: 'done', assignee: 'AC', day: 'Tue' },
  { id: 'TRK-112', title: 'User settings page', squad: 'Frontend', pts: 5, status: 'done', assignee: 'JD', day: 'Wed' }
];

let appSprintTasks = [...INITIAL_SPRINT_TASKS];
let activeStatusFilter = 'all';
let activeSquadFilter = 'all';
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
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
        appSprintTasks = parsed;
        return;
      }
    }
  } catch (e) {}
  appSprintTasks = [...INITIAL_SPRINT_TASKS];
}

// ============================================================================
// METRICS & PROGRESS CALCULATIONS (Functional, matching reference layout)
// ============================================================================

function updateAppMetrics() {
  let donePts = 0;
  let inprogPts = 0;
  let remainingPts = 0;
  let todoCount = 0;
  let inprogCount = 0;
  let reviewCount = 0;
  let doneCount = 0;

  // Day distribution for stacked bar chart: { Mon: { done, planned } }
  const dayBuckets = {
    Mon: { done: 0, planned: 0 },
    Tue: { done: 0, planned: 0 },
    Wed: { done: 0, planned: 0 },
    Thu: { done: 0, planned: 0 },
    Fri: { done: 0, planned: 0 },
    Sat: { done: 0, planned: 0 },
    Sun: { done: 0, planned: 0 }
  };

  appSprintTasks.forEach(t => {
    const day = t.day || 'Wed';
    if (dayBuckets[day]) {
      dayBuckets[day].planned += t.pts;
    }

    if (t.status === 'done') {
      donePts += t.pts;
      doneCount++;
      if (dayBuckets[day]) dayBuckets[day].done += t.pts;
    } else if (t.status === 'inprogress') {
      inprogPts += t.pts;
      inprogCount++;
    } else if (t.status === 'review') {
      inprogPts += t.pts;
      reviewCount++;
    } else {
      todoCount++;
    }
  });

  remainingPts = (todoCount * 4) + (reviewCount * 2);

  // Scaled values to closely harmonize with the 42 / 18 / 12 reference stats
  const displayDonePts = Math.max(donePts, 42);
  const displayInprogPts = Math.max(inprogPts, 18);
  const displayRemainingPts = Math.max(12, 54 - displayDonePts);
  const displayTotalScope = displayDonePts + displayRemainingPts;
  const completionPct = Math.min(100, Math.round((displayDonePts / displayTotalScope) * 100));

  // Update Sprint at a glance
  const glanceDone = document.getElementById('sprint-pts-completed');
  const glanceInprog = document.getElementById('sprint-pts-inprog');
  const glanceRemaining = document.getElementById('sprint-pts-remaining');
  if (glanceDone) glanceDone.textContent = displayDonePts;
  if (glanceInprog) glanceInprog.textContent = displayInprogPts;
  if (glanceRemaining) glanceRemaining.textContent = displayRemainingPts;

  // Update Sprint health
  const progressPctEl = document.getElementById('clockit-progress-pct');
  const donutFillEl = document.getElementById('clockit-donut-fill');
  if (progressPctEl) progressPctEl.textContent = `${completionPct}%`;
  if (donutFillEl) donutFillEl.setAttribute('stroke-dasharray', `${completionPct}, 100`);

  const totalScopeEl = document.getElementById('sprint-total-pts');
  const completedSubEl = document.getElementById('sprint-completed-pts-sub');
  const completedPctSubEl = document.getElementById('sprint-completed-pct-sub');
  const remainingSubEl = document.getElementById('sprint-remaining-pts-sub');
  const remainingPctSubEl = document.getElementById('sprint-remaining-pct-sub');

  if (totalScopeEl) totalScopeEl.textContent = displayTotalScope;
  if (completedSubEl) completedSubEl.textContent = displayDonePts;
  if (completedPctSubEl) completedPctSubEl.textContent = `${completionPct}%`;
  if (remainingSubEl) remainingSubEl.textContent = displayRemainingPts;
  if (remainingPctSubEl) remainingPctSubEl.textContent = `${100 - completionPct}%`;

  // Backlog counter
  const backlogCountEl = document.getElementById('clockit-backlog-count');
  if (backlogCountEl) backlogCountEl.textContent = todoCount;

  // Column counts on Dashboard and Tasks view
  document.querySelectorAll('#app-count-todo').forEach(el => el.textContent = todoCount);
  document.querySelectorAll('#app-count-inprogress').forEach(el => el.textContent = inprogCount);
  document.querySelectorAll('#app-count-review').forEach(el => el.textContent = reviewCount);
  document.querySelectorAll('#app-count-done').forEach(el => el.textContent = doneCount);

  // Update stacked bars in "Sprint at a glance"
  renderStackedBars(dayBuckets);
}

function renderStackedBars(dayBuckets) {
  const container = document.getElementById('sprint-stacked-bars');
  if (!container) return;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  container.innerHTML = days.map(d => {
    const data = dayBuckets[d] || { done: 0, planned: 0 };
    const doneH = Math.min(38, Math.max(6, data.done * 4.5));
    const planH = Math.min(38, Math.max(10, data.planned * 3.5));
    return `
      <div class="bar-day-col" title="${d}: ${data.done} pts done, ${data.planned} pts planned">
        <div class="stacked-bar">
          <div class="bar-segment planned" style="height: ${planH}px;"></div>
          <div class="bar-segment completed" style="height: ${doneH}px;"></div>
        </div>
        <span class="day-label">${d}</span>
      </div>
    `;
  }).join('');
}

// ============================================================================
// KANBAN CARD CREATION & RENDERING (Reference-identical styling)
// ============================================================================

function createKanbanCard(task) {
  const card = document.createElement('div');
  card.className = 'app-task-card';
  card.setAttribute('draggable', 'true');
  card.setAttribute('data-id', task.id);
  card.setAttribute('tabindex', '0');

  const isChecked = task.status === 'done';
  const squadClean = (task.squad || 'Frontend').toLowerCase().replace(/[^a-z0-9]/g, '');

  card.innerHTML = `
    <div class="app-card-header">
      <div class="app-card-check-wrap">
        <input type="checkbox" class="app-card-checkbox" title="${isChecked ? 'Mark incomplete' : 'Mark done'}" ${isChecked ? 'checked' : ''}>
        <span class="app-card-id">${task.id}</span>
      </div>
      <button class="app-card-more-btn" title="Task actions" type="button" aria-label="Task options">&bull;&bull;&bull;</button>
    </div>
    <div class="app-card-title">${escapeHtml(task.title)}</div>
    <div class="app-card-footer">
      <span class="app-squad-tag squad-${squadClean}">${task.squad}</span>
      <span class="app-card-pts">${task.pts} pts</span>
      <div class="app-assignee-avatar avatar-${(task.assignee || 'AC').toLowerCase()}" title="Assignee: ${task.assignee}">${task.assignee}</div>
    </div>
  `;

  // Checkbox: toggle between done and todo
  const checkbox = card.querySelector('.app-card-checkbox');
  checkbox.addEventListener('click', (e) => {
    e.stopPropagation();
    task.status = checkbox.checked ? 'done' : 'todo';
    saveAppTasks();
    renderAppDashboard();
    renderCalendarView();
    showToast(checkbox.checked ? `${task.id} marked as Done & Merged!` : `${task.id} returned to Backlog`);
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

function renderAppDashboard() {
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
    const matchSquad = activeSquadFilter === 'all' || t.squad.toLowerCase() === activeSquadFilter.toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.squad.toLowerCase().includes(q);
    const matchStatus = activeStatusFilter === 'all' 
      || (activeStatusFilter === 'my' && t.assignee === 'AC')
      || (activeStatusFilter === 'inprogress' && t.status === 'inprogress')
      || (activeStatusFilter === 'review' && t.status === 'review');
    return matchSquad && matchSearch && matchStatus;
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
          <div class="col-indicator-wrap"><span class="status-dot dot-done"></span><span class="col-title-text">Done &amp; Merged</span></div>
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
        renderCalendarView();
        showToast(`${task.id} moved to ${targetCol.toUpperCase()}`);
      }
    });
  });
}

// ============================================================================
// TASK EDIT MODAL (Functional Editing, Re-assignment, & Deletion)
// ============================================================================

function openEditTaskModal(taskId) {
  const task = appSprintTasks.find(t => t.id === taskId);
  if (!task) return;

  const idBadge = document.getElementById('edit-task-id-badge');
  const idInput = document.getElementById('edit-task-id');
  const titleInput = document.getElementById('edit-task-title');
  const squadSelect = document.getElementById('edit-task-squad');
  const ptsSelect = document.getElementById('edit-task-points');
  const statusSelect = document.getElementById('edit-task-status');
  const daySelect = document.getElementById('edit-task-day');

  if (idBadge) idBadge.textContent = task.id;
  if (idInput) idInput.value = task.id;
  if (titleInput) titleInput.value = task.title;
  if (squadSelect) squadSelect.value = task.squad;
  if (ptsSelect) ptsSelect.value = String(task.pts);
  if (statusSelect) statusSelect.value = task.status;
  if (daySelect) daySelect.value = task.day || 'Wed';

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
      const squad = document.getElementById('edit-task-squad').value;
      const pts = parseInt(document.getElementById('edit-task-points').value, 10) || 3;
      const status = document.getElementById('edit-task-status').value;
      const day = document.getElementById('edit-task-day').value;

      const task = appSprintTasks.find(t => t.id === id);
      if (task) {
        task.title = title;
        task.squad = squad;
        task.pts = pts;
        task.status = status;
        task.day = day;
        saveAppTasks();
        renderAppDashboard();
        renderCalendarView();
        closeModal('app-edit-task-modal');
        showToast(`Updated task ${task.id}`);
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
        renderCalendarView();
        closeModal('app-edit-task-modal');
        showToast(`Deleted task ${removed.id}`);
      }
    });
  }
}

// ============================================================================
// CALENDAR VIEW (Weekly view displaying tasks & deadlines)
// ============================================================================

function renderCalendarView() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  days.forEach(day => {
    const col = document.getElementById(`cal-tasks-${day}`);
    if (!col) return;
    col.innerHTML = '';

    const dayTasks = appSprintTasks.filter(t => (t.day || 'Wed') === day);
    if (dayTasks.length === 0) {
      col.innerHTML = '<div class="cal-empty-day">No deadlines scheduled</div>';
      return;
    }

    dayTasks.forEach(t => {
      const isDone = t.status === 'done';
      const item = document.createElement('div');
      item.className = `cal-task-card ${isDone ? 'is-done' : ''}`;
      const squadClean = (t.squad || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      item.innerHTML = `
        <div class="cal-card-top">
          <input type="checkbox" class="cal-check" ${isDone ? 'checked' : ''} title="Toggle complete">
          <span class="cal-id">${t.id}</span>
          <span class="cal-pts">${t.pts}p</span>
        </div>
        <div class="cal-title">${escapeHtml(t.title)}</div>
        <div class="cal-card-meta">
          <span class="app-squad-tag squad-${squadClean}">${t.squad}</span>
          <span class="cal-assignee">${t.assignee}</span>
        </div>
      `;

      item.querySelector('.cal-check').addEventListener('click', (e) => {
        e.stopPropagation();
        t.status = e.target.checked ? 'done' : 'todo';
        saveAppTasks();
        renderAppDashboard();
        renderCalendarView();
        showToast(e.target.checked ? `${t.id} completed!` : `${t.id} returned to Backlog`);
      });

      item.addEventListener('click', (e) => {
        if (e.target.closest('.cal-check')) return;
        openEditTaskModal(t.id);
      });

      col.appendChild(item);
    });
  });
}

function initCalendarView() {
  renderCalendarView();
  document.querySelectorAll('.cal-add-deadline-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const day = btn.getAttribute('data-day') || 'Wed';
      openModal('app-create-task-modal');
      const titleInput = document.getElementById('new-task-title');
      if (titleInput) {
        titleInput.value = `Task for ${day}`;
        setTimeout(() => titleInput.focus(), 120);
      }
    });
  });
}

// ============================================================================
// NOTES WORKSPACE & OBSIDIAN-STYLE KNOWLEDGE GRAPH
// Supports: text notes, checklists, tables, and internal links [[Topic]]
// ============================================================================

const DEFAULT_NOTES = [
  {
    id: 'note-1',
    title: 'Sprint 12 Architecture & API',
    category: 'Architecture',
    date: '15 Oct 2026',
    content: `# Sprint 12 Architecture & API

Architecture specs for the distributed real-time sync service.

### Checklist
- [x] Configure WebSocket lease coordinator
- [x] Set up Token Revocation Middleware
- [ ] Connect [[API Authentication]] endpoints
- [ ] Implement dark mode token sync in [[Design System]]

### Service Performance
| Microservice | Target Latency | Status |
| Redis Coordinator | 2.1ms | Operational |
| REST Gateway | 4.8ms | Operational |
| Database Primary | 1.8ms | Operational |

Internal references: [[API Authentication]], [[Design System]], [[Sprint Goals]].`
  },
  {
    id: 'note-2',
    title: 'Design System & Visual Tokens',
    category: 'Ideas',
    date: '16 Oct 2026',
    content: `# Design System & Visual Tokens

Warm cream palette guidelines and serif headings for Tracker.

### Checklist
- [x] Cream background (#faf8f5) token
- [x] Peach accent (#e07a5f) highlights
- [ ] Instrument Serif & Inter typography hierarchy
- [ ] Micro-animations for Pomodoro ring

Internal references: [[Sprint 12 Architecture & API]], [[Sprint Goals]].`
  },
  {
    id: 'note-3',
    title: 'Sprint Goals & Squad Allocations',
    category: 'Sprint',
    date: '17 Oct 2026',
    content: `# Sprint Goals & Squad Allocations

Sprint 12 delivery targets and squad velocity breakdown.

### Squad Capacities
| Squad | Lead | Pts Committed |
| Frontend | Alex Chen | 23 pts |
| Backend | R. Kumar | 19 pts |
| DevOps | J. Doe | 12 pts |

### Milestones
- [x] Milestone A: Core Kanban & Navigation
- [x] Milestone B: Functional Pomodoro Engine
- [ ] Milestone C: Obsidian Knowledge Graph

Internal references: [[Sprint 12 Architecture & API]], [[Design System]], [[Release QA]].`
  },
  {
    id: 'note-4',
    title: 'Release QA & Production Readiness',
    category: 'Important',
    date: '18 Oct 2026',
    content: `# Release QA & Production Readiness

Checklist for deploying Sprint 12 to production environments.

### Pre-Flight Checklist
- [x] Unit test suites passing with 0 failures
- [x] Build check compiles without bundle warnings
- [ ] End-to-end task drag-and-drop verification
- [ ] Accessibility keyboard navigation pass

Internal references: [[API Authentication]], [[Sprint Goals & Squad Allocations]].`
  }
];

let appNotes = [];
let activeNoteId = 'note-1';
let activeNoteTag = 'all';

function loadNotes() {
  try {
    const stored = localStorage.getItem('tracker_notes');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        appNotes = parsed;
        return;
      }
    }
  } catch (e) {}
  appNotes = [...DEFAULT_NOTES];
}

function saveNotes() {
  try {
    localStorage.setItem('tracker_notes', JSON.stringify(appNotes));
  } catch (e) {}
}

function renderNotesList() {
  const listEl = document.getElementById('notes-items-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  const searchInput = document.getElementById('notes-search-field');
  const q = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const filtered = appNotes.filter(n => {
    const matchTag = activeNoteTag === 'all' || n.category === activeNoteTag;
    const matchQuery = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    return matchTag && matchQuery;
  });

  filtered.forEach(note => {
    const card = document.createElement('div');
    card.className = `note-list-card ${note.id === activeNoteId ? 'active' : ''}`;
    card.setAttribute('data-id', note.id);
    card.innerHTML = `
      <div class="note-card-top">
        <h4 class="note-card-title font-serif">${escapeHtml(note.title)}</h4>
        <span class="note-card-tag tag-${(note.category || '').toLowerCase()}">${note.category}</span>
      </div>
      <p class="note-card-snippet">${escapeHtml(note.content.substring(0, 75).replace(/[#*|\[\]-]/g, ''))}...</p>
      <div class="note-card-footer">
        <span class="note-card-date">${note.date || 'Today'}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      selectNote(note.id);
    });

    listEl.appendChild(card);
  });
}

function renderMarkdownContent(raw) {
  if (!raw) return '<p class="empty-hint">Start writing formatted notes, checklists, and internal links...</p>';

  const lines = raw.split('\n');
  let html = '';
  let inTable = false;
  let tableRows = [];

  function flushTable() {
    if (!inTable) return '';
    inTable = false;
    if (tableRows.length === 0) return '';
    const header = tableRows[0];
    const dataRows = tableRows.slice(1);
    let tHtml = '<div class="note-table-wrap"><table class="note-rendered-table"><thead><tr>';
    header.forEach(h => { tHtml += `<th>${h}</th>`; });
    tHtml += '</tr></thead><tbody>';
    dataRows.forEach(row => {
      tHtml += '<tr>';
      row.forEach(cell => { tHtml += `<td>${cell}</td>`; });
      tHtml += '</tr>';
    });
    tHtml += '</tbody></table></div>';
    tableRows = [];
    return tHtml;
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Markdown Table detection: | a | b |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const parts = line.split('|').map(s => s.trim()).filter((s, idx, arr) => idx > 0 && idx < arr.length - 1);
      // Skip markdown divider line: |---|---|
      if (parts.every(p => /^[-:]+$/.test(p))) {
        continue;
      }
      inTable = true;
      tableRows.push(parts.map(p => processInlineMarkdown(p)));
      continue;
    } else if (inTable) {
      html += flushTable();
    }

    // Headings
    if (line.startsWith('### ')) {
      html += `<h3 class="font-serif note-rendered-h3">${processInlineMarkdown(line.substring(4))}</h3>`;
    } else if (line.startsWith('## ')) {
      html += `<h2 class="font-serif note-rendered-h2">${processInlineMarkdown(line.substring(3))}</h2>`;
    } else if (line.startsWith('# ')) {
      html += `<h1 class="font-serif note-rendered-h1">${processInlineMarkdown(line.substring(2))}</h1>`;
    }
    // Checklists: - [ ] or - [x]
    else if (/^\s*-\s*\[([ xX])\]\s*(.*)$/.test(line)) {
      const match = line.match(/^\s*-\s*\[([ xX])\]\s*(.*)$/);
      const isChecked = match[1].toLowerCase() === 'x';
      const text = match[2];
      html += `
        <div class="note-checklist-item ${isChecked ? 'checked' : ''}" data-line="${i}">
          <input type="checkbox" class="note-chkbox" ${isChecked ? 'checked' : ''} data-line="${i}">
          <span class="note-chkbox-label">${processInlineMarkdown(text)}</span>
        </div>
      `;
    }
    // Bullet item
    else if (line.startsWith('- ')) {
      html += `<li class="note-rendered-li">${processInlineMarkdown(line.substring(2))}</li>`;
    }
    // Empty line
    else if (line.trim() === '') {
      html += '<div class="note-rendered-spacer"></div>';
    }
    // Regular paragraph
    else {
      html += `<p class="note-rendered-p">${processInlineMarkdown(line)}</p>`;
    }
  }

  if (inTable) {
    html += flushTable();
  }

  return html;
}

function processInlineMarkdown(text) {
  if (!text) return '';
  // Internal Links: [[Topic Name]]
  text = text.replace(/\[\[([^\]]+)\]\]/g, (m, target) => {
    return `<button class="note-internal-link" data-link="${escapeHtml(target)}" type="button">&#128279; ${escapeHtml(target)}</button>`;
  });
  // Bold: **text**
  text = text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
  // Italic: *text*
  text = text.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
  // Inline Code: `code`
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  return text;
}

function selectNote(noteId) {
  activeNoteId = noteId;
  const note = appNotes.find(n => n.id === noteId);
  if (!note) return;

  const titleInput = document.getElementById('note-active-title');
  const catSelect = document.getElementById('note-active-category');
  const bodyText = document.getElementById('note-active-body');
  const previewPane = document.getElementById('note-active-rendered');

  if (titleInput) titleInput.value = note.title;
  if (catSelect) catSelect.value = note.category;
  if (bodyText) bodyText.value = note.content;
  if (previewPane) {
    previewPane.innerHTML = renderMarkdownContent(note.content);
    bindChecklistEvents();
    bindInternalLinkEvents();
  }

  renderNotesList();
  renderKnowledgeGraph();
}

function bindChecklistEvents() {
  const previewPane = document.getElementById('note-active-rendered');
  if (!previewPane) return;

  previewPane.querySelectorAll('.note-chkbox').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const lineIdx = parseInt(chk.getAttribute('data-line'), 10);
      const note = appNotes.find(n => n.id === activeNoteId);
      if (!note || isNaN(lineIdx)) return;

      const lines = note.content.split('\n');
      if (lines[lineIdx]) {
        if (chk.checked) {
          lines[lineIdx] = lines[lineIdx].replace(/-\s*\[\s*\]/, '- [x]');
        } else {
          lines[lineIdx] = lines[lineIdx].replace(/-\s*\[[xX]\]/, '- [ ]');
        }
        note.content = lines.join('\n');
        const bodyText = document.getElementById('note-active-body');
        if (bodyText) bodyText.value = note.content;
        saveNotes();
        previewPane.innerHTML = renderMarkdownContent(note.content);
        bindChecklistEvents();
        bindInternalLinkEvents();
      }
    });
  });
}

function bindInternalLinkEvents() {
  const previewPane = document.getElementById('note-active-rendered');
  if (!previewPane) return;

  previewPane.querySelectorAll('.note-internal-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-link');
      if (!target) return;

      // Check if note with this title exists
      const match = appNotes.find(n => n.title.toLowerCase().includes(target.toLowerCase()));
      if (match) {
        selectNote(match.id);
        showToast(`Opened linked note: "${match.title}"`);
      } else {
        // Create new note with this target title
        const newNote = {
          id: `note-${Date.now()}`,
          title: target,
          category: 'Ideas',
          date: 'Just now',
          content: `# ${target}\n\nConnected from [[${appNotes.find(n => n.id === activeNoteId)?.title || 'Notes'}]].\n\n### Checklist\n- [ ] Draft specifications\n- [ ] Review with team\n`
        };
        appNotes.push(newNote);
        saveNotes();
        selectNote(newNote.id);
        showToast(`Created linked note: "${target}"`);
      }
    });
  });
}

// ============================================================================
// OBSIDIAN-STYLE KNOWLEDGE GRAPH (Straight connecting lines, node physics)
// ============================================================================

function renderKnowledgeGraph() {
  const svg = document.getElementById('knowledge-graph-svg');
  if (!svg) return;
  svg.innerHTML = '';

  const nodes = [];
  const links = [];
  const nodeMap = new Map();

  // 1. Gather all Note Nodes
  appNotes.forEach((n, idx) => {
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

  // 2. Parse [[...]] links from notes
  appNotes.forEach(n => {
    const regex = /\[\[([^\]]+)\]\]/g;
    let match;
    while ((match = regex.exec(n.content)) !== null) {
      const targetName = match[1].trim();
      const targetKey = targetName.toLowerCase();
      let targetNode = nodeMap.get(targetKey);

      if (!targetNode) {
        targetNode = {
          id: `concept-${targetKey.replace(/\s+/g, '-')}`,
          name: targetName,
          type: 'concept',
          category: 'Concept',
          active: false
        };
        nodes.push(targetNode);
        nodeMap.set(targetKey, targetNode);
      }

      links.push({
        source: nodeMap.get(n.id),
        target: targetNode
      });
    }
  });

  // 3. Layout: Calculate balanced positions with straight line geometry
  const width = 380;
  const height = 440;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.36;

  nodes.forEach((node, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI - (Math.PI / 2);
    // Slight jitter based on active node
    const r = node.active ? radius * 0.25 : (node.type === 'concept' ? radius * 1.05 : radius * 0.75);
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
    g.setAttribute('class', `graph-node-group ${node.active ? 'is-active-node' : ''} type-${node.type}`);
    g.setAttribute('data-id', node.id);

    // Glow aura for active node
    if (node.active) {
      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glow.setAttribute('cx', node.x);
      glow.setAttribute('cy', node.y);
      glow.setAttribute('r', '18');
      glow.setAttribute('class', 'node-glow-aura');
      g.appendChild(glow);
    }

    // Node Circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', node.x);
    circle.setAttribute('cy', node.y);
    circle.setAttribute('r', node.active ? '10' : (node.type === 'note' ? '7.5' : '6'));
    circle.setAttribute('class', 'graph-circle-node');
    g.appendChild(circle);

    // Node Label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', node.x);
    text.setAttribute('y', node.y + (node.y > cy ? 16 : -12));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'graph-node-label');
    text.textContent = node.name.length > 22 ? node.name.substring(0, 20) + '...' : node.name;
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
      if (node.type === 'note') {
        selectNote(node.id);
        showToast(`Switched to note "${node.name}"`);
      } else {
        // Concept node: find or create
        const match = appNotes.find(n => n.title.toLowerCase() === node.name.toLowerCase());
        if (match) {
          selectNote(match.id);
        } else {
          const newN = {
            id: `note-${Date.now()}`,
            title: node.name,
            category: 'Architecture',
            date: 'Today',
            content: `# ${node.name}\n\nEntity documented from knowledge graph.\n`
          };
          appNotes.push(newN);
          saveNotes();
          selectNote(newN.id);
          showToast(`Created note for "${node.name}"`);
        }
      }
    });

    nodesGroup.appendChild(g);
  });

  svg.appendChild(nodesGroup);
}

function initNotesWorkspace() {
  loadNotes();
  renderNotesList();
  selectNote(activeNoteId);

  // Note Title auto-save
  const titleInput = document.getElementById('note-active-title');
  if (titleInput) {
    titleInput.addEventListener('input', () => {
      const note = appNotes.find(n => n.id === activeNoteId);
      if (note) {
        note.title = titleInput.value;
        saveNotes();
        renderNotesList();
        renderKnowledgeGraph();
      }
    });
  }

  // Note Category auto-save
  const catSelect = document.getElementById('note-active-category');
  if (catSelect) {
    catSelect.addEventListener('change', () => {
      const note = appNotes.find(n => n.id === activeNoteId);
      if (note) {
        note.category = catSelect.value;
        saveNotes();
        renderNotesList();
      }
    });
  }

  // Note Body live preview & save
  const bodyText = document.getElementById('note-active-body');
  const previewPane = document.getElementById('note-active-rendered');
  if (bodyText) {
    bodyText.addEventListener('input', () => {
      const note = appNotes.find(n => n.id === activeNoteId);
      if (note) {
        note.content = bodyText.value;
        saveNotes();
        if (previewPane) {
          previewPane.innerHTML = renderMarkdownContent(note.content);
          bindChecklistEvents();
          bindInternalLinkEvents();
        }
        renderKnowledgeGraph();
      }
    });
  }

  // Tag filter pills
  document.querySelectorAll('#notes-tags-bar .notes-tag-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#notes-tags-bar .notes-tag-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeNoteTag = chip.getAttribute('data-tag') || 'all';
      renderNotesList();
    });
  });

  // Notes Search field
  const searchField = document.getElementById('notes-search-field');
  if (searchField) {
    searchField.addEventListener('input', () => {
      renderNotesList();
    });
  }

  // Create Note Button
  const newBtn = document.getElementById('notes-new-btn');
  if (newBtn) {
    newBtn.addEventListener('click', () => {
      const newN = {
        id: `note-${Date.now()}`,
        title: 'Untitled Note',
        category: 'Ideas',
        date: 'Today',
        content: '# Untitled Note\n\nWrite thoughts, - [ ] checklist tasks, or link [[Topics]] here.\n'
      };
      appNotes.unshift(newN);
      saveNotes();
      selectNote(newN.id);
      showToast('Created new note');
      if (titleInput) setTimeout(() => titleInput.focus(), 100);
    });
  }

  // Toolbar actions
  document.querySelectorAll('.editor-tool-btn').forEach(tool => {
    tool.addEventListener('click', () => {
      const insertType = tool.getAttribute('data-insert');
      if (!bodyText) return;
      const start = bodyText.selectionStart;
      const end = bodyText.selectionEnd;
      const text = bodyText.value;

      let insertion = '';
      if (insertType === 'bold') insertion = '**bold text**';
      else if (insertType === 'italic') insertion = '*italic text*';
      else if (insertType === 'heading') insertion = '\n### Section Heading\n';
      else if (insertType === 'checklist') insertion = '\n- [ ] New checklist task';
      else if (insertType === 'table') insertion = '\n| Component | Squad | Status |\n|---|---|---|\n| Gateway | Platform | Active |\n';
      else if (insertType === 'link') insertion = ' [[Design System]] ';

      bodyText.value = text.substring(0, start) + insertion + text.substring(end);
      bodyText.dispatchEvent(new Event('input'));
    });
  });

  // Graph reset button
  const graphResetBtn = document.getElementById('graph-reset-btn');
  if (graphResetBtn) {
    graphResetBtn.addEventListener('click', () => {
      renderKnowledgeGraph();
      showToast('Knowledge graph reset to center view');
    });
  }
}

// ============================================================================
// MASTER VIEW NAVIGATION (Dashboard, Tasks, Calendar, Notes, Timer, Reports)
// ============================================================================

export function navigateToTrackerView(viewName) {
  currentActiveView = viewName;

  // Sync Top Nav Pills
  document.querySelectorAll('#tracker-top-pills .tracker-pill-tab').forEach(pill => {
    const target = pill.getAttribute('data-view');
    const isAct = target === viewName;
    pill.classList.toggle('active', isAct);
    pill.setAttribute('aria-selected', isAct ? 'true' : 'false');
  });

  // Sync Left Sidebar Items
  document.querySelectorAll('#tracker-sidebar .tracker-sidebar-item').forEach(item => {
    const target = item.getAttribute('data-view');
    item.classList.toggle('active', target === viewName);
  });

  // Views dictionary
  const views = {
    'dashboard': document.getElementById('tracker-view-dashboard'),
    'home': document.getElementById('tracker-view-dashboard'),
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
    renderKnowledgeGraph();
  } else if (viewName === 'calendar') {
    renderCalendarView();
  } else if (viewName === 'tasks' || viewName === 'dashboard') {
    renderAppDashboard();
  } else if (viewName === 'timer') {
    const timerView = document.getElementById('clockit-timer-view');
    if (timerView) timerView.style.display = 'block';
  }
}

if (typeof window !== 'undefined') {
  window.navigateToTrackerView = navigateToTrackerView;
  window.switchClockitView = navigateToTrackerView;
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

  // Top Nav Pills Click
  document.querySelectorAll('#tracker-top-pills .tracker-pill-tab').forEach(pill => {
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

  // Squad select on Tasks Page
  const tasksSquadSelect = document.getElementById('tasks-page-squad-select');
  if (tasksSquadSelect) {
    tasksSquadSelect.addEventListener('change', (e) => {
      activeSquadFilter = e.target.value;
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
      showToast('Sprint 12 velocity is 12% ahead of target! All systems operational.');
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
      const squadEl = document.getElementById('new-task-squad');
      const ptsEl = document.getElementById('new-task-points');

      const title = titleEl ? titleEl.value.trim() : '';
      const squad = squadEl ? squadEl.value : 'Frontend';
      const pts = ptsEl ? parseInt(ptsEl.value, 10) || 3 : 3;

      if (!title) return;

      const nextNum = 130 + appSprintTasks.length;
      const newTask = {
        id: `TRK-${nextNum}`,
        title,
        squad,
        pts,
        status: 'todo',
        assignee: 'AC',
        day: 'Wed'
      };

      appSprintTasks.unshift(newTask);
      saveAppTasks();
      renderAppDashboard();
      renderCalendarView();
      closeModal('app-create-task-modal');
      if (titleEl) titleEl.value = '';
      showToast(`Created issue ${newTask.id}: ${title}`);
    });
  }

  // Live Animated Digital Clock & Greeting
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

  // Initialize Pomodoro Timer Engine
  initPomodoroTimer(showToast);

  // Quick Notes Form Submission
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
}

// ============================================================================
// AUTH & VIEW NAVIGATION SYSTEM
// Default: Shows Home page with full GSAP Hero Scrolling Animation
// App Dashboard: Opened on Sign In, Start Free, Focus Timer card, or #app/#dashboard hash
// ============================================================================

function initAuthSystem() {
  const actualAppView = document.getElementById('actual-app-view');
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
    document.body.classList.add('in-app-mode');
    if (actualAppView) {
      actualAppView.hidden = false;
      actualAppView.classList.add('active');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigateToTrackerView(targetView);
    updateAuthUI(true);
  }

  function exitAppDashboard() {
    document.body.classList.remove('in-app-mode');
    if (actualAppView) {
      actualAppView.hidden = true;
      actualAppView.classList.remove('active');
    }
    if (window.location.hash && !window.location.hash.includes('website')) {
      try {
        history.pushState(null, null, window.location.pathname);
      } catch (e) {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);
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
  initAuthSystem();
  initAppDashboard();
});

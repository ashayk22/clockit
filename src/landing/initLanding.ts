/**
 * ClockIt public landing page — behaviour layer.
 *
 * This is a faithful port of the original, pre-React landing scripts
 * (src/main.js) so the scroll-driven hero animation and every landing
 * interaction survive the move into the React app. The markup itself is
 * rendered verbatim from `landing.html`, and the styles come from the
 * namespaced `landing.css`, so the animation is preserved rather than
 * re-created.
 *
 * Everything created here is torn down on unmount (ScrollTriggers, tweens and
 * window listeners), which is what allows the animation to keep working after
 * navigating away to the dashboard and back again.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../motion/presets';

gsap.registerPlugin(ScrollTrigger);

const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export interface LandingOptions {
  /** React Router navigation (used by every CTA / preview artifact). */
  navigate: (path: string) => void;
  /** Toggle the app-wide theme from the landing nav. */
  toggleTheme: () => void;
  /** Whether the app is currently dark (for toast copy). */
  isDark: () => boolean;
}

function toast(message: string, duration = 3200) {
  const el = document.getElementById('toast');
  const msg = document.getElementById('toast-msg');
  if (!el || !msg) return;
  msg.textContent = message;
  el.hidden = false;
  el.style.opacity = '1';
  el.style.transform = 'translateY(0)';
  window.clearTimeout((el as any)._hideTimeout);
  (el as any)._hideTimeout = window.setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    (el as any)._hideTimeout = window.setTimeout(() => {
      el.hidden = true;
    }, 200);
  }, duration);
}

/* ------------------------------------------------------------------ */
/* Hero pinned scroll timeline (the protected core animation)          */
/* ------------------------------------------------------------------ */

function initHeroScrollAnimation(navigate: LandingOptions['navigate']) {
  const container = document.getElementById('hero-scroll-container');
  const stage = document.getElementById('hero-stage');
  const bgLayer = document.getElementById('hero-bg-layer');
  const textBlock = document.getElementById('hero-text-block');
  const appFrame = document.getElementById('hero-app-frame');
  const contentStart = document.getElementById('app-content-start');
  const contentDocked = document.getElementById('app-content-docked');

  const pinkBlock = document.getElementById('hero-pink-block');
  const blueBlock = document.getElementById('hero-blue-block');
  const grayBlock = document.getElementById('hero-gray-block');
  const aiComposer = document.getElementById('hero-ai-composer');
  const carousel = document.getElementById('hero-carousel');

  // Floating preview artifacts are clickable shortcuts into the product.
  if (pinkBlock) {
    pinkBlock.style.cursor = 'pointer';
    pinkBlock.setAttribute('title', 'Click to open the Focus Timer');
    pinkBlock.addEventListener('click', () => navigate('/app/focus'));
  }
  if (blueBlock) {
    blueBlock.style.cursor = 'pointer';
    blueBlock.setAttribute('title', "Click to view today's progress");
    blueBlock.addEventListener('click', () => navigate('/app'));
  }
  if (grayBlock) {
    grayBlock.style.cursor = 'pointer';
    grayBlock.setAttribute('title', 'Click to open Tasks');
    grayBlock.addEventListener('click', () => navigate('/app/tasks'));
  }
  if (aiComposer) {
    aiComposer.style.cursor = 'pointer';
    aiComposer.setAttribute('title', 'Click to open Quick Notes');
    aiComposer.addEventListener('click', () => navigate('/app/notes'));
  }

  if (!container || !stage || !appFrame) return;

  function getMeasurements() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scaleFactor = width === 0 || width >= 1440 ? 1 : Math.max((width - 80) / 1360, 0.58);
    const a = Math.max(0, Math.min(1, (height - 800) / 400));
    return {
      scaleFactor,
      width,
      height,
      containerHeight: 1480 * scaleFactor,
      yOffset: 160 * a,
    };
  }

  let { scaleFactor, width, containerHeight, yOffset: ea } = getMeasurements();

  gsap.set(stage, { xPercent: -50, x: 0, y: 0, scale: scaleFactor, transformOrigin: 'top center' });

  // Mobile (<768px) or reduced-motion: no pinning and no scroll-driven scrub,
  // so the hero renders as a static, fully readable stacked layout.
  if (width < 768 || prefersReducedMotion()) {
    gsap.set(container, { height: 'auto' });
    gsap.set(stage, { position: 'relative', left: 'auto', xPercent: 0, x: 0, scale: 1, width: '100%' });
    gsap.set(textBlock, {
      position: 'relative',
      top: 'auto',
      left: 'auto',
      transform: 'none',
      width: '100%',
      opacity: 1,
      padding: '120px 20px 40px',
    });
    gsap.set(appFrame, { width: '100%', maxWidth: '100%', margin: '0 auto', height: 'auto', opacity: 1, y: 0, scale: 1 });
    gsap.set([pinkBlock, blueBlock, grayBlock, aiComposer].filter(Boolean) as Element[], { display: 'none' });
    gsap.set(contentDocked, { opacity: 1, position: 'relative', top: 0, left: 0, right: 0 });
    gsap.set(contentStart, { display: 'none' });
    if (carousel) gsap.set(carousel, { position: 'relative', left: 0, width: '100%' });
    return;
  }

  gsap.set(container, { height: containerHeight });

  const P = (e: number) => ({ opacity: 1, scale: 1, y: 0 + e });
  const O = { opacity: 0, scale: 0.65, y: -200, duration: 0.45 };
  const z = { scale: 0.85, y: 680, opacity: 0 };
  const M = { scale: 1, y: 110, opacity: 1 };
  const F = { y: 720, opacity: 0 };
  const D = { y: 200, opacity: 1 };

  const startProgress = (e: number) => ({ x: -110, y: 195 + e * 0.5, width: 330, opacity: 1 });
  const dockProgress = { x: 20, y: M.y + 182, width: 377, opacity: 0.98 };

  const startTimer = (e: number) => ({ x: 960, y: 200 + e * 0.5, width: 330, opacity: 1 });
  const dockTimer = { x: 411, y: M.y + 182, width: 377, opacity: 0.98 };

  const startBacklog = (e: number) => ({ x: -60, y: 380 + e * 0.5, width: 300, opacity: 1 });
  const dockBacklog = { x: 802, y: M.y + 182, width: 377, opacity: 0.98 };

  const startNotes = (e: number) => ({ x: 930, y: 380 + e * 0.5, width: 270, opacity: 1 });
  const dockNotes = { x: 910, y: M.y + 304, width: 270, opacity: 0.98 };

  const K = { y: 0 };
  const Y = { y: -120 };
  const Q = { opacity: 0, y: 14 };

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

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: container,
      start: 'top top',
      pin: true,
      scrub: isSafari ? 0.6 : 0.8,
      end: () => `+=${1.2 * containerHeight}`,
      anticipatePin: 0.5,
      invalidateOnRefresh: true,
      refreshPriority: 1,
    },
  });

  if (textBlock) tl.fromTo(textBlock, initialP, O, 0);
  tl.fromTo(appFrame, z, M, 0);
  if (bgLayer) tl.fromTo(bgLayer, K, Y, 0);
  if (carousel) tl.fromTo(carousel, F, D, 0);

  const shadowStart = { boxShadow: '0 24px 50px -8px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)' };
  const shadowEnd = { boxShadow: '0 0 0 0 rgba(0,0,0,0)' };

  if (blueBlock) tl.fromTo(blueBlock, { ...initialProgress, ...shadowStart }, { ...dockProgress, ...shadowEnd }, 0);
  if (pinkBlock) tl.fromTo(pinkBlock, { ...initialTimer, ...shadowStart }, { ...dockTimer, ...shadowEnd }, 0);
  if (grayBlock) tl.fromTo(grayBlock, { ...initialBacklog, ...shadowStart }, { ...dockBacklog, ...shadowEnd }, 0);
  if (aiComposer) tl.fromTo(aiComposer, { ...initialNotes, ...shadowStart }, { ...dockNotes, ...shadowEnd }, 0);

  if (contentStart) tl.to(contentStart, { opacity: 0, duration: 0.22, ease: 'power2.inOut' }, 0.62);

  [blueBlock, pinkBlock, grayBlock, aiComposer].forEach((el) => {
    if (el) tl.to(el, { opacity: 0, pointerEvents: 'none', duration: 0.22, ease: 'power2.inOut' }, 0.65);
  });

  if (contentDocked) tl.fromTo(contentDocked, Q, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.66);

  const onResize = () => {
    const updated = getMeasurements();
    if (updated.width >= 768) {
      gsap.set(container, { height: updated.containerHeight });
      gsap.set(stage, { xPercent: -50, x: 0, scale: updated.scaleFactor });
      ScrollTrigger.refresh();
    }
  };
  window.addEventListener('resize', onResize);

  cleanupFns.push(() => window.removeEventListener('resize', onResize));
}

/* ------------------------------------------------------------------ */
/* Interactive kanban demo                                             */
/* ------------------------------------------------------------------ */

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

  const initialMarkup = {
    todo: stackTodo.innerHTML,
    inprogress: stackInprogress.innerHTML,
    review: stackReview.innerHTML,
    done: stackDone.innerHTML,
  };

  function updateBoardMetrics() {
    const count = (el: HTMLElement) => el.querySelectorAll('.interactive-task-card').length;
    const elTodo = document.getElementById('count-todo');
    const elInprog = document.getElementById('count-inprogress');
    const elRev = document.getElementById('count-review');
    const elDone = document.getElementById('count-done');
    if (elTodo) elTodo.textContent = String(count(stackTodo!));
    if (elInprog) elInprog.textContent = String(count(stackInprogress!));
    if (elRev) elRev.textContent = String(count(stackReview!));
    if (elDone) elDone.textContent = String(count(stackDone!));

    if (velocityEl) {
      let donePts = 0;
      let totalPts = 0;
      document.querySelectorAll('.interactive-task-card').forEach((card) => {
        const pts = parseInt(card.getAttribute('data-points') || '0', 10) || 0;
        totalPts += pts;
        if (card.closest('#stack-done')) donePts += pts;
      });
      velocityEl.textContent = `${donePts} / ${totalPts} pts completed`;
    }
  }

  function advanceCard(card: Element) {
    const parent = card.parentElement;
    const taskId = card.getAttribute('data-id') || 'Task';
    const taskPts = card.getAttribute('data-points') || '3';
    const hintEl = card.querySelector('.task-action-hint, .task-done-badge');

    if (parent === stackTodo) {
      stackInprogress!.appendChild(card);
      card.classList.remove('card-done');
      card.classList.add('active-pulse');
      if (hintEl) {
        hintEl.className = 'task-action-hint';
        hintEl.textContent = 'Click to review ->';
      }
      toast(`${taskId} moved to In Progress`);
    } else if (parent === stackInprogress) {
      stackReview!.appendChild(card);
      card.classList.remove('active-pulse', 'card-done');
      if (hintEl) {
        hintEl.className = 'task-action-hint';
        hintEl.textContent = 'Click to merge ->';
      }
      toast(`${taskId} submitted for Review`);
    } else if (parent === stackReview) {
      stackDone!.appendChild(card);
      card.classList.remove('active-pulse');
      card.classList.add('card-done');
      if (hintEl) {
        hintEl.className = 'task-done-badge';
        hintEl.textContent = 'Merged';
      }
      toast(`${taskId} merged into main (+${taskPts} pts)`);
    } else if (parent === stackDone) {
      stackTodo!.appendChild(card);
      card.classList.remove('card-done', 'active-pulse');
      if (hintEl) {
        hintEl.className = 'task-action-hint';
        hintEl.textContent = 'Click to advance ->';
      }
      toast(`${taskId} returned to Backlog`);
    }
    updateBoardMetrics();
  }

  function bindCardEvents(card: Element) {
    const onClick = () => advanceCard(card);
    const onKeydown = (e: Event) => {
      const ev = e as KeyboardEvent;
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        advanceCard(card);
      }
    };
    card.addEventListener('click', onClick);
    card.addEventListener('keydown', onKeydown);
    cleanupFns.push(() => {
      card.removeEventListener('click', onClick);
      card.removeEventListener('keydown', onKeydown);
    });
  }

  function bindAllExistingCards() {
    document.querySelectorAll('.interactive-task-card').forEach(bindCardEvents);
  }

  bindAllExistingCards();
  updateBoardMetrics();

  if (resetBtn) {
    const onReset = () => {
      stackTodo.innerHTML = initialMarkup.todo;
      stackInprogress.innerHTML = initialMarkup.inprogress;
      stackReview.innerHTML = initialMarkup.review;
      stackDone.innerHTML = initialMarkup.done;
      bindAllExistingCards();
      updateBoardMetrics();
      toast('Demo board reset to baseline sprint');
    };
    resetBtn.addEventListener('click', onReset);
    cleanupFns.push(() => resetBtn.removeEventListener('click', onReset));
  }

  let nextId = 126;
  const sampleBacklog = [
    { title: 'Zero-downtime database failover handler', squad: 'Platform', pts: 5 },
    { title: 'Distributed edge rate-limiting middleware', squad: 'Infra', pts: 8 },
    { title: 'Automated SOC 2 audit snapshot exporter', squad: 'Security', pts: 3 },
    { title: 'Optimistic UI rollback for offline edits', squad: 'Frontend', pts: 5 },
    { title: 'Webhook retry backoff with jitter queue', squad: 'DevOps', pts: 5 },
  ];
  let sampleIndex = 0;

  function addNewTask() {
    const item = sampleBacklog[sampleIndex % sampleBacklog.length];
    sampleIndex++;
    const taskId = `ST-${nextId++}`;
    const card = document.createElement('div');
    card.className = 'interactive-task-card';
    card.setAttribute('data-id', taskId);
    card.setAttribute('data-points', String(item.pts));
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
    stackTodo!.prepend(card);
    updateBoardMetrics();
    toast(`Created issue ${taskId} in Backlog`);
  }

  if (addBtn) {
    const onAdd = () => addNewTask();
    addBtn.addEventListener('click', onAdd);
    cleanupFns.push(() => addBtn.removeEventListener('click', onAdd));
  }
}

/* ------------------------------------------------------------------ */
/* FAQ accordion                                                       */
/* ------------------------------------------------------------------ */

function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach((item) => {
    const trigger = item.querySelector('.faq-trigger');
    if (!trigger) return;
    const onToggle = () => {
      const isOpen = item.classList.contains('open');
      items.forEach((other) => {
        if (other !== item) {
          other.classList.remove('open');
          const t = other.querySelector('.faq-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('open', !isOpen);
      trigger.setAttribute('aria-expanded', String(!isOpen));
    };
    trigger.addEventListener('click', onToggle);
    cleanupFns.push(() => trigger.removeEventListener('click', onToggle));
  });
}

/* ------------------------------------------------------------------ */
/* Scroll island (case-study floating navigation)                      */
/* ------------------------------------------------------------------ */

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

  let ticking = false;
  function updateScrollProgress() {
    ticking = false;
    const rect = caseStudySection!.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const isVisible = rect.top <= windowHeight * 0.6 && rect.bottom >= 150;

    if (isVisible) {
      islandContainer!.classList.add('visible');
      const totalScrollable = rect.height - windowHeight * 0.4;
      const scrolled = windowHeight * 0.6 - rect.top;
      const progress = Math.max(0, Math.min(100, Math.round((scrolled / Math.max(totalScrollable, 1)) * 100)));
      if (progressRing) progressRing.style.background = `conic-gradient(#ffffff ${progress}%, #3a3b40 0)`;
      if (progressNum) progressNum.textContent = `${progress}%`;
    } else {
      islandContainer!.classList.remove('visible');
      islandCard!.classList.remove('expanded');
      if (backdrop) backdrop.classList.remove('visible');
      if (islandTrigger) islandTrigger.setAttribute('aria-expanded', 'false');
    }
  }

  // rAF-throttled so scrolling never floods the main thread.
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateScrollProgress);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateScrollProgress();

  if (islandTrigger) {
    const onTriggerClick = (e: Event) => {
      e.stopPropagation();
      const isExpanded = islandCard!.classList.toggle('expanded');
      islandTrigger.setAttribute('aria-expanded', String(isExpanded));
      if (backdrop) backdrop.classList.toggle('visible', isExpanded);
    };
    const onTriggerKeydown = (e: Event) => {
      const ev = e as KeyboardEvent;
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        (islandTrigger as HTMLElement).click();
      }
    };
    islandTrigger.addEventListener('click', onTriggerClick);
    islandTrigger.addEventListener('keydown', onTriggerKeydown);
    cleanupFns.push(() => {
      islandTrigger.removeEventListener('click', onTriggerClick);
      islandTrigger.removeEventListener('keydown', onTriggerKeydown);
    });
  }

  if (backdrop) {
    const onBackdropClick = () => {
      islandCard!.classList.remove('expanded');
      backdrop.classList.remove('visible');
      if (islandTrigger) islandTrigger.setAttribute('aria-expanded', 'false');
    };
    backdrop.addEventListener('click', onBackdropClick);
    cleanupFns.push(() => backdrop.removeEventListener('click', onBackdropClick));
  }

  topicBtns.forEach((btn) => {
    const timeoutIds: number[] = [];
    const onTopicClick = (e: Event) => {
      e.stopPropagation();
      const targetId = btn.getAttribute('data-target');
      const targetEl = targetId ? document.getElementById(targetId) : null;
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.classList.remove('animate-flash');
        void (targetEl as HTMLElement).offsetWidth;
        targetEl.classList.add('animate-flash');
        timeoutIds.push(window.setTimeout(() => targetEl.classList.remove('animate-flash'), 1800));
      }
      islandCard!.classList.remove('expanded');
      if (backdrop) backdrop.classList.remove('visible');
      if (islandTrigger) islandTrigger.setAttribute('aria-expanded', 'false');
    };
    btn.addEventListener('click', onTopicClick);
    cleanupFns.push(() => {
      btn.removeEventListener('click', onTopicClick);
      timeoutIds.forEach((id) => window.clearTimeout(id));
    });
  });

  cleanupFns.push(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  });
}

/* ------------------------------------------------------------------ */
/* Footer / support interactions                                       */
/* ------------------------------------------------------------------ */

function initLandingExtras() {
  const contactBtn = document.getElementById('open-contact-btn');
  if (contactBtn) {
    const onContact = () => {
      toast('Support: support@tracker.app | Hotline: +1 (800) 555-0199', 4500);
    };
    contactBtn.addEventListener('click', onContact);
    cleanupFns.push(() => contactBtn.removeEventListener('click', onContact));
  }
}

/* ------------------------------------------------------------------ */
/* Modals (Terms of Service / Privacy / 404)                           */
/* ------------------------------------------------------------------ */

function openModal(modalId: string) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId: string | Element) {
  const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (!modal) return;
  (modal as HTMLElement).hidden = true;
  if (!document.querySelector('.modal-backdrop:not([hidden])')) {
    document.body.style.overflow = '';
  }
}

function initModals() {
  const bindOpen = (btn: HTMLElement | null, modalId: string) => {
    if (!btn) return;
    const handler = () => openModal(modalId);
    btn.addEventListener('click', handler);
    cleanupFns.push(() => btn.removeEventListener('click', handler));
  };
  bindOpen(document.getElementById('open-tos-btn'), 'tos-modal');
  bindOpen(document.getElementById('open-privacy-btn'), 'privacy-modal');
  bindOpen(document.getElementById('simulate-404-btn'), 'notfound-modal');

  document.querySelectorAll('[data-close]').forEach((btn) => {
    const handler = () => {
      const modalId = btn.getAttribute('data-close');
      if (modalId) closeModal(modalId);
    };
    btn.addEventListener('click', handler);
    cleanupFns.push(() => btn.removeEventListener('click', handler));
  });

  document.querySelectorAll<HTMLElement>('.modal-backdrop').forEach((modal) => {
    const handler = (e: MouseEvent) => {
      if (e.target === modal) closeModal(modal);
    };
    modal.addEventListener('click', handler);
    cleanupFns.push(() => modal.removeEventListener('click', handler));
  });

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop:not([hidden])').forEach((m) => closeModal(m));
    }
  };
  window.addEventListener('keydown', onKeydown);
  cleanupFns.push(() => window.removeEventListener('keydown', onKeydown));
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

/** Cleanup callbacks registered by the modules above. */
const cleanupFns: Array<() => void> = [];

/**
 * Boots every landing behaviour and returns a single teardown function.
 */
export function initLanding(root: HTMLElement, options: LandingOptions): () => void {
  cleanupFns.length = 0;

  // One GSAP context owns every tween & ScrollTrigger created below, so a
  // single revert() fully unwinds the animation when we leave the page.
  const ctx = gsap.context(() => {
    initHeroScrollAnimation(options.navigate);
  }, root);

  initInteractiveKanbanBoard();
  initFaqAccordion();
  initScrollIsland();
  initModals();
  initLandingExtras();

  // Landing CTAs → real routes
  const signInBtn = document.getElementById('nav-cta-btn');
  const heroStartBtn = document.getElementById('hero-start-btn');
  const onSignIn = (e: Event) => {
    e.preventDefault();
    options.navigate('/login');
  };
  if (signInBtn) signInBtn.addEventListener('click', onSignIn);
  if (heroStartBtn) heroStartBtn.addEventListener('click', onSignIn);

  // Theme toggle in the landing nav
  const themeBtn = document.getElementById('theme-toggle-btn');
  const onThemeToggle = () => {
    options.toggleTheme();
    const nowDark = document.documentElement.classList.contains('dark');
    toast(nowDark ? 'Switched to Dark mode' : 'Switched to Light mode', 2000);
  };
  if (themeBtn) themeBtn.addEventListener('click', onThemeToggle);

  // Keep in-app anchors from doing full page loads.
  const onRootClick = (e: MouseEvent) => {
    const anchor = (e.target as HTMLElement).closest?.('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href) return;
    if (href === '/' || href === '') {
      e.preventDefault();
      options.navigate('/');
    }
  };
  root.addEventListener('click', onRootClick);

  // Recalculate after fonts/layout settle (the SPA already fired `load`).
  const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 60);
  const refreshAgain = window.setTimeout(() => ScrollTrigger.refresh(), 400);
  if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
    (document as any).fonts.ready.then(() => ScrollTrigger.refresh());
  }

  return () => {
    window.clearTimeout(refreshTimer);
    window.clearTimeout(refreshAgain);
    root.removeEventListener('click', onRootClick);
    if (signInBtn) signInBtn.removeEventListener('click', onSignIn);
    if (heroStartBtn) heroStartBtn.removeEventListener('click', onSignIn);
    if (themeBtn) themeBtn.removeEventListener('click', onThemeToggle);
    cleanupFns.forEach((fn) => fn());
    cleanupFns.length = 0;
    ctx.revert();
    // Leaving the landing page must never lock the document behind a modal.
    root.querySelectorAll('.modal-backdrop:not([hidden])').forEach((m) => {
      (m as HTMLElement).hidden = true;
    });
    document.body.style.overflow = '';
  };
}

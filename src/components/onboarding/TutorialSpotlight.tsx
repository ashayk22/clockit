import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Check, Lightbulb, SkipForward, X } from 'lucide-react';
import type { TourStep } from '../../services/onboardingService';
import '../../styles/onboarding.css';

interface TutorialSpotlightProps {
  step: TourStep | null;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkipPage: () => void;
  onFinish: () => void;
  onClose: () => void;
}

interface RectGeometry {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const TutorialSpotlight: React.FC<TutorialSpotlightProps> = ({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkipPage,
  onFinish,
  onClose,
}) => {
  const [targetRect, setTargetRect] = useState<RectGeometry | null>(null);
  const [popoverPos, setPopoverPos] = useState<{
    top?: number;
    left?: number;
    bottom?: number;
    right?: number;
  } | null>(null);

  const activeElementRef = useRef<HTMLElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Measure and position both spotlight box and popover relative to target
  const updateGeometry = useCallback(
    (el: HTMLElement) => {
      if (!el.isConnected) return;
      const r = el.getBoundingClientRect();
      const pad = 6;
      const x = Math.max(0, r.left - pad);
      const y = Math.max(0, r.top - pad);
      const w = Math.min(window.innerWidth - x, r.width + pad * 2);
      const h = Math.min(window.innerHeight - y, r.height + pad * 2);

      setTargetRect({
        top: Math.round(y),
        left: Math.round(x),
        width: Math.round(w),
        height: Math.round(h),
      });

      const cardW = Math.min(440, window.innerWidth - 32);
      const cardH = 260;
      const margin = 14;

      // Mobile screen docking
      if (window.innerWidth <= 640) {
        setPopoverPos({
          bottom: 16,
          left: 16,
          right: 16,
        });
        return;
      }

      const preferredPos = step?.position || 'bottom';
      let finalTop: number;
      let finalLeft: number;

      if (preferredPos === 'bottom' && y + h + cardH + margin < window.innerHeight) {
        finalTop = y + h + margin;
        finalLeft = Math.max(margin, Math.min(x, window.innerWidth - cardW - margin));
      } else if (preferredPos === 'top' && y - cardH - margin > 0) {
        finalTop = y - cardH - margin;
        finalLeft = Math.max(margin, Math.min(x, window.innerWidth - cardW - margin));
      } else if (preferredPos === 'right' && x + w + cardW + margin < window.innerWidth) {
        finalTop = Math.max(margin, Math.min(y, window.innerHeight - cardH - margin));
        finalLeft = x + w + margin;
      } else if (preferredPos === 'left' && x - cardW - margin > 0) {
        finalTop = Math.max(margin, Math.min(y, window.innerHeight - cardH - margin));
        finalLeft = x - cardW - margin;
      } else if (y + h + cardH + margin < window.innerHeight) {
        // Fallback below
        finalTop = y + h + margin;
        finalLeft = Math.max(margin, Math.min(x, window.innerWidth - cardW - margin));
      } else if (y - cardH - margin > 0) {
        // Fallback above
        finalTop = y - cardH - margin;
        finalLeft = Math.max(margin, Math.min(x, window.innerWidth - cardW - margin));
      } else {
        // Fallback centered
        finalTop = Math.max(margin, (window.innerHeight - cardH) / 2);
        finalLeft = Math.max(margin, (window.innerWidth - cardW) / 2);
      }

      setPopoverPos({
        top: Math.round(finalTop),
        left: Math.round(finalLeft),
      });
    },
    [step?.position],
  );

  // Discovery and measurement effect
  useEffect(() => {
    if (!step) {
      setTargetRect(null);
      setPopoverPos(null);
      return;
    }

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    activeElementRef.current = null;

    let isCancelled = false;
    let pollTimer: number | null = null;
    let domObserver: MutationObserver | null = null;
    let attempts = 0;
    const maxAttempts = 70; // 70 * 50ms = 3.5s

    const findTarget = () => {
      if (isCancelled) return;

      let el: HTMLElement | null = null;
      if (step.targetSelector) {
        try {
          el = document.querySelector<HTMLElement>(step.targetSelector);
        } catch {
          el = null;
        }
      }

      if (el && el.isConnected) {
        activeElementRef.current = el;

        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        } catch {
          // ignore scroll errors
        }

        updateGeometry(el);

        // Attach ResizeObserver to handle layout/content size changes
        if (typeof ResizeObserver !== 'undefined') {
          const ro = new ResizeObserver(() => {
            if (!isCancelled && activeElementRef.current) {
              updateGeometry(activeElementRef.current);
            }
          });
          ro.observe(el);
          resizeObserverRef.current = ro;
        }

        if (domObserver) {
          domObserver.disconnect();
          domObserver = null;
        }
        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        pollTimer = window.setTimeout(findTarget, 50);
      } else {
        // Graceful fallback to centered card if element not found
        setTargetRect(null);
        setPopoverPos(null);
      }
    };

    // Observe body for asynchronous route mounts
    if (typeof MutationObserver !== 'undefined') {
      domObserver = new MutationObserver(() => {
        if (!activeElementRef.current) {
          findTarget();
        }
      });
      domObserver.observe(document.body, { childList: true, subtree: true });
    }

    findTarget();

    const handleScrollOrResize = () => {
      if (activeElementRef.current) {
        requestAnimationFrame(() => {
          if (!isCancelled && activeElementRef.current) {
            updateGeometry(activeElementRef.current);
          }
        });
      }
    };

    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });

    return () => {
      isCancelled = true;
      if (pollTimer !== null) {
        window.clearTimeout(pollTimer);
      }
      if (domObserver) {
        domObserver.disconnect();
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize);
    };
  }, [step, updateGeometry]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && (e.metaKey || e.ctrlKey)) {
        onNext();
      } else if (e.key === 'ArrowLeft' && (e.metaKey || e.ctrlKey)) {
        onPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onClose]);

  if (!step) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const progressPercent = Math.round(((stepIndex + 1) / totalSteps) * 100);

  const popoverStyle: React.CSSProperties = popoverPos
    ? {
        top: popoverPos.top !== undefined ? `${popoverPos.top}px` : undefined,
        left: popoverPos.left !== undefined ? `${popoverPos.left}px` : undefined,
        bottom: popoverPos.bottom !== undefined ? `${popoverPos.bottom}px` : undefined,
        right: popoverPos.right !== undefined ? `${popoverPos.right}px` : undefined,
      }
    : {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };

  const portalContent = (
    <div
      className="clockit-tour-portal-root"
      role="dialog"
      aria-modal="true"
      aria-label={`${step.pageTitle} Tour: ${step.title}`}
    >
      {/* Invisible backdrop click catcher */}
      <div
        className="clockit-tour-backdrop-catcher"
        onClick={onClose}
        aria-hidden="true"
        title="Click to pause walkthrough"
      />

      {/* Either spotlight cutout box (animating across targets) or centered backdrop */}
      {targetRect ? (
        <div
          className="clockit-tour-spotlight-box"
          style={{
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
          }}
          aria-hidden="true"
        />
      ) : (
        <div className="clockit-tour-centered-backdrop" onClick={onClose} aria-hidden="true" />
      )}

      {/* Popover Card */}
      <div
        className="clockit-tutorial-popover"
        style={popoverStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Live region announcement for assistive technology */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          {`${step.pageTitle} Tour: Step ${step.stepNumberInPage} of ${step.totalStepsInPage}. ${step.title}. ${step.description}`}
        </div>

        {/* Top Progress Bar */}
        <div
          style={{
            height: 3,
            width: '100%',
            background: 'var(--border-subtle, rgba(255,255,255,0.08))',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'var(--accent-green, #10b981)',
              transition: 'width 0.25s ease',
            }}
          />
        </div>

        {/* Header */}
        <div className="clockit-tutorial-header">
          <div className="clockit-tutorial-meta" style={{ flexWrap: 'wrap', gap: 6 }}>
            <span className="clockit-tutorial-pill">{step.pageTitle}</span>
            <span className="clockit-tutorial-step-indicator" style={{ fontWeight: 550 }}>
              Step {step.stepNumberInPage} of {step.totalStepsInPage}
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-subtle, rgba(0,0,0,0.04))',
                padding: '1px 6px',
                borderRadius: 4,
              }}
            >
              Overall {stepIndex + 1}/{totalSteps} ({progressPercent}%)
            </span>
          </div>

          <button
            type="button"
            className="clockit-tutorial-close"
            onClick={onClose}
            aria-label="Exit tour (progress is saved)"
            title="Exit tour (progress is saved)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="clockit-tutorial-body">
          <h3 className="clockit-tutorial-title">{step.title}</h3>
          <p className="clockit-tutorial-desc">{step.description}</p>

          {step.tip && (
            <div className="clockit-tutorial-tip">
              <Lightbulb
                size={15}
                style={{ flexShrink: 0, marginTop: 1, color: 'var(--accent-green, #10b981)' }}
              />
              <span>{step.tip}</span>
            </div>
          )}

          {step.shortcut && (
            <div className="clockit-tutorial-shortcut">
              <span>Shortcut:</span>
              <kbd className="clockit-tutorial-kbd">{step.shortcut}</kbd>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="clockit-tutorial-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!isLast && (
              <button
                type="button"
                className="clockit-tutorial-skip"
                onClick={onSkipPage}
                title="Skip to the next page in the tour"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: 4,
                  background: 'none',
                  border: 'none',
                }}
              >
                <SkipForward size={12} />
                <span>Skip Page</span>
              </button>
            )}
            <button
              type="button"
              className="clockit-tutorial-skip"
              onClick={onClose}
              title="Pause and resume later"
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: 4,
                background: 'none',
                border: 'none',
              }}
            >
              Exit Tour
            </button>
          </div>

          <div className="clockit-tutorial-nav">
            {!isFirst && (
              <button
                type="button"
                className="clockit-tutorial-btn secondary"
                onClick={onPrev}
                aria-label="Previous step"
              >
                <ArrowLeft size={13} />
                <span>Previous</span>
              </button>
            )}

            {isLast ? (
              <button
                type="button"
                className="clockit-tutorial-btn primary"
                onClick={onFinish}
                aria-label="Finish interactive product tour"
                style={{
                  background: 'var(--accent-green, #10b981)',
                  borderColor: 'var(--accent-green, #10b981)',
                }}
              >
                <span>Finish Tour</span>
                <Check size={14} />
              </button>
            ) : (
              <button
                type="button"
                className="clockit-tutorial-btn primary"
                onClick={onNext}
                aria-label="Next step"
              >
                <span>Next</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(portalContent, document.body) : null;
};

export default TutorialSpotlight;

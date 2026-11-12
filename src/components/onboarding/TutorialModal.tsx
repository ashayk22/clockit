import React from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  Compass,
  FileText,
  Flame,
  FolderKanban,
  LayoutDashboard,
  Play,
  RotateCcw,
  Settings,
  Sparkles,
  Timer,
  X,
} from 'lucide-react';
import {
  TOUR_PAGES,
  TOTAL_TOUR_STEPS,
  getCompletedTutorialIds,
  getSavedTourStep,
  getTutorialProgress,
  isGlobalTourCompleted,
  resetAllTutorials,
  type TourPage,
} from '../../services/onboardingService';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import '../../styles/onboarding.css';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTutorial: (module: TourPage) => void;
  onStartFullTour?: () => void;
  onResumeTour?: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={18} />,
  CheckSquare: <CheckSquare size={18} />,
  FolderKanban: <FolderKanban size={18} />,
  Calendar: <Calendar size={18} />,
  Timer: <Timer size={18} />,
  Flame: <Flame size={18} />,
  FileText: <FileText size={18} />,
  Sparkles: <Sparkles size={18} />,
  Clock: <Clock size={18} />,
  Settings: <Settings size={18} />,
};

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  onStartTutorial,
  onStartFullTour,
  onResumeTour,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen, onClose);

  if (!isOpen) return null;

  const { completed, total, percentage } = getTutorialProgress();
  const completedIds = getCompletedTutorialIds();
  const savedStep = getSavedTourStep();
  const isAllComplete = isGlobalTourCompleted() || completed === total;

  const handleReset = () => {
    resetAllTutorials();
  };

  const modalContent = (
    <div className="clockit-tutorial-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        className="clockit-tutorial-directory-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-directory-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="clockit-td-header">
          <div className="clockit-td-title-wrap">
            <h2 id="tutorial-directory-title">ClockIt Product Tour & Feature Guides</h2>
            <p>Interactive step-by-step walkthroughs across all 11 application areas</p>
          </div>
          <button
            type="button"
            className="clockit-tutorial-close"
            onClick={onClose}
            aria-label="Close guides"
          >
            <X size={18} />
          </button>
        </div>

        {/* Global Progress & Quick Actions */}
        <div className="clockit-td-progress-section">
          <div className="clockit-td-bar-container">
            <div className="clockit-td-bar-labels">
              <span>Overall Tour Progress</span>
              <span>
                {completed} of {total} sections completed ({percentage}%)
              </span>
            </div>
            <div className="clockit-td-bar-bg">
              <div
                className="clockit-td-bar-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {savedStep > 0 && !isAllComplete && onResumeTour && (
              <button
                type="button"
                className="clockit-tutorial-btn primary"
                onClick={() => {
                  onClose();
                  onResumeTour();
                }}
                style={{ background: 'var(--accent-green, #10b981)' }}
              >
                <Compass size={13} />
                <span>Resume Tour (Step {savedStep + 1})</span>
              </button>
            )}

            {onStartFullTour && (
              <button
                type="button"
                className={`clockit-tutorial-btn ${savedStep > 0 && !isAllComplete ? 'secondary' : 'primary'}`}
                onClick={() => {
                  onClose();
                  onStartFullTour();
                }}
              >
                <Play size={13} />
                <span>{isAllComplete ? 'Replay Full Tour' : 'Start Full Tour'}</span>
              </button>
            )}

            {completed > 0 && (
              <button
                type="button"
                className="clockit-tutorial-btn secondary"
                onClick={handleReset}
                title="Reset progress to replay all tutorials"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Module List */}
        <div className="clockit-td-list">
          {TOUR_PAGES.map((page, pageIdx) => {
            const isDone = completedIds.includes(page.id);
            return (
              <div key={page.id} className="clockit-td-item">
                <div className="clockit-td-item-info">
                  <div className="clockit-td-item-icon">
                    {ICON_MAP[page.iconName] || <Sparkles size={18} />}
                  </div>
                  <div>
                    <div className="clockit-td-item-title">
                      <span>{page.title}</span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                          marginLeft: 8,
                          fontWeight: 'normal',
                        }}
                      >
                        ({page.steps.length} steps)
                      </span>
                    </div>
                    <div className="clockit-td-item-sub">{page.subtitle}</div>
                  </div>
                </div>

                <div className="clockit-td-item-actions">
                  <span
                    className={`clockit-td-badge ${isDone ? 'completed' : 'pending'}`}
                  >
                    {isDone ? 'Completed' : `Section ${pageIdx + 1}`}
                  </span>
                  <button
                    type="button"
                    className="clockit-tutorial-btn primary"
                    onClick={() => {
                      onClose();
                      onStartTutorial(page);
                    }}
                  >
                    {isDone ? (
                      <>
                        <RotateCcw size={13} />
                        <span>Replay</span>
                      </>
                    ) : (
                      <>
                        <Play size={13} />
                        <span>Start</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default TutorialModal;

import React, { useState } from 'react';
import { Compass, Sparkles, X } from 'lucide-react';
import {
  TUTORIAL_MODULES,
  dismissInitialWelcome,
  getCompletedTutorialIds,
  shouldShowInitialWelcome,
  type TutorialModule,
} from '../../services/onboardingService';
import '../../styles/onboarding.css';

interface OnboardingWelcomeBannerProps {
  onStartTour: (module: TutorialModule) => void;
}

export const OnboardingWelcomeBanner: React.FC<OnboardingWelcomeBannerProps> = ({
  onStartTour,
}) => {
  const [visible, setVisible] = useState(() => shouldShowInitialWelcome());

  if (!visible) return null;

  // Don't show if user has already completed most tutorials
  const completed = getCompletedTutorialIds();
  if (completed.length >= 3) return null;

  const handleDismiss = () => {
    dismissInitialWelcome();
    setVisible(false);
  };

  const handleStart = () => {
    dismissInitialWelcome();
    setVisible(false);
    onStartTour(TUTORIAL_MODULES[0]); // Start with Dashboard
  };

  return (
    <div className="clockit-onboarding-welcome-card" role="region" aria-label="Welcome tour invitation">
      <div className="clockit-owc-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <Sparkles size={15} style={{ color: 'var(--accent-green)' }} />
          <h3>Welcome to your focused workspace</h3>
        </div>
        <p>
          Take a quick 2-minute interactive walkthrough to master tasks, deep focus, habits, and notes.
        </p>
      </div>

      <div className="clockit-owc-actions">
        <button
          type="button"
          className="clockit-tutorial-btn primary"
          onClick={handleStart}
        >
          <Compass size={14} />
          <span>Start Interactive Tour</span>
        </button>
        <button
          type="button"
          className="clockit-tutorial-skip"
          onClick={handleDismiss}
          aria-label="Dismiss welcome banner"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};

export default OnboardingWelcomeBanner;

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ALL_TOUR_STEPS,
  TOTAL_TOUR_STEPS,
  TOUR_PAGES,
  completeTutorial,
  getSavedTourStep,
  isGlobalTourCompleted,
  saveTourStep,
  setGlobalTourCompleted,
  skipTutorial,
  type TourPage,
  type TourStep,
} from '../../services/onboardingService';
import { TutorialSpotlight } from './TutorialSpotlight';
import { TutorialModal } from './TutorialModal';
import { toast } from '../ui/NotificationToast';

export interface OnboardingContextValue {
  openTutorialDirectory: () => void;
  closeTutorialDirectory: () => void;
  startTour: (fromStepIndex?: number) => void;
  startPageTour: (pageId: string) => void;
  startTutorial: (page: TourPage) => void; // compatibility
  resumeTour: () => void;
  isTourActive: boolean;
  currentStepIndex: number;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const openTutorialDirectory = useCallback(() => {
    setIsDirectoryOpen(true);
  }, []);

  const closeTutorialDirectory = useCallback(() => {
    setIsDirectoryOpen(false);
  }, []);

  const startTour = useCallback(
    (fromStepIndex?: number) => {
      const targetIndex =
        fromStepIndex !== undefined
          ? Math.max(0, Math.min(fromStepIndex, TOTAL_TOUR_STEPS - 1))
          : 0;

      setCurrentStepIndex(targetIndex);
      saveTourStep(targetIndex);
      setIsTourActive(true);
      setIsDirectoryOpen(false);

      const targetStep = ALL_TOUR_STEPS[targetIndex];
      if (targetStep && location.pathname !== targetStep.route) {
        navigate(targetStep.route);
      }
    },
    [location.pathname, navigate],
  );

  const startPageTour = useCallback(
    (pageId: string) => {
      const stepIndex = ALL_TOUR_STEPS.findIndex((s) => s.pageId === pageId);
      if (stepIndex !== -1) {
        startTour(stepIndex);
      } else {
        startTour(0);
      }
    },
    [startTour],
  );

  const startTutorial = useCallback(
    (page: TourPage) => {
      startPageTour(page.id);
    },
    [startPageTour],
  );

  const resumeTour = useCallback(() => {
    const saved = getSavedTourStep();
    startTour(saved);
  }, [startTour]);

  const handleNext = useCallback(() => {
    if (currentStepIndex < TOTAL_TOUR_STEPS - 1) {
      const currentStep = ALL_TOUR_STEPS[currentStepIndex];
      const nextIndex = currentStepIndex + 1;
      const nextStep = ALL_TOUR_STEPS[nextIndex];

      // If completing the last step of this page, mark page as completed
      if (currentStep && currentStep.pageId !== nextStep.pageId) {
        completeTutorial(currentStep.pageId);
      }

      setCurrentStepIndex(nextIndex);
      saveTourStep(nextIndex);

      if (nextStep && location.pathname !== nextStep.route) {
        navigate(nextStep.route);
      }
    } else {
      // Last step finished
      setGlobalTourCompleted(true);
      TOUR_PAGES.forEach((p) => completeTutorial(p.id));
      setIsTourActive(false);
      setCurrentStepIndex(0);
      toast.success("Product tour completed! You're ready to master ClockIt.", {
        title: 'Tour Complete',
      });
    }
  }, [currentStepIndex, location.pathname, navigate]);

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      const prevStep = ALL_TOUR_STEPS[prevIndex];

      setCurrentStepIndex(prevIndex);
      saveTourStep(prevIndex);

      if (prevStep && location.pathname !== prevStep.route) {
        navigate(prevStep.route);
      }
    }
  }, [currentStepIndex, location.pathname, navigate]);

  const handleSkipPage = useCallback(() => {
    const currentStep = ALL_TOUR_STEPS[currentStepIndex];
    if (!currentStep) return;

    completeTutorial(currentStep.pageId);

    // Find the first step belonging to the next page
    const nextPageIndex = ALL_TOUR_STEPS.findIndex(
      (s, idx) => idx > currentStepIndex && s.pageId !== currentStep.pageId,
    );

    if (nextPageIndex !== -1) {
      const nextStep = ALL_TOUR_STEPS[nextPageIndex];
      setCurrentStepIndex(nextPageIndex);
      saveTourStep(nextPageIndex);

      if (nextStep && location.pathname !== nextStep.route) {
        navigate(nextStep.route);
      }
    } else {
      // Current page was the final page in the tour
      setGlobalTourCompleted(true);
      TOUR_PAGES.forEach((p) => completeTutorial(p.id));
      setIsTourActive(false);
      setCurrentStepIndex(0);
      toast.success("Product tour completed! You're ready to master ClockIt.", {
        title: 'Tour Complete',
      });
    }
  }, [currentStepIndex, location.pathname, navigate]);

  const handleFinish = useCallback(() => {
    setGlobalTourCompleted(true);
    TOUR_PAGES.forEach((p) => completeTutorial(p.id));
    setIsTourActive(false);
    setCurrentStepIndex(0);
    toast.success("Product tour completed! You're ready to master ClockIt.", {
      title: 'Tour Complete',
    });
  }, []);

  const handleClose = useCallback(() => {
    // Save current step so user can resume later
    saveTourStep(currentStepIndex);
    setIsTourActive(false);
  }, [currentStepIndex]);

  const activeStep: TourStep | null =
    isTourActive && ALL_TOUR_STEPS[currentStepIndex] ? ALL_TOUR_STEPS[currentStepIndex] : null;

  const contextValue = useMemo(
    () => ({
      openTutorialDirectory,
      closeTutorialDirectory,
      startTour,
      startPageTour,
      startTutorial,
      resumeTour,
      isTourActive,
      currentStepIndex,
    }),
    [
      openTutorialDirectory,
      closeTutorialDirectory,
      startTour,
      startPageTour,
      startTutorial,
      resumeTour,
      isTourActive,
      currentStepIndex,
    ],
  );

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}

      <TutorialModal
        isOpen={isDirectoryOpen}
        onClose={closeTutorialDirectory}
        onStartTutorial={startTutorial}
        onStartFullTour={() => startTour(0)}
        onResumeTour={resumeTour}
      />

      {isTourActive && (
        <TutorialSpotlight
          step={activeStep}
          stepIndex={currentStepIndex}
          totalSteps={TOTAL_TOUR_STEPS}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkipPage={handleSkipPage}
          onFinish={handleFinish}
          onClose={handleClose}
        />
      )}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextValue => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return ctx;
};

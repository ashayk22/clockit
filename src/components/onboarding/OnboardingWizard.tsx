import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Compass, Sparkles, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useTheme, type AppearanceMode } from '../../theme/ThemeContext';
import { preferencesRepository } from '../../services/repositories';
import { scopedStorageKey } from '../../services/repositories/storage';
import { ClockItLogo } from '../brand/ClockItLogo';
import { useOnboarding } from './OnboardingContext';
import './onboardingWizard.css';

const CHALLENGE_OPTIONS = [
  'Staying focused',
  'Managing too many tasks',
  'Maintaining consistency',
  'Organizing information',
  'Managing time',
  'Keeping everything organized',
] as const;

const PLANNING_OPTIONS = [
  {
    title: 'Plan everything in advance.',
    description: 'Structured time-blocking and predefined daily agendas.',
  },
  {
    title: 'Create a task list and work through it.',
    description: 'Action-oriented checklists ordered by priority.',
  },
  {
    title: 'Adapt priorities as the day progresses.',
    description: 'Dynamic response to incoming deadlines and urgent goals.',
  },
  {
    title: 'A mixture of everything.',
    description: 'Balanced approach combining time blocks and reactive lists.',
  },
] as const;

const FOCUS_PRESETS = [
  { label: '25 minutes', value: 25, hint: 'Classic Pomodoro technique for high agility' },
  { label: '50 minutes', value: 50, hint: 'Extended deep-work sprint for engineers and writers' },
  { label: '90 minutes', value: 90, hint: 'Ultradian rhythm for immersive problem-solving' },
  { label: 'Custom duration', value: -1, hint: 'Set your preferred minutes (5 to 180 min)' },
] as const;

const APPEARANCE_OPTIONS: { id: AppearanceMode; title: string; desc: string; icon: typeof Sun }[] = [
  { id: 'light', title: 'Light', desc: 'Warm cream, crisp surfaces for bright environments', icon: Sun },
  { id: 'dark', title: 'Dark', desc: 'Soft charcoal, low eye strain for evening focus', icon: Moon },
  { id: 'system', title: 'System default', desc: 'Automatically matches your operating system setting', icon: Monitor },
];

export const OnboardingWizard: React.FC = () => {
  const { user } = useAuth();
  const { appearance, setAppearance } = useTheme();
  const { openTutorialDirectory } = useOnboarding();
  const navigate = useNavigate();

  // Wizard step state (1 to 4, then 5 for completion)
  const [step, setStep] = useState<number>(1);

  // Form states
  const [challenges, setChallenges] = useState<string[]>(() => {
    const existing = preferencesRepository.get('productivityChallenges');
    return Array.isArray(existing) && existing.length > 0 ? existing : ['Staying focused'];
  });

  const [planning, setPlanning] = useState<string>(() => {
    return preferencesRepository.get('planningPreference') || 'A mixture of everything.';
  });

  const [selectedFocusPreset, setSelectedFocusPreset] = useState<number>(() => {
    const existing = preferencesRepository.get('preferredFocusDuration') || 25;
    if (existing === 25 || existing === 50 || existing === 90) return existing;
    return -1; // custom
  });

  const [customMinutes, setCustomMinutes] = useState<string>(() => {
    const existing = preferencesRepository.get('preferredFocusDuration') || 25;
    return String(existing > 0 ? existing : 25);
  });

  const [selectedAppearance, setSelectedAppearance] = useState<AppearanceMode>(() => appearance || 'system');

  const resolvedFocusDuration = useMemo(() => {
    if (selectedFocusPreset !== -1) return selectedFocusPreset;
    const parsed = parseInt(customMinutes, 10);
    return Number.isFinite(parsed) && parsed >= 5 && parsed <= 180 ? parsed : 25;
  }, [selectedFocusPreset, customMinutes]);

  const isCustomDurationValid = useMemo(() => {
    if (selectedFocusPreset !== -1) return true;
    const parsed = parseInt(customMinutes, 10);
    return Number.isFinite(parsed) && parsed >= 5 && parsed <= 180;
  }, [selectedFocusPreset, customMinutes]);

  // Validation per step
  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return challenges.length > 0;
      case 2:
        return Boolean(planning);
      case 3:
        return isCustomDurationValid;
      case 4:
        return Boolean(selectedAppearance);
      default:
        return true;
    }
  }, [step, challenges, planning, isCustomDurationValid, selectedAppearance]);

  const toggleChallenge = (item: string) => {
    setChallenges((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]
    );
  };

  const applyPreferences = (isSkip = false) => {
    const finalChallenges = isSkip ? ['Staying focused', 'Managing too many tasks'] : challenges;
    const finalPlanning = isSkip ? 'A mixture of everything.' : planning;
    const finalFocus = isSkip ? 25 : resolvedFocusDuration;
    const finalAppearance = isSkip ? 'system' : selectedAppearance;

    // 1. Repository
    preferencesRepository.set('onboardingCompleted', true);
    preferencesRepository.set('productivityChallenges', finalChallenges);
    preferencesRepository.set('planningPreference', finalPlanning);
    preferencesRepository.set('preferredFocusDuration', finalFocus);
    preferencesRepository.set('appearancePreference', finalAppearance);

    // 2. Theme
    setAppearance(finalAppearance);

    // 3. Initial Timer preset
    try {
      const rawSettings = localStorage.getItem(scopedStorageKey('clockit_timer_settings'));
      const settings = rawSettings ? JSON.parse(rawSettings) : { deepWork: 25, shortBreak: 5, longBreak: 15 };
      settings.deepWork = finalFocus;
      localStorage.setItem(scopedStorageKey('clockit_timer_settings'), JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  };

  const handleNext = () => {
    if (!canContinue) return;
    if (step < 4) {
      // Temporarily preview appearance if on step 4
      if (step === 3) {
        setAppearance(selectedAppearance);
      }
      setStep((prev) => prev + 1);
    } else {
      // Commit and go to completion summary
      applyPreferences(false);
      setStep(5);
    }
  };

  const handleBack = () => {
    if (step > 1 && step <= 4) {
      setStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    applyPreferences(true);
    navigate('/app', { replace: true });
  };

  const handleFinish = () => {
    navigate('/app', { replace: true });
  };

  const handleFinishWithTour = () => {
    navigate('/app', { replace: true });
    // Allow brief render before opening tour directory
    setTimeout(() => {
      openTutorialDirectory();
    }, 250);
  };

  const displayName = user?.name || 'ClockIt user';

  return (
    <div className="clockit-onboarding-shell">
      {/* Top Header */}
      <header className="clockit-onboarding-header">
        <ClockItLogo variant="full" size={24} />
        {step < 5 && (
          <button
            type="button"
            className="clockit-onboarding-skip-btn"
            onClick={handleSkip}
            title="Skip questionnaire with standard defaults"
          >
            Skip for now
          </button>
        )}
      </header>

      <main className="clockit-onboarding-container">
        {/* Progress indicator */}
        {step <= 4 && (
          <div className="clockit-onboarding-progress-wrap">
            <div className="clockit-onboarding-progress-meta">
              <span>Personalization</span>
              <span>Step {step} of 4</span>
            </div>
            <div className="clockit-onboarding-progress-track">
              <div
                className="clockit-onboarding-progress-fill"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Card Body */}
        <div className="clockit-onboarding-card">
          {/* STEP 1: Productivity Challenges */}
          {step === 1 && (
            <>
              <div className="clockit-onboarding-card-header">
                <span className="clockit-onboarding-eyebrow">Personal Goals</span>
                <h1 className="clockit-onboarding-title">
                  What is your biggest productivity challenge?
                </h1>
                <p className="clockit-onboarding-subtitle">
                  Select all that apply. ClockIt adapts your starting view to keep you grounded.
                </p>
              </div>

              <div className="clockit-onboarding-grid two-col">
                {CHALLENGE_OPTIONS.map((item) => {
                  const isSelected = challenges.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      className={`clockit-onboarding-option multi ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => toggleChallenge(item)}
                    >
                      <span className="clockit-onboarding-option-title">{item}</span>
                      <span className="clockit-onboarding-indicator">
                        {isSelected && <Check size={13} strokeWidth={2.8} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* STEP 2: Planning Preference */}
          {step === 2 && (
            <>
              <div className="clockit-onboarding-card-header">
                <span className="clockit-onboarding-eyebrow">Daily Rhythm</span>
                <h1 className="clockit-onboarding-title">
                  How do you prefer to plan your day?
                </h1>
                <p className="clockit-onboarding-subtitle">
                  Choose the planning rhythm that best matches your actual work pattern.
                </p>
              </div>

              <div className="clockit-onboarding-grid">
                {PLANNING_OPTIONS.map((opt) => {
                  const isSelected = planning === opt.title;
                  return (
                    <button
                      key={opt.title}
                      type="button"
                      className={`clockit-onboarding-option ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setPlanning(opt.title)}
                    >
                      <div className="clockit-onboarding-option-content">
                        <span className="clockit-onboarding-option-title">{opt.title}</span>
                        <span className="clockit-onboarding-option-desc">{opt.description}</span>
                      </div>
                      <span className="clockit-onboarding-indicator">
                        {isSelected && <Check size={13} strokeWidth={2.8} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* STEP 3: Focus Duration */}
          {step === 3 && (
            <>
              <div className="clockit-onboarding-card-header">
                <span className="clockit-onboarding-eyebrow">Focus Engine</span>
                <h1 className="clockit-onboarding-title">
                  How long do you prefer to focus?
                </h1>
                <p className="clockit-onboarding-subtitle">
                  We will configure your primary Deep Work countdown block to this duration. All other presets remain fully available.
                </p>
              </div>

              <div className="clockit-onboarding-grid">
                {FOCUS_PRESETS.map((preset) => {
                  const isSelected = selectedFocusPreset === preset.value;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      className={`clockit-onboarding-option ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedFocusPreset(preset.value)}
                    >
                      <div className="clockit-onboarding-option-content">
                        <span className="clockit-onboarding-option-title">{preset.label}</span>
                        <span className="clockit-onboarding-option-desc">{preset.hint}</span>
                      </div>
                      <span className="clockit-onboarding-indicator">
                        {isSelected && <Check size={13} strokeWidth={2.8} />}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedFocusPreset === -1 && (
                <div className="clockit-onboarding-custom-input">
                  <label htmlFor="custom-focus-input" style={{ fontSize: 14, fontWeight: 500 }}>
                    Enter minutes:
                  </label>
                  <input
                    id="custom-focus-input"
                    type="number"
                    min={5}
                    max={180}
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    placeholder="45"
                    aria-label="Custom focus duration in minutes"
                  />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    (5 to 180 minutes)
                  </span>
                  {!isCustomDurationValid && (
                    <span style={{ color: 'var(--accent-red, #ef4444)', fontSize: 13, marginLeft: 'auto' }}>
                      Enter 5–180
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {/* STEP 4: Appearance */}
          {step === 4 && (
            <>
              <div className="clockit-onboarding-card-header">
                <span className="clockit-onboarding-eyebrow">Appearance</span>
                <h1 className="clockit-onboarding-title">
                  Choose your appearance.
                </h1>
                <p className="clockit-onboarding-subtitle">
                  Select your theme aesthetic. You can change this anytime from the navigation bar or settings.
                </p>
              </div>

              <div className="clockit-onboarding-grid">
                {APPEARANCE_OPTIONS.map((opt) => {
                  const isSelected = selectedAppearance === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`clockit-onboarding-option ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => {
                        setSelectedAppearance(opt.id);
                        setAppearance(opt.id);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--radius-sm)',
                            background: isSelected ? 'var(--accent-green)' : 'var(--bg-subtle)',
                            color: isSelected ? '#ffffff' : 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="clockit-onboarding-option-content">
                          <span className="clockit-onboarding-option-title">{opt.title}</span>
                          <span className="clockit-onboarding-option-desc">{opt.desc}</span>
                        </div>
                      </div>
                      <span className="clockit-onboarding-indicator">
                        {isSelected && <Check size={13} strokeWidth={2.8} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* STEP 5: Completion Celebration */}
          {step === 5 && (
            <div className="clockit-onboarding-completion">
              <div className="clockit-onboarding-check-badge">
                <Sparkles size={28} />
              </div>

              <div className="clockit-onboarding-card-header" style={{ alignItems: 'center', textAlign: 'center' }}>
                <span className="clockit-onboarding-eyebrow">Setup Complete</span>
                <h1 className="clockit-onboarding-title">
                  You are all set, {displayName}!
                </h1>
                <p className="clockit-onboarding-subtitle" style={{ maxWidth: 480 }}>
                  Your personal ClockIt workspace is ready with your tailored focus timer, clean task queue, and personal preferences.
                </p>
              </div>

              <div className="clockit-onboarding-summary-list">
                <div className="clockit-onboarding-summary-item">
                  <span className="clockit-onboarding-summary-label">Focus Preset</span>
                  <span className="clockit-onboarding-summary-val">{resolvedFocusDuration} minutes deep-work timer</span>
                </div>
                <div className="clockit-onboarding-summary-item">
                  <span className="clockit-onboarding-summary-label">Planning Preference</span>
                  <span className="clockit-onboarding-summary-val">{planning}</span>
                </div>
                <div className="clockit-onboarding-summary-item">
                  <span className="clockit-onboarding-summary-label">Appearance</span>
                  <span className="clockit-onboarding-summary-val">
                    {selectedAppearance === 'system' ? 'System default (auto)' : `${selectedAppearance.charAt(0).toUpperCase() + selectedAppearance.slice(1)} mode`}
                  </span>
                </div>
                <div className="clockit-onboarding-summary-item">
                  <span className="clockit-onboarding-summary-label">Workspace</span>
                  <span className="clockit-onboarding-summary-val">Clean Personal Workspace</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, width: '100%', marginTop: 14 }}>
                <button
                  type="button"
                  className="clockit-onboarding-btn primary"
                  onClick={handleFinish}
                  style={{ flex: '1 1 200px', height: 46, fontSize: 15 }}
                >
                  <span>Launch Workspace</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  className="clockit-onboarding-btn secondary"
                  onClick={handleFinishWithTour}
                  style={{ flex: '1 1 200px', height: 46, fontSize: 14.5 }}
                >
                  <Compass size={16} />
                  <span>Take a 2-Minute Tour</span>
                </button>
              </div>
            </div>
          )}

          {/* Action buttons (Steps 1 to 4) */}
          {step <= 4 && (
            <footer className="clockit-onboarding-actions">
              {step > 1 ? (
                <button
                  type="button"
                  className="clockit-onboarding-btn secondary"
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                className="clockit-onboarding-btn primary"
                onClick={handleNext}
                disabled={!canContinue}
              >
                <span>{step === 4 ? 'Complete Setup' : 'Continue'}</span>
                <ArrowRight size={16} />
              </button>
            </footer>
          )}
        </div>
      </main>
    </div>
  );
};

export default OnboardingWizard;

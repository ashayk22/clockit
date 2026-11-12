import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Download,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Monitor,
  Moon,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Sun,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useTheme, type AppearanceMode } from '../../theme/ThemeContext';
import { useOnboarding } from '../onboarding/OnboardingContext';
import { getTutorialProgress, resetAllTutorials } from '../../services/onboardingService';
import { preferencesRepository } from '../../services/repositories';
import { downloadUserDataExport } from '../../services/dataExport';
import { PasswordStrengthMeter, validatePasswordInput } from '../../auth/passwordSecurity';
import { toast } from '../ui/NotificationToast';

export const SettingsPage: React.FC = () => {
  const { user, signOut, updateProfile, changePassword, isDemo } = useAuth();
  const { appearance, setAppearance } = useTheme();
  const { openTutorialDirectory } = useOnboarding();
  const navigate = useNavigate();
  const { completed, total, percentage } = getTutorialProgress();

  // Name Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);

  // Change Password State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const planningPref = preferencesRepository.get('planningPreference') || 'Not specified';
  const focusDur = preferencesRepository.get('preferredFocusDuration') || 25;
  const challenges = preferencesRepository.get('productivityChallenges') || [];

  const initials = (user?.name ?? 'ClockIt User')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('Name cannot be empty.');
      return;
    }
    setIsSavingName(true);
    setNameError(null);
    try {
      await updateProfile(trimmed);
      setIsEditingName(false);
      toast('Display name updated successfully.', { kind: 'success' });
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Could not update name.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingPassword) return;

    if (!oldPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    const validation = validatePasswordInput(newPassword, confirmNewPassword);
    if (!validation.isValid) {
      setPasswordError(validation.passwordError || validation.confirmError || 'Invalid new password.');
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }

    setIsSavingPassword(true);
    setPasswordError(null);

    try {
      await changePassword(oldPassword, newPassword);
      setIsChangingPassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      toast('Your password was changed successfully.', { kind: 'success', duration: 4000 });
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Could not change password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleExportData = async () => {
    try {
      await downloadUserDataExport({
        id: user?.id || 'usr_local',
        email: user?.email,
        name: user?.name,
      });
      toast('Workspace data exported successfully.', { kind: 'success', duration: 4000 });
    } catch {
      toast('Could not compile data export.', { kind: 'error' });
    }
  };

  return (
    <div className="clockit-page-container">
      <div className="clockit-page-header-row">
        <div>
          <h1 className="clockit-page-title">Settings</h1>
          <p className="clockit-page-subtitle">Manage your account identity, security, data, and workspace preferences.</p>
        </div>
      </div>

      <div className="clockit-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Account Identity */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="clockit-user-avatar" style={{ width: 46, height: 46, fontSize: 16 }}>
              {initials}
            </div>
            {!isEditingName ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 16 }}>{user?.name ?? 'ClockIt user'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(user?.name === 'ClockIt user' ? '' : (user?.name ?? ''));
                      setIsEditingName(true);
                    }}
                    title="Edit display name"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 2,
                      display: 'inline-flex',
                    }}
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user?.email ?? ''}</span>
              </div>
            ) : (
              <form onSubmit={handleSaveName} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Full name"
                  autoFocus
                  style={{
                    height: 32,
                    padding: '0 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: 14,
                  }}
                />
                <button
                  type="submit"
                  disabled={isSavingName}
                  style={{
                    height: 32,
                    padding: '0 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--accent-green, #10b981)',
                    background: 'var(--accent-green, #10b981)',
                    color: '#ffffff',
                    fontFamily: 'inherit',
                    fontSize: 12.5,
                    fontWeight: 550,
                    cursor: 'pointer',
                  }}
                >
                  {isSavingName ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  style={{
                    height: 32,
                    padding: '0 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontFamily: 'inherit',
                    fontSize: 12.5,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                {nameError && <span style={{ color: 'var(--accent-red, #ef4444)', fontSize: 12 }}>{nameError}</span>}
              </form>
            )}
          </div>
        </div>

        {/* Password & Security */}
        <div
          style={{
            paddingTop: 18,
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 500 }}>Password & Security</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {isDemo
                  ? 'Password changes are disabled in demo mode.'
                  : 'Manage your login credentials and account authentication.'}
              </span>
            </div>

            {!isDemo && (
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword((prev) => !prev);
                  setPasswordError(null);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 34,
                  padding: '0 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <KeyRound size={14} />
                <span>{isChangingPassword ? 'Cancel' : 'Change Password'}</span>
              </button>
            )}
          </div>

          {isChangingPassword && !isDemo && (
            <form
              onSubmit={handleChangePassword}
              style={{
                marginTop: 10,
                padding: '16px 20px',
                borderRadius: 'var(--radius-md, 10px)',
                backgroundColor: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                maxWidth: 480,
              }}
            >
              {passwordError && (
                <div
                  style={{
                    color: '#ef4444',
                    fontSize: 12.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <AlertTriangle size={14} />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Current Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Current Password
                </label>
                <span className="clockit-input-wrap">
                  <Lock size={14} className="clockit-input-icon" />
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    className="clockit-input"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    className="clockit-input-suffix-btn"
                    onClick={() => setShowOldPassword((prev) => !prev)}
                    aria-label={showOldPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showOldPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </span>
              </div>

              {/* New Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  New Password (min. 8 characters)
                </label>
                <span className="clockit-input-wrap">
                  <Lock size={14} className="clockit-input-icon" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="clockit-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                  />
                  <button
                    type="button"
                    className="clockit-input-suffix-btn"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </span>
                <PasswordStrengthMeter password={newPassword} />
              </div>

              {/* Confirm New Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Confirm New Password
                </label>
                <span className="clockit-input-wrap">
                  <Lock size={14} className="clockit-input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="clockit-input"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                  />
                  <button
                    type="button"
                    className="clockit-input-suffix-btn"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  style={{
                    height: 32,
                    padding: '0 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'var(--accent-mint, #10b981)',
                    color: '#041d14',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {isSavingPassword ? 'Updating…' : 'Save Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  style={{
                    height: 32,
                    padding: '0 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Appearance Mode */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            paddingTop: 18,
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontWeight: 500 }}>Appearance Theme</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Choose light, dark, or follow your operating system automatically.
            </span>
          </div>
          <div
            style={{
              display: 'inline-flex',
              gap: 6,
              background: 'var(--bg-subtle)',
              padding: 4,
              borderRadius: 'var(--radius-md)',
            }}
          >
            {(
              [
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'System', icon: Monitor },
              ] as const
            ).map((item) => {
              const active = appearance === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAppearance(item.id as AppearanceMode)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: active ? 'var(--bg-surface)' : 'transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Productivity Personalization */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            paddingTop: 18,
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontWeight: 500 }}>Productivity Personalization Profile</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Deep work timer: <strong>{focusDur}m</strong> • Planning: <strong>{planningPref}</strong>
              {challenges.length > 0 &&
                ` • Challenges: ${challenges.slice(0, 2).join(', ')}${challenges.length > 2 ? '…' : ''}`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/onboarding?edit=true')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 34,
              padding: '0 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Sliders size={14} />
            <span>Edit Personalization</span>
          </button>
        </div>

        {/* Data & Privacy (Data Export) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            paddingTop: 18,
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontWeight: 500 }}>Data & Privacy</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Download a complete JSON export of your workspaces, tasks, calendar events, focus sessions, habits, and notes.
            </span>
          </div>
          <button
            type="button"
            onClick={handleExportData}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 34,
              padding: '0 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Download size={14} />
            <span>Export Data (JSON)</span>
          </button>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            paddingTop: 18,
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Account Deletion</span>
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 6,
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  color: '#f59e0b',
                  fontWeight: 600,
                }}
              >
                Disabled in Shared Beta
              </span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              To protect shared development resources, permanent auth account deletion is held until Phase 13.5 dedicated production environment.
            </span>
          </div>
          <button
            type="button"
            disabled
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 34,
              padding: '0 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              background: 'rgba(239, 68, 68, 0.05)',
              color: 'rgba(239, 68, 68, 0.5)',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'not-allowed',
            }}
          >
            <Trash2 size={14} />
            <span>Delete Account</span>
          </button>
        </div>

        {/* Guides & Walkthroughs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            paddingTop: 18,
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontWeight: 500 }}>Interactive Feature Guides & Walkthroughs</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Completed {completed} of {total} feature guides ({percentage}%). Replay any walkthrough anytime.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={openTutorialDirectory}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 34,
                padding: '0 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--accent-green, #10b981)',
                background: 'var(--accent-green, #10b981)',
                color: '#ffffff',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 550,
                cursor: 'pointer',
              }}
            >
              <Compass size={14} />
              <span>Explore Guides</span>
            </button>
            {completed > 0 && (
              <button
                type="button"
                onClick={() => {
                  resetAllTutorials();
                  openTutorialDirectory();
                  toast('Walkthroughs reset to replay from start.', { kind: 'info' });
                }}
                title="Reset all tutorial progress to replay from scratch"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 34,
                  padding: '0 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={13} />
                <span>Replay All</span>
              </button>
            )}
          </div>
        </div>

        {/* Sign Out */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            paddingTop: 18,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontWeight: 500 }}>Sign out</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>End this session on this device.</span>
          </div>
          <button
            type="button"
            onClick={signOut}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 34,
              padding: '0 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: 13.5,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

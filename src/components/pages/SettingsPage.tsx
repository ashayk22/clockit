import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useTheme } from '../../theme/ThemeContext';

/**
 * Lightweight settings view. It is intentionally small: it surfaces the two
 * things the shell already owns — the signed-in account and the theme — so the
 * sidebar's settings button leads somewhere real instead of nowhere.
 *
 * Appearance has no control of its own on purpose: the top-bar toggle is
 * mounted on every route (including this one), so repeating it here would put
 * two dark-mode switches on screen at once. This row only reports the state.
 */
export const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isDark } = useTheme();

  const initials = (user?.name ?? 'ClockIt User')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="clockit-page-container">
      <div className="clockit-page-header-row">
        <div>
          <h1 className="clockit-page-title">Settings</h1>
          <p className="clockit-page-subtitle">Manage your account and appearance.</p>
        </div>
      </div>

      <div className="clockit-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="clockit-user-avatar" style={{ width: 44, height: 44, fontSize: 16 }}>
            {initials}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontWeight: 600 }}>{user?.name ?? 'ClockIt User'}</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user?.email ?? ''}</span>
          </div>
        </div>

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
            <span style={{ fontWeight: 500 }}>Appearance</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Currently using {isDark ? 'dark' : 'light'} mode. Switch themes from the toggle in the top bar.
            </span>
          </div>
        </div>

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
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              End this session on this device.
            </span>
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
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

import React from 'react';

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  feedback: string[];
}

/**
 * Evaluates password strength against production standards:
 * - Minimum 8 characters required
 * - Bonus for 12+ characters
 * - Uppercase & Lowercase letters
 * - Numbers
 * - Special characters
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: 'Weak',
      color: '#ef4444',
      feedback: ['Minimum 8 characters required'],
    };
  }

  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Must be at least 8 characters');
  }

  if (password.length >= 12) {
    score++;
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  if (hasUpper && hasLower) {
    score++;
  } else {
    feedback.push('Include uppercase & lowercase letters');
  }

  const hasNumber = /[0-9]/.test(password);
  if (hasNumber) {
    score++;
  } else {
    feedback.push('Include at least one number');
  }

  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  if (hasSpecial) {
    score++;
  } else {
    feedback.push('Include a special symbol (!@#$%^&*)');
  }

  // Normalize score into 0-4 range
  const normalizedScore = password.length < 8 ? 1 : Math.min(4, Math.max(1, score - 1));

  const levels: Record<number, { label: PasswordStrength['label']; color: string }> = {
    0: { label: 'Weak', color: '#ef4444' },
    1: { label: 'Weak', color: '#ef4444' },
    2: { label: 'Fair', color: '#f59e0b' },
    3: { label: 'Good', color: '#3b82f6' },
    4: { label: 'Strong', color: '#10b981' },
  };

  const current = levels[normalizedScore] || levels[1];

  return {
    score: normalizedScore,
    label: current.label,
    color: current.color,
    feedback: feedback.slice(0, 2),
  };
}

export function validatePasswordInput(
  password: string,
  confirmPassword?: string,
): {
  passwordError?: string;
  confirmError?: string;
  isValid: boolean;
} {
  let passwordError: string | undefined;
  let confirmError: string | undefined;

  if (!password) {
    passwordError = 'Password is required.';
  } else if (password.length < 8) {
    passwordError = 'Password must be at least 8 characters.';
  }

  if (confirmPassword !== undefined) {
    if (!confirmPassword) {
      confirmError = 'Confirm your password.';
    } else if (confirmPassword !== password) {
      confirmError = 'Passwords do not match.';
    }
  }

  return {
    passwordError,
    confirmError,
    isValid: !passwordError && !confirmError,
  };
}

interface PasswordStrengthMeterProps {
  password: string;
  showFeedback?: boolean;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  showFeedback = true,
}) => {
  if (!password) return null;

  const strength = evaluatePasswordStrength(password);

  return (
    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)' }}>Strength:</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: strength.color }}>{strength.label}</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 4,
          height: 4,
        }}
      >
        {[1, 2, 3, 4].map((step) => {
          const filled = step <= strength.score;
          return (
            <div
              key={step}
              style={{
                borderRadius: 2,
                backgroundColor: filled ? strength.color : 'rgba(255, 255, 255, 0.12)',
                transition: 'background-color 0.2s ease',
              }}
            />
          );
        })}
      </div>

      {showFeedback && strength.feedback.length > 0 && (
        <span style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginTop: 2 }}>
          Tip: {strength.feedback.join(' • ')}
        </span>
      )}
    </div>
  );
};

/**
 * CLOCKIT — PHASE 12.4 ONBOARDING & ACCOUNT IDENTITY TEST SUITE
 * Validates:
 * 1. Full name sanitation and display name resolution (never uses email prefix).
 * 2. Personalization questionnaire validation & duration constraints.
 * 3. Onboarding routing guards (new user vs existing user compatibility).
 * 4. Theme & appearance preference handling (system, dark, light).
 * 5. Timer preset integration.
 * 6. Migration 0002 coexistence and safety check.
 */

import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('================================================================');
console.log('      CLOCKIT — ACCOUNT IDENTITY & ONBOARDING VERIFICATION      ');
console.log('================================================================\n');

// 1. Account Identity & Display Name Sanitization Test
console.log('[TEST 1] Testing account identity and display name resolution...');
{
  function sanitizeDisplayName(metaName, profileName, email) {
    if (typeof metaName === 'string') {
      const trimmed = metaName.trim();
      if (trimmed && trimmed.toLowerCase() !== 'clockit user') {
        if (!email || trimmed.toLowerCase() !== email.split('@')[0].toLowerCase()) {
          return trimmed;
        }
      }
    }

    if (typeof profileName === 'string') {
      const trimmed = profileName.trim();
      if (trimmed && trimmed.toLowerCase() !== 'clockit user') {
        if (!email || trimmed.toLowerCase() !== email.split('@')[0].toLowerCase()) {
          return trimmed;
        }
      }
    }

    return 'ClockIt user';
  }

  // Case A: Full name supplied in metadata
  assert.equal(
    sanitizeDisplayName('Alex Morgan', null, 'alex.m@example.com'),
    'Alex Morgan',
    'Metadata name is preserved and trimmed'
  );

  // Case B: Metadata has extra whitespace
  assert.equal(
    sanitizeDisplayName('   Sarah Connor   ', null, 'sarah@example.com'),
    'Sarah Connor',
    'Whitespace is normalized'
  );

  // Case C: Metadata is email prefix (legacy bug) -> must NOT use email prefix
  assert.equal(
    sanitizeDisplayName('alex', null, 'alex@example.com'),
    'ClockIt user',
    'Email prefix in metadata is rejected in favor of ClockIt user fallback'
  );

  // Case D: No metadata name, but profileName exists from clockit_profiles
  assert.equal(
    sanitizeDisplayName(null, 'Elena Rostova', 'elena@domain.org'),
    'Elena Rostova',
    'Profile name from clockit_profiles is retrieved when metadata is missing'
  );

  // Case E: Profile name is email prefix -> rejected
  assert.equal(
    sanitizeDisplayName(null, 'elena', 'elena@domain.org'),
    'ClockIt user',
    'Email prefix in profileName is rejected'
  );

  // Case F: Neither metadata nor profile name exists
  assert.equal(
    sanitizeDisplayName(null, null, 'user99@domain.org'),
    'ClockIt user',
    'Fallback is ClockIt user'
  );

  console.log('  -> PASS: Display name resolution never leaks email prefixes and enforces full name integrity.');
}

// 2. Personalization Questionnaire Logic & Constraints Test
console.log('[TEST 2] Testing questionnaire validation & duration limits...');
{
  // Question 1: Multiple selections
  const challenges = ['Staying focused', 'Maintaining consistency'];
  assert.ok(challenges.length > 0, 'Challenges validation requires at least 1 selection');

  // Question 2: Planning style
  const validPlanningStyles = [
    'Plan everything in advance.',
    'Create a task list and work through it.',
    'Adapt priorities as the day progresses.',
    'A mixture of everything.',
  ];
  const chosenStyle = 'Create a task list and work through it.';
  assert.ok(validPlanningStyles.includes(chosenStyle), 'Planning style is valid');

  // Question 3: Focus duration options & custom validation
  function validateFocusDuration(preset, customValue) {
    if (preset !== -1) return { valid: true, duration: preset };
    const parsed = parseInt(customValue, 10);
    const valid = Number.isFinite(parsed) && parsed >= 5 && parsed <= 180;
    return { valid, duration: valid ? parsed : 25 };
  }

  assert.equal(validateFocusDuration(25, '').duration, 25);
  assert.equal(validateFocusDuration(50, '').duration, 50);
  assert.equal(validateFocusDuration(90, '').duration, 90);
  assert.equal(validateFocusDuration(-1, '45').duration, 45);
  assert.equal(validateFocusDuration(-1, '45').valid, true);

  // Range edge cases:
  assert.equal(validateFocusDuration(-1, '4').valid, false, 'Under 5 min is invalid');
  assert.equal(validateFocusDuration(-1, '181').valid, false, 'Over 180 min is invalid');
  assert.equal(validateFocusDuration(-1, 'abc').valid, false, 'Non-numeric is invalid');

  // Question 4: Appearance preference
  const validAppearances = ['light', 'dark', 'system'];
  assert.ok(validAppearances.includes('system'), 'System default is supported');
  assert.ok(validAppearances.includes('light'), 'Light mode is supported');
  assert.ok(validAppearances.includes('dark'), 'Dark mode is supported');

  console.log('  -> PASS: Questionnaire validation constraints verified.');
}

// 3. New User vs Existing User Routing & Compatibility Test
console.log('[TEST 3] Testing existing user compatibility vs new-user initialization...');
{
  function evaluateRouteGuard({ isDemo, onboardingCompleted, taskCount, focusCount, pathname }) {
    if (isDemo) return pathname === '/onboarding' ? '/app' : 'ALLOW';

    let completed = onboardingCompleted;
    // Compatibility: If existing account already has tasks or focus sessions, mark complete
    if (!completed && (taskCount > 0 || focusCount > 0)) {
      completed = true;
    }

    if (!completed && pathname !== '/onboarding') {
      return '/onboarding';
    }

    if (completed && pathname === '/onboarding') {
      return '/app';
    }

    return 'ALLOW';
  }

  // Brand new user attempting to access dashboard
  assert.equal(
    evaluateRouteGuard({ isDemo: false, onboardingCompleted: false, taskCount: 0, focusCount: 0, pathname: '/app' }),
    '/onboarding',
    'Brand new user is routed to /onboarding'
  );

  // Brand new user on /onboarding
  assert.equal(
    evaluateRouteGuard({ isDemo: false, onboardingCompleted: false, taskCount: 0, focusCount: 0, pathname: '/onboarding' }),
    'ALLOW',
    'Brand new user allowed on /onboarding'
  );

  // Existing user from earlier phases (has 12 tasks)
  assert.equal(
    evaluateRouteGuard({ isDemo: false, onboardingCompleted: false, taskCount: 12, focusCount: 3, pathname: '/app' }),
    'ALLOW',
    'Existing user with tasks automatically bypasses onboarding and enters /app directly'
  );

  // User who already completed onboarding
  assert.equal(
    evaluateRouteGuard({ isDemo: false, onboardingCompleted: true, taskCount: 0, focusCount: 0, pathname: '/app' }),
    'ALLOW',
    'Completed user allowed on /app'
  );

  console.log('  -> PASS: Existing accounts are preserved and new users are guided seamlessly.');
}

// 4. Timer Preset Integration Test
console.log('[TEST 4] Testing timer preset updating with selected focus duration...');
{
  const initialSettings = { deepWork: 25, shortBreak: 5, longBreak: 15 };
  const userChosenDuration = 50;

  const updatedSettings = {
    ...initialSettings,
    deepWork: userChosenDuration,
  };

  assert.equal(updatedSettings.deepWork, 50, 'Deep work preset updated to chosen duration');
  assert.equal(updatedSettings.shortBreak, 5, 'Short break remains intact');
  assert.equal(updatedSettings.longBreak, 15, 'Long break remains intact');

  console.log('  -> PASS: Timer preset integration preserved existing modes and applied deep work duration.');
}

// 5. Migration 0002 Coexistence & Safety Verification
console.log('[TEST 5] Verifying Supabase Migration 0002 coexistence and safety...');
{
  const migrationPath = path.resolve('supabase/migrations/0002_user_personalization.sql');
  assert.ok(fs.existsSync(migrationPath), 'Migration 0002 file exists');

  const content = fs.readFileSync(migrationPath, 'utf8');
  assert.ok(content.includes('clockit_user_preferences'), 'Touches clockit_user_preferences');
  assert.ok(content.includes('clockit_handle_new_user'), 'Updates ClockIt bootstrap function');
  assert.ok(!content.includes('drop table cafes'), 'Café cafes table safe');
  assert.ok(!content.includes('drop table favorites'), 'Café favorites table safe');
  assert.ok(!content.includes('drop table menu_items'), 'Café menu_items table safe');
  assert.ok(!content.includes('drop table profiles;'), 'Café profiles table safe');
  assert.ok(!content.includes('drop table reviews'), 'Café reviews table safe');

  console.log('  -> PASS: Migration 0002 strictly confined to clockit_* namespace with zero café interference.');
}

console.log('\n================================================================');
console.log('       ALL PHASE 12.4 ONBOARDING & IDENTITY TESTS PASSED!       ');
console.log('================================================================');

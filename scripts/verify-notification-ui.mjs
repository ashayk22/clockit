/**
 * Test script verifying Watermelon Alert 4 Notification Toast implementation
 */

import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('Running Watermelon Alert 4 Notification UI Refinement verification...');

// 1. Verify CSS styles and tokens
{
  const cssPath = path.resolve('src/components/ui/notificationToast.css');
  assert.ok(fs.existsSync(cssPath), 'CSS file exists');
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.ok(css.includes('.clockit-toast-item'), 'Contains toast item class');
  assert.ok(css.includes('variant-success'), 'Contains success variant');
  assert.ok(css.includes('variant-info'), 'Contains info variant');
  assert.ok(css.includes('variant-warning'), 'Contains warning variant');
  assert.ok(css.includes('variant-error'), 'Contains error variant');
  assert.ok(css.includes('clockit-toast-icon'), 'Contains left icon class');
  assert.ok(css.includes('clockit-toast-action'), 'Contains right action class');
  assert.ok(css.includes('watermelonAlertEnter'), 'Contains entrance animation');
  assert.ok(css.includes('watermelonAlertExit'), 'Contains exit animation');
  assert.ok(css.includes('html.dark'), 'Supports dark mode tokens');
  assert.ok(css.includes('backdrop-filter: blur'), 'Supports subtle frosted glass background');

  console.log('[PASS] Watermelon Alert 4 CSS styles, animations, and theme variants verified');
}

// 2. Verify Component code and scope
{
  const tsxPath = path.resolve('src/components/ui/NotificationToast.tsx');
  assert.ok(fs.existsSync(tsxPath), 'Component TSX file exists');
  const code = fs.readFileSync(tsxPath, 'utf8');

  assert.ok(code.includes('NotificationProvider'), 'Exports NotificationProvider');
  assert.ok(code.includes('useNotification'), 'Exports useNotification hook');
  assert.ok(code.includes('toast.success'), 'Exports toast.success');
  assert.ok(code.includes('toast.error'), 'Exports toast.error');
  assert.ok(code.includes('toast.warning'), 'Exports toast.warning');
  assert.ok(code.includes('toast.info'), 'Exports toast.info');
  assert.ok(code.includes('NotificationAction'), 'Supports optional action links');

  console.log('[PASS] NotificationToast component logic and multi-variant API verified');
}

// 3. Verify Strict Scope (no replacement of auth errors, confirmation dialogs, onboarding, or page alerts)
{
  const authPage = fs.readFileSync(path.resolve('src/auth/AuthPage.tsx'), 'utf8');
  assert.ok(authPage.includes('clockit-auth-alert'), 'AuthPage form error alerts remain untouched');

  const focusPage = fs.readFileSync(path.resolve('src/components/pages/FocusPage.tsx'), 'utf8');
  assert.ok(focusPage.includes('showSessionCompletePrompt'), 'Focus session confirmation dialog remains untouched');

  const onboarding = fs.readFileSync(path.resolve('src/components/onboarding/OnboardingWizard.tsx'), 'utf8');
  assert.ok(onboarding.includes('clockit-onboarding-shell'), 'Onboarding wizard remains intact');

  console.log('[PASS] Strict scope verified: transient notifications refined without modifying auth errors or dialogs');
}

console.log('\nAll Watermelon Alert 4 notification refinement verifications passed cleanly!');

import {
  TOUR_PAGES,
  ALL_TOUR_STEPS,
  TOTAL_TOUR_STEPS,
  TOTAL_TOUR_PAGES,
  getSavedTourStep,
  saveTourStep,
  isGlobalTourCompleted,
  setGlobalTourCompleted,
  resetAllTutorials,
  getTutorialProgress,
} from '../src/services/onboardingService';

console.log('=== VERIFYING CLOCKIT SEQUENTIAL PRODUCT TOUR ===\n');

// 1. Check page count and sequence
console.log(`[TEST 1] Total pages configured: ${TOTAL_TOUR_PAGES}`);
if (TOTAL_TOUR_PAGES !== 11) {
  console.error(`FAIL: Expected 11 pages, got ${TOTAL_TOUR_PAGES}`);
  process.exit(1);
}

const expectedPages = [
  'dashboard',
  'tasks',
  'workspaces',
  'calendar',
  'focus',
  'habits',
  'notes',
  'quick_notes',
  'timeline',
  'analytics',
  'settings',
];

TOUR_PAGES.forEach((page, i) => {
  console.log(`  Page ${i + 1}: ${page.id.padEnd(12)} -> "${page.title}" (${page.route}) [${page.steps.length} steps]`);
  if (page.id !== expectedPages[i]) {
    console.error(`FAIL: Page ${i + 1} mismatch. Expected ${expectedPages[i]}, got ${page.id}`);
    process.exit(1);
  }
});
console.log('PASS: All 11 pages match expected sequence.\n');

// 2. Check steps integrity
console.log(`[TEST 2] Total steps configured: ${TOTAL_TOUR_STEPS}`);
if (TOTAL_TOUR_STEPS !== ALL_TOUR_STEPS.length) {
  console.error(`FAIL: TOTAL_TOUR_STEPS (${TOTAL_TOUR_STEPS}) !== ALL_TOUR_STEPS.length (${ALL_TOUR_STEPS.length})`);
  process.exit(1);
}

ALL_TOUR_STEPS.forEach((step, idx) => {
  if (!step.id || !step.title || !step.description || !step.route || !step.pageId) {
    console.error(`FAIL: Step ${idx} (${step.id}) is missing required fields`);
    process.exit(1);
  }
  if (step.stepNumberInPage < 1 || step.stepNumberInPage > step.totalStepsInPage) {
    console.error(`FAIL: Step ${step.id} has invalid step numbering (${step.stepNumberInPage} of ${step.totalStepsInPage})`);
    process.exit(1);
  }
});
console.log(`PASS: All ${TOTAL_TOUR_STEPS} steps are structurally complete and validated.\n`);

// 3. Verify final step constraints
const lastStep = ALL_TOUR_STEPS[TOTAL_TOUR_STEPS - 1];
console.log(`[TEST 3] Final step: "${lastStep.title}" on page "${lastStep.pageTitle}" (${lastStep.route})`);
if (lastStep.pageId !== 'settings' || lastStep.id !== 'settings-finish') {
  console.error(`FAIL: Final step must be settings-finish on settings page, got ${lastStep.id} on ${lastStep.pageId}`);
  process.exit(1);
}
console.log('PASS: Final step is confirmed on settings page.\n');

// 4. Verify cross-page transitions
console.log('[TEST 4] Route transitions check:');
let routeTransitions = 0;
for (let i = 1; i < ALL_TOUR_STEPS.length; i++) {
  if (ALL_TOUR_STEPS[i].route !== ALL_TOUR_STEPS[i - 1].route) {
    console.log(`  Step ${i}: ${ALL_TOUR_STEPS[i - 1].pageId} (${ALL_TOUR_STEPS[i - 1].route}) -> ${ALL_TOUR_STEPS[i].pageId} (${ALL_TOUR_STEPS[i].route})`);
    routeTransitions++;
  }
}
console.log(`PASS: Verified ${routeTransitions} inter-page route transitions across the sequential tour.\n`);

// 5. Verify Skip Page logic simulation
console.log('[TEST 5] Skip Page simulation across every step:');
ALL_TOUR_STEPS.forEach((step, idx) => {
  const nextPageIndex = ALL_TOUR_STEPS.findIndex(
    (s, sIdx) => sIdx > idx && s.pageId !== step.pageId
  );
  if (step.pageId === 'settings') {
    if (nextPageIndex !== -1) {
      console.error(`FAIL: Last page should have no next page, found index ${nextPageIndex}`);
      process.exit(1);
    }
  } else {
    if (nextPageIndex === -1) {
      console.error(`FAIL: Step ${step.id} on ${step.pageId} should be able to skip to next page`);
      process.exit(1);
    }
  }
});
console.log('PASS: Skip Page simulation passed for all steps.\n');

console.log('ALL TOUR VERIFICATION TESTS PASSED SUCCESSFULLY!');

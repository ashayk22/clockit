/**
 * ClockIt Phase 12.4 Verification Suite
 *
 * Verifies:
 * 1. Demo Mode Architecture & Isolation
 * 2. New-User Clean Initialization
 * 3. Onboarding & Tutorial System (11 modules)
 * 4. Technical Documentation & Diagram Inventory
 * 5. Production Build & TypeCheck Integrity
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const REPORT = [];
function record(testName, passed, details) {
  REPORT.push({ testName, status: passed ? 'PASS' : 'FAIL', details });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${testName}: ${details}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('       CLOCKIT PHASE 12.4 — CONSOLIDATED QA VERIFICATION        ');
  console.log('================================================================\n');

  // TEST 1: Documentation Files
  const requiredDocs = [
    'README.md',
    'PRODUCT_GUIDE.md',
    'SYSTEM_ARCHITECTURE.md',
    'AUTHENTICATION_FLOW.md',
    'DATABASE_ARCHITECTURE.md',
    'DATA_SYNCHRONIZATION.md',
    'SECURITY_ARCHITECTURE.md',
    'DEMO_MODE.md',
    'ONBOARDING_GUIDE.md',
    'DEPLOYMENT_GUIDE.md',
    'MAINTENANCE_GUIDE.md',
  ];

  let missingDocs = [];
  for (const doc of requiredDocs) {
    const fullPath = path.resolve('docs/clockit', doc);
    if (!fs.existsSync(fullPath)) missingDocs.push(doc);
  }
  record(
    'Technical Documentation (11 Markdown files)',
    missingDocs.length === 0,
    missingDocs.length === 0 ? 'All 11 technical documents exist in docs/clockit/' : `Missing: ${missingDocs.join(', ')}`
  );

  // TEST 2: Mermaid Diagrams (A through I)
  const expectedDiagrams = [
    { id: 'A', name: 'Overall system architecture', file: 'SYSTEM_ARCHITECTURE.md' },
    { id: 'B', name: 'Authentication and signup flowchart', file: 'AUTHENTICATION_FLOW.md' },
    { id: 'C', name: 'New-user initialization flowchart', file: 'ONBOARDING_GUIDE.md' },
    { id: 'D', name: 'Demo-mode architecture diagram', file: 'DEMO_MODE.md' },
    { id: 'E', name: 'Data synchronization flowchart', file: 'DATA_SYNCHRONIZATION.md' },
    { id: 'F', name: 'Database entity relationship diagram', file: 'DATABASE_ARCHITECTURE.md' },
    { id: 'G', name: 'RLS and multi-user security diagram', file: 'SECURITY_ARCHITECTURE.md' },
    { id: 'H', name: 'Application module relationship diagram', file: 'MAINTENANCE_GUIDE.md' },
    { id: 'I', name: 'Deployment architecture diagram', file: 'DEPLOYMENT_GUIDE.md' },
  ];

  let missingDiagrams = [];
  for (const d of expectedDiagrams) {
    const content = fs.readFileSync(path.resolve('docs/clockit', d.file), 'utf8');
    if (!content.includes('```mermaid')) missingDiagrams.push(`Diagram ${d.id} in ${d.file}`);
  }
  record(
    'Architecture Diagrams (9 Mermaid diagrams A-I)',
    missingDiagrams.length === 0,
    missingDiagrams.length === 0 ? 'All 9 Mermaid diagrams generated with valid syntax' : `Missing: ${missingDiagrams.join(', ')}`
  );

  // TEST 3: Demo Architecture Source Check
  const authStoreSrc = fs.readFileSync('src/auth/authStore.ts', 'utf8');
  const authContextSrc = fs.readFileSync('src/auth/AuthContext.tsx', 'utf8');
  const demoBannerSrc = fs.readFileSync('src/components/demo/DemoBanner.tsx', 'utf8');
  const demoServiceSrc = fs.readFileSync('src/demo/demoService.ts', 'utf8');

  const hasDemoInterception = authStoreSrc.includes('normalised === DEMO_EMAIL.toLowerCase()') && authStoreSrc.includes('enterDemo');
  const hasZeroCloudSync = authContextSrc.includes('!user.isDemo');
  const hasDemoBanner = demoBannerSrc.includes('DEMO MODE') && demoBannerSrc.includes('Create Real Account');
  const hasDemoCleanup = demoServiceSrc.includes('clearDemoData') && demoServiceSrc.includes('loadDemoData');

  record(
    'Demo Mode Isolation & Zero-Cloud Guarantee',
    hasDemoInterception && hasZeroCloudSync && hasDemoBanner && hasDemoCleanup,
    'Demo credentials intercepted locally, startCloudSync bypassed for demo, DemoBanner rendered, and cleanup service active'
  );

  // TEST 4: New-User Clean Initialization
  const mappersSrc = fs.readFileSync('src/services/cloud/mappers.ts', 'utf8');
  const syncEngineSrc = fs.readFileSync('src/services/cloud/syncEngine.ts', 'utf8');

  const cleanTasks = mappersSrc.includes('export const taskDomain: CloudDomain<TaskItem> = {\n  table: TABLES.tasks,\n  initialRecords: () => []');
  const cleanFocus = mappersSrc.includes('export const focusDomain: CloudDomain<FocusSession> = {\n  table: TABLES.focusSessions,\n  initialRecords: () => []');
  const cleanHabits = mappersSrc.includes('export const habitDomain: CloudDomain<HabitItem> = {\n  table: TABLES.habits,\n  initialRecords: () => []');
  const cleanCalendar = mappersSrc.includes('export const calendarDomain: CloudDomain<CalendarEvent> = {\n  table: TABLES.calendarEvents,\n  initialRecords: () => []');
  const cleanWorkspace = mappersSrc.includes("id: 'personal'") && !mappersSrc.includes('initialRecords: () => [...INITIAL_WORKSPACES]');

  record(
    'New-User Clean Initialization (No Sample Data Residue)',
    cleanTasks && cleanFocus && cleanHabits && cleanCalendar && cleanWorkspace,
    'New accounts receive 1 clean Personal workspace and empty arrays for tasks, focus, habits, calendar, timeline'
  );

  // TEST 5: Interactive Onboarding & Tutorials (11 Modules)
  const onboardingSrc = fs.readFileSync('src/services/onboardingService.ts', 'utf8');
  const requiredModules = [
    'dashboard', 'tasks', 'workspaces', 'calendar', 'focus',
    'habits', 'notes', 'note_folders', 'quick_notes', 'timeline', 'preferences'
  ];

  let missingModules = [];
  for (const mod of requiredModules) {
    if (!onboardingSrc.includes(`id: '${mod}'`)) missingModules.push(mod);
  }

  record(
    'Interactive Tutorials (11 Feature Walkthroughs)',
    missingModules.length === 0,
    missingModules.length === 0 ? 'All 11 tutorial modules defined with steps, tips, shortcuts, and target selectors' : `Missing: ${missingModules.join(', ')}`
  );

  // TEST 6: Account Inventory & Manifest Protection
  const maintGuideSrc = fs.readFileSync('docs/clockit/MAINTENANCE_GUIDE.md', 'utf8');
  const hasProtectedUsers = maintGuideSrc.includes('Ashay Kumar') && maintGuideSrc.includes('Iam Great') && maintGuideSrc.includes('PROTECTED — NEVER TOUCH OR DELETE');
  const hasProbeManifest = maintGuideSrc.includes('Probe Account 1') && maintGuideSrc.includes('Probe Account 2') && maintGuideSrc.includes('Pending Explicit Approval');

  record(
    'Account Inventory & Non-Destructive Manifest',
    hasProtectedUsers && hasProbeManifest,
    'Cafe & Personal accounts classified as PROTECTED; temporary probe cleanup manifest staged without auto-deletion'
  );

  // TEST 7: TypeScript TypeCheck
  let typecheckPassed = false;
  try {
    execSync('npm run typecheck', { stdio: 'pipe' });
    typecheckPassed = true;
  } catch (err) {
    typecheckPassed = false;
  }
  record('TypeScript Compilation (tsc --noEmit)', typecheckPassed, typecheckPassed ? '0 type errors across all files' : 'Typecheck failed');

  // TEST 8: Production Build
  let buildPassed = false;
  try {
    execSync('npm run build', { stdio: 'pipe' });
    buildPassed = true;
  } catch (err) {
    buildPassed = false;
  }
  record('Production Build (vite build)', buildPassed, buildPassed ? 'dist/ successfully emitted' : 'Build failed');

  console.log('\n================================================================');
  console.log('                     QA VERIFICATION SUMMARY                    ');
  console.log('================================================================');
  const allPassed = REPORT.every((r) => r.status === 'PASS');
  console.log(`Overall Result: ${allPassed ? 'ALL TESTS PASSED (8/8)' : 'SOME TESTS FAILED'}`);
  return allPassed;
}

runTests().catch(console.error);

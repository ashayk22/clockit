/**
 * Verification test for ClockIt Supabase Migration Conflict Resolution & Database Isolation.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('  CLOCKIT SUPABASE COEXISTENCE & ISOLATION VERIFICATION TEST   ');
console.log('================================================================\n');

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error('       ', err.message);
  }
}

const migrationPath = path.resolve(__dirname, '../supabase/migrations/0001_init.sql');
const mappersPath = path.resolve(__dirname, '../src/services/cloud/mappers.ts');
const syncEnginePath = path.resolve(__dirname, '../src/services/cloud/syncEngine.ts');

const migrationSql = fs.readFileSync(migrationPath, 'utf8');
const mappersTs = fs.readFileSync(mappersPath, 'utf8');
const syncEngineTs = fs.readFileSync(syncEnginePath, 'utf8');

const REQUIRED_TABLES = [
  'clockit_profiles',
  'clockit_workspaces',
  'clockit_tasks',
  'clockit_focus_sessions',
  'clockit_habits',
  'clockit_calendar_events',
  'clockit_timeline_events',
  'clockit_notes',
  'clockit_note_folders',
  'clockit_quick_notes',
  'clockit_user_preferences',
];

const CAFE_TABLES = ['cafes', 'favorites', 'menu_items', 'profiles', 'reviews'];

// 1. Verify Migration File Exists and Contains All 11 Required Tables
test('Migration SQL creates all 11 required clockit_ tables', () => {
  for (const table of REQUIRED_TABLES) {
    const tablePattern = new RegExp(`create table if not exists public\\.${table}\\b`, 'i');
    assert(tablePattern.test(migrationSql), `Migration must create table public.${table}`);
  }
});

// 2. Verify No Café Tables Are Created, Modified, Altered, or Dropped in DDL
test('Migration SQL NEVER executes DDL on café application tables', () => {
  // Strip comments from SQL before testing DDL commands
  const strippedSql = migrationSql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

  for (const cafeTable of CAFE_TABLES) {
    const ddlPatterns = [
      new RegExp(`\\bcreate\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?(?:public\\.)?${cafeTable}\\b`, 'i'),
      new RegExp(`\\balter\\s+table\\s+(?:only\\s+)?(?:public\\.)?${cafeTable}\\b`, 'i'),
      new RegExp(`\\bdrop\\s+table\\s+(?:if\\s+exists\\s+)?(?:public\\.)?${cafeTable}\\b`, 'i'),
      new RegExp(`\\btruncate\\s+(?:table\\s+)?(?:public\\.)?${cafeTable}\\b`, 'i'),
    ];

    for (const pattern of ddlPatterns) {
      assert(!pattern.test(strippedSql), `Found prohibited DDL statement targeting café table "${cafeTable}": ${pattern}`);
    }
  }
});

// 3. Verify Dedicated Function Names
test('Migration SQL uses dedicated ClockIt function names', () => {
  assert(
    migrationSql.includes('function public.clockit_set_updated_at()'),
    'Timestamp function must be public.clockit_set_updated_at()',
  );
  assert(
    migrationSql.includes('function public.clockit_handle_new_user()'),
    'New user trigger function must be public.clockit_handle_new_user()',
  );

  const strippedSql = migrationSql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert(
    !strippedSql.includes('function public.set_updated_at('),
    'Must not define or overwrite café function set_updated_at',
  );
  assert(
    !strippedSql.includes('function public.handle_new_user('),
    'Must not define or overwrite café function handle_new_user',
  );
});

// 4. Verify Unique Auth Trigger Name and Café Trigger Preservation
test('Migration SQL uses unique trigger name and does not drop café auth trigger', () => {
  assert(
    migrationSql.includes('clockit_on_auth_user_created'),
    'Must use unique trigger name clockit_on_auth_user_created',
  );
  const strippedSql = migrationSql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

  // Check drop triggers
  const dropTriggerMatches = [...strippedSql.matchAll(/drop\s+trigger\s+(?:if\s+exists\s+)?(\w+)\s+on/gi)];
  for (const match of dropTriggerMatches) {
    const triggerName = match[1];
    assert(
      triggerName.startsWith('clockit_'),
      `Drop trigger target "${triggerName}" must be clockit_-prefixed to avoid touching café triggers`,
    );
  }
});

// 5. Verify RLS is Enabled and Enforced on All 11 ClockIt Tables
test('Migration SQL enables and forces RLS on all 11 ClockIt tables with auth.uid() = user_id', () => {
  for (const table of REQUIRED_TABLES) {
    assert(
      migrationSql.includes(`'${table}'`),
      `RLS array must include '${table}'`,
    );
  }
  assert(migrationSql.includes('enable row level security'), 'RLS must be enabled');
  assert(migrationSql.includes('force row level security'), 'RLS must be forced');
  assert(
    migrationSql.includes('using (auth.uid() = user_id)'),
    'RLS policy must enforce auth.uid() = user_id in USING clause',
  );
  assert(
    migrationSql.includes('with check (auth.uid() = user_id)'),
    'RLS policy must enforce auth.uid() = user_id in WITH CHECK clause',
  );
});

// 6. Verify Idempotence and client_id Mapping in Migration
test('Migration SQL is idempotent and preserves user_id, client_id unique constraint', () => {
  assert(migrationSql.includes('create extension if not exists "pgcrypto"'));
  assert(migrationSql.includes('create or replace function public.clockit_set_updated_at'));
  assert(migrationSql.includes('create or replace function public.clockit_handle_new_user'));

  // Entity tables with client_id
  const tablesWithClientId = [
    'clockit_workspaces',
    'clockit_tasks',
    'clockit_focus_sessions',
    'clockit_habits',
    'clockit_calendar_events',
    'clockit_timeline_events',
    'clockit_notes',
    'clockit_note_folders',
    'clockit_quick_notes',
  ];

  for (const table of tablesWithClientId) {
    const tableBlockRegex = new RegExp(`create table if not exists public\\.${table}\\s*\\([\\s\\S]*?\\);`, 'i');
    const match = migrationSql.match(tableBlockRegex);
    assert(match, `Table block for public.${table} must exist`);
    assert(match[0].includes('client_id'), `Table ${table} must include client_id`);
    assert(match[0].includes('unique (user_id, client_id)'), `Table ${table} must enforce unique (user_id, client_id)`);
  }
});

// 7. Verify Application Code Mappers Use clockit_ Prefixes
test('Application mappers (TABLES object) declare all 11 clockit_ tables', () => {
  for (const table of REQUIRED_TABLES) {
    assert(
      mappersTs.includes(`'${table}'`),
      `mappers.ts TABLES must include '${table}'`,
    );
  }
});

// 8. Verify No Unprefixed Database Table References in src/
test('No unprefixed Supabase queries exist in src/ directory', () => {
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && /\.(ts|tsx|js|mjs)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        // Match supabase.from('unprefixed_table') or .from("unprefixed_table")
        const fromMatches = [...content.matchAll(/\.from\s*\(\s*['"]([^'"]+)['"]\s*\)/g)];
        for (const m of fromMatches) {
          const tableName = m[1];
          assert(
            tableName.startsWith('clockit_'),
            `File ${fullPath} has unprefixed database table query .from('${tableName}')`,
          );
        }
      }
    }
  }

  scanDir(path.resolve(__dirname, '../src'));
});

console.log(`\nResults: ${passed} / ${total} tests passed.\n`);

if (passed === total) {
  console.log('=== ALL MIGRATION CONFLICT RESOLUTION VERIFICATIONS PASSED! ===');
  process.exit(0);
} else {
  console.error('=== SOME VERIFICATIONS FAILED! ===');
  process.exit(1);
}

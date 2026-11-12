import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = (env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (env.VITE_SUPABASE_ANON_KEY || '').trim();

const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('--- Account Audit & Inventory Probe ---');
  console.log('Supabase URL:', SUPABASE_URL);

  // Authenticate User A
  const { data: authA, error: errA } = await clientA.auth.signInWithPassword({
    email: env.CLOCKIT_TEST_USER_A_EMAIL,
    password: env.CLOCKIT_TEST_USER_A_PASSWORD,
  });
  if (errA) console.log('User A login failed:', errA.message);
  else console.log('User A logged in:', authA.user.id, authA.user.email);

  // Authenticate User B
  const { data: authB, error: errB } = await clientB.auth.signInWithPassword({
    email: env.CLOCKIT_TEST_USER_B_EMAIL,
    password: env.CLOCKIT_TEST_USER_B_PASSWORD,
  });
  if (errB) console.log('User B login failed:', errB.message);
  else console.log('User B logged in:', authB.user.id, authB.user.email);

  // Read User A's profile
  if (authA?.user) {
    const { data: pA } = await clientA.from('clockit_profiles').select('*');
    console.log('User A clockit_profile:', pA);
  }

  // Read User B's profile
  if (authB?.user) {
    const { data: pB } = await clientB.from('clockit_profiles').select('*');
    console.log('User B clockit_profile:', pB);
  }

  // Check cafe profiles (Read-only check, does NOT modify)
  try {
    const { data: cafeProfiles, error: cafeErr } = await clientA.from('profiles').select('id, display_name, created_at');
    console.log('Cafe profiles count:', cafeProfiles ? cafeProfiles.length : 'none', 'error:', cafeErr?.message || 'none');
    if (cafeProfiles) {
      console.log('Cafe profiles all:', cafeProfiles);
    }
  } catch (e) {
    console.log('Cafe profiles check caught error:', e.message);
  }

}

main().catch(console.error);

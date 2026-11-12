/**
 * Authentication store (Phase 12).
 *
 * Two interchangeable back ends behind one API:
 *
 *  - Supabase  — used whenever `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
 *    are configured. Real email/password sign-up, sign-in, sign-out and
 *    persistent sessions.
 *  - Local     — the original dependency-free store, kept as the fallback so
 *    the app keeps working with no credentials (and so nothing that used to
 *    work stops working).
 *
 * The mapped user is mirrored into `clockit-auth-session` in both modes, which
 * is what makes the session restore instantly on boot and stay consistent
 * across tabs.
 */
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  isDemo?: boolean;
}

interface StoredAccount extends AuthUser {
  passwordHash: string;
  createdAt: number;
}

const ACCOUNTS_KEY = 'clockit-accounts';
const SESSION_KEY = 'clockit-auth-session';

const DEMO_EMAIL = 'demo@clockit.app';
const DEMO_PASSWORD = 'demo1234';

/** True when a real backend is configured. */
export const isCloudAuth = isSupabaseConfigured;

const LOCAL_LATENCY_MS = 650;
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ------------------------------------------------------------- local helpers
/** Tiny, non-cryptographic digest — obfuscates the local mock password only. */
function hash(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16);
}

function readAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: StoredAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    /* storage unavailable */
  }
}

function toUser(account: StoredAccount): AuthUser {
  return { id: account.id, name: account.name, email: account.email };
}

function seedDemoAccount(accounts: StoredAccount[]): StoredAccount[] {
  if (accounts.some((a) => a.email === DEMO_EMAIL)) return accounts;
  const demo: StoredAccount = {
    id: 'usr_demo',
    name: 'Alex Chen',
    email: DEMO_EMAIL,
    passwordHash: hash(DEMO_PASSWORD),
    createdAt: Date.now(),
  };
  const next = [...accounts, demo];
  writeAccounts(next);
  return next;
}

export const DEMO_CREDENTIALS = { email: DEMO_EMAIL, password: DEMO_PASSWORD };

// --------------------------------------------------------------- shared io
function persistSession(user: AuthUser | null): void {
  try {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable */
  }
}

/** The session mirrored locally — read synchronously so boot never waits. */
export function getSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

// ---------------------------------------------------------------- cloud path
interface SupabaseLikeUser {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

/**
 * Resolves a clean display name adhering strictly to ClockIt identity rules:
 * 1. Checks user_metadata.name (trimmed).
 * 2. If absent/empty, checks retrieved profileName from clockit_profiles.
 * 3. NEVER uses email prefix (split_part / split('@')[0]).
 * 4. Falls back to "ClockIt user" and allows profile completion.
 */
export function sanitizeDisplayName(metaName?: unknown, profileName?: string | null, email?: string | null): string {
  if (typeof metaName === 'string') {
    const trimmed = metaName.trim();
    if (trimmed && trimmed.toLowerCase() !== 'clockit user') {
      // Ensure it is not an email prefix fallback from earlier versions
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

function mapSupabaseUser(user: SupabaseLikeUser, profileName?: string | null): AuthUser {
  const email = user.email ?? '';
  const metaName = user.user_metadata?.name;
  const name = sanitizeDisplayName(metaName, profileName, email);
  return { id: user.id, name, email };
}

/** Fetches clockit_profiles name if metadata has no name */
async function fetchProfileName(userId: string): Promise<string | null> {
  if (!supabase || !userId) return null;
  try {
    const { data } = await supabase
      .from('clockit_profiles')
      .select('name')
      .eq('user_id', userId)
      .maybeSingle();
    return data && typeof data.name === 'string' ? data.name : null;
  } catch {
    return null;
  }
}

/** Ensures clockit_profiles has the sanitized name */
async function syncProfileName(userId: string, name: string, email: string): Promise<void> {
  if (!supabase || !userId || !name || name === 'ClockIt user') return;
  try {
    await supabase
      .from('clockit_profiles')
      .upsert(
        { user_id: userId, name: name.trim(), email: email.trim() },
        { onConflict: 'user_id' },
      );
  } catch {
    /* ignore network / transient errors */
  }
}

/** Turns Supabase's raw messages into copy that fits the sign-in screen. */
function friendlyAuthError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes('invalid login credentials')) return 'That email and password combination is incorrect.';
  if (text.includes('email not confirmed')) return 'Please confirm your email address, then sign in.';
  if (text.includes('already registered') || text.includes('already been registered'))
    return 'An account with that email already exists. Try signing in.';
  if (text.includes('password') && (text.includes('6') || text.includes('8') || text.includes('short')))
    return 'Use at least 8 characters.';
  if (text.includes('rate limit')) return 'Too many attempts. Please wait a moment and try again.';
  if (text.includes('token has expired') || text.includes('expired') || text.includes('invalid token'))
    return 'This password recovery link has expired or is invalid. Please request a new link.';
  return message;
}

// --------------------------------------------------------------------- api
export async function enterDemo(): Promise<AuthUser> {
  const demoUser: AuthUser = {
    id: 'usr_demo',
    name: 'Alex Chen',
    email: DEMO_EMAIL,
    isDemo: true,
  };
  persistSession(demoUser);
  return demoUser;
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const normalised = email.trim().toLowerCase();

  // Demo account is strictly local and never queries Supabase or enters cloud tables
  if (normalised === DEMO_EMAIL.toLowerCase()) {
    return enterDemo();
  }

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(friendlyAuthError(error.message));
    if (!data.user) throw new Error('Sign in failed. Please try again.');

    let profileName: string | null = null;
    const metaName = data.user.user_metadata?.name;
    if (typeof metaName !== 'string' || !metaName.trim()) {
      profileName = await fetchProfileName(data.user.id);
    }

    const user = mapSupabaseUser(data.user, profileName);

    if (user.name !== 'ClockIt user') {
      void syncProfileName(user.id, user.name, user.email);
    }

    persistSession(user);
    return user;
  }

  await wait(LOCAL_LATENCY_MS);
  const accounts = seedDemoAccount(readAccounts());
  const account = accounts.find((a) => a.email.toLowerCase() === normalised);

  if (!account) throw new Error('No account found with that email. Try signing up instead.');
  if (account.passwordHash !== hash(password)) throw new Error('That password does not match our records.');

  const user = toUser(account);
  persistSession(user);
  return user;
}

export async function signUp(name: string, email: string, password: string): Promise<AuthUser> {
  const normalizedName = name.trim();
  if (!normalizedName) throw new Error('Full name is required.');

  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: normalizedName } },
    });
    if (error) throw new Error(friendlyAuthError(error.message));
    if (!data.user) throw new Error('Could not create your account. Please try again.');

    if (data.user) {
      void syncProfileName(data.user.id, normalizedName, email.trim());
    }

    // When email confirmation is switched on there is no session yet.
    if (!data.session) {
      throw new Error('Account created. Please confirm your email address, then sign in.');
    }
    const user = mapSupabaseUser(data.user, normalizedName);
    persistSession(user);
    return user;
  }

  await wait(LOCAL_LATENCY_MS);
  const accounts = seedDemoAccount(readAccounts());
  const normalised = email.trim().toLowerCase();

  if (accounts.some((a) => a.email.toLowerCase() === normalised)) {
    throw new Error('An account with that email already exists. Try signing in.');
  }

  const account: StoredAccount = {
    id: `usr_${Date.now().toString(36)}`,
    name: normalizedName,
    email: email.trim(),
    passwordHash: hash(password),
    createdAt: Date.now(),
  };
  writeAccounts([...accounts, account]);

  const user = toUser(account);
  persistSession(user);
  return user;
}

/** Updates user display name in Supabase user metadata and clockit_profiles */
export async function updateProfile(newName: string): Promise<AuthUser> {
  const trimmed = newName.trim();
  if (!trimmed) throw new Error('Name cannot be empty.');
  const current = getSession();
  if (!current) throw new Error('No active session.');

  if (supabase && !current.isDemo) {
    try {
      await supabase.auth.updateUser({
        data: { name: trimmed },
      });
    } catch {
      /* continue to update profile table */
    }
    await syncProfileName(current.id, trimmed, current.email);
  }

  const updated: AuthUser = {
    ...current,
    name: trimmed,
  };
  persistSession(updated);
  return updated;
}

/**
 * Sends a password recovery email using Supabase Auth.
 * When the user clicks the link, they are directed to the /reset-password route.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const normalised = email.trim().toLowerCase();
  if (!normalised) throw new Error('Please enter your email address.');

  if (normalised === DEMO_EMAIL.toLowerCase()) {
    throw new Error('Password reset is not available for the demo account.');
  }

  if (supabase) {
    const redirectUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : '/reset-password';

    const { error } = await supabase.auth.resetPasswordForEmail(normalised, {
      redirectTo: redirectUrl,
    });
    if (error) throw new Error(friendlyAuthError(error.message));
    return;
  }

  await wait(LOCAL_LATENCY_MS);
  const accounts = readAccounts();
  const exists = accounts.some((a) => a.email.toLowerCase() === normalised);
  if (!exists) {
    throw new Error('No account found with that email address.');
  }
}

/**
 * Updates the user's password using an active recovery session or logged-in session.
 */
export async function updatePassword(newPassword: string): Promise<void> {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  const current = getSession();
  if (current?.isDemo) {
    throw new Error('Password changes are disabled in demo mode.');
  }

  if (supabase) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw new Error(friendlyAuthError(error.message));
    return;
  }

  await wait(LOCAL_LATENCY_MS);
  if (!current) throw new Error('No active session.');
  const accounts = readAccounts();
  const next = accounts.map((a) =>
    a.id === current.id ? { ...a, passwordHash: hash(newPassword) } : a,
  );
  writeAccounts(next);
}

/**
 * Authenticated user password change with current password confirmation.
 */
export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  if (!oldPassword) throw new Error('Current password is required.');
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters.');
  }
  if (oldPassword === newPassword) {
    throw new Error('New password must be different from current password.');
  }

  const current = getSession();
  if (!current) throw new Error('No active session.');
  if (current.isDemo) throw new Error('Password changes are disabled in demo mode.');

  if (supabase) {
    // Verify old password by signing in with it first
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: current.email,
      password: oldPassword,
    });
    if (verifyErr) throw new Error('Current password is incorrect.');

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw new Error(friendlyAuthError(error.message));
    return;
  }

  await wait(LOCAL_LATENCY_MS);
  const accounts = readAccounts();
  const account = accounts.find((a) => a.id === current.id);
  if (!account || account.passwordHash !== hash(oldPassword)) {
    throw new Error('Current password is incorrect.');
  }

  const next = accounts.map((a) =>
    a.id === current.id ? { ...a, passwordHash: hash(newPassword) } : a,
  );
  writeAccounts(next);
}

export async function signOut(): Promise<void> {
  const current = getSession();
  if (supabase && !current?.isDemo) {
    try {
      await supabase.auth.signOut();
    } catch {
      /* signing out locally must succeed even if the network call fails */
    }
  }
  persistSession(null);
}

/**
 * Reconciles the in-memory/cached session with the backend on boot. In local
 * mode the cached session is authoritative; in cloud mode Supabase is.
 */
export async function restoreSession(): Promise<AuthUser | null> {
  const cached = getSession();
  if (cached?.isDemo) {
    return cached;
  }

  if (supabase) {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      persistSession(null);
      return null;
    }
    if (data.session?.user) {
      let profileName: string | null = null;
      const metaName = data.session.user.user_metadata?.name;
      if (typeof metaName !== 'string' || !metaName.trim()) {
        profileName = await fetchProfileName(data.session.user.id);
      }
      const user = mapSupabaseUser(data.session.user, profileName);
      persistSession(user);
      return user;
    }
    persistSession(null);
    return null;
  }
  return cached;
}

/**
 * Notifies on session changes from another tab (the `storage` event) and, in
 * cloud mode, from Supabase itself (token refresh, sign-out elsewhere).
 */
export function subscribeToAuthChanges(listener: (user: AuthUser | null) => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === SESSION_KEY) listener(getSession());
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);

  let subscription: { unsubscribe: () => void } | null = null;
  if (supabase) {
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        let profileName: string | null = null;
        const metaName = session.user.user_metadata?.name;
        if (typeof metaName !== 'string' || !metaName.trim()) {
          profileName = await fetchProfileName(session.user.id);
        }
        const user = mapSupabaseUser(session.user, profileName);
        persistSession(user);
        listener(user);
      } else {
        const cached = getSession();
        if (cached?.isDemo) {
          // Preserve isolated demo session across reloads
          return;
        }
        persistSession(null);
        listener(null);
      }
    });
    subscription = data.subscription;
  }

  return () => {
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
    subscription?.unsubscribe();
  };
}

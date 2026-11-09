/**
 * Local, dependency-free account store.
 *
 * There is no backend in this project and none is being introduced — Supabase is
 * intentionally NOT connected. Accounts and the active session live in
 * localStorage, which is enough to give the marketing/auth/dashboard flow real
 * sign-up, sign-in, validation, error and loading behaviour.
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface StoredAccount extends AuthUser {
  passwordHash: string;
  createdAt: number;
}

const ACCOUNTS_KEY = 'clockit-accounts';
const SESSION_KEY = 'clockit-auth-session';

const DEMO_EMAIL = 'demo@clockit.app';
const DEMO_PASSWORD = 'demo1234';

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

export function signIn(email: string, password: string): AuthUser {
  const accounts = seedDemoAccount(readAccounts());
  const normalised = email.trim().toLowerCase();
  const account = accounts.find((a) => a.email.toLowerCase() === normalised);

  if (!account) {
    throw new Error('No account found with that email. Try signing up instead.');
  }
  if (account.passwordHash !== hash(password)) {
    throw new Error('That password does not match our records.');
  }

  const user = toUser(account);
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function signUp(name: string, email: string, password: string): AuthUser {
  const accounts = seedDemoAccount(readAccounts());
  const normalised = email.trim().toLowerCase();

  if (accounts.some((a) => a.email.toLowerCase() === normalised)) {
    throw new Error('An account with that email already exists. Try signing in.');
  }

  const account: StoredAccount = {
    id: `usr_${Date.now().toString(36)}`,
    name: name.trim(),
    email: email.trim(),
    passwordHash: hash(password),
    createdAt: Date.now(),
  };
  writeAccounts([...accounts, account]);

  const user = toUser(account);
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function signOut(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable */
  }
}

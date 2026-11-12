/**
 * Supabase client (Phase 12).
 *
 * The whole backend integration is opt-in: when `VITE_SUPABASE_URL` and
 * `VITE_SUPABASE_ANON_KEY` are present the app talks to Supabase; when they are
 * missing `supabase` is `null` and every caller falls back to the existing
 * local-storage implementation. Nothing here runs at import time beyond the
 * one `createClient` call, so a missing configuration can never break boot.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

/** True when both environment values are present. */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Keep our own storage key so the session never collides with anything
        // the local (no-backend) auth path already wrote.
        storageKey: 'clockit-supabase-auth',
      },
    })
  : null;

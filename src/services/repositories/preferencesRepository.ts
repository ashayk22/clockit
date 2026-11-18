import { ObservableRepository, localStore, scopedStorageKey } from './storage';
import type { AppearanceMode, PreferenceKey, PreferencesRepository, UserPreferences } from './types';

const THEME_KEY = 'tracker-theme';
const APPEARANCE_KEY = 'clockit-appearance';
const SIDEBAR_KEY = 'clockit-sidebar-collapsed';
const NOTIF_KEY = 'clockit-notif-read';
const WORKSPACE_KEY = 'clockit-active-workspace';
const ONBOARDING_KEY = 'clockit-onboarding-completed';
const CHALLENGES_KEY = 'clockit-productivity-challenges';
const PLANNING_KEY = 'clockit-planning-preference';
const FOCUS_KEY = 'clockit-preferred-focus-duration';

/**
 * Local-storage backed preferences repository.
 *
 * Each preference keeps the exact key and encoding it already had, so existing
 * browsers round-trip unchanged: the theme stays a bare string, the sidebar
 * flag stays `'1'`/`'0'` and the acknowledged-notification list stays a JSON
 * array. A list that cannot be parsed is left untouched rather than reset.
 */
export class LocalPreferencesRepository
  extends ObservableRepository
  implements PreferencesRepository
{
  private readonly baseKeys = [
    THEME_KEY,
    APPEARANCE_KEY,
    SIDEBAR_KEY,
    NOTIF_KEY,
    WORKSPACE_KEY,
    ONBOARDING_KEY,
    CHALLENGES_KEY,
    PLANNING_KEY,
    FOCUS_KEY,
  ];
  get keys(): readonly string[] { return this.baseKeys.map((key) => scopedStorageKey(key)); }

  private theme: UserPreferences['theme'] = 'light';
  private appearancePreference: AppearanceMode = 'system';
  private sidebarCollapsed = false;
  private notificationReadKeys: string[] = [];
  private activeWorkspaceId: string | null = null;
  private onboardingCompleted = false;
  private productivityChallenges: string[] = [];
  private planningPreference: string | null = null;
  private preferredFocusDuration = 25;
  /** Set when the stored notification list was unreadable — never overwritten. */
  private notificationKeysQuarantined = false;

  constructor() {
    super();
    this.readAll();
  }

  get<K extends PreferenceKey>(key: K): UserPreferences[K] {
    return this.getAll()[key];
  }

  getAll(): UserPreferences {
    return {
      theme: this.theme,
      appearancePreference: this.appearancePreference,
      sidebarCollapsed: this.sidebarCollapsed,
      notificationReadKeys: [...this.notificationReadKeys],
      activeWorkspaceId: this.activeWorkspaceId,
      onboardingCompleted: this.onboardingCompleted,
      productivityChallenges: [...this.productivityChallenges],
      planningPreference: this.planningPreference,
      preferredFocusDuration: this.preferredFocusDuration,
    };
  }

  set<K extends PreferenceKey>(key: K, value: UserPreferences[K]): void {
    switch (key) {
      case 'theme':
        this.theme = value as UserPreferences['theme'];
        localStore.writeRaw(scopedStorageKey(THEME_KEY), this.theme);
        break;
      case 'appearancePreference':
        this.appearancePreference = value as AppearanceMode;
        localStore.writeRaw(scopedStorageKey(APPEARANCE_KEY), this.appearancePreference);
        break;
      case 'sidebarCollapsed':
        this.sidebarCollapsed = Boolean(value);
        localStore.writeRaw(scopedStorageKey(SIDEBAR_KEY), this.sidebarCollapsed ? '1' : '0');
        break;
      case 'notificationReadKeys': {
        const keys = Array.isArray(value) ? (value as string[]).filter((k) => typeof k === 'string') : [];
        this.notificationReadKeys = keys;
        if (!this.notificationKeysQuarantined) {
          localStore.writeRaw(scopedStorageKey(NOTIF_KEY), JSON.stringify(keys));
        }
        break;
      }
      case 'activeWorkspaceId':
        this.activeWorkspaceId = typeof value === 'string' && value ? value : null;
        if (this.activeWorkspaceId) {
          localStore.writeRaw(scopedStorageKey(WORKSPACE_KEY), this.activeWorkspaceId);
        } else {
          localStore.remove(scopedStorageKey(WORKSPACE_KEY));
        }
        break;
      case 'onboardingCompleted':
        this.onboardingCompleted = Boolean(value);
        localStore.writeRaw(scopedStorageKey(ONBOARDING_KEY), this.onboardingCompleted ? '1' : '0');
        break;
      case 'productivityChallenges': {
        const arr = Array.isArray(value) ? (value as string[]).filter((c) => typeof c === 'string') : [];
        this.productivityChallenges = arr;
        localStore.writeRaw(scopedStorageKey(CHALLENGES_KEY), JSON.stringify(arr));
        break;
      }
      case 'planningPreference':
        this.planningPreference = typeof value === 'string' && value ? value : null;
        if (this.planningPreference) {
          localStore.writeRaw(scopedStorageKey(PLANNING_KEY), this.planningPreference);
        } else {
          localStore.remove(scopedStorageKey(PLANNING_KEY));
        }
        break;
      case 'preferredFocusDuration': {
        const dur = typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : 25;
        this.preferredFocusDuration = dur;
        localStore.writeRaw(scopedStorageKey(FOCUS_KEY), String(dur));
        break;
      }
      default:
        return;
    }
    this.emit();
  }

  refreshFromStorage(): boolean {
    this.readAll();
    this.emit();
    return true;
  }

  private readAll(): void {
    this.readTheme();
    this.readAppearance();
    this.readSidebar();
    this.readNotificationKeys();
    this.readActiveWorkspace();
    this.readOnboarding();
    this.readChallenges();
    this.readPlanning();
    this.readFocus();
  }

  private readTheme(): void {
    this.theme = localStore.readRaw(scopedStorageKey(THEME_KEY)) === 'dark' ? 'dark' : 'light';
  }

  private readAppearance(): void {
    const raw = localStore.readRaw(scopedStorageKey(APPEARANCE_KEY));
    if (raw === 'light' || raw === 'dark' || raw === 'system') {
      this.appearancePreference = raw;
    } else {
      this.appearancePreference = 'system';
    }
  }

  private readSidebar(): void {
    this.sidebarCollapsed = localStore.readRaw(scopedStorageKey(SIDEBAR_KEY)) === '1';
  }

  private readActiveWorkspace(): void {
    this.activeWorkspaceId = localStore.readRaw(scopedStorageKey(WORKSPACE_KEY)) || null;
  }

  private readOnboarding(): void {
    this.onboardingCompleted = localStore.readRaw(scopedStorageKey(ONBOARDING_KEY)) === '1';
  }

  private readChallenges(): void {
    const raw = localStore.readRaw(scopedStorageKey(CHALLENGES_KEY));
    if (!raw) {
      this.productivityChallenges = [];
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      this.productivityChallenges = Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === 'string') : [];
    } catch {
      this.productivityChallenges = [];
    }
  }

  private readPlanning(): void {
    this.planningPreference = localStore.readRaw(scopedStorageKey(PLANNING_KEY)) || null;
  }

  private readFocus(): void {
    const raw = localStore.readRaw(scopedStorageKey(FOCUS_KEY));
    const parsed = raw ? parseInt(raw, 10) : 25;
    this.preferredFocusDuration = Number.isFinite(parsed) && parsed > 0 ? parsed : 25;
  }

  private readNotificationKeys(): void {
    const raw = localStore.readRaw(scopedStorageKey(NOTIF_KEY));
    if (raw === null || raw === '') {
      this.notificationReadKeys = [];
      this.notificationKeysQuarantined = false;
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      this.notificationReadKeys = Array.isArray(parsed)
        ? parsed.filter((k): k is string => typeof k === 'string')
        : [];
      this.notificationKeysQuarantined = false;
    } catch (error) {
      // Keep the bytes on disk; show nothing read rather than resetting the list.
      this.notificationReadKeys = [];
      this.notificationKeysQuarantined = true;
      console.error(
        `[clockit/storage] "${NOTIF_KEY}" is not valid JSON. The existing value was left untouched.`,
        error,
      );
    }
  }
}

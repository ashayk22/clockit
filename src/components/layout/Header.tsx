import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Sun,
  Moon,
  Bell,
  MoreHorizontal,
  X,
  Menu,
  Settings,
  LogOut,
  CircleCheckBig,
} from 'lucide-react';
import { dataService, ANCHOR_DATE } from '../../services/dataService';
import type { TaskItem } from '../../data/mockData';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  /** Opens the off-canvas sidebar on small screens. */
  onOpenMobileNav?: () => void;
  onOpenSettings?: () => void;
  onSignOut?: () => void;
  /** Jump to the Tasks view (used by the notification list). */
  onOpenTasks?: () => void;
}

interface AppNotification {
  id: string;
  title: string;
  meta: string;
  kind: 'overdue' | 'today';
}

/** Stable identity for a notification so read/unread can be remembered. */
const notifKey = (n: Pick<AppNotification, 'kind' | 'id'>) => `${n.kind}:${n.id}`;

/** Closes a popover on outside click or Escape. */
function useDismiss(active: boolean, onDismiss: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active) return;
    const handlePointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onDismiss();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [active, onDismiss]);
  return ref;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleTheme,
  searchQuery,
  onSearchChange,
  onOpenMobileNav,
  onOpenSettings,
  onSignOut,
  onOpenTasks,
}) => {
  const [openMenu, setOpenMenu] = useState<'none' | 'notif' | 'more'>('none');
  const [tasks, setTasks] = useState<TaskItem[]>(() => dataService.getTasks());
  const searchRef = useRef<HTMLInputElement>(null);

  // Keys of notifications the user has already acknowledged (persisted locally so
  // read/unread survives a reload — no backend involved).
  const [readNotifKeys, setReadNotifKeys] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('clockit-notif-read');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((k) => typeof k === 'string') : [];
    } catch {
      return [];
    }
  });

  useEffect(() => dataService.subscribe(() => setTasks(dataService.getTasks())), []);

  useEffect(() => {
    try {
      localStorage.setItem('clockit-notif-read', JSON.stringify(readNotifKeys));
    } catch {
      /* storage unavailable — read state simply won't persist */
    }
  }, [readNotifKeys]);

  const closeMenus = useCallback(() => setOpenMenu('none'), []);
  const notifRef = useDismiss(openMenu === 'notif', closeMenus);
  const moreRef = useDismiss(openMenu === 'more', closeMenus);

  // Ctrl/Cmd + K focuses search, matching the hint pill.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Real notifications derived from the user's own tasks — nothing invented.
  const notifications = useMemo<AppNotification[]>(() => {
    const overdue = tasks.filter((t) => t.isOverdue && !t.completed);
    const dueToday = tasks.filter((t) => t.isToday && !t.completed);
    return [
      ...overdue.map((t) => ({ id: t.id, title: t.title, meta: 'Overdue', kind: 'overdue' as const })),
      ...dueToday.map((t) => ({ id: t.id, title: t.title, meta: 'Due today', kind: 'today' as const })),
    ];
  }, [tasks]);

  const isRead = useCallback((n: AppNotification) => readNotifKeys.includes(notifKey(n)), [readNotifKeys]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readNotifKeys.includes(notifKey(n))).length,
    [notifications, readNotifKeys],
  );

  // Bright red is reserved for genuinely urgent items (overdue work only).
  const hasUrgent = useMemo(() => notifications.some((n) => n.kind === 'overdue'), [notifications]);

  const markRead = useCallback((n: AppNotification) => {
    const key = notifKey(n);
    setReadNotifKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
  }, []);

  const markAllRead = useCallback(() => {
    setReadNotifKeys((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(notifKey(n)));
      return Array.from(next);
    });
  }, [notifications]);

  // Design anchor date, formatted from ANCHOR_DATE so it never drifts out of sync.
  const anchorLabel = useMemo(() => {
    const [year, month, day] = ANCHOR_DATE.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    return `${weekday}, ${day} ${monthName} ${year}`;
  }, []);

  return (
    <header className="clockit-topbar" aria-label="Top Application Header">
      <div className="clockit-topbar-left">
        {onOpenMobileNav ? (
          <button
            className="clockit-icon-action-btn clockit-nav-trigger"
            aria-label="Open navigation"
            title="Open navigation"
            type="button"
            onClick={onOpenMobileNav}
          >
            <Menu size={18} />
          </button>
        ) : null}

        {/* Search Input */}
        <div className="clockit-search-box">
          <Search size={15} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search tasks, notes, anything..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search"
          />
          {searchQuery ? (
            <button
              className="clockit-search-clear"
              aria-label="Clear search"
              title="Clear search"
              type="button"
              onClick={() => {
                onSearchChange('');
                searchRef.current?.focus();
              }}
            >
              <X size={14} />
            </button>
          ) : (
            <span className="clockit-kbd-pill">Ctrl K</span>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="clockit-topbar-right">
        <span className="clockit-live-date-pill">{anchorLabel}</span>

        {/* Theme Switcher */}
        <button
          className="clockit-icon-action-btn"
          onClick={onToggleTheme}
          aria-label={isDarkMode ? 'Switch to Light mode' : 'Switch to Dark mode'}
          title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          type="button"
        >
          {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications */}
        <div className="clockit-menu-anchor" ref={notifRef}>
          <button
            className={`clockit-icon-action-btn${openMenu === 'notif' ? ' is-open' : ''}`}
            aria-label={
              unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications, none unread'
            }
            aria-haspopup="true"
            aria-expanded={openMenu === 'notif'}
            title="Notifications"
            type="button"
            onClick={() => setOpenMenu((m) => (m === 'notif' ? 'none' : 'notif'))}
          >
            <Bell size={17} />
            {unreadCount > 0 ? (
              <span className={`clockit-badge-count${hasUrgent ? ' is-urgent' : ''}`}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </button>

          {openMenu === 'notif' ? (
            <div className="clockit-dropdown clockit-dropdown-notif" role="menu">
              <div className="clockit-dropdown-header">
                <span className="clockit-dropdown-title">Notifications</span>
                {unreadCount > 0 ? (
                  <button
                    className="clockit-dropdown-action"
                    type="button"
                    onClick={markAllRead}
                  >
                    Mark all read
                  </button>
                ) : (
                  <span className="clockit-dropdown-count">
                    {notifications.length > 0 ? 'All read' : '0 new'}
                  </span>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="clockit-notif-empty">
                  <CircleCheckBig size={20} className="clockit-notif-empty-icon" />
                  <span className="clockit-notif-empty-title">You&rsquo;re all caught up.</span>
                  <span className="clockit-notif-empty-sub">No overdue or due-today tasks.</span>
                </div>
              ) : (
                <div className="clockit-notif-list">
                  {notifications.slice(0, 8).map((n) => {
                    const read = isRead(n);
                    return (
                      <button
                        key={notifKey(n)}
                        className={`clockit-notif-row${read ? ' is-read' : ''}`}
                        role="menuitem"
                        type="button"
                        onClick={() => {
                          markRead(n);
                          setOpenMenu('none');
                          onOpenTasks?.();
                        }}
                      >
                        <span
                          className={`clockit-notif-dot is-${n.kind}`}
                          aria-hidden="true"
                        />
                        <span className="clockit-notif-body">
                          <span className="clockit-notif-title">{n.title}</span>
                          <span className="clockit-notif-meta">{n.meta}</span>
                        </span>
                        {read ? null : <span className="clockit-notif-unread" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="clockit-dropdown-sep" />
              <button
                className="clockit-dropdown-item"
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpenMenu('none');
                  onOpenTasks?.();
                }}
              >
                <CircleCheckBig size={15} />
                View all tasks
              </button>
            </div>
          ) : null}
        </div>

        {/* More Actions */}
        <div className="clockit-menu-anchor" ref={moreRef}>
          <button
            className={`clockit-icon-action-btn${openMenu === 'more' ? ' is-open' : ''}`}
            aria-label="More actions"
            aria-haspopup="true"
            aria-expanded={openMenu === 'more'}
            title="More actions"
            type="button"
            onClick={() => setOpenMenu((m) => (m === 'more' ? 'none' : 'more'))}
          >
            <MoreHorizontal size={17} />
          </button>

          {openMenu === 'more' ? (
            <div className="clockit-dropdown" role="menu">
              {onOpenSettings ? (
                <button
                  className="clockit-dropdown-item"
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setOpenMenu('none');
                    onOpenSettings();
                  }}
                >
                  <Settings size={15} />
                  Settings
                </button>
              ) : null}
              {onSignOut ? (
                <>
                  <div className="clockit-dropdown-sep" />
                  <button
                    className="clockit-dropdown-item is-danger"
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setOpenMenu('none');
                      onSignOut();
                    }}
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Header;

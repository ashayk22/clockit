/**
 * Shared task/date conventions.
 *
 * Extracted from `dataService` so the repositories, the selectors and the
 * service facade can all depend on one copy of these rules without importing
 * each other. `dataService` re-exports everything here, so existing imports are
 * unaffected.
 */

export const ANCHOR_DATE = '2026-10-26'; // Sun, 26 Oct 2026 (matching ClockIt reference design anchor)

export const WORKSPACE_COLORS: Record<string, string> = {
  Personal: '#22c55e',
  College: '#3b82f6',
  Club: '#a855f7',
  Freelance: '#f97316',
  Development: '#10b981',
  SIH: '#10b981',
};

export const formatDeadlineString = (dueDateStr?: string, dueTimeStr?: string): string => {
  if (!dueDateStr) return 'No deadline';
  try {
    const parts = dueDateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = months[month - 1] || 'Oct';
      const base = `${day} ${monthName} ${year}`;
      if (dueTimeStr) {
        return `${base}, ${dueTimeStr}`;
      }
      return base;
    }
    return dueDateStr;
  } catch {
    return dueDateStr;
  }
};

export const computeDaysDiff = (dueDateStr?: string): { daysLeft: string; isOverdue: boolean; isToday: boolean } => {
  if (!dueDateStr) return { daysLeft: 'Someday', isOverdue: false, isToday: false };
  try {
    const target = new Date(dueDateStr + 'T00:00:00');
    const anchor = new Date(ANCHOR_DATE + 'T00:00:00');
    const diffTime = target.getTime() - anchor.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return {
        daysLeft: `${Math.abs(diffDays)} days overdue`,
        isOverdue: true,
        isToday: false,
      };
    } else if (diffDays === 0) {
      return {
        daysLeft: 'Today',
        isOverdue: false,
        isToday: true,
      };
    } else if (diffDays === 1) {
      return {
        daysLeft: 'Tomorrow',
        isOverdue: false,
        isToday: false,
      };
    } else {
      return {
        daysLeft: `${diffDays} days left`,
        isOverdue: false,
        isToday: false,
      };
    }
  } catch {
    return { daysLeft: 'Upcoming', isOverdue: false, isToday: false };
  }
};

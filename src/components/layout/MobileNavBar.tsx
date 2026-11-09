import React from 'react';
import { Home, Target, CheckSquare, Calendar as CalendarIcon, Menu } from 'lucide-react';
import type { NavView } from './Sidebar';

interface MobileNavBarProps {
  activeView: NavView;
  onViewChange: (view: NavView) => void;
  /** Opens the full off-canvas drawer (workspaces, notes, analytics, …). */
  onOpenMenu: () => void;
}

const PRIMARY_ITEMS: { id: NavView; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <Home size={20} /> },
  { id: 'focus', label: 'Focus', icon: <Target size={20} /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
  { id: 'calendar', label: 'Calendar', icon: <CalendarIcon size={20} /> },
];

/**
 * Compact bottom navigation for phones. The four highest-frequency views live
 * here for one-tap reach; everything else (Notes, Analytics, Habits, Settings,
 * workspace switching) stays in the off-canvas drawer behind "More".
 */
export const MobileNavBar: React.FC<MobileNavBarProps> = ({ activeView, onViewChange, onOpenMenu }) => {
  return (
    <nav className="clockit-mobile-nav" aria-label="Primary mobile navigation">
      {PRIMARY_ITEMS.map((item) => {
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`clockit-mobile-nav-item${isActive ? ' is-active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onViewChange(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
      <button
        type="button"
        className="clockit-mobile-nav-item"
        onClick={onOpenMenu}
        aria-label="Open full navigation"
      >
        <Menu size={20} />
        <span>More</span>
      </button>
    </nav>
  );
};

export default MobileNavBar;

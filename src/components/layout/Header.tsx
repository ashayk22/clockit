import React from 'react';
import { Search, Sun, Moon, Bell, MoreHorizontal } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleTheme,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className="clockit-topbar" aria-label="Top Application Header">
      {/* Search Input */}
      <div className="clockit-search-box">
        <Search size={15} />
        <input
          type="text"
          placeholder="Search tasks, notes, anything..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search"
        />
        <span className="clockit-kbd-pill">Ctrl K</span>
      </div>

      {/* Right Controls */}
      <div className="clockit-topbar-right">
        <span className="clockit-live-date-pill">Sun, 26 Oct 2026</span>

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
        <button
          className="clockit-icon-action-btn"
          aria-label="Notifications"
          title="Notifications"
          type="button"
        >
          <Bell size={17} />
        </button>

        {/* More Actions */}
        <button
          className="clockit-icon-action-btn"
          aria-label="More actions"
          title="More actions"
          type="button"
        >
          <MoreHorizontal size={17} />
        </button>
      </div>
    </header>
  );
};

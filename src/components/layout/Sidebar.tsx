import React from 'react';
import {
  Home,
  Target,
  CheckSquare,
  FileText,
  BarChart2,
  Clock,
  Calendar as CalendarIcon,
  Plus,
  ChevronDown,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Workspace } from '../../data/mockData';

export type NavView = 'home' | 'focus' | 'tasks' | 'notes' | 'analytics' | 'habits' | 'calendar';

interface SidebarProps {
  activeView: NavView;
  onViewChange: (view: NavView) => void;
  workspaces: Workspace[];
  activeWorkspace: string;
  onWorkspaceSelect: (id: string) => void;
  userName?: string;
  onOpenSettings?: () => void;
  /** Desktop rail mode — icons only. */
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Off-canvas drawer state on small screens. */
  isMobileOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  workspaces,
  activeWorkspace,
  onWorkspaceSelect,
  userName = 'Ashay',
  onOpenSettings,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
}) => {
  const userInitial = userName.trim().charAt(0).toUpperCase() || 'A';

  /** Keyboard activation for the custom (non-<button>) interactive rows. */
  const activateOnKey =
    (run: () => void) => (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        run();
      }
    };

  const navItems: { id: NavView; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home size={17} /> },
    { id: 'focus', label: 'Focus', icon: <Target size={17} /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={17} /> },
    { id: 'notes', label: 'Notes', icon: <FileText size={17} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={17} /> },
    { id: 'habits', label: 'Habits', icon: <Clock size={17} /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon size={17} /> },
  ];

  return (
    <aside
      className={`clockit-sidebar${isCollapsed ? ' is-collapsed' : ''}${isMobileOpen ? ' is-mobile-open' : ''}`}
      aria-label="Main Navigation"
      aria-expanded={!isCollapsed}
    >
      {/* Scrollable region — keeps the profile footer pinned to the bottom. */}
      <div className="clockit-sidebar-scroll">
        {/* Brand Header */}
        <div
          className="clockit-brand-row"
          onClick={() => onViewChange('home')}
          onKeyDown={activateOnKey(() => onViewChange('home'))}
          role="button"
          tabIndex={0}
          aria-label="ClockIt home"
          title="ClockIt"
        >
          <div className="clockit-brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
          </div>
          <span className="clockit-brand-name">ClockIt</span>
        </div>

        {/* Primary Navigation */}
        <ul className="clockit-nav-list" role="tablist">
          {navItems.map((item) => (
            <li
              key={item.id}
              className={`clockit-nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => onViewChange(item.id)}
              onKeyDown={activateOnKey(() => onViewChange(item.id))}
              role="tab"
              tabIndex={0}
              aria-selected={activeView === item.id}
              aria-current={activeView === item.id ? 'page' : undefined}
              aria-label={item.label}
              title={item.label}
            >
              {item.icon}
              <span className="clockit-nav-label">{item.label}</span>
            </li>
          ))}
        </ul>

        {/* Workspaces Section */}
        <div className="clockit-sidebar-section-title">Workspace</div>
        <div className="clockit-nav-list">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className={`clockit-workspace-item ${activeWorkspace === ws.id ? 'active' : ''}`}
              onClick={() => onWorkspaceSelect(ws.id)}
              onKeyDown={activateOnKey(() => onWorkspaceSelect(ws.id))}
              role="button"
              tabIndex={0}
              aria-current={activeWorkspace === ws.id ? 'true' : undefined}
              aria-label={`Switch to ${ws.name} workspace`}
              title={ws.name}
            >
              <span
                className="clockit-workspace-dot"
                style={{ backgroundColor: ws.color }}
              />
              <span className="clockit-workspace-name">{ws.name}</span>
            </div>
          ))}
          <div className="clockit-add-space-btn" title="Add space">
            <Plus size={15} />
            <span>Add space</span>
          </div>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="clockit-sidebar-user">
        <div className="clockit-sidebar-user-left">
          <div className="clockit-user-avatar">{userInitial}</div>
          <span className="clockit-user-name">{userName}</span>
          <ChevronDown size={14} color="var(--text-muted)" />
        </div>
        <div className="clockit-sidebar-user-actions">
          {onToggleCollapse ? (
            <button
              className="clockit-icon-action-btn clockit-collapse-trigger"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              type="button"
              onClick={onToggleCollapse}
            >
              {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          ) : null}
          <button
            className="clockit-icon-action-btn"
            aria-label="Settings"
            title="Settings"
            type="button"
            onClick={onOpenSettings}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

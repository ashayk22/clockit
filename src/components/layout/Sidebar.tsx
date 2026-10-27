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
} from 'lucide-react';
import { Workspace } from '../../data/mockData';

export type NavView = 'home' | 'focus' | 'tasks' | 'notes' | 'analytics' | 'habits' | 'calendar';

interface SidebarProps {
  activeView: NavView;
  onViewChange: (view: NavView) => void;
  workspaces: Workspace[];
  activeWorkspace: string;
  onWorkspaceSelect: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  workspaces,
  activeWorkspace,
  onWorkspaceSelect,
}) => {
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
    <aside className="clockit-sidebar" aria-label="Main Navigation">
      {/* Brand Header */}
      <div className="clockit-brand-row" onClick={() => onViewChange('home')} role="button" tabIndex={0}>
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
            role="tab"
            aria-selected={activeView === item.id}
          >
            {item.icon}
            <span>{item.label}</span>
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
          >
            <span
              className="clockit-workspace-dot"
              style={{ backgroundColor: ws.color }}
            />
            <span>{ws.name}</span>
          </div>
        ))}
        <div className="clockit-add-space-btn">
          <Plus size={15} />
          <span>Add space</span>
        </div>
      </div>

      {/* Motivational Card */}
      <div className="clockit-sidebar-motivational">
        <div className="clockit-sidebar-motivational-overlay" />
        <p>Progress lives in small steps.</p>
      </div>

      {/* User Footer Profile */}
      <div className="clockit-sidebar-user">
        <div className="clockit-sidebar-user-left">
          <div className="clockit-user-avatar">A</div>
          <span className="clockit-user-name">Ashay</span>
          <ChevronDown size={14} color="var(--text-muted)" />
        </div>
        <button
          className="clockit-icon-action-btn"
          aria-label="Settings"
          title="Settings"
          type="button"
        >
          <Settings size={16} />
        </button>
      </div>
    </aside>
  );
};

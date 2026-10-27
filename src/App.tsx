import React, { useState, useEffect } from 'react';
import { Sidebar, NavView } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { HomePage } from './components/pages/HomePage';
import { FocusPage } from './components/pages/FocusPage';
import { TasksPage } from './components/pages/TasksPage';
import { NotesPage } from './components/pages/NotesPage';
import { AnalyticsPage } from './components/pages/AnalyticsPage';
import { HabitsPage } from './components/pages/HabitsPage';
import { CalendarPage } from './components/pages/CalendarPage';
import { dataService } from './services/dataService';
import './styles/clockit-theme.css';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<NavView>('home');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        document.documentElement.classList.contains('dark') ||
        localStorage.getItem('tracker-theme') === 'dark' ||
        localStorage.getItem('vertix-theme') === 'dark'
      );
    }
    return false;
  });

  const [tasks, setTasks] = useState(() => dataService.getTasks());
  const [workspaces, setWorkspaces] = useState(() => dataService.getWorkspaces());
  const [activeWorkspace, setActiveWorkspace] = useState('personal');
  const [habits, setHabits] = useState(() => dataService.getHabits());
  const [searchQuery, setSearchQuery] = useState('');

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tracker-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tracker-theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleToggleTask = (id: string) => {
    const updated = dataService.toggleTask(id);
    setTasks(updated);
  };

  const handleToggleHabit = (id: string) => {
    const updated = dataService.toggleHabit(id);
    setHabits(updated);
  };

  return (
    <div className="clockit-layout-container">
      {/* 1. Global Left Sidebar */}
      <Sidebar
        activeView={activeView}
        onViewChange={(view) => setActiveView(view)}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onWorkspaceSelect={(id) => setActiveWorkspace(id)}
      />

      {/* 2. Main Viewport */}
      <div className="clockit-main-viewport">
        {/* Top Header */}
        <Header
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Dynamic Page Views */}
        <main style={{ flex: 1 }}>
          {activeView === 'home' && (
            <HomePage
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onNavigateToFocus={() => setActiveView('focus')}
            />
          )}

          {activeView === 'focus' && <FocusPage />}

          {activeView === 'tasks' && (
            <TasksPage
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onNavigateToCalendar={() => setActiveView('calendar')}
            />
          )}

          {activeView === 'notes' && <NotesPage />}

          {activeView === 'analytics' && <AnalyticsPage />}

          {activeView === 'habits' && (
            <HabitsPage habits={habits} onToggleHabit={handleToggleHabit} />
          )}

          {activeView === 'calendar' && <CalendarPage />}
        </main>
      </div>
    </div>
  );
};

export default App;

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './theme/ThemeContext';
import { AuthProvider } from './auth/AuthContext';
import { NotificationProvider } from './components/ui/NotificationToast';
import { RootErrorBoundary } from './components/common/ErrorBoundary';
import './styles/clockit-theme.css';
import './styles/motion.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <RootErrorBoundary>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <NotificationProvider>
                <App />
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </RootErrorBoundary>
    </React.StrictMode>
  );
}

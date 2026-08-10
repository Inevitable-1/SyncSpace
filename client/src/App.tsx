import { useCallback, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import WorkspacesPage from './pages/dashboard/WorkspacesPage';
import WorkspaceDetailPage from './pages/dashboard/WorkspaceDetailPage';
import RoomsPage from './pages/dashboard/RoomsPage';
import RoomDetailPage from './pages/dashboard/RoomDetailPage';
import SharedWithMePage from './pages/dashboard/SharedWithMePage';
import ActivityPage from './pages/dashboard/ActivityPage';
import TrashPage from './pages/dashboard/TrashPage';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import WhiteboardPage from './pages/WhiteboardPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import InsightsPage from './pages/dashboard/InsightsPage';
import FileManagerPage from './pages/dashboard/FileManagerPage';
import MeetingsPage from './pages/dashboard/MeetingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import CommandPalette from './components/CommandPalette';
import AISidebar from './components/AISidebar';
import IntroScreen from './components/intro/IntroScreen';

const INTRO_STORAGE_KEY = 'syncspace-intro-played';

function readIntroPlayed(): boolean {
  try {
    return localStorage.getItem(INTRO_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function NotFound() {
  return (
    <div className="min-h-screen bg-surface-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-purple-400">
          404
        </h1>
        <p className="text-gray-400 text-lg mb-8">Page not found</p>
        <a
          href="/"
          className="px-6 py-3 bg-gradient-to-r from-brand-600 to-purple-600 rounded-xl font-semibold text-sm text-white shadow-lg shadow-brand-600/25 hover:shadow-brand-500/40 transition-all inline-block"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

function Root() {
  const location = useLocation();
  const [introDone, setIntroDone] = useState(readIntroPlayed);
  const showIntro = location.pathname === '/' && !introDone;

  const handleIntroDone = useCallback(() => {
    try {
      localStorage.setItem(INTRO_STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setIntroDone(true);
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="workspaces" element={<WorkspacesPage />} />
          <Route path="workspaces/:id" element={<WorkspaceDetailPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="rooms/:id" element={<RoomDetailPage />} />
          <Route path="meetings" element={<MeetingsPage />} />
          <Route path="shared" element={<SharedWithMePage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="trash" element={<TrashPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="files" element={<FileManagerPage />} />
        </Route>
        <Route
          path="/whiteboard/:roomId"
          element={
            <ProtectedRoute>
              <WhiteboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <CommandPalette />
      <AISidebar />
      {showIntro && <IntroScreen onDone={handleIntroDone} />}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <Root />
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

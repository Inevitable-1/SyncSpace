import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import AboutPage from './pages/AboutPage';
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
import PublicRoute from './components/PublicRoute';
import CommandPalette from './components/CommandPalette';
import LogoMark from './components/logo/LogoMark';
import LoadingScreen from './components/logo/LoadingScreen';

const INTRO_STORAGE_KEY = 'syncspace-intro-played';

function readIntroPlayed(): boolean {
  try {
    return localStorage.getItem(INTRO_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div
      className="min-h-screen bg-white flex items-center justify-center px-6 overflow-hidden"
      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}
    >
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.12), transparent 60%)' }}
        />
      </div>
      <div className="relative text-center">
        <div className="flex justify-center mb-8">
          <LogoMark size={72} />
        </div>
        <h1 className="text-8xl font-black mb-3 text-[#111111] tracking-tight">
          4<span className="text-[#C1121F]">0</span>4
        </h1>
        <p className="text-[#555555] text-lg mb-3">This page drifted off the whiteboard.</p>
        <p className="text-sm text-[#888888] mb-10">
          The link may be broken, or the page was moved to a different room.
        </p>
        <a
          href="/"
          className="inline-block px-8 py-3.5 rounded-xl text-sm font-semibold text-white bg-[#C1121F] hover:bg-[#9e0e19] transition-all shadow-lg shadow-red-500/25"
        >
          Back to SyncSpace
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
      <ScrollToTop />
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            }
          />
          <Route
            path="/features"
            element={
              <PublicRoute>
                <FeaturesPage />
              </PublicRoute>
            }
          />
          <Route
            path="/about"
            element={
              <PublicRoute>
                <AboutPage />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPasswordPage />
              </PublicRoute>
            }
          />
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
      </motion.div>
      <CommandPalette />
      {showIntro && <LoadingScreen onDone={handleIntroDone} />}
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

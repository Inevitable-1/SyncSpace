import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/common/Toast';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import WorkspacesPage from './pages/dashboard/WorkspacesPage';
import RoomsPage from './pages/dashboard/RoomsPage';
import SharedWithMePage from './pages/dashboard/SharedWithMePage';
import ActivityPage from './pages/dashboard/ActivityPage';
import TrashPage from './pages/dashboard/TrashPage';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import WorkspaceDetailPage from './pages/dashboard/WorkspaceDetailPage';
import RoomDetailPage from './pages/dashboard/RoomDetailPage';
import WhiteboardPage from './pages/WhiteboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import type { RootState } from './store';

function Landing() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">SyncSpace</h1>
        <p className="text-gray-400 text-lg mb-8">Real-time collaborative platform</p>
        <div className="flex gap-4 justify-center">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-medium transition"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 text-indigo-500">404</h1>
        <p className="text-gray-400 text-lg mb-8">Page not found</p>
        <Link
          to="/"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
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
              <Route path="shared" element={<SharedWithMePage />} />
              <Route path="activity" element={<ActivityPage />} />
              <Route path="trash" element={<TrashPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
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
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

import { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import AISidebar from '../AISidebar';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const location = useLocation();

  const isRoomView = /^\/dashboard\/rooms\/[^/]+$/.test(location.pathname);

  const toggleCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface-900 text-white">
      <div className="aurora-bg" />

      <div className="flex flex-1 min-h-0">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={closeSidebar}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleCollapse}
        />

        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}
        >
          {!isRoomView && <TopNav onMenuClick={openSidebar} />}

          {isRoomView ? (
            <main className="flex-1 min-h-0 overflow-hidden">
              <Outlet />
            </main>
          ) : (
            <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto animate-fade-in">
                <Outlet />
              </div>
            </main>
          )}
        </div>
      </div>

      <AISidebar isOpen={aiOpen} onOpen={() => setAiOpen(true)} onClose={() => setAiOpen(false)} />
    </div>
  );
}

import { Link } from 'react-router-dom';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-600/30">
                <span className="text-white font-bold text-lg">S</span>
              </div>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">SyncSpace</h1>
            <p className="text-gray-400 mt-2 text-sm">Real-time collaborative platform</p>
          </Link>
        </div>
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl shadow-black/20">
          {children}
        </div>
        <p className="text-center text-gray-600 text-xs mt-6">
          &copy; {new Date().getFullYear()} SyncSpace. All rights reserved.
        </p>
      </div>
    </div>
  );
}

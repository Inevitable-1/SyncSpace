import { Link } from 'react-router-dom';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-white">SyncSpace</h1>
            <p className="text-gray-400 mt-1 text-sm">Real-time collaborative platform</p>
          </Link>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 shadow-xl">
          {children}
        </div>
        <p className="text-center text-gray-500 text-xs mt-6">
          &copy; {new Date().getFullYear()} SyncSpace. All rights reserved.
        </p>
      </div>
    </div>
  );
}

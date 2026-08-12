import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const collaborationCards = [
  {
    title: 'Collaborative Whiteboards',
    description: 'Sketch, draw and brainstorm together on an infinite canvas with live cursors.',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
        />
      </svg>
    ),
  },
  {
    title: 'Live Code Editor',
    description:
      'Pair program with your team in a shared editor with real-time syntax highlighting.',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
        />
      </svg>
    ),
  },
  {
    title: 'Team Chat',
    description: 'Stay in sync with threaded conversations, mentions and live typing indicators.',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
        />
      </svg>
    ),
  },
  {
    title: 'Shared Workspaces',
    description: 'Organize rooms, files and tasks in shared spaces everyone can access instantly.',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
        />
      </svg>
    ),
  },
  {
    title: 'Real-Time Sync',
    description: 'Every edit, message and change appears instantly for everyone in the room.',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.364 6.636a9 9 0 010 12.728m-10.728 0a9 9 0 010-12.728m10.728 0L8.636 17.364m10.728-10.728L12 12l-6.364-6.364"
        />
      </svg>
    ),
  },
];

const faqs = [
  {
    q: 'What is SyncSpace?',
    a: 'SyncSpace is a real-time collaboration platform that brings your entire team into one shared space — whiteboards, code rooms, chat and files working together seamlessly.',
  },
  {
    q: 'Why should I use SyncSpace?',
    a: 'Instead of juggling five different tools, SyncSpace gives you one premium workspace where you can brainstorm, write code and communicate in real time — like Linear, Notion, Figma and GitHub combined.',
  },
  {
    q: 'How does collaboration work?',
    a: 'Everything in a workspace stays in sync live. Open a room, invite your team, and every whiteboard stroke, line of code and message appears instantly for everyone — with presence indicators so you always know who is online.',
  },
  {
    q: 'Can I create multiple workspaces?',
    a: 'Yes. You can create as many workspaces as you need — one per project, client or team — and organize rooms, files and tasks inside each one.',
  },
  {
    q: 'Is SyncSpace suitable for students?',
    a: 'Absolutely. It is perfect for study groups, hackathons and final year projects — sketch ideas together, share notes, write code side by side and keep everything in one place.',
  },
];

function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      className={`w-6 h-6 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-[#0F172A]`}
    >
      {initials}
    </div>
  );
}

function WorkspaceLogo({ color, glyph }: { color: string; glyph: string }) {
  return (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      style={{ background: color }}
    >
      {glyph}
    </div>
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Initialize demo mode for the Watch Demo button
  useEffect(() => {
    const auth = (() => {
      try {
        return localStorage.getItem('auth')
          ? JSON.parse(localStorage.getItem('auth') || '{}')
          : null;
      } catch {
        return null;
      }
    })();
    if (auth?.state?.user) return;
    localStorage.setItem(
      'auth',
      JSON.stringify({
        state: {
          user: {
            id: 'demo-user',
            name: 'Manoj Kumar',
            email: 'mr.manojmanu05@gmail.com',
            avatar: 'M',
            isEmailVerified: true,
          },
          accessToken: 'demo-token',
          isAuthenticated: true,
          isDemo: true,
        },
      }),
    );
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'FAQ', href: '#faq' },
  ];

  const heroBadges = [
    'Collaborative Whiteboards',
    'Live Code Editor',
    'Team Chat',
    'Shared Workspaces',
    'Real-Time Sync',
  ];

  return (
    <div
      className="min-h-screen bg-[#0F172A] text-white overflow-hidden"
      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}
    >
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute top-[-10%] left-1/4 w-[600px] h-[600px] rounded-full blur-3xl animate-float"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent 60%)' }}
        />
        <div
          className="absolute bottom-[-10%] right-1/4 w-[500px] h-[500px] rounded-full blur-3xl animate-float"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.12), transparent 60%)',
            animationDelay: '-3s',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-60"
          style={{
            background: 'radial-gradient(circle at center, rgba(30,41,59,0.5), transparent 65%)',
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg
                  className="w-4.5 h-4.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 7.125c0-1.036.84-1.875 1.875-1.875h5.25c1.036 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875h-5.25a1.875 1.875 0 01-1.875-1.875v-9.75zm10.5 0c0-1.036.84-1.875 1.875-1.875h5.25c1.035 0 1.875.84 1.875 1.875v3.375c0 1.036-.84 1.875-1.875 1.875h-5.25a1.875 1.875 0 01-1.875-1.875V7.125z"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight">SyncSpace</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] hover:opacity-90 transition-all shadow-lg shadow-blue-500/25"
              >
                Start Collaborating
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-20 pb-24 sm:pt-32 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-8 max-w-2xl">
              {heroBadges.map((badge) => (
                <span
                  key={badge}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-white/10 bg-white/[0.04] backdrop-blur-sm text-slate-300"
                >
                  {badge}
                </span>
              ))}
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
              <span className="block text-slate-100">One Space.</span>
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400">
                Infinite Collaboration.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Create ideas, sketch on whiteboards, write code together, and build projects with your
              team in real time.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="group relative px-8 py-3.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] hover:opacity-90 transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40"
              >
                Start Collaborating
              </Link>
              <Link
                to="/dashboard"
                className="px-8 py-3.5 rounded-xl text-base font-semibold text-slate-200 border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.07] hover:border-white/20 transition-all"
              >
                Watch Demo
              </Link>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 relative"
          >
            <div className="relative mx-auto max-w-6xl rounded-2xl border border-white/10 bg-[#1E293B]/60 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/50">
              {/* Window chrome */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md text-[10px] text-slate-500 bg-white/[0.04] border border-white/5">
                    app.syncspace.dev/workspace/project-atlas
                  </div>
                </div>
                <div className="flex items-center -space-x-1.5">
                  <Avatar initials="MK" color="from-blue-500 to-sky-500" />
                  <Avatar initials="RA" color="from-cyan-500 to-teal-500" />
                  <Avatar initials="SP" color="from-indigo-500 to-blue-500" />
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-slate-300">
                    +2
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 p-3 sm:p-4 text-left">
                {/* Sidebar */}
                <div className="hidden md:flex col-span-2 flex-col gap-3 rounded-xl bg-white/[0.02] border border-white/5 p-3">
                  <div className="flex items-center gap-2 px-1 pb-2 border-b border-white/5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] flex items-center justify-center text-white text-xs font-bold">
                      S
                    </div>
                    <span className="text-xs font-semibold text-slate-300">SyncSpace</span>
                  </div>
                  <div className="space-y-1.5">
                    {['Home', 'Rooms', 'Files', 'Meetings', 'Activity'].map((item) => (
                      <div
                        key={item}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-medium ${
                          item === 'Rooms' ? 'bg-blue-500/15 text-blue-300' : 'text-slate-500'
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto space-y-1.5">
                    {[
                      { color: 'linear-gradient(135deg,#3B82F6,#06B6D4)', glyph: 'A' },
                      { color: 'linear-gradient(135deg,#06B6D4,#0d9488)', glyph: 'I' },
                      { color: 'linear-gradient(135deg,#2563eb,#3B82F6)', glyph: 'F' },
                    ].map((ws) => (
                      <WorkspaceLogo key={ws.glyph} color={ws.color} glyph={ws.glyph} />
                    ))}
                  </div>
                </div>

                {/* Whiteboard */}
                <div className="col-span-12 md:col-span-7 rounded-xl bg-white/[0.02] border border-white/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-semibold text-slate-200">Product Design</span>
                    </div>
                    <span className="text-[10px] text-slate-500">3 collaborating</span>
                  </div>
                  <div className="relative aspect-[16/9] rounded-lg bg-[#0F172A]/80 border border-white/5 overflow-hidden">
                    {/* canvas shapes */}
                    <div className="absolute inset-4 rounded-lg border border-dashed border-blue-500/20" />
                    <div className="absolute left-8 top-8 w-24 h-16 rounded-lg bg-blue-500/15 border border-blue-500/40" />
                    <div className="absolute left-36 top-6 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-3 py-2 text-[10px] text-cyan-300">
                      Brainstorm HQ
                    </div>
                    <div className="absolute left-8 top-32 w-20 h-12 rounded-lg bg-slate-600/20 border border-slate-500/30" />
                    <div className="absolute left-32 top-28 w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30" />
                    <div className="absolute right-8 bottom-6 flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] font-bold text-white">
                        A
                      </div>
                      <div className="px-2 py-1 rounded bg-blue-500/10 text-[9px] text-blue-300">
                        Drawing...
                      </div>
                    </div>
                    <div className="absolute right-8 top-8 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center text-[8px] font-bold text-white">
                      R
                    </div>
                  </div>
                  {/* tool rail */}
                  <div className="mt-3 flex items-center gap-1.5">
                    {['✏️', '📏', '⭕', '🔷', '💬', '🧯'].map((tool, i) => (
                      <div
                        key={i}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                          i === 0
                            ? 'bg-blue-500/20 border border-blue-500/40'
                            : 'bg-white/[0.03] border border-white/5'
                        }`}
                      >
                        {tool}
                      </div>
                    ))}
                    <div className="ml-auto text-[10px] text-slate-500">Last saved just now</div>
                  </div>
                </div>

                {/* Right column: chat + code */}
                <div className="col-span-12 md:col-span-3 flex flex-col gap-3">
                  {/* Team Chat */}
                  <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/5 p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <svg
                        className="w-4 h-4 text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                        />
                      </svg>
                      <span className="text-xs font-semibold text-slate-200">Team Chat</span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2">
                        <Avatar initials="MK" color="from-blue-500 to-sky-500" />
                        <div className="flex-1 rounded-lg bg-white/[0.04] px-2.5 py-1.5">
                          <div className="text-[9px] font-semibold text-slate-300">Manoj</div>
                          <div className="text-[10px] text-slate-400">
                            Great work on the layout!
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Avatar initials="RA" color="from-cyan-500 to-teal-500" />
                        <div className="flex-1 rounded-lg bg-white/[0.04] px-2.5 py-1.5">
                          <div className="text-[9px] font-semibold text-slate-300">Ravi</div>
                          <div className="text-[10px] text-slate-400">Pushing the code now 🚀</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 pl-1">
                        <span className="text-[9px] text-cyan-400 italic">Priya is typing...</span>
                        <div className="flex gap-0.5">
                          <span className="w-0.5 h-0.5 rounded-full bg-cyan-400 animate-bounce" />
                          <span
                            className="w-0.5 h-0.5 rounded-full bg-cyan-400 animate-bounce"
                            style={{ animationDelay: '120ms' }}
                          />
                          <span
                            className="w-0.5 h-0.5 rounded-full bg-cyan-400 animate-bounce"
                            style={{ animationDelay: '240ms' }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/5 px-2.5 py-1.5">
                      <span className="text-[10px] text-slate-500">Message...</span>
                      <div className="ml-auto flex gap-1">
                        <span className="w-3.5 h-3.5 rounded bg-white/5 flex items-center justify-center text-[8px] text-slate-400">
                          📎
                        </span>
                        <span className="w-3.5 h-3.5 rounded bg-blue-500/40 flex items-center justify-center text-[8px] text-white">
                          ➤
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom row: Code Room + Workspace Cards */}
                <div className="col-span-12 grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Code Room */}
                  <div className="md:col-span-7 rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                      <span className="text-xs font-semibold text-slate-200">api/server.ts</span>
                      <span className="text-[10px] text-emerald-400">● Live</span>
                    </div>
                    <div className="p-3 font-mono text-[10px] leading-relaxed">
                      <div className="text-slate-600">{'1 import {createRouter} from "app"'}</div>
                      <div className="text-slate-600">2</div>
                      <div className="text-slate-400">
                        {'3  '}
                        <span className="text-blue-400">const</span>{' '}
                        <span className="text-cyan-400">router</span> ={' '}
                        <span className="text-blue-400">createRouter</span>()
                      </div>
                      <div className="text-slate-600">
                        {'4  '}
                        router.
                        <span className="text-purple-400">get</span>(
                        <span className="text-emerald-400">"/collab"</span>, handler)
                      </div>
                      <div className="text-slate-600">
                        {'5 '}
                        <span className="text-slate-400">// Ravi is editing this line</span>
                      </div>
                    </div>
                  </div>

                  {/* Workspace Cards */}
                  <div className="md:col-span-5 rounded-xl bg-white/[0.02] border border-white/5 p-3">
                    <div className="text-xs font-semibold text-slate-200 mb-2.5">Workspaces</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { name: 'Project Atlas', color: '#3B82F6', members: '8', files: '42' },
                        { name: 'Internship', color: '#06B6D4', members: '5', files: '18' },
                        { name: 'FYP 2026', color: '#2563eb', members: '4', files: '27' },
                        { name: 'Hackathon', color: '#0ea5e9', members: '12', files: '63' },
                      ].map((ws) => (
                        <div
                          key={ws.name}
                          className="rounded-lg bg-[#0F172A]/70 border border-white/5 p-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <WorkspaceLogo color={ws.color} glyph={ws.name.charAt(0)} />
                            <span className="text-[10px] font-semibold text-slate-200 truncate">
                              {ws.name}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-[9px] text-slate-500">
                            <span>👥 {ws.members}</span>
                            <span>📄 {ws.files}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              Built for modern teamwork
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Everything your team needs to create together — in one focused workspace.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collaborationCards.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-6 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] backdrop-blur-sm hover:border-blue-500/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3B82F6]/20 to-[#06B6D4]/20 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 py-24 sm:py-32 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              Frequently asked questions
            </h2>
            <p className="text-slate-400 text-lg">
              Everything you need to know about collaborating.
            </p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden transition-colors hover:border-white/15"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-sm font-semibold pr-4">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-slate-500 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{faq.a}</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-12 sm:p-16 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-xl relative overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background:
                  'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.15), transparent 50%), radial-gradient(circle at 80% 80%, rgba(6,182,212,0.15), transparent 50%)',
              }}
            />
            <div className="relative">
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
                Ready to Collaborate?
              </h2>
              <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
                Bring your ideas together, work with your team, and build something amazing.
              </p>
              <Link
                to="/login"
                className="inline-flex px-10 py-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] hover:opacity-90 transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40"
              >
                Let's Start
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="text-sm font-bold">SyncSpace</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-slate-200 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-slate-200 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-slate-200 transition-colors">
                Security
              </a>
              <a href="#" className="hover:text-slate-200 transition-colors">
                Status
              </a>
            </div>
            <div className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} SyncSpace. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

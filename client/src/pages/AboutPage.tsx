import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import LogoMark from '../components/logo/LogoMark';
import AnimatedLogo from '../components/logo/AnimatedLogo';

const values = [
  {
    title: 'Simple',
    description:
      'No configs to wrestle, no tools to juggle. If it takes more than ten seconds to start, we have failed.',
    accent: '#D4AF37',
  },
  {
    title: 'Organized',
    description:
      'Workspaces, rooms and boards give every idea a home. Nothing important gets lost.',
    accent: '#B8860B',
  },
  {
    title: 'Accessible',
    description:
      'Passwordless sign-up, a generous free tier and a demo mode that works offline. Everyone can join in.',
    accent: '#C1121F',
  },
];

const stack = [
  ['React 18', 'Component-driven UI with hooks'],
  ['TypeScript', 'Strict, shared types end to end'],
  ['Vite 8', 'Instant dev server & fast builds'],
  ['Tailwind CSS', 'Utility-first styling'],
  ['Redux Toolkit', 'Predictable shared state'],
  ['Socket.IO', 'Real-time collaboration'],
  ['Express 5', 'Lean REST API'],
  ['MongoDB', 'Document database'],
  ['Mongoose 9', 'Schema & repository layer'],
  ['JWT', 'Secure rotating sessions'],
  ['Konva', 'Interactive canvas'],
  ['Monaco', 'In-browser code editing'],
];

export default function AboutPage() {
  return (
    <div
      className="min-h-screen bg-white text-[#111111] overflow-hidden"
      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}
    >
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.14), transparent 60%)' }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(193,18,31,0.08), transparent 60%)' }}
        />
      </div>

      <nav className="relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <LogoMark size={30} />
              <span className="text-lg font-bold tracking-tight text-[#111111]">SyncSpace</span>
            </Link>
            <div className="hidden sm:flex items-center gap-6">
              <Link
                to="/"
                className="text-sm font-medium text-[#555555] hover:text-[#111111] transition-colors"
              >
                Home
              </Link>
              <Link
                to="/features"
                className="text-sm font-medium text-[#555555] hover:text-[#111111] transition-colors"
              >
                Features
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#C1121F] hover:bg-[#9e0e19] transition-all shadow-lg shadow-red-500/25"
              >
                Start Collaborating
              </Link>
            </div>
            <Link
              to="/login"
              className="sm:hidden px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#C1121F] hover:bg-[#9e0e19] transition-all shadow-lg shadow-red-500/25"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative z-10 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-[#B8860B] bg-amber-50 border border-[#D4AF37]/30 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                About SyncSpace
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-8">
                One workspace for{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] via-[#B8860B] to-[#D4AF37]">
                  every team.
                </span>
              </h1>
              <p className="text-lg text-[#555555] leading-relaxed mb-10 max-w-xl">
                SyncSpace is a real-time collaboration platform where whiteboards, code, chat and
                project boards live together — so teams brainstorm, build and ship without leaving
                one another behind.
              </p>

              <div className="grid sm:grid-cols-2 gap-6 mb-10">
                <div className="p-6 rounded-2xl border border-[#D4AF37]/40 bg-[#FFFDF7]">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#B8860B] mb-2">
                    Mission
                  </div>
                  <p className="text-[#333333] leading-relaxed">
                    Making collaboration simple, organized and accessible.
                  </p>
                </div>
                <div className="p-6 rounded-2xl border border-[#C1121F]/25 bg-red-50/50">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#C1121F] mb-2">
                    Vision
                  </div>
                  <p className="text-[#333333] leading-relaxed">One workspace for every team.</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="flex items-center justify-center"
            >
              <div className="relative">
                <div
                  className="absolute inset-0 w-[420px] h-[420px] mx-auto rounded-full blur-3xl pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgba(212,175,55,0.25), transparent 65%)',
                  }}
                />
                <AnimatedLogo size={300} />
              </div>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-24">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl border border-[#EAEAEA] bg-white hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgba(184,134,11,0.35)] transition-all duration-300"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg mb-5"
                  style={{ background: value.accent }}
                >
                  {i + 1}
                </div>
                <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-sm text-[#555555] leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 sm:p-14 rounded-3xl border border-[#D4AF37]/40 bg-[#FFFDF7] overflow-hidden relative"
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 20% 0%, rgba(212,175,55,0.12), transparent 50%), radial-gradient(circle at 90% 100%, rgba(193,18,31,0.08), transparent 50%)',
              }}
            />
            <div className="relative">
              <div className="text-xs font-bold uppercase tracking-wider text-[#B8860B] mb-6">
                Technology Stack
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {stack.map(([name, desc]) => (
                  <div
                    key={name}
                    className="group flex flex-col gap-1 rounded-2xl border border-[#EAEAEA] bg-white px-5 py-4 hover:border-[#D4AF37]/60 hover:-translate-y-0.5 transition-all"
                  >
                    <span className="font-bold text-sm text-[#111111]">{name}</span>
                    <span className="text-xs text-[#777777]">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-24"
          >
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">Why SyncSpace?</h2>
            <p className="text-[#555555] text-lg max-w-2xl mx-auto mb-10">
              Because your team&apos;s ideas deserve a single, beautiful, real-time home.
            </p>
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl text-base font-semibold text-white bg-[#C1121F] hover:bg-[#9e0e19] transition-all shadow-xl shadow-red-500/30"
            >
              Start Collaborating
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-[#EAEAEA] py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <LogoMark size={26} />
            <span className="text-sm font-bold text-[#111111]">SyncSpace</span>
          </div>
          <div className="text-xs text-[#888888]">
            &copy; {new Date().getFullYear()} SyncSpace. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import LogoMark from '../components/logo/LogoMark';

interface Feature {
  title: string;
  tagline: string;
  description: string;
  points: string[];
  accent: string;
  icon: React.ReactNode;
}

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const features: Feature[] = [
  {
    title: 'Whiteboards',
    tagline: 'Brainstorm visually, together.',
    description:
      'An infinite canvas for your team to sketch, diagram and think out loud. Every stroke is shared instantly.',
    points: [
      'Pencil, shapes, text & arrows',
      'Multi-user live cursors',
      'Undo / redo history',
      'Save & revisit anytime',
    ],
    accent: '#D4AF37',
    icon: icon(
      'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42',
    ),
  },
  {
    title: 'Live Coding',
    tagline: 'Write code side by side.',
    description:
      'A shared code editor that stays in sync. See cursors, selections and files update in real time as you build.',
    points: [
      'Monaco editor with themes',
      'Live cursors & selections',
      'Multi-file explorer & tabs',
      'Terminal & output panels',
    ],
    accent: '#C1121F',
    icon: icon('M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5'),
  },
  {
    title: 'Team Chat',
    tagline: 'Talk without switching apps.',
    description:
      'Real-time messaging inside every room. Replies, emoji, typing indicators and read receipts keep conversations moving.',
    points: ['Threads & emoji reactions', 'Typing indicators', 'Seen status', 'Persistent history'],
    accent: '#B8860B',
    icon: icon(
      'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
    ),
  },
  {
    title: 'Project Boards',
    tagline: 'Track work that matters.',
    description:
      'Kanban boards that move as fast as your team — drag tasks across columns, set priorities and hit deadlines.',
    points: [
      'Drag-and-drop columns',
      'Priorities, labels & due dates',
      'Checklists & comments',
      'Assignees & filtering',
    ],
    accent: '#C1121F',
    icon: icon(
      'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
    ),
  },
  {
    title: 'Authentication',
    tagline: 'Frictionless, secure access.',
    description:
      'Join with just your name and email — no passwords to remember. Sessions are protected with rotating refresh tokens.',
    points: [
      'Passwordless sign-up',
      'Secure JWT sessions',
      'Session auto-refresh',
      'Protected routes',
    ],
    accent: '#D4AF37',
    icon: icon(
      'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9',
    ),
  },
  {
    title: 'Workspace Management',
    tagline: 'One home for every team.',
    description:
      'Workspaces group rooms, files, meetings and people. Roles and invites keep access exactly where it should be.',
    points: [
      'Create, archive & restore',
      'Owner / admin / member roles',
      'Email invites & join codes',
      'Activity timeline & insights',
    ],
    accent: '#B8860B',
    icon: icon(
      'M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z',
    ),
  },
];

export default function FeaturesPage() {
  return (
    <div
      className="min-h-screen bg-white text-[#111111] overflow-hidden"
      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}
    >
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.14), transparent 60%)' }}
        />
        <div
          className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full blur-3xl"
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
                to="/about"
                className="text-sm font-medium text-[#555555] hover:text-[#111111] transition-colors"
              >
                About
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#C1121F] hover:bg-[#9e0e19] transition-all shadow-lg shadow-red-500/25"
              >
                Get Started
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

      <section className="relative z-10 py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-[#B8860B] bg-amber-50 border border-[#D4AF37]/30 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              Everything in one place
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-5">
              Built to create{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] via-[#B8860B] to-[#D4AF37]">
                together
              </span>
            </h1>
            <p className="text-[#555555] text-lg max-w-2xl mx-auto">
              Six pillars of real-time collaboration, one elegant workspace. Pick a feature — they
              all work together.
            </p>
          </motion.div>

          <div className="space-y-16">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: (i % 2) * 0.1 }}
                className={`grid md:grid-cols-2 gap-8 md:gap-14 items-center ${
                  i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''
                }`}
              >
                <div className="p-8 sm:p-10 rounded-3xl border border-[#EAEAEA] bg-white shadow-sm hover:shadow-[0_24px_48px_-24px_rgba(184,134,11,0.35)] hover:border-[#D4AF37]/60 hover:-translate-y-1 transition-all duration-300">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                    style={{
                      background: `${feature.accent}14`,
                      border: `1px solid ${feature.accent}45`,
                      color: feature.accent,
                    }}
                  >
                    {feature.icon}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black mb-1.5">{feature.title}</h2>
                  <p className="text-lg font-semibold mb-3" style={{ color: feature.accent }}>
                    {feature.tagline}
                  </p>
                  <p className="text-[#555555] leading-relaxed mb-6">{feature.description}</p>
                  <ul className="space-y-2.5">
                    {feature.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-[#333333]">
                        <span
                          className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                          style={{ background: feature.accent }}
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative hidden md:flex items-center justify-center p-10">
                  <div
                    className="absolute inset-0 rounded-[2.5rem] blur-3xl pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${feature.accent}22, transparent 70%)`,
                    }}
                  />
                  <div
                    className="relative w-full max-w-md h-80 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 text-center px-8"
                    style={{ borderColor: `${feature.accent}60`, color: feature.accent }}
                  >
                    <div className="text-5xl font-black opacity-90">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="text-sm uppercase tracking-[0.3em] font-semibold opacity-80">
                      {feature.title}
                    </div>
                    <div className="text-xs text-[#999999] max-w-xs leading-relaxed">
                      Live preview coming soon in the product tour.
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-24"
          >
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl text-base font-semibold text-white bg-[#C1121F] hover:bg-[#9e0e19] transition-all shadow-xl shadow-red-500/30"
            >
              Get Started
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

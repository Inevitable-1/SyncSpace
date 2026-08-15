import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import LogoMark from '../components/logo/LogoMark';
import AnimatedLogo, { LOGO_ANIM_DURATION } from '../components/logo/AnimatedLogo';
import { demoLogin } from '../features/auth/authSlice';
import type { AppDispatch } from '../store';

const featureCards = [
  {
    title: 'Collaborative Whiteboards',
    description: 'Brainstorm ideas visually in real time.',
    badge: 'Live cursors',
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
    title: 'Live Code Collaboration',
    description: 'Write and review code together instantly.',
    badge: 'Real-time sync',
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
    title: 'Team Communication',
    description: 'Chat and coordinate without leaving your workspace.',
    badge: 'Instant messages',
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
    title: 'Shared Project Spaces',
    description: 'Keep all project assets and discussions organized.',
    badge: 'One place',
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
];

const faqs = [
  {
    q: 'What is SyncSpace?',
    a: 'SyncSpace is a premium real-time collaboration platform that brings your entire team into one shared workspace — whiteboards, code rooms, chat and project boards working together seamlessly.',
  },
  {
    q: 'Why should teams use SyncSpace?',
    a: 'Instead of juggling five different tools, SyncSpace gives you one elegant workspace where you can brainstorm, write code and communicate in real time — like Linear, Notion, Figma and GitHub combined.',
  },
  {
    q: 'How does real-time collaboration work?',
    a: 'Everything in a workspace stays in sync live. Open a room, invite your team, and every whiteboard stroke, line of code and message appears instantly for everyone — with presence indicators so you always know who is online.',
  },
  {
    q: 'Can multiple users edit together?',
    a: 'Yes. SyncSpace is built for shared editing — multiple teammates can draw, code and write on the same canvas simultaneously, with live cursors showing exactly where everyone is working.',
  },
  {
    q: 'Is SyncSpace suitable for students and developers?',
    a: 'Absolutely. It is perfect for study groups, hackathons, final year projects and development teams — sketch ideas together, share notes, write code side by side and keep everything in one place.',
  },
  {
    q: 'How secure is team data?',
    a: 'Security is a foundation of SyncSpace. Data is encrypted in transit and at rest, access is role-based, and every workspace is private by default — only invited members can see your work.',
  },
];

const particles = Array.from({ length: 22 }, (_, i) => {
  return {
    id: i,
    left: (i * 41 + 7) % 100,
    size: i % 3 === 0 ? 5 : 2,
    duration: 12 + (i % 7) * 3,
    delay: (i % 10) * 1.4,
    opacity: 0.18 + (i % 4) * 0.08,
    drift: (i % 2 === 0 ? 1 : -1) * (10 + (i % 5) * 8),
  };
});

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleDemoExplore = async () => {
    if (demoLoading) return;
    setDemoLoading(true);
    const action = await dispatch(demoLogin());
    if (demoLogin.fulfilled.match(action)) {
      navigate('/dashboard', { replace: true });
    } else {
      setDemoLoading(false);
    }
  };

  const navLinks = [
    { label: 'Features', href: '/features' },
    { label: 'FAQ', href: '#faq' },
    { label: 'About', href: '/about' },
  ];

  return (
    <div
      className="min-h-screen bg-white text-[#111111] overflow-hidden"
      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}
    >
      {/* Background gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.14), transparent 60%)' }}
        />
        <div
          className="absolute top-[30%] left-[-15%] w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.1), transparent 60%)' }}
        />
        <div
          className="absolute bottom-[-15%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(212,175,55,0.08), transparent 60%)',
          }}
        />
      </div>

      {/* Floating gold particles */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute bottom-[-20px] rounded-full"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              background: '#D4AF37',
              boxShadow: `0 0 ${p.size * 3}px rgba(212,175,55,0.6)`,
              ['--particle-x' as string]: `${p.drift}px`,
              ['--particle-opacity' as string]: p.opacity,
              animation: `floatParticle ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <LogoMark size={32} />
              <span className="text-lg font-bold tracking-tight text-[#111111]">SyncSpace</span>
              <span className="hidden sm:inline-flex ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#B8860B] bg-amber-50 border border-[#D4AF37]/30">
                Enterprise
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) =>
                link.href.startsWith('/') ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-sm font-medium text-[#555555] hover:text-[#111111] transition-colors"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm font-medium text-[#555555] hover:text-[#111111] transition-colors"
                  >
                    {link.label}
                  </a>
                ),
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/signin"
                className="px-4 py-2 text-sm font-medium text-[#555555] hover:text-[#111111] transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#C1121F] hover:bg-[#9e0e19] transition-all shadow-lg shadow-red-500/25"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Animated SyncSpace logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="relative flex justify-center"
          >
            <div
              className="absolute inset-0 -top-8 w-[460px] h-[460px] mx-auto rounded-full blur-3xl pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(212,175,55,0.22), transparent 65%)',
              }}
            />
            <AnimatedLogo size={220} className="sm:hidden" />
            <AnimatedLogo size={260} className="hidden sm:inline-flex" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: LOGO_ANIM_DURATION + 0.1 }}
            className="mt-10"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
              <span className="block text-[#111111]">One Workspace.</span>
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] via-[#B8860B] to-[#D4AF37] bg-[length:200%_auto] animate-[goldSweep_6s_ease-in-out_infinite]">
                Infinite Collaboration.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-[#555555] max-w-2xl mx-auto mb-10 leading-relaxed">
              Where teams brainstorm, build, and collaborate together.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="group relative px-8 py-3.5 rounded-xl text-base font-semibold text-white bg-[#C1121F] hover:bg-[#9e0e19] transition-all shadow-xl shadow-red-500/30"
              >
                Get Started
                <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <Link
                to="/signin"
                className="px-8 py-3.5 rounded-xl text-base font-semibold text-[#111111] border border-[#D4AF37]/60 bg-white hover:bg-[#FFFDF7] hover:border-[#D4AF37] transition-all shadow-sm"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-24 sm:py-32 bg-[#FFFDF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-[#B8860B] bg-amber-50 border border-[#D4AF37]/30 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              Everything in one place
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#111111] mb-4">
              Built to create together
            </h2>
            <p className="text-[#555555] text-lg max-w-2xl mx-auto">
              Whiteboards, code, chat and project boards — all synced live for your whole team.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureCards.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-6 rounded-2xl border border-[#EAEAEA] bg-white hover:border-[#D4AF37]/60 hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-[0_20px_40px_-20px_rgba(184,134,11,0.4)]"
              >
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgba(212,175,55,0.18), transparent 70%)',
                  }}
                />
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37]/15 to-[#B8860B]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#B8860B] mb-4 group-hover:scale-110 group-hover:border-[#D4AF37]/60 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-[#111111] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#555555] leading-relaxed mb-4">{feature.description}</p>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#B8860B]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                  {feature.badge}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 py-24 sm:py-32 border-t border-[#EAEAEA]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#111111] mb-4">
              Frequently asked questions
            </h2>
            <p className="text-[#555555] text-lg">
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
                className={`rounded-2xl border bg-white overflow-hidden transition-colors ${
                  openFaq === i
                    ? 'border-[#D4AF37] shadow-[0_12px_32px_-16px_rgba(184,134,11,0.35)]'
                    : 'border-[#EAEAEA] hover:border-[#D4AF37]/60'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-sm font-semibold text-[#111111] pr-4">{faq.q}</span>
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-sm shrink-0 transition-colors ${
                      openFaq === i
                        ? 'bg-[#C1121F] text-white'
                        : 'bg-amber-50 text-[#B8860B] border border-[#D4AF37]/40'
                    }`}
                  >
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-[#555555] leading-relaxed">{faq.a}</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-24 sm:py-32 bg-[#FFFDF7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-12 sm:p-16 rounded-3xl border border-[#D4AF37]/50 bg-white overflow-hidden shadow-[0_40px_80px_-32px_rgba(17,17,17,0.25)]"
          >
            <div
              className="absolute inset-0 opacity-60 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 25% 25%, rgba(212,175,55,0.14), transparent 55%), radial-gradient(circle at 80% 75%, rgba(212,175,55,0.1), transparent 55%)',
              }}
            />
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-[#C1121F] bg-red-50 border border-[#C1121F]/25 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C1121F] animate-pulse" />
                Your team is waiting
              </span>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[#111111] mb-4">
                Ready to collaborate without limits?
              </h2>
              <p className="text-[#555555] text-lg mb-10 max-w-xl mx-auto">
                Bring your ideas, code, and teamwork together in one powerful workspace.
              </p>
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl text-base font-semibold text-white bg-[#C1121F] hover:bg-[#9e0e19] transition-all shadow-xl shadow-red-500/30"
              >
                Get Started
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#EAEAEA] py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <LogoMark size={28} />
              <span className="text-sm font-bold text-[#111111]">SyncSpace</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#555555]">
              <a href="#" className="hover:text-[#111111] transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-[#111111] transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-[#111111] transition-colors">
                Security
              </a>
              <a href="#" className="hover:text-[#111111] transition-colors">
                Status
              </a>
            </div>
            <button
              type="button"
              onClick={handleDemoExplore}
              disabled={demoLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-[#B8860B] bg-amber-50 border border-[#D4AF37]/40 hover:bg-amber-100 hover:border-[#D4AF37] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122"
                />
              </svg>
              {demoLoading ? 'Loading demo...' : 'Try Demo'}
            </button>
            <div className="flex flex-col items-center gap-1.5 text-xs text-[#888888]">
              <span>&copy; {new Date().getFullYear()} SyncSpace. All rights reserved.</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-amber-50 px-3 py-1 text-[10px] font-semibold text-[#B8860B]">
                <LogoMark size={14} />
                SyncSpace v1.0 Internship Edition
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

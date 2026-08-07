import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const features = [
  {
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
          d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
        />
      </svg>
    ),
    title: 'Real-Time Collaboration',
    description:
      'Work together seamlessly with live cursors, instant sync, and multiplayer editing across whiteboards and code.',
  },
  {
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
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
        />
      </svg>
    ),
    title: 'AI-Powered Assistant',
    description:
      'Get intelligent suggestions, code generation, meeting summaries, and automated task creation powered by AI.',
  },
  {
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
          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
    ),
    title: 'Enterprise Security',
    description:
      'End-to-end encryption, SOC 2 compliance, SSO integration, and role-based access control for your team.',
  },
  {
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
          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
        />
      </svg>
    ),
    title: 'Lightning Fast',
    description:
      'Built with cutting-edge technology for instant load times, smooth animations, and zero-lag collaboration.',
  },
  {
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
          d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
        />
      </svg>
    ),
    title: 'Unlimited Workspaces',
    description:
      'Create unlimited workspaces, rooms, and projects. Organize your team however you want.',
  },
  {
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
          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Live Preview & Share',
    description:
      'Share your work instantly with anyone. Live preview, embed codes, and public links built in.',
  },
];

const stats = [
  { value: '50K+', label: 'Active Teams' },
  { value: '2M+', label: 'Sessions Hosted' },
  { value: '99.9%', label: 'Uptime' },
  { value: '<50ms', label: 'Latency' },
];

const testimonials = [
  {
    quote:
      "SyncSpace transformed how our distributed team collaborates. It's like having a virtual office that actually works.",
    author: 'Sarah Chen',
    role: 'CTO, TechFlow',
    avatar: 'SC',
  },
  {
    quote:
      'The AI assistant alone saves us hours every week. Meeting notes, code reviews, task creation — all automated.',
    author: 'Marcus Rodriguez',
    role: 'Engineering Lead, DataPulse',
    avatar: 'MR',
  },
  {
    quote:
      'We switched from 5 different tools to just SyncSpace. The real-time whiteboard and code editor are incredible.',
    author: 'Aisha Patel',
    role: 'Product Manager, InnovateCo',
    avatar: 'AP',
  },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for small teams getting started',
    features: [
      '3 Workspaces',
      'Unlimited Rooms',
      '5GB Storage',
      'Real-time Collaboration',
      'Basic AI Features',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/user/month',
    description: 'For growing teams that need more power',
    features: [
      'Unlimited Workspaces',
      'Unlimited Storage',
      'Advanced AI Assistant',
      'Priority Support',
      'Custom Integrations',
      'Analytics Dashboard',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations with advanced needs',
    features: [
      'Everything in Pro',
      'SSO & SAML',
      'Audit Logs',
      'Dedicated Support',
      'SLA Guarantee',
      'Custom Deployment',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const faqs = [
  {
    q: 'Is SyncSpace really free?',
    a: 'Yes! Our Free plan includes 3 workspaces, unlimited rooms, and real-time collaboration. No credit card required.',
  },
  {
    q: 'How does the AI assistant work?',
    a: 'Our AI assistant uses advanced language models to help with code generation, meeting summaries, task creation, and more. It understands your workspace context.',
  },
  {
    q: 'Can I use SyncSpace offline?',
    a: 'SyncSpace works best online, but we support limited offline mode for the code editor. Changes sync automatically when you reconnect.',
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. We use end-to-end encryption, SOC 2 Type II compliance, and your data is never used for training. You own your data.',
  },
];

function AnimatedCounter({ target, duration = 2 }: { target: string; duration?: number }) {
  const [count, setCount] = useState('0');

  useEffect(() => {
    const numericPart = parseInt(target.replace(/[^0-9]/g, ''), 10);
    const suffix = target.replace(/[0-9]/g, '');
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(numericPart * eased).toString() + suffix);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return <span>{count}</span>;
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Initialize demo mode for landing page demo button
  useEffect(() => {
    if (localStorage.getItem('auth')) {
      const auth = JSON.parse(localStorage.getItem('auth') || '{}');
      if (!auth?.state?.isDemo) {
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
      }
    } else {
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
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl animate-float" />
        <div
          className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '-2s' }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-600/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '-4s' }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-lg font-bold">SyncSpace</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Testimonials
              </a>
              <a href="#faq" className="text-sm text-gray-400 hover:text-white transition-colors">
                FAQ
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 transition-all shadow-lg shadow-brand-600/25"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 sm:pt-32 sm:pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-gray-300">Now in Public Beta</span>
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight mb-6">
              <span className="block">The Future of</span>
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400">
                Team Collaboration
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Real-time whiteboards, code editing, chat, and AI assistance — all in one premium
              workspace built for modern teams.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  // Enable demo mode and redirect to dashboard
                  const demoData = localStorage.getItem('syncspace-demo-user-workspaces');
                  if (!demoData) {
                    // If no demo data, store the demo user
                    localStorage.setItem('syncspace-demo-user-workspaces', JSON.stringify([]));
                  }
                  window.location.href = '/dashboard';
                }}
                className="group relative px-8 py-4 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 transition-all shadow-xl shadow-brand-600/30 hover:shadow-brand-500/40 hover:scale-105"
              >
                <span className="relative z-10">Live Demo</span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              </button>
              <Link
                to="/register"
                className="px-8 py-4 rounded-2xl text-base font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
              >
                Get Started Free
              </Link>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 relative"
          >
            <div className="relative mx-auto max-w-5xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl shadow-brand-600/10">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 text-center text-xs text-gray-500 font-medium">
                  SyncSpace
                </div>
              </div>
              <div className="p-8 sm:p-12">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 rounded-xl bg-gradient-to-br from-brand-600/20 to-purple-600/20 border border-brand-500/20 p-6 text-left">
                    <div className="text-sm font-semibold text-brand-300 mb-3">Whiteboard</div>
                    <div className="space-y-2">
                      <div className="h-2 rounded-full bg-brand-500/40 w-3/4" />
                      <div className="h-2 rounded-full bg-purple-500/30 w-1/2" />
                      <div className="h-2 rounded-full bg-pink-500/20 w-2/3" />
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold">
                        A
                      </div>
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold">
                        B
                      </div>
                      <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-[10px] font-bold">
                        C
                      </div>
                      <span className="text-[10px] text-gray-400">3 online</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-xl bg-emerald-600/10 border border-emerald-500/20 p-4 text-left">
                      <div className="text-xs font-semibold text-emerald-400 mb-2">
                        AI Assistant
                      </div>
                      <div className="space-y-1">
                        <div className="h-1.5 rounded-full bg-emerald-500/30 w-full" />
                        <div className="h-1.5 rounded-full bg-emerald-500/20 w-4/5" />
                      </div>
                    </div>
                    <div className="rounded-xl bg-purple-600/10 border border-purple-500/20 p-4 text-left">
                      <div className="text-xs font-semibold text-purple-400 mb-2">Code Editor</div>
                      <div className="font-mono text-[10px] text-purple-300/60">
                        <div>{'const app = () => {'}</div>
                        <div className="pl-2">return &lt;Main /&gt;</div>
                        <div>{'}'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-20 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-purple-400">
                  <AnimatedCounter target={stat.value} />
                </div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-black mb-4">Everything your team needs</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              A complete collaborative workspace with tools that work together seamlessly.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-brand-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600/20 to-purple-600/20 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 py-24 sm:py-32 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-black mb-4">Loved by teams worldwide</h2>
            <p className="text-gray-400 text-lg">See what our customers have to say.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg
                      key={j}
                      className="w-4 h-4 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.author}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-black mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-400 text-lg">Start free. Scale as you grow.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-8 rounded-2xl border transition-all ${
                  plan.highlighted
                    ? 'border-brand-500/50 bg-gradient-to-b from-brand-600/10 to-transparent shadow-xl shadow-brand-600/10'
                    : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-brand-500 to-purple-500 text-xs font-bold text-white">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">{plan.price}</span>
                    {plan.period && <span className="text-sm text-gray-500">{plan.period}</span>}
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                      <svg
                        className="w-4 h-4 text-brand-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block w-full py-3 rounded-xl text-center text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-lg shadow-brand-600/25 hover:shadow-brand-500/40'
                      : 'border border-white/10 text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 py-24 sm:py-32 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-black mb-4">Frequently asked questions</h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-sm font-semibold pr-4">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
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
                  <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">{faq.a}</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-12 rounded-3xl border border-white/10 bg-gradient-to-b from-brand-600/10 to-transparent relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 via-transparent to-purple-600/5" />
            <div className="relative">
              <h2 className="text-3xl sm:text-5xl font-black mb-4">
                Ready to transform your workflow?
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of teams already using SyncSpace to collaborate smarter.
              </p>
              <Link
                to="/register"
                className="inline-flex px-8 py-4 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 transition-all shadow-xl shadow-brand-600/30 hover:shadow-brand-500/40 hover:scale-105"
              >
                Get Started Free
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
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="text-sm font-bold">SyncSpace</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Security
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Status
              </a>
            </div>
            <div className="text-xs text-gray-600">
              &copy; {new Date().getFullYear()} SyncSpace. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

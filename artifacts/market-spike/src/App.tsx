import { useEffect, useRef } from 'react';
import { ClerkProvider, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { toast } from 'sonner';

import { AuthProvider, useAuth } from '@/context/AuthContext';

import River from './pages/river';
import XpHunt from './pages/xp-hunt';
import Home from './pages/home';
import Landing from './pages/landing';
import Profile from './pages/profile';
import Friends from './pages/friends';
import Learn from './pages/learn';
import Achievements from './pages/achievements';
import Leaderboard from './pages/leaderboard';
import Upgrade from './pages/upgrade';
import Trade from './pages/trade';
import Market from './pages/market';
import Portfolio from './pages/portfolio';
import StockDetail from './pages/stock-detail';
import NotFound from './pages/not-found';
import Speech from './pages/speech';
import UsersDirectory from './pages/users';
import UserProfile from './pages/user-profile';

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

// REQUIRED — resolves the publishable key from the host so the same build
// works across Clerk custom domains. Do not inline the env var.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — empty in dev (intentional), auto-set in prod. Do NOT gate on NODE_ENV.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

// Clerk passes full paths; wouter's setLocation prepends base — strip to avoid doubling.
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#6366f1',
    colorForeground: '#0f172a',
    colorMutedForeground: '#64748b',
    colorDanger: '#ef4444',
    colorBackground: '#ffffff',
    colorInput: '#f8fafc',
    colorInputForeground: '#0f172a',
    colorNeutral: '#e2e8f0',
    fontFamily: "'Outfit', system-ui, sans-serif",
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl shadow-indigo-500/10',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'font-black text-slate-900',
    headerSubtitle: 'text-slate-500 font-medium',
    socialButtonsBlockButtonText: 'font-bold text-slate-700',
    formFieldLabel: 'font-bold text-slate-700 text-sm',
    footerActionLink: 'text-indigo-600 font-bold hover:text-indigo-700',
    footerActionText: 'text-slate-500',
    dividerText: 'text-slate-400 font-medium',
    identityPreviewEditButton: 'text-indigo-600 font-bold',
    formFieldSuccessText: 'text-green-600 font-medium',
    alertText: 'font-medium',
    logoBox: 'mb-2',
    logoImage: 'rounded-xl',
    socialButtonsBlockButton: 'border-2 border-slate-200 hover:border-indigo-300 transition-colors font-bold',
    formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-wider transition-colors',
    formFieldInput: 'border-2 border-slate-200 focus:border-indigo-400 rounded-xl font-medium transition-colors',
    footerAction: 'bg-slate-50 border-t border-slate-100',
    dividerLine: 'bg-slate-200',
    alert: 'border rounded-xl',
    otpCodeFieldInput: 'border-2 border-slate-200 focus:border-indigo-400 rounded-xl font-black text-xl',
    formFieldRow: 'gap-3',
    main: 'gap-5',
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

/** Renders the page but overlays a sign-in gate for guests. */
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading, openAuthModal } = useAuth();

  if (isLoading) return null;

  if (!user) {
    return (
      <div className="relative min-h-[100dvh]">
        <Component />
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-background/70 backdrop-blur-sm px-6 md:pl-64">
          <div className="bg-background rounded-3xl shadow-2xl border border-border p-10 max-w-sm w-full text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </div>
            <h2 className="text-2xl font-black text-foreground leading-tight">Sign in to access this page</h2>
            <p className="text-muted-foreground font-medium text-base leading-relaxed">
              Sign in to access this page and save your amazing work!
            </p>
            <button
              onClick={openAuthModal}
              className="mt-2 w-full bg-primary text-white font-black text-base py-4 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/30"
            >
              Sign In / Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Component />;
}

function DailyCheckin() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    fetch('/api/users/daily-checkin', { method: 'POST', credentials: 'include' })
      .then(r => r.json())
      .then((data: { alreadyCheckedIn: boolean; xpEarned: number; streak: number; leveledUp: boolean }) => {
        if (!data.alreadyCheckedIn && data.xpEarned > 0) {
          toast(`🔥 ${data.streak}-day streak!`, {
            description: `+${data.xpEarned} XP bonus${data.leveledUp ? ' · Level up! 🎉' : ''}`,
            duration: 4000,
          });
        }
      })
      .catch(() => {});
  }, [user?.id]);

  return null;
}

// Invalidates React Query cache when the signed-in Clerk user changes.
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const id = user?.id ?? null;
      if (prevRef.current !== undefined && prevRef.current !== id) {
        qc.clear();
      }
      prevRef.current = id;
    });
    return unsub;
  }, [addListener, qc]);

  return null;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/home" component={Home} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/upgrade" component={Upgrade} />
      {/* REQUIRED: /*? is the only wouter syntax that matches both bare URL and Clerk OAuth sub-paths */}
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/play">{() => <ProtectedRoute component={River} />}</Route>
      <Route path="/xp-hunt">{() => <ProtectedRoute component={XpHunt} />}</Route>
      <Route path="/learn">{() => <ProtectedRoute component={Learn} />}</Route>
      <Route path="/achievements">{() => <ProtectedRoute component={Achievements} />}</Route>
      <Route path="/profile">{() => <ProtectedRoute component={Profile} />}</Route>
      <Route path="/friends">{() => <ProtectedRoute component={Friends} />}</Route>
      <Route path="/trade">{() => <ProtectedRoute component={Trade} />}</Route>
      <Route path="/market/:symbol">{() => <ProtectedRoute component={StockDetail} />}</Route>
      <Route path="/market">{() => <ProtectedRoute component={Market} />}</Route>
      <Route path="/portfolio">{() => <ProtectedRoute component={Portfolio} />}</Route>
      <Route path="/users/:username">{() => <ProtectedRoute component={UserProfile} />}</Route>
      <Route path="/users">{() => <ProtectedRoute component={UsersDirectory} />}</Route>
      <Route path="/speech">{() => {
        const { user } = useAuth();
        if (user?.email !== 'vaughnlevibrantley@gmail.com') {
          window.location.replace('/home');
          return null;
        }
        return <Speech />;
      }}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <AuthProvider>
          <TooltipProvider>
            <DailyCheckin />
            <AppRoutes />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;

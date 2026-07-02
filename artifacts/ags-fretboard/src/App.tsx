import { useEffect, useRef, useState } from "react";
import {
  Switch,
  Route,
  Redirect,
  Router as WouterRouter,
  useLocation,
} from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import WormholeTransition from "@/components/wormhole-transition";
import AlienGreeting from "@/components/alien-greeting";
import CheckoutReturn from "@/components/checkout-return";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Galaxy from "@/pages/galaxy";
import BossBattle from "@/pages/boss-battle";
import Layout from "@/components/layout";
import FretboardExplorer from "@/pages/fretboard";
import Achievements from "@/pages/achievements";
import Leaderboard from "@/pages/leaderboard";
import Profile from "@/pages/profile";
import FretboardPractice from "@/pages/practice/fretboard";
import IntervalsPractice from "@/pages/practice/intervals";
import ScalesPractice from "@/pages/practice/scales";
import ChordsPractice from "@/pages/practice/chords";
import EarTraining from "@/pages/practice/ear-training";
import FretboardGames from "@/pages/practice/fretboard-games";
import IntervalsLesson from "@/pages/learn/intervals";
import FindingNotesLesson from "@/pages/learn/finding-notes";
import ChordConstructionLesson from "@/pages/learn/chord-construction";
import ScalesLesson from "@/pages/learn/scales";
import Vault from "@/pages/vault";
import DailyPractice from "@/pages/daily-practice";
import TunerPage from "@/pages/tuner";
import MetronomePage from "@/pages/metronome";
import Avatar from "@/pages/avatar";
import Pricing from "@/pages/pricing";
import Privacy from "@/pages/privacy";
import PicksRender from "@/pages/picks-render";
import HallOfLegendsLive from "@/components/hall-of-legends-live";
import PremiumGate from "@/components/premium-gate";
import CabinetBrowser from "@/components/cabinet-browser";
import { usePremium } from "@/lib/usePremium";
import { setAuthTokenGetter, useUpdateTrail } from "@workspace/api-client-react";
import {
  hasFindingNotesViewed,
  hasIntervalsViewed,
  hasPracticeStarted,
  hasScaleLessonViewed,
  hasChordLessonViewed,
} from "@/lib/beginnerTrail";
import { Loader2, ArrowLeft } from "lucide-react";

const queryClient = new QueryClient();

// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so the
// same build serves multiple Clerk custom domains.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — copy verbatim. Empty in dev, auto-set in prod.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Clerk passes full paths to routerPush/routerReplace, but wouter's
// setLocation prepends the base — strip it to avoid doubling.
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#6A00FF",
    colorForeground: "#1a1145",
    colorMutedForeground: "#4c1d95",
    colorDanger: "#d11a1a",
    colorBackground: "#ffffff",
    colorInput: "#f5f3ff",
    colorInputForeground: "#1a1145",
    colorNeutral: "#1a1145",
    fontFamily: "'Space Grotesk', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-white border border-primary/30 rounded-2xl w-[440px] max-w-full shadow-[0_0_45px_rgba(106,0,255,0.45)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#1a1145] text-xl font-sans",
    headerSubtitle: "text-[#4c1d95]",
    socialButtonsBlockButtonText: "text-[#1a1145]",
    formFieldLabel: "text-[#1a1145]",
    footerActionLink: "text-primary hover:text-primary",
    footerActionText: "text-[#4c1d95]",
    dividerText: "text-[#4c1d95]",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-[#0a7d2c]",
    alertText: "text-[#1a1145]",
    logoBox: "flex justify-center",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton:
      "border border-primary/30 bg-white hover:bg-[#f5f3ff]",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-white",
    formFieldInput: "bg-[#f5f3ff] border border-primary/30 text-[#1a1145]",
    dividerLine: "bg-primary/20",
    alert: "bg-[#f5f3ff] border border-primary/30",
    otpCodeFieldInput: "text-[#1a1145] border border-primary/30",
    formFieldAction: "text-primary hover:text-primary",
    formFieldInputShowPasswordButton: "text-[#4c1d95] hover:text-[#1a1145]",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-[#0b1226] to-[#05030f] px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-[#0b1226] to-[#05030f] px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/galaxy" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

const PREMIUM_FEATURES = [
  "All drills — fretboard notes, scales, chords, ear training & fretboard games",
  "Every lesson — intervals, finding notes, chord construction, scales & modes",
  "The full galaxy — every solar system and boss battle",
  "Display Vault — collect and showcase legendary guitars",
  "Avatar Creator — forge your galactic guitarist identity",
  "Cinematic launch sequences and wormhole jumps",
];

// Gates a premium-only page: shows an upsell for free users instead of the page.
function PremiumRoute({
  component: Component,
  title,
  description,
}: {
  component: React.ComponentType;
  title: string;
  description: string;
}) {
  const { isPremium, isLoading } = usePremium();
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }
  if (!isPremium) {
    return (
      <PremiumGate
        title={title}
        description={description}
        features={PREMIUM_FEATURES}
      />
    );
  }
  return <Component />;
}

// The Hall of Legends room is premium-only. Free / anonymous players still get
// to walk the whole collection in close-up (the cabinet browser) as a teaser
// that nudges them to upgrade. Anonymous users go straight to the cabinet so we
// never fire (and block on) the auth-only profile query for them.
function HallRouteSignedIn() {
  const { isPremium, isLoading } = usePremium();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }
  return isPremium ? <HallOfLegendsLive /> : <CabinetBrowser showUpsell />;
}

function HallRoute() {
  const [, setLocation] = useLocation();
  return (
    <>
      <button
        type="button"
        className="ags-hall-exit"
        onClick={() => setLocation("/practice")}
      >
        <ArrowLeft /> Back to practice
      </button>
      <Show when="signed-out">
        <CabinetBrowser showUpsell />
      </Show>
      <Show when="signed-in">
        <HallRouteSignedIn />
      </Show>
    </>
  );
}

// The signed-in application: persistent Layout + warp transition + inner routes.
function AppShell() {
  const [location] = useLocation();
  const [warp, setWarp] = useState({ active: false, token: 0 });
  const prev = useRef(location);

  useEffect(() => {
    if (prev.current !== location) {
      prev.current = location;
      setWarp((w) => ({ active: true, token: w.token + 1 }));
    }
  }, [location]);

  return (
    <Layout>
      <CheckoutReturn />
      <WormholeTransition
        active={warp.active}
        token={warp.token}
        onDone={() => setWarp((w) => ({ ...w, active: false }))}
      />
      <Switch>
        <Route path="/galaxy" component={Galaxy} />
        <Route path="/boss/:system" component={BossBattle} />
        <Route path="/fretboard" component={FretboardExplorer} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/profile" component={Profile} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/vault">
          <PremiumRoute
            component={Vault}
            title="The Display Vault is Premium"
            description="Collect and showcase legendary guitars as you journey across the galaxy. Upgrade to unlock your vault."
          />
        </Route>
        <Route path="/avatar">
          <PremiumRoute
            component={Avatar}
            title="The Avatar Creator is Premium"
            description="Forge your galactic guitarist identity — species, outfit, signature axe and more. Upgrade to customize your avatar."
          />
        </Route>
        <Route path="/learn/intervals">
          <PremiumRoute
            component={IntervalsLesson}
            title="The training lessons are Premium"
            description="Study every interval with a guided lesson and a play-along reference table. Upgrade to unlock the full training library."
          />
        </Route>
        <Route path="/learn/finding-notes">
          <PremiumRoute
            component={FindingNotesLesson}
            title="The training lessons are Premium"
            description="Learn Rob's five octave formulas to find any note anywhere on the fretboard. Upgrade to unlock the full training library."
          />
        </Route>
        <Route path="/learn/chord-construction">
          <PremiumRoute
            component={ChordConstructionLesson}
            title="The training lessons are Premium"
            description="Learn how chords are built from interval-number formulas and how to voice their inversions. Upgrade to unlock the full training library."
          />
        </Route>
        <Route path="/learn/scales">
          <PremiumRoute
            component={ScalesLesson}
            title="The training lessons are Premium"
            description="Learn the Major scale formula, the Minor Pentatonic, and how CAGED and 3-NPS shapes cover the whole neck. Upgrade to unlock the full training library."
          />
        </Route>
        <Route path="/tuner" component={TunerPage} />
        <Route path="/metronome" component={MetronomePage} />
        <Route path="/practice" component={DailyPractice} />
        {/* Intervals drill is free — it's the entry-point hook */}
        <Route path="/practice/intervals" component={IntervalsPractice} />
        {/* All other drills are premium */}
        <Route path="/practice/fretboard">
          <PremiumRoute
            component={FretboardPractice}
            title="Fretboard Notes drill is Premium"
            description="Train yourself to name every note on every string, instantly. Upgrade to unlock all practice drills."
          />
        </Route>
        <Route path="/practice/scales">
          <PremiumRoute
            component={ScalesPractice}
            title="Scales drill is Premium"
            description="Spell major, pentatonic, and modal scales from memory across all keys. Upgrade to unlock all practice drills."
          />
        </Route>
        <Route path="/practice/chords">
          <PremiumRoute
            component={ChordsPractice}
            title="Chords drill is Premium"
            description="Build triads and seventh chords from interval formulas in every key. Upgrade to unlock all practice drills."
          />
        </Route>
        <Route path="/practice/ear-training">
          <PremiumRoute
            component={EarTraining}
            title="Ear Training is Premium"
            description="Identify intervals by ear and build the listening skills every guitarist needs. Upgrade to unlock all practice drills."
          />
        </Route>
        <Route path="/practice/fretboard-games">
          <PremiumRoute
            component={FretboardGames}
            title="Fretboard Games are Premium"
            description="Race the clock and challenge your fretboard knowledge with fast-paced games. Upgrade to unlock all practice drills."
          />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

// Everything that isn't a public route requires an authenticated user.
function ProtectedShell() {
  return (
    <>
      <Show when="signed-in">
        <AppShell />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

// Invalidate the query cache when the signed-in user changes.
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

const GREETING_KEY = "ags_greeting_seen";

// Shows the alien greeting once per browser session, over whatever the user
// lands on (landing page for signed-out, galaxy for signed-in).
function SessionGreeting() {
  const [show, setShow] = useState(() => {
    try {
      return sessionStorage.getItem(GREETING_KEY) !== "1";
    } catch {
      return true;
    }
  });

  if (!show) return null;

  return (
    <AlienGreeting
      onEnter={() => {
        try {
          sessionStorage.setItem(GREETING_KEY, "1");
        } catch {
          /* ignore storage errors */
        }
        setShow(false);
      }}
    />
  );
}

// Pushes any local trail flags to the server the moment a guest signs in.
// This is the primary sync path; the back-fill in galaxy.tsx remains as a fallback.
function TrailSignInSync() {
  const { addListener } = useClerk();
  const { mutate: persistTrail } = useUpdateTrail();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      const wasGuest = prevUserIdRef.current === null || prevUserIdRef.current === undefined;
      const isNowSignedIn = userId !== null;

      if (wasGuest && isNowSignedIn) {
        const findingNotes = hasFindingNotesViewed();
        const intervals = hasIntervalsViewed();
        const practice = hasPracticeStarted();
        const scaleLesson = hasScaleLessonViewed();
        const chordLesson = hasChordLessonViewed();

        if (findingNotes || intervals || practice || scaleLesson || chordLesson) {
          persistTrail({
            data: {
              ...(findingNotes ? { findingNotesViewed: true } : {}),
              ...(intervals ? { intervalsViewed: true } : {}),
              ...(practice ? { practiceStarted: true } : {}),
              ...(scaleLesson ? { scaleLessonViewed: true } : {}),
              ...(chordLesson ? { chordLessonViewed: true } : {}),
            },
          });
        }
      }

      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, persistTrail]);

  return null;
}

// Bridges the Clerk session token into the API client. The web app normally
// relies on the Clerk session cookie being sent automatically, but when the app
// runs inside an embedded iframe (e.g. the Replit canvas preview) browsers block
// that third-party cookie, so every API call comes back 401. Registering a token
// getter makes each request carry an `Authorization: Bearer <token>` header,
// which @clerk/express verifies regardless of cookies. Harmless in a normal tab.
function AuthTokenBridge() {
  const clerk = useClerk();
  useEffect(() => {
    setAuthTokenGetter(async () => {
      try {
        return (await clerk.session?.getToken()) ?? null;
      } catch {
        return null;
      }
    });
    return () => setAuthTokenGetter(null);
  }, [clerk]);
  return null;
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
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to continue your journey",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Start mastering the fretboard for free",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <AuthTokenBridge />
        <ClerkQueryClientCacheInvalidator />
        <TrailSignInSync />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/privacy" component={Privacy} />
            <Route path="/picks-render" component={PicksRender} />
            <Route path="/hall" component={HallRoute} />
            <Route path="/tuner">
              <Layout><TunerPage /></Layout>
            </Route>
            <Route path="/metronome">
              <Layout><MetronomePage /></Layout>
            </Route>
            <Route component={ProtectedShell} />
          </Switch>
          <Show when="signed-in">
            <SessionGreeting />
          </Show>
          <Toaster />
        </TooltipProvider>
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

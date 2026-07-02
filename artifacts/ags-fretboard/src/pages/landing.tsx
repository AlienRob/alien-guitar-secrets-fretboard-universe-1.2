import { Link } from "wouter";
import { Orbit, Compass, Target, Rocket, Trophy, Guitar } from "lucide-react";
import logoHorizontal from "@assets/ags_horizontal_logo_nobg.png";

const features = [
  { icon: Orbit, title: "Galaxy Map", text: "Progress through solar systems of fretboard challenges." },
  { icon: Compass, title: "Scale & Chord Finder", text: "Map every note, scale, and interval across the neck." },
  { icon: Target, title: "Daily Practice", text: "Targeted drills that adapt as your accuracy climbs." },
  { icon: Trophy, title: "Achievements", text: "Earn belts and climb the global leaderboard." },
];

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="flex items-center justify-between px-5 py-4 md:px-10">
        <img
          src={logoHorizontal}
          alt="Alien Guitar Secrets"
          className="h-8 w-auto object-contain drop-shadow-[0_0_10px_rgba(106,0,255,0.4)]"
        />
        <div className="flex items-center gap-2">
          <Link href="/sign-in">
            <button className="rounded-md border border-primary/40 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-white/5">
              Sign In
            </button>
          </Link>
          <Link href="/sign-up">
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
              Start Free
            </button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-12 md:py-20">
        <section className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-widest text-accent">
            <Rocket className="h-3.5 w-3.5" /> Master the fretboard
          </div>
          <h1 className="mx-auto max-w-3xl font-sans text-4xl font-bold leading-tight md:text-6xl">
            Learn the guitar fretboard like a cosmic adventure
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Alien Guitar Secrets turns note mastery into a journey across the galaxy.
            Start free with your first solar system, then unlock the full universe.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/sign-up">
              <button className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
                Create your free account
              </button>
            </Link>
            <Link href="/sign-in">
              <button className="rounded-md border border-primary/40 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-white/5">
                I already have an account
              </button>
            </Link>
          </div>
        </section>

        <section className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-primary/20 bg-card/50 p-5 alien-glow"
            >
              <f.icon className="mb-3 h-6 w-6 text-accent" />
              <h3 className="font-sans text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-16 rounded-2xl border border-primary/30 bg-card/40 p-6 text-center md:p-10">
          <Guitar className="mx-auto mb-3 h-7 w-7 text-accent" />
          <h2 className="font-sans text-2xl font-bold md:text-3xl">Ready to launch?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Free forever for Solar System 1. Upgrade anytime to unlock the full galaxy,
            cinematic launches, the Display Vault, and avatar customization.
          </p>
          <Link href="/sign-up">
            <button className="mt-6 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
              Start Free
            </button>
          </Link>
        </section>

        <footer className="mt-16 border-t border-primary/20 pt-6 text-center text-xs text-muted-foreground">
          <Link href="/privacy">
            <span className="cursor-pointer transition-colors hover:text-foreground">
              Privacy Policy
            </span>
          </Link>
        </footer>
      </main>
    </div>
  );
}

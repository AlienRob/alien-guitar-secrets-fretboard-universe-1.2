import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft, Rocket } from "lucide-react";
import NarrationPlayer from "./narration-player";

interface Props {
  kicker: string;
  title: string;
  intro: ReactNode;
  practiceHref: string;
  practiceLabel: string;
  children: ReactNode;
  narrationSrc?: string;
}

// Shared chrome for a teaching ("Learn") page: a back link to the galaxy, a
// styled header, the narrative intro, the topic-specific study material
// (children), and a call to action that launches the matching practice drill.
export default function LessonLayout({
  kicker,
  title,
  intro,
  practiceHref,
  practiceLabel,
  children,
  narrationSrc,
}: Props) {
  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      <Link href="/galaxy">
        <button
          type="button"
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" /> Back to the galaxy
        </button>
      </Link>

      <header className="space-y-3">
        <div className="font-mono text-sm uppercase tracking-[0.25em] text-primary">
          {kicker}
        </div>
        <h1 className="text-3xl font-bold text-accent sm:text-4xl">{title}</h1>
        <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
          {intro}
        </div>
      </header>

      {narrationSrc ? (
        <NarrationPlayer src={narrationSrc} label="Hear this lesson narrated" />
      ) : null}

      {children}

      <div className="rounded-lg border border-accent/40 bg-accent/5 p-5 text-center alien-glow">
        <p className="text-sm text-muted-foreground">
          Ready to test what you've learned?
        </p>
        <Link href={practiceHref}>
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-accent/50 bg-accent/10 px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/20"
          >
            <Rocket className="h-4 w-4" />
            {practiceLabel}
          </button>
        </Link>
      </div>
    </div>
  );
}

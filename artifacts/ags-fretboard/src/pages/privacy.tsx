import { Link } from "wouter";
import SpaceBackground from "@/components/space-background";
import logoHorizontal from "@assets/ags_horizontal_logo_nobg.png";

const CONTACT_EMAIL = "support@alienguitarsecrets.com.au";
const EFFECTIVE_DATE = "4 June 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 border-b border-primary/20 pb-2 font-sans text-xl font-semibold text-foreground">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function Privacy() {
  return (
    <div className="relative min-h-[100dvh] overflow-auto bg-background text-foreground">
      <SpaceBackground />
      <div className="relative z-10 mx-auto max-w-3xl px-6 py-12 md:py-16">
        <header className="mb-10 flex items-center justify-between">
          <Link href="/">
            <img
              src={logoHorizontal}
              alt="Alien Guitar Secrets"
              className="h-8 w-auto cursor-pointer object-contain drop-shadow-[0_0_10px_rgba(106,0,255,0.4)]"
            />
          </Link>
          <Link href="/">
            <span className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground">
              Back to home
            </span>
          </Link>
        </header>

        <div className="rounded-2xl border border-primary/30 bg-card/40 p-6 backdrop-blur-sm md:p-10">
          <h1 className="font-sans text-3xl font-bold uppercase tracking-tight text-accent">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm italic text-muted-foreground">
            Effective date: {EFFECTIVE_DATE}
          </p>

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            This Privacy Policy explains how Alien Guitar Secrets (&ldquo;we&rdquo;,
            &ldquo;us&rdquo;, &ldquo;our&rdquo;) handles information in the Alien Guitar Secrets
            mobile app (the &ldquo;App&rdquo;). We have built the App to respect your privacy:
            it works on your device and does not require an account.
          </p>

          <Section title="The short version">
            <p>
              The mobile App does not collect, store, or share any personal information about you.
              Your practice progress stays on your device. We do not run ads, we do not use
              tracking, and we do not sell data.
            </p>
          </Section>

          <Section title="Information we collect">
            <p>
              <span className="text-foreground">None.</span> The App does not ask you to sign in
              and does not send your information to us or to any third party. We have no servers
              receiving your data from the mobile App.
            </p>
          </Section>

          <Section title="Information stored on your device">
            <p>
              The App saves your learning progress — such as experience points, levels, ranks, and
              drill history — locally on your device so it is there when you return. This
              information never leaves your device. If you uninstall the App or clear its data, this
              information is removed.
            </p>
          </Section>

          <Section title="Microphone">
            <p>
              Some practice features (for example, listening to check the note you play) may ask for
              permission to use your device&rsquo;s microphone. If you allow it, audio is analysed
              live on your device only, to detect the musical note. We do not record, save, or send
              your audio anywhere. You can decline or change this permission at any time in your
              device settings, and the rest of the App will keep working.
            </p>
          </Section>

          <Section title="Children's privacy">
            <p>
              The App is suitable for general audiences and does not knowingly collect personal
              information from anyone, including children.
            </p>
          </Section>

          <Section title="Payments">
            <p>
              The mobile App does not currently sell anything or process payments. If paid features
              are added in the future, any purchase would be handled by the app store&rsquo;s
              billing system (Google Play or Apple), and this policy will be updated to describe it.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We may update this policy from time to time. When we do, we will change the effective
              date above. Significant changes will be reflected here on this page.
            </p>
          </Section>

          <Section title="Contact us">
            <p>
              If you have any questions about this Privacy Policy, you can reach us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-accent underline-offset-2 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

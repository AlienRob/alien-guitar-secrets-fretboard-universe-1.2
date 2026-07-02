import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Orbit, Trophy, User, Target, BarChart2, Menu, X, Guitar, UserCircle, LogOut, Sparkles, Crown, Landmark, Mic, Timer } from "lucide-react";
import { useUser, useClerk } from "@clerk/react";
import { usePremium } from "@/lib/usePremium";
import SpaceBackground from "@/components/space-background";
import PracticeMusic from "@/components/practice-music";
import logoHorizontal from "@assets/ags_horizontal_logo_nobg.png";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const { isPremium } = usePremium();

  const navItems = [
    { href: "/galaxy", label: "Galaxy Map", icon: Orbit },
    { href: "/practice", label: "Daily Practice", icon: Target },
    { href: "/vault", label: "Display Vault", icon: Guitar },
    { href: "/hall", label: "Hall of Legends", icon: Landmark },
    { href: "/tuner", label: "Tuner", icon: Mic },
    { href: "/metronome", label: "Metronome", icon: Timer },
    { href: "/achievements", label: "Achievements", icon: Trophy },
    { href: "/leaderboard", label: "Leaderboard", icon: BarChart2 },
    { href: "/profile", label: "Profile", icon: User },
    isPremium
      ? { href: "/pricing", label: "Membership", icon: Crown }
      : { href: "/pricing", label: "Upgrade", icon: Sparkles },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-primary/30 flex items-start justify-between">
        <div className="flex flex-col items-center text-center w-full">
          <img
            src={logoHorizontal}
            alt="Alien Guitar Secrets"
            className="w-full object-contain mb-2 drop-shadow-[0_0_12px_rgba(106,0,255,0.35)]"
          />
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Fretboard Universe</p>
        </div>
        <button
          className="md:hidden text-muted-foreground hover:text-foreground p-1 shrink-0"
          onClick={() => setOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <div
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md cursor-pointer transition-all duration-300 ${
                  isActive
                    ? "bg-primary/20 text-accent alien-border"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="font-sans font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-primary/30 p-4">
        <div className="mb-2 flex items-center gap-2 px-2 text-sm text-muted-foreground">
          <UserCircle className="h-5 w-5 shrink-0" />
          <span className="truncate">
            {user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress || "Guest"}
          </span>
        </div>
        <button
          onClick={() => signOut({ redirectUrl: basePath || "/" })}
          className="flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-sm text-muted-foreground transition-all duration-300 hover:bg-white/5 hover:text-foreground"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="font-sans font-medium">Log out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="relative flex min-h-screen w-full bg-background text-foreground overflow-hidden">
      <SpaceBackground />
      {/* Desktop sidebar */}
      <aside className="relative z-10 hidden md:flex w-64 border-r border-primary/30 bg-card/50 flex-col alien-glow shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 border-r border-primary/30 bg-[#070c1a] flex flex-col alien-glow transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 border-b border-primary/30 bg-card/30 flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-muted-foreground hover:text-foreground p-1"
              onClick={() => setOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <img
              src={logoHorizontal}
              alt="Alien Guitar Secrets logo"
              className="h-7 w-auto object-contain drop-shadow-[0_0_8px_rgba(106,0,255,0.4)]"
            />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs text-accent uppercase tracking-wider">System Online</span>
            </div>
            {/* Practice-music toggle lives here only while on a practice route;
                mounting/unmounting also starts/stops the ambient loop. */}
            {location.startsWith("/practice") && <PracticeMusic />}
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

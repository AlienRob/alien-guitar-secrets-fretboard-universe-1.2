import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type TransitionEvent as ReactTransitionEvent,
} from "react";
import { ZoomIn, Loader2 } from "lucide-react";
import { useGetProfile, useGetProfileSummary } from "@workspace/api-client-react";
import CabinetBrowser from "@/components/cabinet-browser";
import GuitarThumb from "@/components/guitar-thumb";
import GuitarModel3D from "@/components/guitar-model-3d";
import { GUITARS, RARITY_META, isUnlocked } from "@/data/guitars";
import { effectiveUnlockLevel } from "@/lib/access";
import { loadHandedness } from "@/lib/playerCustomization";
import "./hall-of-legends-live.css";

const base = import.meta.env.BASE_URL;
const HALL = `${base}assets/scenes/scene_hall_transparent.png`;
const VORTEX = `${base}assets/scenes/vortex_spiral.png`;

// The Hall of Legends is a trophy room: every guitar the player has WON (unlocked
// by level) hangs in a wall niche. Tap one to bring it to the central dais and
// admire it; "Closer look" opens the close-up browser for the whole collection.
type WallSlot = { x: number; y: number; h: number };

// Real wall niches, measured + verified against the hall art (centre x/y and
// height, % of frame). ~20 clean recesses (5 columns x 2 tiers per wall). The
// catalog can hold more guitars than niches, so once the player owns more than
// this, the extras are seen only in the close-up browser. Outer columns sit
// nearer the camera, so they're larger.
const NICHES: WallSlot[] = [
  // upper tier (left wall L1..L5, then right wall R1..R5)
  // Heights kept close together so every guitar reads as the same size in its
  // hanger, with only a gentle outer->inner taper for perspective (outer columns
  // sit nearer the camera). x/y are the measured recess centres; only h is
  // evened out, and h scales around the centre so guitars stay in their recess.
  { x: 4.5, y: 22, h: 13 },
  { x: 11.5, y: 22, h: 12.6 },
  { x: 18.5, y: 22.5, h: 12.2 },
  { x: 25, y: 23, h: 11.8 },
  { x: 31.5, y: 23.5, h: 11.5 },
  { x: 68.5, y: 23.5, h: 11.5 },
  { x: 75, y: 23, h: 11.8 },
  { x: 81.5, y: 22.5, h: 12.2 },
  { x: 88.5, y: 22, h: 12.6 },
  { x: 95.5, y: 22, h: 13 },
  // lower tier (nearer the camera than the upper tier, so a touch larger)
  { x: 4.5, y: 47, h: 13.5 },
  { x: 11.5, y: 46, h: 13.1 },
  { x: 18.5, y: 47, h: 12.7 },
  { x: 25, y: 48, h: 12.3 },
  { x: 31.5, y: 48, h: 12 },
  { x: 68.5, y: 48, h: 12 },
  { x: 75, y: 48, h: 12.3 },
  { x: 81.5, y: 47, h: 12.7 },
  { x: 88.5, y: 46, h: 13.1 },
  { x: 95.5, y: 47, h: 13.5 },
];

const TOTAL = GUITARS.length;

interface WallEntry {
  guitar: (typeof GUITARS)[number];
  number: number; // 1-based catalog position (its permanent No.)
  slot: WallSlot;
}

export default function HallOfLegendsLive() {
  const { data: profile, isLoading } = useGetProfile();
  const { data: summary } = useGetProfileSummary();
  const handed = loadHandedness();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [putAway, setPutAway] = useState(false);
  const [closeup, setCloseup] = useState(false);
  // When true the featured guitar sits on the dais; when false it sits in its
  // wall niche. Toggling it drives the CSS fly transition between the two.
  const [daisPos, setDaisPos] = useState(false);
  // True while a guitar is flying back from the dais to its niche (put away).
  const [returning, setReturning] = useState(false);
  const flybackTimer = useRef<number | null>(null);

  const prefersReducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const feature = useCallback((id: string) => {
    if (flybackTimer.current) {
      window.clearTimeout(flybackTimer.current);
      flybackTimer.current = null;
    }
    setReturning(false);
    // Start the newcomer in its niche so it can be seen flying to the dais.
    setDaisPos(false);
    setSelectedId(id);
    setPutAway(false);
  }, []);

  const level = effectiveUnlockLevel(
    profile?.level ?? 0,
    summary?.fullAccess ?? false,
  );

  // Every won guitar, in catalog order, paired with its permanent number.
  const unlocked = useMemo(
    () =>
      GUITARS.map((guitar, i) => ({ guitar, number: i + 1 }))
        .filter((e) => isUnlocked(e.guitar, level)),
    [level],
  );

  // The ones that get a wall niche (capped at how many niches exist).
  const wall: WallEntry[] = useMemo(() => {
    const chosen = unlocked.slice(0, NICHES.length);
    // The crown (the apex guitar with a 3D model) sits last in the catalog, so
    // the plain cap would leave it off the wall with nowhere to fly to. Always
    // give it a niche (taking the final slot when the wall is otherwise full).
    const apex = unlocked.find((e) => e.guitar.model3d);
    if (apex && !chosen.some((e) => e.guitar.id === apex.guitar.id)) {
      if (chosen.length < NICHES.length) chosen.push(apex);
      else chosen[chosen.length - 1] = apex;
    }
    return chosen.map((e, slotIdx) => ({ ...e, slot: NICHES[slotIdx] }));
  }, [unlocked]);

  // Featured guitar on the dais. Defaults to the player's newest legend (highest
  // unlock level), but any tapped wall guitar takes the stage.
  const defaultEntry = useMemo(() => {
    if (unlocked.length === 0) return undefined;
    return unlocked.reduce((best, e) =>
      e.guitar.unlockLevel >= best.guitar.unlockLevel ? e : best,
    );
  }, [unlocked]);

  // When "put away" is active the dais is empty and every won guitar hangs on
  // the wall. Otherwise one guitar is featured on the dais (its niche empty).
  const featured = putAway
    ? undefined
    : (unlocked.find((e) => e.guitar.id === selectedId) ?? defaultEntry);

  // The wall niche the featured guitar flies from/to. Guitars beyond the niche
  // cap have no niche, so they just arrive through the portal instead.
  const featuredSlot = useMemo(
    () => wall.find((e) => e.guitar.id === featured?.guitar.id)?.slot ?? null,
    [wall, featured],
  );

  // Fly the featured guitar OUT of its niche onto the dais: render it in the
  // niche first, then (next frame) flip to the dais so the CSS transition runs.
  useEffect(() => {
    if (!featured) return;
    if (!featuredSlot || prefersReducedMotion()) {
      setDaisPos(true);
      return;
    }
    setDaisPos(false);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setDaisPos(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featured?.guitar.id, featuredSlot]);

  useEffect(
    () => () => {
      if (flybackTimer.current) window.clearTimeout(flybackTimer.current);
    },
    [],
  );

  // "Put away": fly the dais guitar back to its niche, then clear the dais once
  // it lands (the niche guitar reappears exactly where the flyer touches down).
  const putAwayGuitar = useCallback(() => {
    if (returning) return;
    if (!featuredSlot || prefersReducedMotion()) {
      setPutAway(true);
      return;
    }
    setReturning(true);
    setDaisPos(false);
    flybackTimer.current = window.setTimeout(() => {
      setReturning(false);
      setPutAway(true);
      flybackTimer.current = null;
    }, 1100);
  }, [featuredSlot, returning]);

  const onStageTransitionEnd = useCallback(
    (e: ReactTransitionEvent<HTMLDivElement>) => {
      if (!returning) return;
      if (e.propertyName !== "top" && e.propertyName !== "left") return;
      if (flybackTimer.current) {
        window.clearTimeout(flybackTimer.current);
        flybackTimer.current = null;
      }
      setReturning(false);
      setPutAway(true);
    },
    [returning],
  );

  // Arrow keys flip the featured guitar through the wall (close-up overlay has
  // its own arrow handling, so stand down while it's open).
  const cycle = useCallback(
    (dir: number) => {
      if (wall.length === 0) return;
      const cur = wall.findIndex((e) => e.guitar.id === featured?.guitar.id);
      const next = ((cur < 0 ? 0 : cur) + dir + wall.length) % wall.length;
      feature(wall[next].guitar.id);
    },
    [wall, featured, feature],
  );

  useEffect(() => {
    if (closeup) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") cycle(-1);
      else if (e.key === "ArrowRight") cycle(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycle, closeup]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  const rarity = featured ? RARITY_META[featured.guitar.rarity] : null;

  return (
    <section className="ags-hall">
      <button
        type="button"
        className="ags-closer-btn"
        onClick={() => setCloseup(true)}
      >
        <ZoomIn /> Closer look
      </button>

      {/* Blurred full-bleed copy of the scene so the letterbox area around the
          fixed-ratio stage reads as part of the hall, not dead black. */}
      <img className="ags-hall-backdrop" src={HALL} alt="" aria-hidden="true" />

      <div className="ags-stage is-equipped">
        <img className="ags-hall-bg" src={HALL} alt="Hall of Legends" />

        <img className="ags-vortex" src={VORTEX} alt="" aria-hidden="true" />

        <div className="ags-energy-particles" aria-hidden="true">
          {Array.from({ length: 22 }).map((_, i) => (
            <span
              key={i}
              style={{
                left: `${38 + Math.random() * 24}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${4 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Won guitars hanging on the wall (the featured one is on the dais, so
            its niche sits empty). */}
        {wall
          .filter((e) => e.guitar.id !== featured?.guitar.id)
          .map((e) => (
            <button
              key={e.guitar.id}
              type="button"
              className="ags-wall-guitar"
              style={{
                left: `${e.slot.x}%`,
                top: `${e.slot.y}%`,
                height: `${e.slot.h}%`,
              }}
              onClick={() => feature(e.guitar.id)}
              title={`${e.guitar.name} — No. ${e.number} of ${TOTAL}`}
              aria-label={`Display ${e.guitar.name}, number ${e.number} of ${TOTAL}`}
            >
              {e.guitar.model3d ? (
                <GuitarModel3D
                  guitar={e.guitar}
                  handed={handed}
                  className="ags-wall-guitar-img ags-wall-guitar-img--3d"
                  interactive={false}
                />
              ) : (
                <GuitarThumb
                  guitar={e.guitar}
                  handed={handed}
                  className="ags-wall-guitar-img"
                />
              )}
              <span className="ags-wall-num" aria-hidden="true">
                {e.number}
              </span>
            </button>
          ))}

        {featured && (
          <div
            className={`ags-guitar-stage${featuredSlot ? " is-flying" : " is-portal"}`}
            style={
              daisPos || !featuredSlot
                ? { left: "50.2%", top: "49%", height: "42%" }
                : {
                    left: `${featuredSlot.x}%`,
                    top: `${featuredSlot.y}%`,
                    height: `${featuredSlot.h}%`,
                  }
            }
            onTransitionEnd={onStageTransitionEnd}
          >
            <div className="ags-guitar-glow" />
            <div className="ags-guitar-levitate" key={featured.guitar.id}>
              {featured.guitar.model3d ? (
                <GuitarModel3D
                  guitar={featured.guitar}
                  handed={handed}
                  className="ags-floating-guitar ags-floating-guitar--3d"
                  interactive={false}
                  autoRotate
                />
              ) : (
                <GuitarThumb
                  guitar={featured.guitar}
                  handed={handed}
                  className="ags-floating-guitar"
                />
              )}
            </div>
          </div>
        )}

        {featured && (
          <button
            type="button"
            className="ags-equip-btn"
            onClick={putAwayGuitar}
          >
            Put away
          </button>
        )}

        {/* Museum name plaque that stands with the guitar on the dais. */}
        {featured && rarity && !returning && (
          <div className="ags-plaque" key={featured.guitar.id}>
            <span className="ags-plaque-name">{featured.guitar.name}</span>
            <span className="ags-plaque-meta">
              <em style={{ color: rarity.color }}>{rarity.label}</em>
              <span className="ags-plaque-dot" aria-hidden="true">
                &middot;
              </span>
              No. {featured.number} of {TOTAL}
            </span>
          </div>
        )}

        {unlocked.length > 0 && !featured && (
          <div className="ags-hall-empty">
            <span>Tap a guitar on the wall to bring it to the dais.</span>
          </div>
        )}

        {unlocked.length === 0 && (
          <div className="ags-hall-empty">
            <strong>Your Hall awaits</strong>
            <span>
              Win guitars by levelling up and they&rsquo;ll take their place on
              these walls.
            </span>
          </div>
        )}
      </div>

      {closeup && (
        <div className="ags-closeup">
          <CabinetBrowser
            initialId={featured?.guitar.id}
            onClose={() => setCloseup(false)}
          />
        </div>
      )}
    </section>
  );
}

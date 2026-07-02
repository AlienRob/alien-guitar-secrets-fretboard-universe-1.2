import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

// A full-screen overlay that hands its whole area to a zoom/inspect viewer, so
// any guitar or piece of gear can be examined as large as the screen allows.
// Closes on the X button, the Escape key, or a click on the empty backdrop
// (clicks inside the header/viewer are ignored). Locks page scroll while open
// and behaves as a modal dialog (initial focus on the close button).
export default function FullscreenViewer({ title, onClose, children }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — full screen`}
      className="fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="truncate text-sm font-sans font-bold text-foreground sm:text-base">
          {title}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close full screen"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/15 bg-black/50 text-foreground backdrop-blur transition-colors hover:border-accent/70 hover:text-accent"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="relative min-h-0 flex-1" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

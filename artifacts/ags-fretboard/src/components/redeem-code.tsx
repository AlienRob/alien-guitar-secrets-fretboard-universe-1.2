import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useRedeemPremiumCode,
  getGetProfileSummaryQueryKey,
} from "@workspace/api-client-react";
import { Loader2, Ticket, Check } from "lucide-react";

// A small form letting a signed-in user redeem a premium access code (shared by
// the owner with friends/testers) to unlock premium without paying.
export default function RedeemCodeBox({ className = "" }: { className?: string }) {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const { mutate, isPending } = useRedeemPremiumCode();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Enter your access code.");
      return;
    }
    mutate(
      { data: { code: trimmed } },
      {
        onSuccess: () => {
          setDone(true);
          qc.invalidateQueries({ queryKey: getGetProfileSummaryQueryKey() });
        },
        onError: () => setError("That access code isn't valid."),
      },
    );
  };

  if (done) {
    return (
      <div
        className={`flex items-center justify-center gap-2 rounded-xl border border-[#0a7d2c]/40 bg-[#0a7d2c]/10 px-4 py-3 text-sm font-semibold text-[#22c55e] ${className}`}
      >
        <Check className="h-4 w-4" strokeWidth={3} />
        Access code accepted — premium unlocked. Enjoy the full galaxy.
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className={`rounded-xl border border-primary/30 bg-card/40 p-4 backdrop-blur ${className}`}
    >
      <div className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-accent">
        <Ticket className="h-3.5 w-3.5" /> Have an access code?
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter your code"
          autoComplete="off"
          className="flex-1 rounded-md border border-primary/30 bg-[#0b1020] px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:border-accent/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Ticket className="h-4 w-4" />
          )}
          Redeem
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-[#ff6b60]">{error}</p>}
    </form>
  );
}

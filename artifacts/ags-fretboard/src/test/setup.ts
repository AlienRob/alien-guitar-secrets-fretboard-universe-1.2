import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

// Stub Clerk so any component that calls useUser() / useClerk() / etc. works
// in the jsdom test environment without a <ClerkProvider>.
vi.mock("@clerk/react", () => ({
  useUser:  () => ({ isSignedIn: true, user: null }),
  useClerk: () => ({ signOut: vi.fn(), addListener: vi.fn() }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ClerkProvider: ({ children }: any) => children,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Show: ({ children }: any) => children,
  SignIn: () => null,
  SignUp: () => null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SignInButton: ({ children }: any) => children ?? null,
}));
import { cleanup } from "@testing-library/react";

// --- jsdom polyfills the Galaxy Map relies on ---------------------------------

// SolarSystem measures its stage with a ResizeObserver; jsdom has none.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver =
  globalThis.ResizeObserver ?? (ResizeObserverStub as typeof ResizeObserver);

// prefers-reduced-motion is read through window.matchMedia. Default to "no
// reduced motion"; individual tests override matchMedia to flip it on.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// Pointer capture APIs used by the drag interaction are absent in jsdom.
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

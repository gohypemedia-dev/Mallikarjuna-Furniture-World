"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

type GsapLike = typeof gsap;
type ScrollTriggerLike = typeof ScrollTrigger;
type LujoWindow = Window & { gsap?: GsapLike; ScrollTrigger?: ScrollTriggerLike };

const LENIS_OPTIONS = {
  duration: 1.2,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: "vertical" as const,
  gestureOrientation: "vertical" as const,
  smoothWheel: true,
  wheelMultiplier: 1,
  // phones/tablets keep native touch scrolling (feels better and keeps sticky sections exact)
  syncTouch: false,
  // menus, drawers and other inner scroll areas scroll natively
  allowNestedScroll: true,
  prevent: (node: HTMLElement) => node.closest("[data-lenis-prevent]") !== null,
};

/**
 * Wire Lenis to a GSAP instance: ScrollTrigger reads the smoothed position and Lenis is
 * stepped on GSAP's ticker so pinned/scrubbed animations stay frame-synced.
 */
function connect(lenis: Lenis, g: GsapLike, st: ScrollTriggerLike) {
  lenis.on("scroll", st.update);
  const tick = (time: number) => lenis.raf(time * 1000);
  g.ticker.add(tick);
  g.ticker.lagSmoothing(0);
  return () => g.ticker.remove(tick);
}

export default function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const isHome = pathname === "/";

  useEffect(() => {
    if (isDashboard) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let lenis: Lenis | null = null;
    let disconnect: (() => void) | null = null;
    let lockObserver: MutationObserver | null = null;
    let waitTimer: number | undefined;
    let cancelled = false;

    const start = (g: GsapLike, st: ScrollTriggerLike) => {
      if (cancelled) return;
      lenis = new Lenis(LENIS_OPTIONS);
      disconnect = connect(lenis, g, st);

      // The storefront locks the page by putting a class on <body> (mega menu, search, mobile menu,
      // cart drawer, newsletter popup → overflow: hidden). Stop Lenis while locked so the page behind
      // does not scroll, and resume afterwards. Only <body> is watched: Lenis itself toggles classes on <html>.
      let stopped = false;
      const syncLock = () => {
        if (!lenis) return;
        const locked = getComputedStyle(document.body).overflowY === "hidden";
        if (locked === stopped) return;
        stopped = locked;
        if (locked) lenis.stop();
        else lenis.start();
      };
      lockObserver = new MutationObserver(syncLock);
      lockObserver.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
      syncLock();

      // layout settles after fonts/images load: let ScrollTrigger re-measure against Lenis
      st.refresh();
    };

    if (isHome) {
      // The home page animations live in /lujo/lujo.js, which ships its own GSAP + ScrollTrigger on window.
      // Lenis must drive that instance (not the bundled one), so wait for it to load.
      const w = window as LujoWindow;
      const tryStart = (attempt: number) => {
        if (cancelled) return;
        if (w.gsap && w.ScrollTrigger) start(w.gsap, w.ScrollTrigger);
        else if (attempt < 100) waitTimer = window.setTimeout(() => tryStart(attempt + 1), 100);
        // lujo.js never loaded: leave native scrolling in place
      };
      tryStart(0);
    } else {
      gsap.registerPlugin(ScrollTrigger);
      start(gsap, ScrollTrigger);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(waitTimer);
      lockObserver?.disconnect();
      disconnect?.();
      lenis?.destroy();
    };
  }, [isDashboard, isHome]);

  return <>{children}</>;
}

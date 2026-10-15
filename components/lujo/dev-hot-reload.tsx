"use client";

import { useEffect } from "react";

/**
 * Development only. The storefront animations (lujo.js: GSAP pins, swipers, sticky story, loader) attach once
 * per page load. Next.js hot-swaps edited markup/CSS without reloading, which leaves those animations bound
 * to stale elements and stale measurements. When a hot update touches the storefront markup or styles,
 * do a full reload instead so everything is set up fresh.
 */
export default function DevHotReload() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    let armed = false;
    const arm = window.setTimeout(() => (armed = true), 4000); // ignore the initial page load
    const reload = () => armed && window.location.reload();

    // markup: the .lujo containers get their innerHTML replaced by a hot update
    const markup = new MutationObserver((records) => {
      if (records.some((r) => r.target instanceof Element && r.target.classList.contains("lujo"))) reload();
    });
    document.querySelectorAll(".lujo").forEach((el) => markup.observe(el, { childList: true }));

    // styles: a hot update adds/replaces stylesheet tags in <head>
    const styles = new MutationObserver((records) => {
      const changed = records.some((r) =>
        [...r.addedNodes, ...r.removedNodes].some(
          (n) => n instanceof HTMLStyleElement || (n instanceof HTMLLinkElement && n.rel === "stylesheet")
        )
      );
      if (changed) reload();
    });
    styles.observe(document.head, { childList: true });

    return () => {
      window.clearTimeout(arm);
      markup.disconnect();
      styles.disconnect();
    };
  }, []);

  return null;
}

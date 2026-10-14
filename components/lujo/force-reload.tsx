"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * The header/footer behaviour is plain DOM script that attaches once per page load, so storefront pages are
 * navigated with a real page load instead of a client-side transition. Moving inside /dashboard stays client-side.
 */
export default function ForceReload() {
  const pathname = usePathname();
  const first = useRef(pathname);

  useEffect(() => {
    if (pathname === first.current) return;
    const bothDashboard = pathname.startsWith("/dashboard") && first.current.startsWith("/dashboard");
    if (!bothDashboard) window.location.reload();
    first.current = pathname;
  }, [pathname]);

  return null;
}

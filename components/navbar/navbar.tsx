import Script from "next/script";
import headerHtml from "@/components/lujo/header-html";

/**
 * Site header: announcement bar, navbar, mega menu, search, mobile menu and the cart drawer.
 * Markup + behaviour come from the lujo clone (see components/lujo and public/lujo/lujo.js).
 */
export default function Navbar() {
  return (
    <>
      <div className="lujo" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: headerHtml }} />
      <Script id="lujo-bundle" src="/lujo/lujo.js" strategy="afterInteractive" />
    </>
  );
}

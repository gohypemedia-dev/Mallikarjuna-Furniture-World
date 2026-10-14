import Script from "next/script";
import footerHtml from "@/components/lujo/footer-html";

/** Site footer + newsletter popup (markup and behaviour from the lujo clone). */
export default function Footer() {
  return (
    <>
      <div className="lujo" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: footerHtml }} />
      <Script id="lujo-bundle" src="/lujo/lujo.js" strategy="afterInteractive" />
    </>
  );
}

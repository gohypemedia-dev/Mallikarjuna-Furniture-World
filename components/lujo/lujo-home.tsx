import homeHtml from "@/components/lujo/home-html";

/** Home page body: hero video, tabs, pinned slider, banner, products, our story, testimonials, journals, socials. */
export default function LujoHome() {
  return <div className="lujo" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: homeHtml }} />;
}

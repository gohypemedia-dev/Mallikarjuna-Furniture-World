import Navbar from "@/components/navbar/navbar";
import Footer from "@/components/footer/footer";
import LujoHome from "@/components/lujo/lujo-home";

// Static page: no database or API calls. Product data lives in public/lujo/lujo.js (js/data.js in the clone).
export default function Home() {
  return (
    <>
      <Navbar />
      <LujoHome />
      <Footer />
    </>
  );
}

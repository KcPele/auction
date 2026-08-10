import { Apply } from "./Apply";
import { Auctions } from "./Auctions";
import { Categories } from "./Categories";
import { FAQ } from "./FAQ";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { Nav } from "./Nav";
import { Trust } from "./Trust";

export function LandingPage() {
  return (
    <>
      <a href="#main-content" className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:translate-y-0">
        Skip to content
      </a>
      <Nav />
      <main id="main-content">
        <Hero />
        <Categories />
        <Auctions />
        <Trust />
        <HowItWorks />
        <Apply />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}

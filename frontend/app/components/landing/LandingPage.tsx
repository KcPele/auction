import { Apply } from "./Apply";
import { Auctions } from "./Auctions";
import { Categories } from "./Categories";
import { FAQ } from "./FAQ";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { Nav } from "./Nav";
import { Payments } from "./Payments";
import { SectionDivider } from "./Section";
import { Ticker } from "./Ticker";
import { Trust } from "./Trust";
import { Wallet } from "./Wallet";

export function LandingPage() {
  return (
    <>
      <Nav />
      <Ticker />
      <Hero />
      <SectionDivider />
      <Categories />
      <SectionDivider />
      <Auctions />
      <SectionDivider />
      <HowItWorks />
      <SectionDivider />
      <Wallet />
      <SectionDivider />
      <Trust />
      <SectionDivider />
      <Payments />
      <SectionDivider />
      <Apply />
      <SectionDivider />
      <FAQ />
      <Footer />
    </>
  );
}

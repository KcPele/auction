import { ClipboardCheck, Landmark, LockKeyhole, ScanSearch } from "lucide-react";
import { Section } from "./Section";
import { SectionHead } from "./primitives/SectionHead";

const ITEMS = [
  { icon: ScanSearch, title: "Item verification", description: "Cars are reviewed by registered mechanics. Gadget listings require proof of ownership." },
  { icon: ClipboardCheck, title: "Human approval", description: "A platform administrator reviews listing details and documents before an auction opens." },
  { icon: LockKeyhole, title: "Accountable bidding", description: "Wallet holds discourage fake bids and are released automatically when a bidder is outbid." },
  { icon: Landmark, title: "Recorded payments", description: "Bids, holds, releases, and settlement activity are recorded for support and dispute review." },
];

export function Trust() {
  return (
    <Section id="trust" className="bg-contrast text-contrast-foreground">
      <SectionHead
        kicker={<span className="text-primary-soft">Trust & safety</span>}
        title={<span className="text-contrast-foreground">Confidence comes from clear controls.</span>}
        sub={<span className="text-contrast-foreground/70">Every listing and financial action passes through an accountable process designed for online auctions.</span>}
      />
      <div className="grid gap-px overflow-hidden rounded-xl bg-contrast-foreground/15 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, description }) => (
          <article key={title} className="bg-contrast p-6 md:p-8">
            <Icon className="size-6 text-primary-soft" aria-hidden="true" />
            <h3 className="mt-5 font-semibold text-contrast-foreground">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-contrast-foreground/70">{description}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

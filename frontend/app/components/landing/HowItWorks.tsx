import { BadgeCheck, CircleDollarSign, Gavel, Search, ShieldCheck, WalletCards } from "lucide-react";
import { Section } from "./Section";
import { SectionHead } from "./primitives/SectionHead";

const BUYER_STEPS = [
  { icon: Search, title: "Explore verified listings", description: "Review photos, condition notes, ownership proof, and auction terms before you bid." },
  { icon: WalletCards, title: "Fund and place your bid", description: "A clearly disclosed percentage of your bid is held in your wallet while you remain active." },
  { icon: Gavel, title: "Win and complete payment", description: "Your hold counts toward the total. Pay the balance within the stated settlement window." },
];

const SELLER_STEPS = [
  { icon: BadgeCheck, title: "Apply to become a lister", description: "Choose cars, gadgets, or both. Our team reviews every listing application." },
  { icon: ShieldCheck, title: "Verify the item", description: "Cars need a mechanic review; gadgets need ownership documents and clear condition details." },
  { icon: CircleDollarSign, title: "Launch your auction", description: "Set the opening price and timing, then follow bids from your dashboard." },
];

function Flow({ label, steps }: { label: string; steps: typeof BUYER_STEPS }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 md:p-8">
      <h3 className="text-xl font-bold tracking-tight text-foreground">{label}</h3>
      <ol className="mt-6 flex flex-col gap-6">
        {steps.map(({ icon: Icon, title, description }, index) => (
          <li key={title} className="grid grid-cols-[auto_1fr] gap-4">
            <span className="flex size-10 items-center justify-center rounded-md bg-primary-soft text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <div className="text-xs font-semibold text-subtle-foreground">STEP {index + 1}</div>
              <h4 className="mt-1 font-semibold text-foreground">{title}</h4>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function HowItWorks() {
  return (
    <Section id="how" className="bg-background">
      <SectionHead
        kicker="How it works"
        title="A clear process for both sides."
        sub="The rules are visible before anyone commits. Buyers know how their money moves, and sellers know what verification requires."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Flow label="Buying at auction" steps={BUYER_STEPS} />
        <Flow label="Selling an item" steps={SELLER_STEPS} />
      </div>
    </Section>
  );
}

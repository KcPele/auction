import { ArrowRight, CarFront, Smartphone } from "lucide-react";
import { Section } from "./Section";
import { Button } from "./primitives/Button";

const REQUIREMENTS = [
  { icon: CarFront, title: "Cars", description: "Mechanic review and ownership documents" },
  { icon: Smartphone, title: "Gadgets", description: "Proof of ownership and condition details" },
];

export function Apply() {
  return (
    <Section id="sell" className="bg-surface">
      <div className="grid items-center gap-10 rounded-xl border border-border bg-primary-soft p-6 md:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
        <div>
          <div className="text-sm font-semibold text-primary">Sell with BidNaija</div>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
            Reach serious buyers through a verified auction.
          </h2>
          <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
            Apply once, submit clear item details, and let the platform manage bidding, wallet holds, and the settlement record.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button href="/register" size="lg">
              Apply to sell
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button href="#faq" variant="ghost" size="lg">Review requirements</Button>
          </div>
        </div>
        <div className="grid gap-3">
          {REQUIREMENTS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-center gap-4 rounded-lg border border-border bg-surface p-5">
              <span className="flex size-10 items-center justify-center rounded-md bg-surface-subtle text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <div className="font-semibold text-foreground">{title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

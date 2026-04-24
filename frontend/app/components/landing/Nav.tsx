import { BrandMark } from "./BrandMark";
import { Button } from "./primitives/Button";

const LINKS = [
  { href: "#auctions", label: "Live auctions" },
  { href: "#how", label: "How it works" },
  { href: "#trust", label: "Trust & safety" },
  { href: "#sell", label: "Sell / list" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-line bg-bg/70 px-5 py-3 backdrop-blur-xl backdrop-saturate-150 md:px-10 md:py-[18px]">
      <BrandMark size={28} />
      <div className="hidden gap-7 text-sm text-fg-muted md:flex">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} className="hover:text-fg transition-colors">
            {l.label}
          </a>
        ))}
      </div>
      <div className="flex items-center gap-2.5">
        <Button variant="ghost">Log in</Button>
        <Button variant="primary">Sign up to bid</Button>
      </div>
    </nav>
  );
}

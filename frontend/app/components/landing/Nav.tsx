import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { Button } from "./primitives/Button";

const LINKS = [
  { href: "#auctions", label: "Browse auctions" },
  { href: "#how", label: "How it works" },
  { href: "#trust", label: "Trust & safety" },
  { href: "#sell", label: "Sell with us" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-md">
      <nav
        className="mx-auto flex min-h-[var(--nav-h)] max-w-7xl items-center justify-between gap-6 px-5 md:px-8"
        aria-label="Main navigation"
      >
        <Link href="/" aria-label="BidNaija home">
          <BrandMark />
        </Link>
        <div className="hidden items-center gap-7 text-sm font-medium text-muted-foreground lg:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <Button href="/login" variant="ghost">
              Log in
            </Button>
          </div>
          <Button href="/register">Create account</Button>
        </div>
      </nav>
    </header>
  );
}

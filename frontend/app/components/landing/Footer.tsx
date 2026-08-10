import Link from "next/link";
import { BrandMark } from "./BrandMark";

const LINKS = [
  { href: "#auctions", label: "Browse auctions" },
  { href: "#how", label: "How it works" },
  { href: "#trust", label: "Trust & safety" },
  { href: "#sell", label: "Sell with us" },
  { href: "#faq", label: "FAQ" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <BrandMark />
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              A transparent auction marketplace for verified cars and gadgets across Nigeria.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Marketplace</h2>
            <nav className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground" aria-label="Footer marketplace links">
              {LINKS.map((link) => <a key={link.href} href={link.href} className="hover:text-foreground">{link.label}</a>)}
            </nav>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Account</h2>
            <nav className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground" aria-label="Footer account links">
              <Link href="/register" className="hover:text-foreground">Create account</Link>
              <Link href="/login" className="hover:text-foreground">Log in</Link>
            </nav>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-6 text-xs text-subtle-foreground">
          © 2026 BidNaija Technologies Ltd. Lagos, Nigeria.
        </div>
      </div>
    </footer>
  );
}

import { BrandMark } from "./BrandMark";

interface Col {
  heading: string;
  links: string[];
}

const COLS: Col[] = [
  { heading: "Auctions", links: ["Live cars", "Live gadgets", "Starting soon", "Recently settled", "Dealers directory"] },
  { heading: "For listers", links: ["Apply for a car code", "Apply for a gadget code", "Find a registered mechanic", "Proof of ownership guide", "Lister handbook"] },
  { heading: "Company", links: ["About", "Press & partnerships", "Help center", "Terms of service", "Privacy policy", "Dispute resolution"] },
];

const SOCIALS = ["X", "IG", "in", "YT"];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-bg-1 px-5 py-20 pb-10 md:px-10">
      <div
        className="pointer-events-none absolute bottom-[-300px] left-1/2 h-[600px] w-[1200px] -translate-x-1/2"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,122,26,0.2), transparent 60%)" }}
      />
      <div className="relative mx-auto grid max-w-[1280px] gap-12 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <BrandMark size={32} />
          <p className="my-4 mb-5 max-w-[300px] text-sm leading-[1.55] text-fg-muted">
            Nigeria&apos;s serious auction floor for cars and gadgets. Verified listings, real-money holds, Strowallet settlement, admin oversight — built for the market that made &quot;no wahala&quot; an art form.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <div className="rounded-full bg-[rgba(255,122,26,0.1)] px-2.5 py-1 text-[11px] font-semibold text-accent">
              🇳🇬 Proudly Nigerian
            </div>
            <div className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-fg-muted">
              Made in Lagos
            </div>
          </div>
        </div>
        {COLS.map((c) => (
          <div key={c.heading}>
            <h4 className="m-0 mb-4 text-xs uppercase tracking-[0.12em] text-fg-dim">{c.heading}</h4>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {c.links.map((l) => (
                <li key={l}>
                  <a className="cursor-pointer text-sm text-fg-muted hover:text-accent-2">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="relative mx-auto mt-12 flex max-w-[1280px] items-center justify-between border-t border-line pt-7 text-xs text-fg-dim">
        <div>© 2026 BidNaija Technologies Ltd. · RC 7284102 · Lagos, Nigeria</div>
        <div className="flex gap-3">
          {SOCIALS.map((s) => (
            <a
              key={s}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-line text-fg-muted hover:border-accent hover:text-accent"
            >
              {s}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

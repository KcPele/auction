import type { Step } from "./types";

export const BIDDER_STEPS: Step[] = [
  { title: "Register and fund your wallet", desc: "Sign up, verify your phone, and top up your dashboard wallet via Strowallet. No bid without balance — it keeps the floor serious.", detail: "$ strowallet.top_up(₦250,000) → wallet.available = ₦250,000" },
  { title: "Get notified before auctions start", desc: "We message you on email and WhatsApp 24h, 6h, and 1h before each auction. If your wallet is short for the expected hold, we nudge you to top up.", detail: '→ "Toyota Camry XLE starts in 1 hour. Estimated hold: ₦485,000. Top up?"' },
  { title: "Place a bid — 10–20% locks on your dashboard", desc: "When you bid, we atomically move 10–20% of your bid amount from available to held. Out-bid? Your hold returns instantly. This is what keeps bidding real.", detail: "→ bid.place(₦4,850,000) · hold = ₦485,000 · available -= ₦485,000" },
  { title: "Win the auction", desc: "When the timer hits zero, the highest bidder wins. Your held funds stay locked and automatically apply toward the final payment.", detail: "→ auction.closed · winner = you · held ₦485,000 counts toward total" },
  { title: "Pay the balance within 24 hours", desc: "Complete the remainder via Strowallet within 24 hours. Payment clears, seller is notified, delivery is arranged. Miss the window → hold forfeited.", detail: "→ strowallet.pay(₦4,365,000) · auction.settled · hold → applied" },
];

export const LISTER_STEPS: Step[] = [
  { title: "Apply for an access code", desc: "Listing is gated. Submit your application (dealer or individual) and wait for admin approval. One user can hold both car and gadget codes.", detail: '→ access_code.apply({ type: "car" | "gadget" }) · status: pending' },
  { title: "Cars: work with a registered mechanic", desc: "Before your car goes live, a registered mechanic inspects it in person and takes clear photos from every angle — exterior, interior, engine, tyres, odometer.", detail: "→ inspection.verified_by(mechanic_id) · photos[14] · report.attached" },
  { title: "Gadgets: upload proof of ownership", desc: "Original receipt. Or, if the box or receipt is missing, a police report will do. No proof, no listing — no exceptions.", detail: "→ proof.upload({ receipt | police_report }) · admin.review()" },
  { title: "Set start time, duration, and base price", desc: "You decide when it starts, how long it runs, and where bidding opens. You also set the hold percentage between 10–20%.", detail: "→ auction.create({ start, duration, base_price, hold_pct })" },
  { title: "Admin approves. It goes live.", desc: "Every listing crosses an admin desk before the timer starts. Once approved, notifications fire to your audience via email and WhatsApp.", detail: "→ admin.approve() · notifications.queue(email + whatsapp)" },
];

export const FAQS: { q: string; a: string }[] = [
  { q: "Why does bidding require a wallet hold?", a: "A wallet hold confirms that a bidder can support the bid they place. The required percentage is shown before bidding. If another bidder takes the lead, the hold is returned to the available wallet balance." },
  { q: "How do I fund my wallet?", a: "You can fund your wallet from the dashboard through Strowallet. Your available balance updates after the payment provider confirms the transaction." },
  { q: "What happens after I win?", a: "Your existing hold is applied toward the winning amount. You then have 24 hours to complete the remaining payment. The platform sends reminders before the deadline." },
  { q: "How do I become an approved seller?", a: "Create an account and apply for permission to list cars, gadgets, or both. The team reviews your application and unlocks the relevant listing tools after approval." },
  { q: "What documents are required for a gadget?", a: "Provide the original purchase receipt where possible. If it is unavailable, the review team may accept a police report together with the other listing and ownership details." },
  { q: "Can I choose which auction alerts I receive?", a: "Yes. Auction reminders are delivered through the notification channels enabled in your account preferences, and gadget alerts can be limited to users who opt in." },
  { q: "Can I place a bid lower than the current top bid?", a: "No. Your first bid must meet the base price, and later bids must meet the current top bid plus the displayed minimum increment." },
  { q: "Is my data safe?", a: "All traffic runs over HTTPS. Passwords are Argon2-hashed. Strowallet webhook signatures are verified server-side. Every bid and wallet movement is logged as a ledger entry, so disputes are resolved against the record." },
];

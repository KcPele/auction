import type { Auction, Step, TickerBid } from "./types";

export const TICKER_SEED: TickerBid[] = [
  { item: "2019 Toyota Camry XLE", bid: 4_850_000, user: "dami_o", city: "Lagos" },
  { item: "iPhone 15 Pro Max 256GB", bid: 985_000, user: "tunde.k", city: "Abuja" },
  { item: "2017 Honda Accord Sport", bid: 6_120_000, user: "nkem_a", city: "PH" },
  { item: 'MacBook Pro M3 14"', bid: 2_340_000, user: "zee__", city: "Lagos" },
  { item: "Samsung Galaxy S24 Ultra", bid: 780_000, user: "emeka_b", city: "Enugu" },
  { item: "2015 Lexus RX 350", bid: 9_400_000, user: "bolaji.o", city: "Ibadan" },
  { item: "PlayStation 5 Slim", bid: 520_000, user: "ade.p", city: "Lagos" },
  { item: "2020 Kia Sportage", bid: 11_200_000, user: "ifeoma_", city: "Abuja" },
  { item: "DJI Mavic 3 Pro", bid: 1_450_000, user: "chuka.v", city: "Lagos" },
];

export const AUCTIONS: Auction[] = [
  { title: "2017 Honda Accord Sport", meta: "Lagos · 94k km · Mechanic: K. Adebayo", bid: 6_120_000, bidders: 23, status: "live", end: 2 * 3600 + 14 * 60, kind: "car", tag: "CAR · 12 PHOTOS" },
  { title: "iPhone 15 Pro Max 256GB", meta: "Abuja · 97% battery · Receipt verified", bid: 985_000, bidders: 41, status: "live", end: 45 * 60, kind: "gadget", tag: "GADGET · 8 PHOTOS" },
  { title: "2020 Kia Sportage EX", meta: "Port Harcourt · 51k km · No accidents", bid: 11_200_000, bidders: 18, status: "live", end: 6 * 3600 + 32 * 60, kind: "car", tag: "CAR · 18 PHOTOS" },
  { title: 'MacBook Pro M3 14" 1TB', meta: "Lagos · 100% battery · Sealed box", bid: 2_340_000, bidders: 29, status: "starting", end: 15 * 60, kind: "gadget", tag: "GADGET · VIDEO" },
  { title: "2015 Lexus RX 350", meta: "Ibadan · 120k km · Full service history", bid: 9_400_000, bidders: 31, status: "scheduled", end: 18 * 3600, kind: "car", tag: "CAR · 22 PHOTOS" },
  { title: "PlayStation 5 Slim + 2 pads", meta: "Lagos · Mint · Original receipt", bid: 520_000, bidders: 14, status: "scheduled", end: 24 * 3600, kind: "gadget", tag: "GADGET · 6 PHOTOS" },
];

export const BIDDER_STEPS: Step[] = [
  { title: "Register and fund your wallet", desc: "Sign up, verify your phone, and top up your dashboard wallet via OPay. No bid without balance — it keeps the floor serious.", detail: "$ opay.top_up(₦250,000) → wallet.available = ₦250,000" },
  { title: "Get notified before auctions start", desc: "We message you on email and WhatsApp 24h, 6h, and 1h before each auction. If your wallet is short for the expected hold, we nudge you to top up.", detail: '→ "Toyota Camry XLE starts in 1 hour. Estimated hold: ₦485,000. Top up?"' },
  { title: "Place a bid — 10–20% locks on your dashboard", desc: "When you bid, we atomically move 10–20% of your bid amount from available to held. Out-bid? Your hold returns instantly. This is what keeps bidding real.", detail: "→ bid.place(₦4,850,000) · hold = ₦485,000 · available -= ₦485,000" },
  { title: "Win the auction", desc: "When the timer hits zero, the highest bidder wins. Your held funds stay locked and automatically apply toward the final payment.", detail: "→ auction.closed · winner = you · held ₦485,000 counts toward total" },
  { title: "Pay the balance within 24 hours", desc: "Complete the remainder via OPay within 24 hours. Payment clears, seller is notified, delivery is arranged. Miss the window → hold forfeited.", detail: "→ opay.pay(₦4,365,000) · auction.settled · hold → applied" },
];

export const LISTER_STEPS: Step[] = [
  { title: "Apply for an access code", desc: "Listing is gated. Submit your application (dealer or individual) and wait for admin approval. One user can hold both car and gadget codes.", detail: '→ access_code.apply({ type: "car" | "gadget" }) · status: pending' },
  { title: "Cars: work with a registered mechanic", desc: "Before your car goes live, a registered mechanic inspects it in person and takes clear photos from every angle — exterior, interior, engine, tyres, odometer.", detail: "→ inspection.verified_by(mechanic_id) · photos[14] · report.attached" },
  { title: "Gadgets: upload proof of ownership", desc: "Original receipt. Or, if the box or receipt is missing, a police report will do. No proof, no listing — no exceptions.", detail: "→ proof.upload({ receipt | police_report }) · admin.review()" },
  { title: "Set start time, duration, and base price", desc: "You decide when it starts, how long it runs, and where bidding opens. You also set the hold percentage between 10–20%.", detail: "→ auction.create({ start, duration, base_price, hold_pct })" },
  { title: "Admin approves. It goes live.", desc: "Every listing crosses an admin desk before the timer starts. Once approved, notifications fire to your audience via email and WhatsApp.", detail: "→ admin.approve() · notifications.queue(email + whatsapp)" },
];

export const FAQS: { q: string; a: string }[] = [
  { q: "Why does bidding need a hold?", a: "To keep bidding serious. Every bid locks 10–20% of the amount on your dashboard — atomically. If you don't have enough available, the bid is rejected. If you're outbid, the hold returns instantly. It stops fake bids cold." },
  { q: "How do I fund my wallet?", a: "Top up via OPay directly from your dashboard. Once the OPay webhook confirms settlement, your available balance updates. Top-ups are near-instant." },
  { q: "What happens if I win but can't pay in 24 hours?", a: "The hold is forfeited per platform policy, and the auction either falls to the second-highest bidder or is re-listed — admin decides case by case. This is why we send 12h, 4h, and 1h reminders." },
  { q: "How do I become a lister?", a: 'Apply for an access code (car, gadget, or both). Admin reviews your application. Once approved, a "List a Vehicle" or "List a Gadget" section unlocks on your dashboard. Cars require a registered mechanic. Gadgets require proof of ownership.' },
  { q: "What counts as proof of ownership for a gadget?", a: "The original receipt is the gold standard. If the box or receipt is missing, a police report will do. No proof, no listing — no exceptions." },
  { q: "Do I get notified about every auction?", a: 'For cars: yes — every registered car dealer and individual gets the notification (via email and WhatsApp). For gadgets: only users with the "Ready to Bid" toggle ON in their preferences. You control your noise.' },
  { q: "Can I place a bid lower than the current top bid?", a: "On gadgets, technically yes — but only the highest bid at close wins, so a lower bid just locks your hold for nothing. On cars, your bid must be at or above the base price." },
  { q: "Is my data safe?", a: "All traffic runs over HTTPS. Passwords are Argon2-hashed. OPay webhook signatures are verified server-side. Every bid and wallet movement is logged as a ledger entry, so disputes are resolved against the record." },
];

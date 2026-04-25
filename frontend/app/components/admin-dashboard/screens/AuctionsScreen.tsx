"use client";
import { LiveAuctions } from "../widgets/LiveAuctions";
import { SectionHeader } from "./SectionHeader";

export function AuctionsScreen() {
  return (
    <>
      <SectionHeader
        title="Live auctions monitor"
        sub="All running auctions in real time. Intervene on suspicious bidding, extend, or cancel with full hold release."
      />
      <LiveAuctions />
    </>
  );
}

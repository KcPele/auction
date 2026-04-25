"use client";
import { LiveAuctions } from "../widgets/LiveAuctions";
import { SectionHeader } from "./SectionHeader";

export function AuctionsScreen() {
  // Integration: fetch from GET /api/v1/admin/auctions?status=LIVE
  // when backend admin auction endpoint is available
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

"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { auctionsSocket } from "@/app/lib/realtime/socket";
import { koboToNaira } from "@/app/lib/format/money";
import type {
  Auction,
  AuctionDetail,
  Bid,
  BidStatusWire,
} from "../types/auction.types";
import { auctionKeys } from "./auction-keys";

type BidPayloadDto = {
  bid: {
    id: string;
    auctionId: string;
    bidderId: string;
    amountKobo: number;
    status: BidStatusWire;
    createdAt: string;
  };
  isTopBid: boolean;
};

type StatusChangedDto = {
  auctionId: string;
  previousStatus: string;
  newStatus: string;
};

/**
 * Subscribe to live bid + status events for one auction. Joins the auction
 * room on mount, leaves on unmount. Server pushes go straight into the
 * existing React Query cache via setQueryData — components keep reading
 * `useAuctionBids` / `useAuction` and don't see the socket at all.
 */
export function useAuctionBidsStream(auctionId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!auctionId) return;
    const socket = auctionsSocket();

    if (!socket.connected) socket.connect();
    socket.emit("auction.join", { auctionId });

    const onBidPlaced = (e: BidPayloadDto) => {
      const newBid: Bid = {
        id: e.bid.id,
        userId: e.bid.bidderId,
        // Server doesn't send the masked handle on this event; preserve a
        // stable fallback. The next refetch reconciles to the real handle.
        handle: "@anonymous",
        amount: koboToNaira(e.bid.amountKobo),
        placedAt: new Date(e.bid.createdAt),
        isLeading: e.isTopBid,
        status: e.bid.status,
      };

      qc.setQueryData<Bid[]>(auctionKeys.bids(auctionId), (prev) => {
        if (!prev) return [newBid];
        if (prev.some((b) => b.id === newBid.id)) return prev;
        const next = e.isTopBid
          ? prev.map((b) => ({ ...b, isLeading: false }))
          : prev;
        return [newBid, ...next];
      });

      // Top-bid display lives on the auction detail; bump it too.
      if (e.isTopBid) {
        qc.setQueryData<AuctionDetail>(
          auctionKeys.detail(auctionId),
          (cur) =>
            cur
              ? { ...cur, basePrice: Math.max(cur.basePrice, newBid.amount) }
              : cur,
        );
      }
    };

    const onTopChanged = (e: { auctionId: string; bid: BidPayloadDto["bid"] }) => {
      qc.setQueryData<Bid[]>(auctionKeys.bids(auctionId), (prev) =>
        prev
          ? prev.map((b) => ({ ...b, isLeading: b.id === e.bid.id }))
          : prev,
      );
    };

    const onStatusChanged = (e: StatusChangedDto) => {
      qc.setQueryData<AuctionDetail>(auctionKeys.detail(auctionId), (cur) =>
        cur
          ? {
              ...cur,
              status: e.newStatus as Auction["status"],
              isLive: e.newStatus === "LIVE",
              isUpcoming: e.newStatus === "SCHEDULED",
              isEnded:
                e.newStatus === "ENDED" ||
                e.newStatus === "AWAITING_PAYMENT" ||
                e.newStatus === "SETTLED" ||
                e.newStatus === "CANCELLED",
            }
          : cur,
      );
    };

    const onClosed = () =>
      qc.invalidateQueries({ queryKey: auctionKeys.detail(auctionId) });

    socket.on("bid.placed", onBidPlaced);
    socket.on("auction.topBidChanged", onTopChanged);
    socket.on("auction.statusChanged", onStatusChanged);
    socket.on("auction.closed", onClosed);

    return () => {
      socket.emit("auction.leave", { auctionId });
      socket.off("bid.placed", onBidPlaced);
      socket.off("auction.topBidChanged", onTopChanged);
      socket.off("auction.statusChanged", onStatusChanged);
      socket.off("auction.closed", onClosed);
    };
  }, [auctionId, qc]);
}

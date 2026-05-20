"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMe } from "@/app/components/auth/hooks/use-me";
import {
  useAuction,
  useAuctionBids,
  useConfirmWinnerPayment,
} from "@/app/components/auctions/hooks/use-auctions";
import { useAuctionBidsStream } from "@/app/components/auctions/hooks/use-auction-bids-stream";
import { BidBar } from "@/app/components/auctions/widgets/BidBar";
import { BidHistoryList } from "@/app/components/auctions/widgets/BidHistoryList";
import { DetailHero } from "@/app/components/auctions/widgets/DetailHero";
import { ApiError } from "@/app/lib/api/error";
import { Icon } from "../primitives/Icon";
import { Countdown } from "../widgets/Countdown";
import { fmtNaira } from "../utils";

const BID_BTN_BG = {
  background: "linear-gradient(180deg, var(--accent-light), var(--accent))",
};

export function DetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const { data: me } = useMe();
  const { data: auction, isLoading, isError, refetch } = useAuction(id);
  const { data: bids = [], isLoading: bidsLoading } = useAuctionBids(id);
  const confirmPayment = useConfirmWinnerPayment(id);

  // Subscribe to live bid + status events; no extra render in this component,
  // events stream straight into the React Query cache so the lists above
  // auto-update.
  useAuctionBidsStream(id);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !auction) {
    return (
      <div className="py-12 text-center">
        <div className="text-sm text-fg-dim">Could not load auction.</div>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 text-xs font-medium text-accent"
        >
          Retry
        </button>
      </div>
    );
  }

  const topBid = bids[0]?.amount ?? auction.basePrice;
  const minIncrement = Math.max(auction.minimumBidIncrement, 1_000);

  const isWinner = me && auction.winnerId === me.id;
  const showWinnerActions =
    isWinner &&
    (auction.status === "AWAITING_PAYMENT" || auction.status === "ENDED");

  const countdownTarget = (
    auction.isLive ? auction.endTime : auction.startTime
  ).getTime();

  return (
    <>
      <DetailHero auction={auction} />

      <div className="py-4 pb-3">
        <h1 className="m-0 mb-1 font-display text-[22px] font-semibold leading-[1.15] tracking-tight">
          {auction.title}
        </h1>
        {auction.subtitle && (
          <div className="text-xs text-fg-muted">{auction.subtitle}</div>
        )}
      </div>

      <div className="mb-3.5 grid grid-cols-2 gap-2.5 rounded-[14px] border border-line bg-surface p-3.5">
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-[0.1em] text-fg-dim">
            {auction.isLive ? "Top bid" : "Starts at"}
          </div>
          <div className="font-mono text-[18px] font-semibold tabular-nums text-accent-light">
            {fmtNaira(auction.isLive ? topBid : auction.basePrice)}
          </div>
          <div className="mt-0.5 text-[11px] text-fg-dim">
            {bids.length} bids placed
          </div>
        </div>
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-[0.1em] text-fg-dim">
            {auction.isLive ? "Ends in" : "Opens in"}
          </div>
          <Countdown target={countdownTarget} />
        </div>
      </div>

      <div className="my-3.5 grid grid-cols-2 gap-2.5">
        <Stat lbl="Bid increment" val={fmtNaira(minIncrement)} />
        <Stat lbl="Hold %" val={`${auction.holdPercent}%`} />
        <Stat lbl="Status" val={auction.status.replace("_", " ").toLowerCase()} />
        <Stat lbl="Category" val={auction.category} />
      </div>

      <div className="my-3 mt-5 flex items-center justify-between">
        <div className="text-[15px] font-semibold tracking-tight">
          Bid history
        </div>
      </div>
      <BidHistoryList
        bids={bids}
        currentUserId={me?.id}
        isLoading={bidsLoading}
      />

      {showWinnerActions && (
        <div className="my-4 flex flex-col gap-2">
          <button
            type="button"
            disabled={confirmPayment.isPending}
            onClick={async () => {
              try {
                await confirmPayment.mutateAsync(undefined);
                toast.success("Payment confirmation sent");
              } catch (err) {
                if (err instanceof ApiError) toast.error(err.message);
                else toast.error("Could not confirm");
              }
            }}
            className="w-full rounded-xl border-none p-3.5 text-sm font-bold text-[#1a0a00] disabled:opacity-60"
            style={BID_BTN_BG}
          >
            {confirmPayment.isPending ? "Sending…" : "Confirm payment"}
          </button>
          <button
            type="button"
            onClick={() =>
              router.push(`/dashboard/auction/${id}/payment`)
            }
            className="w-full rounded-xl border border-line bg-surface p-3.5 text-sm font-medium text-fg"
          >
            <Icon name="wallet" size={16} className="mr-1.5 inline-block" />
            Payment instructions
          </button>
        </div>
      )}

      {auction.isLive ? (
        <BidBar
          auctionId={id}
          topBidNaira={topBid}
          minIncrementNaira={minIncrement}
        />
      ) : auction.isUpcoming ? (
        <div className="sticky bottom-0 -mx-[18px] -mb-6 px-[18px] pt-3.5">
          <button
            type="button"
            className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border-none px-5 py-3.5 text-sm font-bold text-[#1a0a00]"
            style={BID_BTN_BG}
          >
            <Icon name="bell" size={16} /> Remind me when it opens
          </button>
        </div>
      ) : null}
    </>
  );
}

function Stat({ lbl, val }: { lbl: string; val: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <div className="text-[10px] uppercase tracking-[0.08em] text-fg-dim">
        {lbl}
      </div>
      <div className="mt-0.5 truncate text-sm font-medium capitalize">{val}</div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <>
      <div className="-mx-[18px] aspect-[4/3] animate-pulse bg-surface-2" />
      <div className="space-y-3 py-4">
        <div className="h-6 w-2/3 animate-pulse rounded bg-surface-2" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-surface-2" />
        <div className="h-24 w-full animate-pulse rounded-[14px] bg-surface-2" />
      </div>
    </>
  );
}

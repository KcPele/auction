"use client";
import { toast } from "sonner";
import {
  useConfirmWinnerPayment,
  usePaymentInstructions,
} from "@/app/components/auctions/hooks/use-auctions";
import { ApiError } from "@/app/lib/api/error";
import { Icon } from "../primitives/Icon";
import { fmtNaira } from "../utils";

const PRIMARY_BTN_BG = {
  background: "linear-gradient(180deg, var(--accent-light), var(--accent))",
};

const formatDate = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lagos",
});

export function PaymentInstructionsScreen({
  auctionId,
}: {
  auctionId: string;
}) {
  const { data, isLoading, isError, refetch } =
    usePaymentInstructions(auctionId);
  const confirm = useConfirmWinnerPayment(auctionId);

  if (isLoading) return <Skeleton />;
  if (isError || !data) {
    return (
      <div className="py-12 text-center">
        <div className="text-sm text-fg-dim">
          Could not load payment instructions.
        </div>
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

  const copy = (val: string) =>
    navigator.clipboard
      .writeText(val)
      .then(() => toast.success("Copied"))
      .catch(() => toast.error("Could not copy"));

  return (
    <>
      <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">
        Payment
      </h1>
      <div className="mt-1 text-sm text-fg-muted">You won the auction!</div>

      <div className="mt-4 rounded-[14px] border border-line bg-surface p-4">
        <div className="text-[13px] font-semibold">{data.auction.title}</div>
        <div className="mt-3 rounded-lg border border-accent/20 bg-accent/[0.04] p-3">
          <div className="text-[10px] uppercase tracking-[0.1em] text-fg-dim">
            Amount to pay
          </div>
          <div className="mt-1 font-display text-[28px] font-bold text-accent-light">
            {fmtNaira(data.amountDue)}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[14px] border border-line bg-surface p-4">
        <div className="mb-3 text-[13px] font-semibold">Bank details</div>
        <div className="flex flex-col gap-2.5 text-[13px]">
          <Row label="Bank" value={data.bankName} onCopy={() => copy(data.bankName)} />
          <Row
            label="Account number"
            value={data.accountNumber}
            mono
            onCopy={() => copy(data.accountNumber)}
          />
          <Row
            label="Account name"
            value={data.accountName}
            onCopy={() => copy(data.accountName)}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-red/20 bg-red/[0.06] p-3 text-xs text-fg-muted">
        <Icon name="clock" size={16} className="text-red" />
        <div>
          Payment deadline:{" "}
          <strong className="text-fg">
            {data.paymentDeadlineAt
              ? formatDate.format(data.paymentDeadlineAt)
              : "24h after win"}
          </strong>
          . Failure to pay results in hold forfeit and account flag.
        </div>
      </div>

      <button
        type="button"
        disabled={confirm.isPending}
        onClick={async () => {
          try {
            await confirm.mutateAsync(undefined);
            toast.success("Payment confirmation sent");
          } catch (err) {
            if (err instanceof ApiError) toast.error(err.message);
            else toast.error("Could not confirm");
          }
        }}
        className="mt-6 w-full cursor-pointer rounded-xl border-none p-4 text-sm font-bold text-[#1a0a00] disabled:opacity-60"
        style={PRIMARY_BTN_BG}
      >
        {confirm.isPending ? "Sending…" : "I've made the transfer"}
      </button>
    </>
  );
}

function Row({
  label,
  value,
  mono,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-fg-muted">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-medium ${mono ? "font-mono" : ""}`}>{value}</span>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md border border-line bg-surface-2 p-1.5 text-fg-muted hover:text-fg"
        >
          <Icon name="copy" size={12} />
        </button>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3 py-6">
      <div className="h-7 w-1/3 animate-pulse rounded bg-surface-2" />
      <div className="h-32 w-full animate-pulse rounded-[14px] bg-surface-2" />
      <div className="h-40 w-full animate-pulse rounded-[14px] bg-surface-2" />
    </div>
  );
}

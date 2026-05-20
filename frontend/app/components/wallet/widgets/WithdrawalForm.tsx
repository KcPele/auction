"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/app/lib/api/error";
import { useCreateWithdrawal } from "../hooks/use-wallet";
import {
  withdrawalSchema,
  type WithdrawalForm as WithdrawalFormValues,
} from "../utils/withdrawal.schema";

interface Props {
  onClose: () => void;
}

export function WithdrawalForm({ onClose }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: { destinationAccountNumber: "", destinationAccountName: "" },
  });
  const create = useCreateWithdrawal();

  const onSubmit = handleSubmit(async (data) => {
    try {
      await create.mutateAsync({
        amountNaira: data.amountNaira,
        destinationBankCode: data.destinationBankCode,
        destinationBankName: data.destinationBankName,
        destinationAccountNumber: data.destinationAccountNumber,
        destinationAccountName: data.destinationAccountName,
        narration: data.narration || undefined,
      });
      toast.success("Withdrawal requested");
      onClose();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not submit withdrawal");
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <FieldRow label="Amount (₦)" error={errors.amountNaira?.message}>
        <input
          type="number"
          inputMode="numeric"
          step="100"
          min={100}
          {...register("amountNaira", { valueAsNumber: true })}
          className={inputCls}
        />
      </FieldRow>
      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="Bank code" error={errors.destinationBankCode?.message}>
          <input
            placeholder="057"
            {...register("destinationBankCode")}
            className={inputCls}
          />
        </FieldRow>
        <FieldRow label="Bank name" error={errors.destinationBankName?.message}>
          <input
            placeholder="Zenith Bank"
            {...register("destinationBankName")}
            className={inputCls}
          />
        </FieldRow>
      </div>
      <FieldRow label="Account number" error={errors.destinationAccountNumber?.message}>
        <input
          inputMode="numeric"
          maxLength={10}
          {...register("destinationAccountNumber")}
          className={inputCls}
        />
      </FieldRow>
      <FieldRow label="Account name" error={errors.destinationAccountName?.message}>
        <input {...register("destinationAccountName")} className={inputCls} />
      </FieldRow>
      <FieldRow label="Narration (optional)" error={errors.narration?.message}>
        <input {...register("narration")} className={inputCls} />
      </FieldRow>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm font-medium text-fg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={create.isPending}
          className="flex-1 rounded-lg p-2.5 text-sm font-semibold text-[#1a0a00] disabled:opacity-60"
          style={{
            background:
              "linear-gradient(180deg, var(--accent-light), var(--accent))",
          }}
        >
          {create.isPending ? "Requesting…" : "Request withdrawal"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-[10px] border border-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent placeholder:text-fg-dim";

function FieldRow({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-fg-muted">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] text-red">{error}</p>}
    </div>
  );
}

"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/app/lib/api/error";
import {
  useCreateWithdrawal,
  useResolveBankAccount,
  useSupportedBanks,
} from "../hooks/use-wallet";
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
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      destinationBankCode: "",
      destinationBankName: "",
      destinationAccountNumber: "",
      destinationAccountName: "",
      narration: "",
    },
  });
  const create = useCreateWithdrawal();
  const banks = useSupportedBanks();
  const resolveAccount = useResolveBankAccount();

  const accountNumberField = register("destinationAccountNumber", {
    onChange: () => {
      setValue("destinationAccountName", "");
      clearErrors("destinationAccountNumber");
    },
    onBlur: async () => {
      const bankCode = getValues("destinationBankCode");
      const accountNumber = getValues("destinationAccountNumber");
      if (!bankCode || !/^\d{10}$/.test(accountNumber)) return;

      try {
        const result = await resolveAccount.mutateAsync({
          bankCode,
          accountNumber,
        });
        setValue("destinationAccountName", result.accountName, {
          shouldValidate: true,
        });
        clearErrors(["destinationAccountNumber", "destinationAccountName"]);
      } catch (err) {
        setValue("destinationAccountName", "");
        setError("destinationAccountNumber", {
          message:
            err instanceof ApiError
              ? err.message
              : "Could not verify this account",
        });
      }
    },
  });

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
      <FieldRow id="withdrawal-amount" label="Amount (₦)" error={errors.amountNaira?.message}>
        <input
          id="withdrawal-amount"
          type="number"
          inputMode="numeric"
          step="100"
          min={100}
          {...register("amountNaira", { valueAsNumber: true })}
          className={inputCls}
        />
      </FieldRow>
      <FieldRow id="withdrawal-bank" label="Bank" error={errors.destinationBankCode?.message ?? errors.destinationBankName?.message}>
        <select
          id="withdrawal-bank"
          disabled={banks.isLoading || banks.isError}
          {...register("destinationBankCode", {
            onChange: (event) => {
              const selected = banks.data?.find(
                (bank) => bank.code === event.target.value,
              );
              setValue("destinationBankName", selected?.name ?? "", {
                shouldValidate: true,
              });
              setValue("destinationAccountName", "");
            },
          })}
          className={inputCls}
        >
          <option value="">
            {banks.isLoading ? "Loading banks…" : "Select a bank"}
          </option>
          {banks.data?.map((bank) => (
            <option key={bank.code} value={bank.code}>
              {bank.name}
            </option>
          ))}
        </select>
        <input type="hidden" {...register("destinationBankName")} />
        {banks.isError && (
          <button
            type="button"
            onClick={() => banks.refetch()}
            className="mt-1 text-xs font-semibold text-primary"
          >
            Could not load banks. Retry
          </button>
        )}
      </FieldRow>
      <FieldRow id="withdrawal-account-number" label="Account number" error={errors.destinationAccountNumber?.message}>
        <input
          id="withdrawal-account-number"
          inputMode="numeric"
          maxLength={10}
          {...accountNumberField}
          className={inputCls}
        />
      </FieldRow>
      <FieldRow id="withdrawal-account-name" label="Account name" error={errors.destinationAccountName?.message}>
        <input
          id="withdrawal-account-name"
          readOnly
          aria-busy={resolveAccount.isPending}
          placeholder={
            resolveAccount.isPending
              ? "Verifying account…"
              : "Verified account name appears here"
          }
          {...register("destinationAccountName")}
          className={inputCls}
        />
      </FieldRow>
      <FieldRow id="withdrawal-narration" label="Narration (optional)" error={errors.narration?.message}>
        <input id="withdrawal-narration" {...register("narration")} className={inputCls} />
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
          disabled={
            create.isPending ||
            resolveAccount.isPending ||
            banks.isLoading ||
            banks.isError
          }
          className="flex-1 rounded-lg bg-primary p-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
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
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-fg-muted">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] text-danger">{error}</p>}
    </div>
  );
}

"use client";
import { Ledger } from "../widgets/Ledger";
import { SectionHeader } from "./SectionHeader";

export function PaymentsScreen() {
  return (
    <>
      <SectionHeader
        title="Payments & ledger"
        sub="Every wallet movement as a ledger entry. Reconcile StroWallet settlements, export reports, investigate anomalies."
      />
      <Ledger />
    </>
  );
}

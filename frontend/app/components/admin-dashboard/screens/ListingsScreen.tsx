"use client";
import { Queue } from "../widgets/Queue";
import { SectionHeader } from "./SectionHeader";

export function ListingsScreen() {
  return (
    <>
      <SectionHeader
        title="Listing approvals"
        sub="Listings awaiting approval. Verify mechanic reports for cars, and proof-of-ownership for gadgets."
      />
      <Queue />
    </>
  );
}

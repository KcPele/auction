"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCarListing,
  createGadgetListing,
  getCarListing,
  getGadgetListing,
  listMyListings,
  submitCarListing,
  submitGadgetListing,
  updateCarListing,
  updateGadgetListing,
  uploadBatchFiles,
  uploadOneFile,
} from "../api/listings.api";
import type {
  CreateCarInput,
  CreateGadgetInput,
  UpdateCarInput,
  UpdateGadgetInput,
} from "../types/listing.types";
import { listingKeys } from "./listing-keys";

export function useMyListings() {
  return useQuery({ queryKey: listingKeys.mine(), queryFn: listMyListings });
}

export function useCarListing(id: string | undefined) {
  return useQuery({
    queryKey: listingKeys.car(id ?? ""),
    queryFn: () => getCarListing(id!),
    enabled: Boolean(id),
  });
}

export function useGadgetListing(id: string | undefined) {
  return useQuery({
    queryKey: listingKeys.gadget(id ?? ""),
    queryFn: () => getGadgetListing(id!),
    enabled: Boolean(id),
  });
}

export function useCreateCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCarInput) => createCarListing(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: listingKeys.mine() }),
  });
}

export function useCreateGadget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGadgetInput) => createGadgetListing(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: listingKeys.mine() }),
  });
}

export function useUpdateCar(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCarInput) => updateCarListing(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listingKeys.mine() });
      qc.invalidateQueries({ queryKey: listingKeys.car(id) });
    },
  });
}

export function useUpdateGadget(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateGadgetInput) => updateGadgetListing(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listingKeys.mine() });
      qc.invalidateQueries({ queryKey: listingKeys.gadget(id) });
    },
  });
}

export function useSubmitListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; category: "cars" | "gadgets" }) =>
      input.category === "cars"
        ? await submitCarListing(input.id)
        : await submitGadgetListing(input.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: listingKeys.mine() }),
  });
}

export function useUploadOne() {
  return useMutation({ mutationFn: uploadOneFile });
}

export function useUploadBatch() {
  return useMutation({ mutationFn: uploadBatchFiles });
}

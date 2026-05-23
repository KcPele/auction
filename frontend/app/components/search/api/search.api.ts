import { apiClient } from "@/app/lib/api/client";

export type SearchHitDto = {
  type: "auction";
  auctionId: string;
  status: string;
  category: "CAR" | "GADGET";
  title: string;
  subtitle: string | null;
  coverUrl: string | null;
};
export type SearchResponseDto = { items: SearchHitDto[] };

export type SearchHit = {
  auctionId: string;
  title: string;
  subtitle: string;
  category: "car" | "gadget";
  coverUrl: string | null;
  status: string;
};

export const searchAuctions = async (q: string): Promise<SearchHit[]> => {
  const dto = await apiClient<SearchResponseDto>("/public/search", {
    query: { q, limit: 8 },
  });
  return dto.items.map((i) => ({
    auctionId: i.auctionId,
    title: i.title,
    subtitle: i.subtitle ?? "",
    category: i.category === "CAR" ? "car" : "gadget",
    coverUrl: i.coverUrl,
    status: i.status,
  }));
};

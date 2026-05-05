import { Suspense } from "react";
import { ListingDetailScreen } from "@/app/components/user-dashboard/screens/ListingDetailScreen";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <ListingDetailScreen id={id} />
    </Suspense>
  );
}

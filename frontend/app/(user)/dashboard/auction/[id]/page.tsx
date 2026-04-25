import { DetailScreen } from "@/app/components/user-dashboard/screens/DetailScreen";

export default async function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DetailScreen id={id} />;
}
